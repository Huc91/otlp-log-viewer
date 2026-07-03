import { BarChart } from "@/components/charts/bar-chart/bar-chart";
import { formatClock, formatDateTime } from "@/lib/format";
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
  const points = buckets.map((bucket, bucketIndex) => ({
    x: bucket.startTime,
    y: bucket.count,
    label: `${bucket.count} logs`,
    sublabel: `${formatDateTime(new Date(bucket.startTime))} - ${formatClock(
      new Date(bucket.endTime),
    )}`,
    // a tick every 4h (more would collide) plus the newest bucket
    xLabel:
      bucketIndex % 4 === 0 || bucketIndex === buckets.length - 1
        ? formatClock(new Date(bucket.startTime))
        : undefined,
  }));

  // clock-aligned bars overhang the sliding 24h caption window
  const firstBucket = buckets[0];
  const lastBucket = buckets[buckets.length - 1];
  const xDomain: [number, number] =
    firstBucket && lastBucket
      ? [firstBucket.startTime, lastBucket.endTime]
      : [range.fromMs, range.toMs];

  return (
    <section className={styles.panel}>
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
