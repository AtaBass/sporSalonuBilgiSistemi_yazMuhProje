import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Topbar } from './Topbar';
import styles from './MainLayout.module.css';

export default function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className={styles.root}>
      <Sidebar mobileOpen={mobileOpen} onNavigate={() => setMobileOpen(false)} />
      {mobileOpen && (
        <button
          type="button"
          className={styles.backdrop}
          aria-label="Menüyü kapat"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <div className={styles.main}>
        <Topbar onMenuClick={() => setMobileOpen((o) => !o)} />
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
