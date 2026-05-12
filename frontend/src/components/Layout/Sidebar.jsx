import { NavLink } from 'react-router-dom';
import styles from './Sidebar.module.css';
import { useAuth } from '../../context/AuthContext';

const items = [
  { to: '/', label: 'Dashboard', icon: '▣' },
  { to: '/members', label: 'Aboneler', icon: '◎' },
  { to: '/packages', label: 'Abonelik Paketleri', icon: '◈' },
  { to: '/subscriptions', label: 'Abonelikler', icon: '◇' },
  { to: '/payments', label: 'Ödemeler', icon: '₺' },
  { to: '/health-reports', label: 'Sağlık Raporları', icon: '✚' },
  { to: '/equipments', label: 'Spor Aletleri', icon: '⚙' },
  { to: '/maintenance', label: 'Bakım Kayıtları', icon: '◐' },
  { to: '/repairs', label: 'Tamir Kayıtları', icon: '✎' },
  { to: '/budget', label: 'Bütçe Raporu', icon: '≡', adminOnly: true },
];

export default function Sidebar({ mobileOpen, onNavigate }) {
  const { isAdmin } = useAuth();
  const visible = items.filter((i) => !i.adminOnly || isAdmin);

  return (
    <aside className={`${styles.sidebar} ${mobileOpen ? styles.open : ''}`}>
      <div className={styles.brand}>
        <span className={styles.logo}>S</span>
        <div>
          <div className={styles.brandTitle}>FitYönet</div>
          <div className={styles.brandSub}>Spor Salonu</div>
        </div>
      </div>
      <nav className={styles.nav}>
        {visible.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
            onClick={() => onNavigate?.()}
          >
            <span className={styles.ico}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
