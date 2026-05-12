import styles from './Input.module.css';

export default function Input({ label, id, error, className = '', ...props }) {
  const inputId = id || props.name;
  return (
    <label className={`${styles.wrap} ${className}`} htmlFor={inputId}>
      {label && <span className={styles.label}>{label}</span>}
      <input id={inputId} className={`${styles.input} ${error ? styles.inputError : ''}`} {...props} />
      {error && <span className={styles.error}>{error}</span>}
    </label>
  );
}
