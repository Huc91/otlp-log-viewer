import type { LogRow } from "@/features/dashboard-logs/api/view-model";
import styles from "./style.module.css";

interface LogDetailsProps {
  row: LogRow;
}

// Draft: bodyKind-aware rendering (pretty JSON, preformatted stack traces)
// lands together with the transform algorithm.
export function LogDetails({ row }: LogDetailsProps) {
  const attributeEntries = Object.entries(row.attributes);

  return (
    <div className={styles.details}>
      <pre className={styles.body}>{row.body}</pre>
      {attributeEntries.length > 0 && (
        <dl className={styles.attributeList}>
          {attributeEntries.map(([key, value]) => (
            <div key={key} className={styles.attributeEntry}>
              <dt className={styles.attributeKey}>{key}</dt>
              <dd className={styles.attributeValue}>{String(value)}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
