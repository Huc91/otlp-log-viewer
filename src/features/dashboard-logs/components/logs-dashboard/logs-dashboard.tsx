"use client";

import { StatCard } from "@/components/stat-card/stat-card";
import { formatClock } from "@/lib/format";
import { useLogsDashboard } from "../../hooks/use-logs-dashboard";
import { useDashboardUiStore } from "../../stores";
import { LogTableCard } from "../log-table-card/log-table-card";
import { LogsDistributionCard } from "../logs-distribution-card/logs-distribution-card";
import styles from "./style.module.css";

export function LogsDashboard() {
  const { data, isPending, isError, refetch } = useLogsDashboard();
  const isTableExpanded = useDashboardUiStore(
    (state) => state.isTableExpanded,
  );

  if (isPending) {
    return <p className={styles.stateNote}>Fetching logs…</p>;
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
      {!isTableExpanded && (
        <div className={styles.rightColumn}>
          <LogsDistributionCard buckets={data.buckets} range={data.range} />
          <StatCard
            value={data.rows.length}
            caption={`logs at ${formatClock(new Date(data.fetchedAtMs))}`}
          />
        </div>
      )}
    </div>
  );
}
