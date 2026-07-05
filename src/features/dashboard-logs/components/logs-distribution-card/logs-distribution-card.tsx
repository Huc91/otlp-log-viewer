"use client";

import { BarChart } from "@/components/charts/bar-chart/bar-chart";
import type { ClusteredLogsByHour, TimeRange } from "@/features/dashboard-logs/api/view-model";
import { useDashboardUiStore } from "@/features/dashboard-logs/stores";
import styles from "./style.module.css";

interface LogsDistributionCardProps {
  clusters: ClusteredLogsByHour[];
  range: TimeRange;
}

export function LogsDistributionCard({
  clusters,
  range,
}: LogsDistributionCardProps) {
  const highlightedHourMs = useDashboardUiStore(
    (state) => state.highlightedHourMs,
  );
  const displayMode = useDashboardUiStore((state) => state.displayMode);
  const requestHourFocus = useDashboardUiStore(
    (state) => state.requestHourFocus,
  );
  const points = clusters.map((cluster, clusterIndex) => ({
    x: cluster.startTime,
    y: cluster.count,
    label: `${cluster.count} logs`,
    sublabel: cluster.rangeLabel,
    xLabel:
      clusterIndex % 4 === 0 || clusterIndex === clusters.length - 1
        ? cluster.startLabel
        : undefined,
  }));

  const firstCluster = clusters[0];
  const lastCluster = clusters[clusters.length - 1];
  const xDomain: [number, number] =
    firstCluster && lastCluster
      ? [firstCluster.startTime, lastCluster.endTime]
      : [range.fromMs, range.toMs];

  return (
    <section className={styles.card}>
      <h2 className={styles.title}>
        Logs distribution <strong>24h</strong>
      </h2>
      <div className={styles.chartArea}>
        <BarChart
          points={points}
          xDomain={xDomain}
          ariaLabel="Log count distribution over time"
          emptyMessage="No logs in the selected window."
          highlightedX={highlightedHourMs ?? undefined}
          onPointSelect={
            displayMode === "flat"
              ? (point) => requestHourFocus(point.x)
              : undefined
          }
        />
      </div>
      <dl className={styles.rangeCaption}>
        <dt className={styles.rangeLabel}>from</dt>
        <dd className={styles.rangeValue}>{range.fromLabel}</dd>
        <dt className={styles.rangeLabel}>to</dt>
        <dd className={styles.rangeValue}>{range.toLabel}</dd>
      </dl>
    </section>
  );
}
