import styles from "./style.module.css";

interface StatCardProps {
  value: number | string;
  caption: string;
}

export function StatCard({ value, caption }: StatCardProps) {
  return (
    <section className={styles.card}>
      <p className={styles.stat}>
        <span className={styles.value}>{value}</span>
        <span className={styles.caption}>{caption}</span>
      </p>
    </section>
  );
}
