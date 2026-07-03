import type { ServiceGroup } from "@/features/dashboard-logs/api/view-model";
import { LogTable } from "../log-table/log-table";
import styles from "./style.module.css";

interface GroupedLogListProps {
  groups: ServiceGroup[];
}

// Draft grouped view: one collapsible section per service, each embedding the
// same table. Revisit once groupByService lands (counts, default collapsed
// state, group-level severity summary).
export function GroupedLogList({ groups }: GroupedLogListProps) {
  if (groups.length === 0) {
    return (
      <p className={styles.emptyNote}>
        No groups yet — waiting on the data formatting algorithm
        (groupByService).
      </p>
    );
  }

  return (
    <div className={styles.groupList}>
      {groups.map((group) => (
        <details key={group.service.key} open>
          <summary className={styles.groupSummary}>
            {group.service.namespace}/{group.service.name}{" "}
            <span className={styles.groupMeta}>
              v{group.service.version} · {group.rows.length} logs
            </span>
          </summary>
          <LogTable rows={group.rows} />
        </details>
      ))}
    </div>
  );
}
