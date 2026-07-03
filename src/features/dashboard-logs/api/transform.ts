import type {
  ExportLogsServiceRequest,
  InstrumentationScope,
  KeyValue,
  Resource,
} from "./types";
import {
  SEVERITY_BANDS,
  type AttributeValue,
  type BodyKind,
  type ClusteredLogsByHour,
  type LogRow,
  type NamespaceGroup,
  type ScopeGroup,
  type ScopeIdentity,
  type ServiceGroup,
  type ServiceIdentity,
  type SeverityBand,
} from "./view-model";


function buildLogRowId(resourceIndex: number, scopeIndex: number, recordIndex: number): string {
  return `${resourceIndex}-${scopeIndex}-${recordIndex}`;
}

function nanoStringToMs(nanoStr: string): number {
  // timeUnixNano arrives as a string (exceeds safe integer range as Number),
  // convert via BigInt to avoid precision loss, then divide down to ms.
  return Number(BigInt(nanoStr) / 1_000_000n);
}

function detectBodyKind(text: string | undefined): BodyKind {
  if (!text) return "text";
  // "  at fn (file:1:2)" lines are the stack-trace signature
  if (/\n\s+at\s/.test(text)) return "stacktrace";
  // cheap precheck avoids running JSON.parse (expensive w/ try-catch) on
  // the ~80% of bodies that are plain text and can't possibly be JSON
  const c = text.charCodeAt(0);
  if (c !== 123 /* { */ && c !== 91 /* [ */) return "text";
  try {
    JSON.parse(text);
    return "json";
  } catch {
    return "text";
  }
}

function extractAttributes(
  keyValues: KeyValue[] | undefined,
): Record<string, AttributeValue> {
  const attributes: Record<string, AttributeValue> = {};
  keyValues?.forEach((attribute) => {
    if (!attribute.key) return;
    attributes[attribute.key] =
      attribute.value?.stringValue ??
      attribute.value?.intValue ??
      attribute.value?.boolValue ??
      attribute.value?.doubleValue ??
      "";
  });
  return attributes;
}

function extractScopeIdentity(
  scope: InstrumentationScope | undefined,
): ScopeIdentity {
  const name = scope?.name ?? "";
  const version = scope?.version ?? "";
  return {
    key: `${name}@${version}`,
    name: name || "unknown scope",
    version,
    attributes: extractAttributes(scope?.attributes),
  };
}

// severityNumber bands per the OTLP data model: 1-4 TRACE, 5-8 DEBUG, 9-12 INFO,
// 13-16 WARN, 17-20 ERROR, 21-24 FATAL; 0 / out-of-range → UNSPECIFIED.
function severityBandOf(severityNumber: number): SeverityBand {
  if (severityNumber < 1 || severityNumber > 24) return "UNSPECIFIED";
  return SEVERITY_BANDS[Math.ceil(severityNumber / 4)];
}

function extractServiceIdentity(resource: Resource | undefined): ServiceIdentity {
  let namespace = "";
  let name = "";
  let version = "";

  resource?.attributes?.forEach((attribute) => {
    const stringValue = attribute.value?.stringValue;
    if (typeof stringValue !== "string") return;
    if (attribute.key === "service.namespace") namespace = stringValue;
    else if (attribute.key === "service.name") name = stringValue;
    else if (attribute.key === "service.version") version = stringValue;
  });

  return {
    key: `${namespace}/${name}/${version}`,
    namespace,
    name: name || "unknown service",
    version,
  };
}

