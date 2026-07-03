"use client";

import { useDisplayModeStore } from "@/features/dashboard-logs/stores";
import type { LogRow, ServiceGroup } from "@/features/dashboard-logs/api/view-model";
import { DisplayModeToggle } from "../display-mode-toggle/display-mode-toggle";
import { GroupedLogList } from "../grouped-log-list/grouped-log-list";
import { LogTable } from "../log-table/log-table";
import styles from "./style.module.css";

interface LogTablePanelProps {
  rows: LogRow[];
  groups: ServiceGroup[];
}

export function LogTablePanel({ rows, groups }: LogTablePanelProps) {
  const displayMode = useDisplayModeStore((state) => state.displayMode);

  return (
    <section className={styles.card}>
      <h2 className={styles.title}>All logs</h2>
      <div className={styles.controls}>
        <DisplayModeToggle />
        <span className={styles.expandHint}>expand →</span>
      </div>
      {displayMode === "grouped" ? (
        <GroupedLogList groups={groups} />
      ) : (
        <LogTable rows={rows} />
      )}
    </section>
  );
}
