"use client";

import { useDashboardUiStore } from "@/features/dashboard-logs/stores";
import styles from "./style.module.css";

export function DisplayModeToggle() {
  const displayMode = useDashboardUiStore((state) => state.displayMode);
  const toggleDisplayMode = useDashboardUiStore(
    (state) => state.toggleDisplayMode,
  );

  return (
    <button
      type="button"
      role="switch"
      aria-checked={displayMode === "grouped"}
      onClick={toggleDisplayMode}
      className={styles.toggleButton}
    >
      group by service
      <span className={styles.track}>
        <span className={styles.thumb} />
      </span>
    </button>
  );
}
