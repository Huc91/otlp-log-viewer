import { fetchLogs } from "./fetch-logs";
import { buildHistogram, flattenLogs, groupByService } from "./transform";
import type { LogsDashboardData, TimeRange } from "./view-model";

export const LOGS_DASHBOARD_QUERY_KEY = ["logs-dashboard"] as const;

const HISTOGRAM_BUCKET_COUNT = 48;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

// The single server-side assembly point, shared by the RSC prefetch and the
// /api/logs route handler. Clients receive render-ready view models only.
export async function getLogsDashboardData(): Promise<LogsDashboardData> {
  const { request, fetchedAtMs } = await fetchLogs();
  const rows = flattenLogs(request);
  // TODO(luca): derive the range from the flattened rows once flattenLogs
  // lands; the API spans the trailing 24h so this draft matches the design.
  const range: TimeRange = {
    fromMs: fetchedAtMs - DAY_IN_MS,
    toMs: fetchedAtMs,
  };
  return {
    rows,
    buckets: buildHistogram(rows, range, HISTOGRAM_BUCKET_COUNT),
    groups: groupByService(rows),
    range,
    fetchedAtMs,
  };
}
