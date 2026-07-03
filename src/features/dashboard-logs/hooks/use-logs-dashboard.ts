"use client";

import { useQuery } from "@tanstack/react-query";
import { LOGS_DASHBOARD_QUERY_KEY } from "@/features/dashboard-logs/api/dashboard-data";
import type { LogsDashboardData } from "@/features/dashboard-logs/api/view-model";

// Off because the mock API returns a random dataset per request; set to a
// number of milliseconds to turn the dashboard into a polled live view.
const POLL_INTERVAL_MS: number | false = false;

async function fetchLogsDashboard(): Promise<LogsDashboardData> {
  const response = await fetch("/api/logs");
  if (!response.ok) {
    throw new Error(`Logs API route failed with status ${response.status}`);
  }
  return response.json();
}

// First load is served from the RSC-prefetched hydration cache; `refetch()`
// gives on-demand refresh, POLL_INTERVAL_MS gives polling. Same query key as
// the server prefetch — that contract is what makes hydration work.
export function useLogsDashboard() {
  return useQuery({
    queryKey: LOGS_DASHBOARD_QUERY_KEY,
    queryFn: fetchLogsDashboard,
    refetchInterval: POLL_INTERVAL_MS,
  });
}
