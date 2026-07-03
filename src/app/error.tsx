"use client";

import styles from "./error.module.css";

export default function DashboardError({ reset }: { reset: () => void }) {
  return (
    <main className={styles.errorPage}>
      <h1 className={styles.title}>Something went wrong</h1>
      <p className={styles.note}>
        The log data could not be loaded or rendered.
      </p>
      <button type="button" className={styles.retryButton} onClick={reset}>
        Try again
      </button>
    </main>
  );
}
