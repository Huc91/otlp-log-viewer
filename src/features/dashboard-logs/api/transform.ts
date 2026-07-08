import type {
  AnyValue,
  ExportLogsServiceRequest,
  InstrumentationScope,
  KeyValue,
  Resource,
} from "./types";
import { formatHourMinute, formatDateTime, formatTime } from "@/lib/format";
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


function buildLogRowId(resourceIndex: number, scopeIndex: number, recordIndex: number, timestampMs: number): string {
  return `${resourceIndex}-${scopeIndex}-${recordIndex}-${timestampMs}`;
}

function nanoStringToMs(nanoStr: string): number | null {
  // timeUnixNano arrives as a string (exceeds safe integer range as Number),
  // convert via BigInt to avoid precision loss, then divide down to ms.
  try {
    const timestampMs = Number(BigInt(nanoStr) / 1_000_000n);
    return timestampMs > 0 ? timestampMs : null;
  } catch {
    return null;
  }
}

export function unwrapAnyValue(value: AnyValue | undefined): AttributeValue {
  if (!value) return "";
  if (value.stringValue != null) return value.stringValue;
  if (value.intValue != null) return value.intValue;
  if (value.doubleValue != null) return value.doubleValue;
  if (value.boolValue != null) return value.boolValue;
  if (value.arrayValue?.values) {
    return value.arrayValue.values
      .map((item) => String(unwrapAnyValue(item)))
      .join(", ");
  }
  if (value.kvlistValue?.values) {
    return value.kvlistValue.values
      .map((entry) => `${entry.key ?? ""}=${String(unwrapAnyValue(entry.value))}`)
      .join(", ");
  }
  if (value.bytesValue != null) return value.bytesValue;
  return "";
}

function prettyPrintJson(text: string): string {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}

function detectBodyKind(text: string | undefined): BodyKind {
  if (!text) return "text";
  if (/\n\s+at\s/.test(text)) return "stacktrace";
  // simple cheap precheck avoids running JSON.parse (expensive w/ try-catch) on
  // the ~80% of bodies that are plain text and can't possibly be JSON and literally bumps perfomances.
  // 123 = {
  // 91 = [

  const char = text.charCodeAt(0);
  if (char !== 123 && char !== 91 ) return "text";
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
    attributes[attribute.key] = unwrapAnyValue(attribute.value);
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
        const timestampMs = nanoStringToMs(nano);
        if (timestampMs === null) return;

        const bodyText = String(unwrapAnyValue(logRecord.body));
        const severityNumber = logRecord.severityNumber ?? 0;
        const severityBand = severityBandOf(severityNumber);
        const bodyKind = detectBodyKind(bodyText);

        rows.push({
          id: buildLogRowId(resourceIndex, scopeIndex, recordIndex, timestampMs),
          timestampMs,
          time: formatTime(new Date(timestampMs)),
          severityNumber,
          severityBand,
          severityLabel: severityBand,
          body: bodyKind === "json" ? prettyPrintJson(bodyText) : bodyText,
          bodyKind,
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
    const endTime = startTime + HOUR_IN_MS;
    clustersDictionary[hourKeyOf(startTime)] = {
      startTime,
      endTime,
      count: 0,
      startLabel: formatHourMinute(new Date(startTime)),
      rangeLabel: `${formatDateTime(new Date(startTime))} - ${formatHourMinute(new Date(endTime))}`,
    };
  }

  rows.forEach((row) => {
    const cluster = clustersDictionary[hourKeyOf(row.timestampMs)];
    if (!cluster) return;
    cluster.count += 1;
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

export function groupByNamespace(rows: LogRow[]): NamespaceGroup[] {
  const byNamespace = new Map<string, LogRow[]>();
  rows.forEach((row) => pushInto(byNamespace, row.service.namespace, row));

  return [...byNamespace.entries()]
    .map(([namespace, namespaceRows]) => ({
      namespace,
      logCount: namespaceRows.length,
      serviceGroups: buildServiceGroups(namespaceRows),
    }))
    .sort((a, b) => b.logCount - a.logCount);
}

function buildServiceGroups(rows: LogRow[]): ServiceGroup[] {
  const byService = new Map<string, LogRow[]>();
  rows.forEach((row) => pushInto(byService, row.service.key, row));

  return [...byService.values()]
    .map((serviceRows) => ({
      service: serviceRows[0].service,
      resourceAttributes: mergeResourceAttributes(serviceRows),
      logCount: serviceRows.length,
      scopeGroups: buildScopeGroups(serviceRows),
    }))
    .sort((a, b) => b.logCount - a.logCount);
}

function mergeResourceAttributes(rows: LogRow[]): Record<string, AttributeValue> {
  const merged: Record<string, AttributeValue> = {};
  rows.forEach((row) => {
    Object.entries(row.resourceAttributes).forEach(([key, value]) => {
      const existing = merged[key];
      if (existing === undefined) merged[key] = value;
      else if (existing !== value && !String(existing).includes(String(value)))
        merged[key] = `${String(existing)}, ${String(value)}`;
    });
  });
  return merged;
}

function buildScopeGroups(rows: LogRow[]): ScopeGroup[] {
  const byScope = new Map<string, LogRow[]>();
  rows.forEach((row) => pushInto(byScope, row.scope.key, row));

  return [...byScope.values()]
    .map((scopeRows) => ({ scope: scopeRows[0].scope, rows: scopeRows }))
    .sort((a, b) => b.rows.length - a.rows.length);
}
