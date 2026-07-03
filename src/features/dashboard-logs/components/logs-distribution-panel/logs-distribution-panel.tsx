import { BarChart } from "@/components/charts/bar-chart/bar-chart";
import { formatDateTime } from "@/lib/format";
import type { ClusteredLogsByHour, TimeRange } from "@/features/dashboard-logs/api/view-model";
import styles from "./style.module.css";

interface LogsDistributionPanelProps {
  buckets: ClusteredLogsByHour[];
  range: TimeRange;
}

export function LogsDistributionPanel({
  buckets,
  range,
}: LogsDistributionPanelProps) {
  const points = buckets.map((bucket) => ({
    x: bucket.startTime,
    y: bucket.count,
    label: `${bucket.count} logs`,
  }));

  return (
    <section className={styles.panel}>
      <h2 className={styles.title}>
        Logs distribution <strong>24h</strong>
      </h2>
      <div className={styles.chartArea}>
        <BarChart
          points={points}
          xDomain={[range.fromMs, range.toMs]}
          ariaLabel="Log count distribution over time"
          emptyMessage="No logs in the selected window."
        />
      </div>
      <dl className={styles.rangeCaption}>
        <dt className={styles.rangeLabel}>from</dt>
        <dd className={styles.rangeValue}>
          {formatDateTime(new Date(range.fromMs))}
        </dd>
        <dt className={styles.rangeLabel}>to</dt>
        <dd className={styles.rangeValue}>
          {formatDateTime(new Date(range.toMs))}
        </dd>
      </dl>
    </section>
  );
}
