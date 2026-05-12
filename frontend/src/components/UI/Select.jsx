import styles from './Input.module.css';

export default function Select({ label, id, children, error, className = '', ...props }) {
  const sid = id || props.name;
  return (
    <label className={`${styles.wrap} ${className}`} htmlFor={sid}>
      {label && <span className={styles.label}>{label}</span>}
      <select id={sid} className={`${styles.input} ${error ? styles.inputError : ''}`} {...props}>
        {children}
      </select>
      {error && <span className={styles.error}>{error}</span>}
    </label>
  );
}
