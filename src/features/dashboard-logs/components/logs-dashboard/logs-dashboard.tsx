"use client";

import { StatCard } from "@/components/stat-card/stat-card";
import { DashboardSkeleton } from "../dashboard-skeleton/dashboard-skeleton";
import { useIsDesktop } from "../../hooks/use-is-desktop";
import { useLogsDashboard } from "../../hooks/use-logs-dashboard";
import { useStore } from "../../stores";
import { LogTableCard } from "../log-table-card/log-table-card";
import { LogsDistributionCard } from "../logs-distribution-card/logs-distribution-card";
import styles from "./style.module.css";
import { useSearchParams } from "next/navigation";


export function LogsDashboard() {
  const severityFilter = useSearchParams().get("severityFilter") ?? "";
  console.log('severityFilter in comp', severityFilter)
  const { data, isPending, isError, refetch } = useLogsDashboard(severityFilter);
  const isDesktop = useIsDesktop();
  const isTableExpanded =
    useStore((state) => state.isTableExpanded) && isDesktop;

  if (isPending) {
    return <DashboardSkeleton />;
  }

  if (isError) {
    return (
      <p className={styles.stateNote}>
        Could not load logs.{" "}
        <button
          type="button"
          onClick={() => refetch()}
          className={styles.retryButton}
        >
          Retry
        </button>
      </p>
    );
  }

  return (
    <div
      className={
        isTableExpanded ? `${styles.grid} ${styles.gridExpanded}` : styles.grid
      }
    >
      <LogTableCard rows={data.rows} groups={data.groups} />
      <div className={styles.rightColumn} inert={isTableExpanded}>
        <LogsDistributionCard clusters={data.clusters} range={data.range} />
        <StatCard
          value={data.rows.length}
          caption={`logs at ${data.fetchedAtLabel}`}
        />
      </div>
    </div>
  );
}
