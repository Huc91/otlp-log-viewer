import { Suspense } from "react";
import { connection } from "next/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { LogsDashboard } from "@/features/dashboard-logs/components/logs-dashboard/logs-dashboard";
import {
  getLogsDashboardData,
  LOGS_DASHBOARD_QUERY_KEY,
} from "@/features/dashboard-logs/api/dashboard-data";
import { getQueryClient } from "@/lib/query-client";
import styles from "./page.module.css";

export default function DashboardPage() {
  return (
    <main className={styles.main}>
      <h1 className={styles.pageTitle}>Overview</h1>
      <Suspense fallback={<p className={styles.loadingNote}>Fetching logs…</p>}>
        <PrefetchedDashboard />
      </Suspense>
    </main>
  );
}

// Server-side prefetch into the query cache: the client renders instantly from
// the hydrated cache, while refetch()/polling stay available via the hook.
async function PrefetchedDashboard() {
  // The API returns random data per request; opt into dynamic rendering so a
  // fresh payload is fetched on every page load, not at build time.
  await connection();
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({
    queryKey: LOGS_DASHBOARD_QUERY_KEY,
    queryFn: getLogsDashboardData,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <LogsDashboard />
    </HydrationBoundary>
  );
}
