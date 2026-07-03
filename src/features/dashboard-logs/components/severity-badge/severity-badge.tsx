import type { SeverityBand } from "@/features/dashboard-logs/api/view-model";
import styles from "./style.module.css";

interface SeverityBadgeProps {
  band: SeverityBand;
  label: string;
}

export function SeverityBadge({ band, label }: SeverityBadgeProps) {
  return (
    <span className={styles.badge}>
      <span className={styles.dot} data-band={band} />
      {label}
    </span>
  );
}
