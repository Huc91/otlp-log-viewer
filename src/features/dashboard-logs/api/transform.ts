import type { ExportLogsServiceRequest, Resource } from "./types";
import {
  SEVERITY_BANDS,
  type AttributeValue,
  type ClusteredLogsByHour,
  type LogRow,
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

function detectBodyKind(text: string | undefined): "text" | "json" {
  if (!text) return "text";
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

    resourceLog.scopeLogs?.forEach((scopeLog, scopeIndex) => {
      scopeLog.logRecords?.forEach((logRecord, recordIndex) => {
        const nano = logRecord.timeUnixNano ?? logRecord.observedTimeUnixNano;
        if (nano === undefined) return;

        const bodyText = logRecord.body?.stringValue ?? "";
        const severityNumber = logRecord.severityNumber ?? 0;
        const severityBand = severityBandOf(severityNumber);

        const attributes: Record<string, AttributeValue> = {};
        logRecord.attributes?.forEach((attribute) => {
          if (!attribute.key) return;
          attributes[attribute.key] =
            attribute.value?.stringValue ??
            attribute.value?.intValue ??
            attribute.value?.boolValue ??
            attribute.value?.doubleValue ??
            "";
        });

        rows.push({
          id: buildLogRowId(resourceIndex, scopeIndex, recordIndex),
          timestampMs: nanoStringToMs(nano),
          severityNumber,
          severityBand,
          severityLabel: severityBand,
          body: bodyText,
          bodyKind: detectBodyKind(bodyText),
          attributes,
          service,
        });
      });
    });
  });

  return rows.sort((a, b) => b.timestampMs - a.timestampMs);
}

const HOUR_IN_MS = 3_600_000;

export function clusterLogsByHour(
  rows: LogRow[],
  rangeHours: number = 24,
): ClusteredLogsByHour[] {

  const newestMs = rows[0]?.timestampMs ?? Date.now();
  const newestBucketStartMs = Math.floor(newestMs / HOUR_IN_MS) * HOUR_IN_MS;
  const endMs = newestBucketStartMs + HOUR_IN_MS;
  const startMs = endMs - rangeHours * HOUR_IN_MS;

  const clustersDictionary: Record<string, ClusteredLogsByHour> = {};

  for (let hour = 0; hour < rangeHours; hour++) {
    const startTime = startMs + hour * HOUR_IN_MS;    
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

// "2026-07-03T11:00" — the log's timestamp truncated to its hour, in UTC
function hourKeyOf(timestampMs: number): string {
  return new Date(timestampMs).toISOString().slice(0, 13) + ":00";
}

/**
 * Rows → one group per service, keyed by ServiceIdentity.key.
 *
 * Stable, intentional group order (e.g. by row count desc) — the collapsible
 * grouped view renders in this order.
 */
export function groupByService(rows: LogRow[]): ServiceGroup[] {
  void rows;
  return []; // TODO(luca)
}
