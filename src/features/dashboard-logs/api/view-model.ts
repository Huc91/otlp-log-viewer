// Render-ready shapes the UI consumes. Produced server-side by transform.ts;
// client components never see raw OTLP.

export const SEVERITY_BANDS = [
  "UNSPECIFIED",
  "TRACE",
  "DEBUG",
  "INFO",
  "WARN",
  "ERROR",
  "FATAL",
] as const;

export type SeverityBand = (typeof SEVERITY_BANDS)[number];

export type AttributeValue = string | number | boolean;

export type BodyKind = "text" | "json" | "stacktrace";

export interface ServiceIdentity {
  key: string;
  namespace: string;
  name: string;
  version: string;
}

export interface LogRow {
  id: string;
  timestampMs: number;
  severityNumber: number;
  severityBand: SeverityBand;
  severityLabel: string;
  body: string;
  bodyKind: BodyKind;
  attributes: Record<string, AttributeValue>;
  service: ServiceIdentity;
}

export interface ClusteredLogsByHour {
  startTime: number;
  endTime: number;
  count: number;
  idsOfLogs: string[];
}

export interface ServiceGroup {
  service: ServiceIdentity;
  rows: LogRow[];
}

export interface TimeRange {
  fromMs: number;
  toMs: number;
}

export interface LogsDashboardData {
  rows: LogRow[];
  buckets: ClusteredLogsByHour[];
  groups: ServiceGroup[];
  range: TimeRange;
  fetchedAtMs: number;
}
