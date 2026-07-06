"use client";

import { useStore } from "@/features/dashboard-logs/stores";
import styles from "./style.module.css";

export function DisplayModeToggle() {
  const displayMode = useStore((state) => state.displayMode);
  const toggleDisplayMode = useStore(
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
