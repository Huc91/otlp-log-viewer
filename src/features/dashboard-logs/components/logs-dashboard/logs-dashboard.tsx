"use client";

import { StatCard } from "@/components/stat-card/stat-card";
import { formatClock } from "@/lib/format";
import { useLogsDashboard } from "../../hooks/use-logs-dashboard";
import { LogTablePanel } from "../log-table-panel/log-table-panel";
import { LogsDistributionPanel } from "../logs-distribution-panel/logs-distribution-panel";
import styles from "./style.module.css";

export function LogsDashboard() {
  const { data, isPending, isError, refetch } = useLogsDashboard();

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
    <div className={styles.grid}>
      <LogTablePanel rows={data.rows} groups={data.groups} />
      <div className={styles.rightColumn}>
        <LogsDistributionPanel buckets={data.buckets} range={data.range} />
        <StatCard
          value={data.rows.length}
          caption={`logs at ${formatClock(new Date(data.fetchedAtMs))}`}
        />
      </div>
    </div>
  );
}
