import type { AnyValue, ExportLogsServiceRequest } from "./types";
import type {
  AttributeValue,
  HistogramBucket,
  LogRow,
  ServiceGroup,
  TimeRange,
} from "./view-model";

/*
 * THE DATA FORMATTING ALGORITHM — Luca writes this file personally.
 * The four functions below are the entire BE-shape → UI-shape boundary.
 * The UI is already wired to these signatures: implement them and the table,
 * histogram, grouped view, and stat all light up. Nothing else needs changing.
 *
 * References:
 * - Logs data model (fields, severity, timestamps):
 *   https://opentelemetry.io/docs/specs/otel/logs/data-model/
 * - Wire schema this API conforms to:
 *   https://github.com/open-telemetry/opentelemetry-proto/blob/main/opentelemetry/proto/logs/v1/logs.proto
 * - Input types: ./types.ts   Output types: ./view-model.ts
 */

/**
 * AnyValue → primitive.
 *
 * Exactly one member of the union is set per value (stringValue | boolValue |
 * intValue | doubleValue | arrayValue | kvlistValue | bytesValue).
 * Nested arrayValue / kvlistValue need a readable string representation.
 */
export function unwrapAnyValue(
  value: AnyValue | undefined,
): AttributeValue | undefined {
  void value;
  return undefined; // TODO(luca)
}

/**
 * Nested OTLP request → flat LogRow[] (one row per logRecord).
 *
 * Walk: resourceLogs[] → read service identity once from resource.attributes
 * (service.namespace / service.name / service.version) → scopeLogs[] →
 * logRecords[] → emit a LogRow carrying that service.
 *
 * Per-field notes (verified against the live API):
 * - timestampMs   — timeUnixNano is a NANOSECOND STRING that overflows
 *                   Number.MAX_SAFE_INTEGER. BigInt(value) / 1_000_000n,
 *                   then Number(). Never Number(timeUnixNano) directly.
 * - severityBand  — from severityNumber (the source of truth; the mock API's
 *                   severityText can disagree). Spec ranges:
 *                   0 UNSPECIFIED · 1-4 TRACE · 5-8 DEBUG · 9-12 INFO ·
 *                   13-16 WARN · 17-20 ERROR · 21-24 FATAL
 * - severityLabel — the text shown in the Severity column.
 * - body          — unwrap body.stringValue.
 * - bodyKind      — classify for the expanded row: "json" (parses as JSON),
 *                   "stacktrace" (multi-line "  at …" frames), else "text".
 * - attributes    — attributes[] through unwrapAnyValue into a Record.
 * - id            — no natural id on the wire; build a unique one (e.g.
 *                   `${resourceIndex}-${scopeIndex}-${recordIndex}`). It is
 *                   the React/TanStack row key.
 */
function buildLogRowId(
  resourceIndex: number,
  scopeIndex: number,
  recordIndex: number,
): string {
  return `${resourceIndex}-${scopeIndex}-${recordIndex}`;
}

export function flattenLogs(request: ExportLogsServiceRequest): LogRow[] {
  request.resourceLogs?.forEach((resourceLog, resourceIndex) => {
    resourceLog.scopeLogs?.forEach((scopeLog, scopeIndex) => {
      scopeLog.logRecords?.forEach((logRecord, recordIndex) => {
        const logRow: LogRow = {
          id: buildLogRowId(resourceIndex, scopeIndex, recordIndex),
          severityNumber: logRecord.severityNumber,
          severityText: logRecord.severityText,
          body: logRecord.body.stringValue,
          bodyKind: logRecord.body.stringValue ? "text" : "json",
          attributes: logRecord.attributes.map((attribute) => ({
            key: attribute.key,
            value: attribute.value.stringValue,
          })),
          timestampMs: logRecord.timeUnixNano,
          timestamp: new Date(logRecord.timeUnixNano).toISOString(),
        };
        void logRow;
      });
    });
  });
  return []; // TODO(luca)
}

/**
 * Rows → fixed number of equal-width time buckets across `range`.
 *
 * Return one entry per bucket INCLUDING empty ones (count: 0) — the chart
 * relies on a complete series. Each bucket: startMs (inclusive), endMs
 * (exclusive), count. d3-array's bin() can do this, or plain index math:
 * bucketIndex = floor((t - fromMs) / bucketWidth), clamped to the last bucket.
 */
export function buildHistogram(
  rows: LogRow[],
  range: TimeRange,
  bucketCount: number,
): HistogramBucket[] {
  void rows;
  void range;
  void bucketCount;
  return []; // TODO(luca)
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
