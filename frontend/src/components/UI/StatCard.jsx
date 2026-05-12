import styles from './StatCard.module.css';

export default function StatCard({ label, value, hint, icon }) {
  return (
    <div className={styles.card}>
      <div className={styles.top}>
        <span className={styles.icon} aria-hidden>
          {icon}
        </span>
        <span className={styles.label}>{label}</span>
      </div>
      <div className={styles.value}>{value}</div>
      {hint && <div className={styles.hint}>{hint}</div>}
    </div>
  );
}
