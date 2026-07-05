// Wire types for the OTLP logs payload, modeled after
// opentelemetry/proto/logs/v1/logs.proto

export interface ExportLogsServiceRequest {
  resourceLogs?: ResourceLogs[];
}

export interface ResourceLogs {
  resource?: Resource;
  scopeLogs?: ScopeLogs[];
}

export interface Resource {
  attributes?: KeyValue[];
  droppedAttributesCount?: number;
}

export interface ScopeLogs {
  scope?: InstrumentationScope;
  logRecords?: LogRecord[];
}

export interface InstrumentationScope {
  name?: string;
  version?: string;
  attributes?: KeyValue[];
  droppedAttributesCount?: number;
}

export interface LogRecord {
  // Nanoseconds since epoch as a string; overflows Number.MAX_SAFE_INTEGER.
  timeUnixNano?: string;
  observedTimeUnixNano?: string;
  severityNumber?: number;
  severityText?: string;
  body?: AnyValue;
  attributes?: KeyValue[];
  droppedAttributesCount?: number;
  traceId?: string;
  spanId?: string;
}

export interface KeyValue {
  key?: string;
  value?: AnyValue;
}

// Exactly one member is set per value.
export interface AnyValue {
  stringValue?: string | null;
  boolValue?: boolean | null;
  intValue?: number | null;
  doubleValue?: number | null;
  arrayValue?: { values?: AnyValue[] } | null;
  kvlistValue?: { values?: KeyValue[] } | null;
  bytesValue?: string | null;
}
