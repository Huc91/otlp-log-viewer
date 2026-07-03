"use client";

import { StatCard } from "@/components/stat-card/stat-card";
import { DashboardSkeleton } from "../dashboard-skeleton/dashboard-skeleton";
import { useIsDesktop } from "../../hooks/use-is-desktop";
import { useLogsDashboard } from "../../hooks/use-logs-dashboard";
import { useDashboardUiStore } from "../../stores";
import { LogTableCard } from "../log-table-card/log-table-card";
import { LogsDistributionCard } from "../logs-distribution-card/logs-distribution-card";
import styles from "./style.module.css";

export function LogsDashboard() {
  const { data, isPending, isError, refetch } = useLogsDashboard();
  const isDesktop = useIsDesktop();
  const isTableExpanded =
    useDashboardUiStore((state) => state.isTableExpanded) && isDesktop;

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
        <LogsDistributionCard buckets={data.buckets} range={data.range} />
        <StatCard
          value={data.rows.length}
          caption={`logs at ${data.fetchedAtLabel}`}
        />
      </div>
    </div>
  );
}
