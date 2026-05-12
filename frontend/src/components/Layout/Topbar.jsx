import styles from './Topbar.module.css';
import Button from '../UI/Button';
import { useAuth } from '../../context/AuthContext';

export function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  return (
    <header className={styles.bar}>
      <div className={styles.left}>
        {onMenuClick && (
          <button type="button" className={styles.menuBtn} onClick={onMenuClick} aria-label="Menü">
            ☰
          </button>
        )}
        <span className={styles.crumb}>Yönetim Paneli</span>
      </div>
      <div className={styles.right}>
        <span className={styles.user}>
          <strong>{user?.username}</strong>
          <span className={styles.role}>{user?.role === 'YONETICI' ? 'Yönetici' : 'Personel'}</span>
        </span>
        <Button variant="secondary" onClick={logout}>
          Çıkış
        </Button>
      </div>
    </header>
  );
}
