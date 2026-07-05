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

export interface ScopeIdentity {
  key: string;
  name: string;
  version: string;
  attributes: Record<string, AttributeValue>;
}

export interface LogRow {
  id: string;
  timestampMs: number;
  time: string;
  severityNumber: number;
  severityBand: SeverityBand;
  severityLabel: string;
  body: string;
  bodyKind: BodyKind;
  attributes: Record<string, AttributeValue>;
  resourceAttributes: Record<string, AttributeValue>;
  service: ServiceIdentity;
  scope: ScopeIdentity;
}

export interface ClusteredLogsByHour {
  startTime: number;
  endTime: number;
  count: number;
  startLabel: string;
  rangeLabel: string;
}

export interface ServiceGroup {
  service: ServiceIdentity;
  resourceAttributes: Record<string, AttributeValue>;
  rows: LogRow[];
  scopeGroups: ScopeGroup[];
}

export interface NamespaceGroup {
  namespace: string;
  rows: LogRow[];
  serviceGroups: ServiceGroup[];
}

export interface ScopeGroup {
  scope: ScopeIdentity;
  rows: LogRow[];
}

export interface TimeRange {
  fromMs: number;
  toMs: number;
  fromLabel: string;
  toLabel: string;
}

export interface LogsDashboardData {
  rows: LogRow[];
  clusters: ClusteredLogsByHour[];
  groups: NamespaceGroup[];
  range: TimeRange;
  fetchedAtMs: number;
  fetchedAtLabel: string;
}
