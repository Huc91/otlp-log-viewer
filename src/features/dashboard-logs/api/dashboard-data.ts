import { fetchLogs } from "./fetch-logs";
import { formatHourMinute, formatDateTime } from "@/lib/format";
import { DAY_IN_MS } from "@/lib/constants";
import { clusterLogsByHour, flattenLogs, groupByNamespace } from "./transform";
import type { LogsDashboardData, TimeRange } from "./view-model";

export const LOGS_DASHBOARD_QUERY_KEY = ["logs-dashboard"] as const;

export async function getLogsDashboardData(): Promise<LogsDashboardData> {
  const { request, fetchedAtMs } = await fetchLogs();
  const rows = flattenLogs(request);
  const clusters = clusterLogsByHour(rows);
  const fromMs = fetchedAtMs - DAY_IN_MS;
  const range: TimeRange = {
    fromMs,
    toMs: fetchedAtMs,
    fromLabel: formatDateTime(new Date(fromMs)),
    toLabel: formatDateTime(new Date(fetchedAtMs)),
  };
  return {
    rows,
    clusters,
    groups: groupByNamespace(rows),
    range,
    fetchedAtMs,
    fetchedAtLabel: formatHourMinute(new Date(fetchedAtMs)),
  };
}
