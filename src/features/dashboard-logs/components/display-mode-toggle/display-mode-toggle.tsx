"use client";

import { useDisplayModeStore } from "@/features/dashboard-logs/stores";
import styles from "./style.module.css";

export function DisplayModeToggle() {
  const displayMode = useDisplayModeStore((state) => state.displayMode);
  const toggleDisplayMode = useDisplayModeStore(
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
