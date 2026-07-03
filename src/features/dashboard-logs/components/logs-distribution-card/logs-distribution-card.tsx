import { BarChart } from "@/components/charts/bar-chart/bar-chart";
import type { ClusteredLogsByHour, TimeRange } from "@/features/dashboard-logs/api/view-model";
import styles from "./style.module.css";

interface LogsDistributionCardProps {
  buckets: ClusteredLogsByHour[];
  range: TimeRange;
}

export function LogsDistributionCard({
  buckets,
  range,
}: LogsDistributionCardProps) {
  const points = buckets.map((bucket, bucketIndex) => ({
    x: bucket.startTime,
    y: bucket.count,
    label: `${bucket.count} logs`,
    sublabel: bucket.rangeLabel,
    xLabel:
      bucketIndex % 4 === 0 || bucketIndex === buckets.length - 1
        ? bucket.startLabel
        : undefined,
  }));

  const firstBucket = buckets[0];
  const lastBucket = buckets[buckets.length - 1];
  const xDomain: [number, number] =
    firstBucket && lastBucket
      ? [firstBucket.startTime, lastBucket.endTime]
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
