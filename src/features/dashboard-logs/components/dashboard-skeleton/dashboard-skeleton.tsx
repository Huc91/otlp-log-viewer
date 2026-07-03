import styles from "./style.module.css";

const SKELETON_ROW_KEYS = Array.from({ length: 10 }, (_, index) => index);

export function DashboardSkeleton() {
  return (
    <div className={styles.grid} aria-busy="true" aria-label="Loading logs">
      <section className={`${styles.card} ${styles.tableCard}`}>
        <div className={styles.titleBlock} />
        <div className={styles.controlsBlock} />
        {SKELETON_ROW_KEYS.map((rowKey) => (
          <div key={rowKey} className={styles.rowBlock} />
        ))}
      </section>
      <div className={styles.rightColumn}>
        <section className={`${styles.card} ${styles.chartCard}`}>
          <div className={styles.titleBlock} />
          <div className={styles.chartBlock} />
        </section>
        <section className={styles.card}>
          <div className={styles.statBlock} />
        </section>
      </div>
    </div>
  );
}
