import styles from './StatusBadge.module.css';

const MAP = {
  AKTIF: 'success',
  GECERLI: 'success',
  ODENDI: 'success',
  BAKIMDA: 'warning',
  KISMI_ODENDI: 'warning',
  BEKLIYOR: 'neutral',
  TAMIRDE: 'orange',
  SURESI_DOLMUS: 'muted',
  IPTAL: 'danger',
  GECIKTI: 'danger',
  EKSIK: 'danger',
  KULLANIM_DISI: 'danger',
};

export default function StatusBadge({ value }) {
  const variant = MAP[value] || 'neutral';
  return <span className={`${styles.badge} ${styles[variant]}`}>{value?.replace(/_/g, ' ') || '—'}</span>;
}
