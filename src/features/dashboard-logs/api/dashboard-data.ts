import { fetchLogs } from "./fetch-logs";
import { formatHourMinute, formatDateTime } from "@/lib/format";
import { clusterLogsByHour, flattenLogs, groupByNamespace } from "./transform";
import type { LogsDashboardData, TimeRange } from "./view-model";

export const LOGS_DASHBOARD_QUERY_KEY = ["logs-dashboard"] as const;

const DAY_IN_MS = 24 * 60 * 60 * 1000;

// The single server-side assembly point, shared by the RSC prefetch and the
// /api/logs route handler. Clients receive render-ready view models only.
export async function getLogsDashboardData(): Promise<LogsDashboardData> {
  const { request, fetchedAtMs } = await fetchLogs();
  const rows = flattenLogs(request);
  const buckets = clusterLogsByHour(rows);
  const fromMs = fetchedAtMs - DAY_IN_MS;
  const range: TimeRange = {
    fromMs,
    toMs: fetchedAtMs,
    fromLabel: formatDateTime(new Date(fromMs)),
    toLabel: formatDateTime(new Date(fetchedAtMs)),
  };
  return {
    rows,
    buckets,
    groups: groupByNamespace(rows),
    range,
    fetchedAtMs,
    fetchedAtLabel: formatHourMinute(new Date(fetchedAtMs)),
  };
}