export function flattenLogs(request: ExportLogsServiceRequest): LogRow[] {
  const rows: LogRow[] = [];

  request.resourceLogs?.forEach((resourceLog, resourceIndex) => {
    const service = extractServiceIdentity(resourceLog.resource);
    const resourceAttributes = extractAttributes(resourceLog.resource?.attributes);

    resourceLog.scopeLogs?.forEach((scopeLog, scopeIndex) => {
      const scope = extractScopeIdentity(scopeLog.scope);

      scopeLog.logRecords?.forEach((logRecord, recordIndex) => {
        const nano = logRecord.timeUnixNano ?? logRecord.observedTimeUnixNano;
        if (nano === undefined) return;

        const bodyText = logRecord.body?.stringValue ?? "";
        const severityNumber = logRecord.severityNumber ?? 0;
        const severityBand = severityBandOf(severityNumber);

        rows.push({
          id: buildLogRowId(resourceIndex, scopeIndex, recordIndex),
          timestampMs: nanoStringToMs(nano),
          severityNumber,
          severityBand,
          severityLabel: severityBand,
          body: bodyText,
          bodyKind: detectBodyKind(bodyText),
          attributes: extractAttributes(logRecord.attributes),
          resourceAttributes,
          service,
          scope,
        });
      });
    });
  });

  return rows.sort((a, b) => b.timestampMs - a.timestampMs);
}

const HOUR_IN_MS = 3_600_000;

export function clusterLogsByHour(rows: LogRow[]): ClusteredLogsByHour[] {
  const newestLog = rows[0];
  const oldestLog = rows[rows.length - 1];
  if (newestLog === undefined || oldestLog === undefined) return [];

  const startMs = Math.floor(oldestLog.timestampMs / HOUR_IN_MS) * HOUR_IN_MS;
  const endMs =
    Math.floor(newestLog.timestampMs / HOUR_IN_MS) * HOUR_IN_MS + HOUR_IN_MS;

  const clustersDictionary: Record<string, ClusteredLogsByHour> = {};

  for (let startTime = startMs; startTime < endMs; startTime += HOUR_IN_MS) {
    clustersDictionary[hourKeyOf(startTime)] = {
      startTime,
      endTime: startTime + HOUR_IN_MS,
      count: 0,
      idsOfLogs: [],
    };
  }

  rows.forEach((row) => {
    const cluster = clustersDictionary[hourKeyOf(row.timestampMs)];
    if (!cluster) return;
    cluster.count += 1;
    cluster.idsOfLogs.push(row.id);
  });

  return Object.values(clustersDictionary);
}

function hourKeyOf(timestampMs: number): string {
  return new Date(timestampMs).toISOString().slice(0, 13) + ":00";
}

function pushInto(map: Map<string, LogRow[]>, key: string, row: LogRow): void {
  const existing = map.get(key);
  if (existing) existing.push(row);
  else map.set(key, [row]);
}

// namespace → service → scope, busiest groups first
export function groupByNamespace(rows: LogRow[]): NamespaceGroup[] {
  const byNamespace = new Map<string, LogRow[]>();
  rows.forEach((row) => pushInto(byNamespace, row.service.namespace, row));

  return [...byNamespace.entries()]
    .map(([namespace, namespaceRows]) => ({
      namespace,
      rows: namespaceRows,
      serviceGroups: buildServiceGroups(namespaceRows),
    }))
    .sort((a, b) => b.rows.length - a.rows.length);
}

function buildServiceGroups(rows: LogRow[]): ServiceGroup[] {
  const byService = new Map<string, LogRow[]>();
  rows.forEach((row) => pushInto(byService, row.service.key, row));

  return [...byService.values()]
    .map((serviceRows) => ({
      service: serviceRows[0].service,
      resourceAttributes: serviceRows[0].resourceAttributes,
      rows: serviceRows,
      scopeGroups: buildScopeGroups(serviceRows),
    }))
    .sort((a, b) => b.rows.length - a.rows.length);
}

function buildScopeGroups(rows: LogRow[]): ScopeGroup[] {
  const byScope = new Map<string, LogRow[]>();
  rows.forEach((row) => pushInto(byScope, row.scope.key, row));

  return [...byScope.values()]
    .map((scopeRows) => ({ scope: scopeRows[0].scope, rows: scopeRows }))
    .sort((a, b) => b.rows.length - a.rows.length);
}
