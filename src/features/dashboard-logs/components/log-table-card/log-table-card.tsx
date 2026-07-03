"use client";

import { useDashboardUiStore } from "@/features/dashboard-logs/stores";
import type { LogRow, NamespaceGroup } from "@/features/dashboard-logs/api/view-model";
import { DisplayModeToggle } from "../display-mode-toggle/display-mode-toggle";
import { GroupedLogList } from "../grouped-log-list/grouped-log-list";
import { LogTable } from "../log-table/log-table";
import styles from "./style.module.css";

interface LogTableCardProps {
  rows: LogRow[];
  groups: NamespaceGroup[];
}

export function LogTableCard({ rows, groups }: LogTableCardProps) {
  const displayMode = useDashboardUiStore((state) => state.displayMode);
  const isTableExpanded = useDashboardUiStore(
    (state) => state.isTableExpanded,
  );
  const toggleTableExpanded = useDashboardUiStore(
    (state) => state.toggleTableExpanded,
  );

  return (
    <section className={styles.card}>
      <h2 className={styles.title}>All logs</h2>
      <div className={styles.controls}>
        <DisplayModeToggle />
        <button
          type="button"
          className={styles.expandButton}
          onClick={toggleTableExpanded}
          aria-pressed={isTableExpanded}
          aria-label={isTableExpanded ? "Collapse table" : "Expand table"}
          title={isTableExpanded ? "Collapse table" : "Expand table"}
        >
          <ExpandIcon collapsing={isTableExpanded} />
        </button>
      </div>
      {displayMode === "grouped" ? (
        <div className={`${styles.tableArea} ${styles.scrollsWhole}`}>
          <GroupedLogList groups={groups} />
        </div>
      ) : (
        <div className={styles.tableArea}>
          <LogTable rows={rows} showServiceColumns={isTableExpanded} />
        </div>
      )}
    </section>
  );
}

function ExpandIcon({ collapsing }: { collapsing: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {collapsing ? (
        <>
          <path d="M6 2 L6 6 L2 6" />
          <path d="M10 14 L10 10 L14 10" />
        </>
      ) : (
        <>
          <path d="M9 2 L14 2 L14 7" />
          <path d="M7 14 L2 14 L2 9" />
        </>
      )}
    </svg>
  );
}
