import { Suspense } from "react";
import { connection } from "next/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { DashboardSkeleton } from "@/features/dashboard-logs/components/dashboard-skeleton/dashboard-skeleton";
import { LogsDashboard } from "@/features/dashboard-logs/components/logs-dashboard/logs-dashboard";
import {
  getLogsDashboardData,
  LOGS_DASHBOARD_QUERY_KEY,
} from "@/features/dashboard-logs/api/dashboard-data";
import { getQueryClient } from "@/lib/query-client";
import styles from "./page.module.css";

export default async function DashboardPage({searchParams}) {
  const { severityFilter } = await searchParams;
  console.log('params id', severityFilter);
  return (
    <main className={styles.main}>
      <h1 className={styles.pageTitle}>Dashboard</h1>
      <Suspense fallback={<DashboardSkeleton />}>
        <PrefetchedDashboard filter={severityFilter}/>
      </Suspense>
    </main>
  );
}

// Server-side prefetch into the query cache: the client renders instantly from
// the hydrated cache, while refetch()/polling stay available via the hook.
async function PrefetchedDashboard({filter}) {

  // The API returns random data per request; opt into dynamic rendering so a
  // fresh payload is fetched on every page load, not at build time.
  await connection();
  const queryClient = getQueryClient();
  const valueToFilter = filter ? filter : ""
  console.log('valueToFilter', valueToFilter);
  await queryClient.prefetchQuery({
    queryKey: [...LOGS_DASHBOARD_QUERY_KEY, valueToFilter],
    queryFn: () => getLogsDashboardData( valueToFilter),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <LogsDashboard />
    </HydrationBoundary>
  );
}
