"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { LOGS_DASHBOARD_QUERY_KEY } from "@/features/dashboard-logs/api/dashboard-data";
import type { LogsDashboardData } from "@/features/dashboard-logs/api/view-model";

// Off because the mock API returns a random dataset per request; set to a
// number of milliseconds to turn the dashboard into a polled live view.
const POLL_INTERVAL_MS: number | false = false;

async function fetchLogsDashboard(severityFilter = ""): Promise<LogsDashboardData> {
  const url = severityFilter
    ? `/api/logs?severity=${encodeURIComponent(severityFilter)}`
    : "/api/logs";
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Logs API route failed with status ${response.status}`);
  }
  return response.json();
}

export function useLogsDashboard(severityFilter = "") {
  console.log('severityFilter in useLogs', severityFilter)
  return useQuery({
    queryKey: [...LOGS_DASHBOARD_QUERY_KEY, severityFilter],
    queryFn: () => fetchLogsDashboard(severityFilter),
    refetchInterval: POLL_INTERVAL_MS,
    placeholderData: keepPreviousData,
  });
}
