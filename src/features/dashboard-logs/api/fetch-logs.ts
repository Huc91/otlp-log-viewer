import type { ExportLogsServiceRequest } from "./types";

const LOGS_ENDPOINT =
  "https://take-home-assignment-otlp-logs-api.vercel.app/api/v2/logs";

export interface LogsSnapshot {
  request: ExportLogsServiceRequest;
  fetchedAtMs: number;
}

// The API returns random data on every request; fetch is uncached by default
// in Next 16, which is exactly what we want — one fresh payload per page load.
// fetchedAtMs anchors the 24h window so all derived views share one instant.
export async function fetchLogs(): Promise<LogsSnapshot> {
  const response = await fetch(LOGS_ENDPOINT);
  if (!response.ok) {
    throw new Error(`Logs API request failed with status ${response.status}`);
  }
  const request: ExportLogsServiceRequest = await response.json();
  return { request, fetchedAtMs: Date.now() };
}
