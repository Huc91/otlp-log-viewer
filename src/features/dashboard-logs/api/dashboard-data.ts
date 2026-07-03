import { fetchLogs } from "./fetch-logs";
import { clusterLogsByHour, flattenLogs, groupByService } from "./transform";
import type { LogsDashboardData, TimeRange } from "./view-model";

export const LOGS_DASHBOARD_QUERY_KEY = ["logs-dashboard"] as const;

const DAY_IN_MS = 24 * 60 * 60 * 1000;

// The single server-side assembly point, shared by the RSC prefetch and the
// /api/logs route handler. Clients receive render-ready view models only.
export async function getLogsDashboardData(): Promise<LogsDashboardData> {
  const { request, fetchedAtMs } = await fetchLogs();
  const rows = flattenLogs(request);
  const buckets = clusterLogsByHour(rows);
  console.log("first row:", JSON.stringify(rows[0], null, 2));
  console.log(`rows: ${rows.length}`);
  console.log(
    "buckets:",
    buckets
      .map(
        (bucket) =>
          `${new Date(bucket.startTime).toISOString().slice(11, 16)} → ${bucket.count}`,
      )
      .join("  "),
  );
  const firstBucket = buckets[0];
  const lastBucket = buckets[buckets.length - 1];
  const range: TimeRange =
    firstBucket && lastBucket
      ? { fromMs: firstBucket.startTime, toMs: lastBucket.endTime }
      : { fromMs: fetchedAtMs - DAY_IN_MS, toMs: fetchedAtMs };
  return {
    rows,
    buckets,
    groups: groupByService(rows),
    range,
    fetchedAtMs,
  };
}
