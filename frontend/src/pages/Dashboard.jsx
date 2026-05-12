import { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import StatCard from '../components/UI/StatCard';
import Table from '../components/UI/Table';
import StatusBadge from '../components/UI/StatusBadge';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [payments, setPayments] = useState([]);
  const [maint, setMaint] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      setErr('');
      try {
        const [s, p, m] = await Promise.all([
          axiosInstance.get('/dashboard/summary'),
          axiosInstance.get('/payments'),
          axiosInstance.get('/maintenance-records', { params: { upcoming: 'true' } }),
        ]);
        if (!cancel) {
          setSummary(s.data);
          setPayments((p.data || []).slice(0, 6));
          setMaint((m.data || []).slice(0, 6));
        }
      } catch (e) {
        if (!cancel) setErr(e.response?.data?.message || 'Özet yüklenemedi');
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  if (loading && !summary) {
    return <p className={styles.muted}>Yükleniyor…</p>;
  }

  return (
    <div className={styles.page}>
      <h1 className="pageTitle">Spor Salonu Yönetim Paneli</h1>
      {err && <p className={styles.error}>{err}</p>}
      <div className={styles.grid}>
        <StatCard icon="◎" label="Toplam abone" value={summary?.totalMembers ?? '—'} />
        <StatCard icon="◇" label="Aktif abonelik" value={summary?.activeSubscriptions ?? '—'} />
        <StatCard icon="!" label="Geciken ödeme" value={summary?.latePayments ?? '—'} />
        <StatCard icon="✚" label="Süresi dolan sağlık raporu" value={summary?.expiredHealthReports ?? '—'} />
        <StatCard icon="◐" label="Bakım zamanı gelen alet" value={summary?.upcomingMaintenanceCount ?? '—'} />
        <StatCard icon="↑" label="Aylık gelir" value={formatCurrency(summary?.monthlyIncome)} />
        <StatCard icon="↓" label="Aylık gider" value={formatCurrency(summary?.monthlyExpense)} />
        <StatCard icon="≡" label="Net bütçe" value={formatCurrency(summary?.netBudget)} hint="Seçili ay (ödemeler / bakım-tamir)" />
      </div>
      <div className={styles.tables}>
        <section className={styles.panel}>
          <h2>Son ödemeler</h2>
          <Table
            columns={[
              { key: 'due_date', header: 'Vade', render: (r) => formatDate(r.due_date) },
              { key: 'name', header: 'Abone', render: (r) => `${r.first_name} ${r.last_name}` },
              { key: 'amount', header: 'Tutar', render: (r) => formatCurrency(r.amount) },
              { key: 'status', header: 'Durum', render: (r) => <StatusBadge value={r.status} /> },
            ]}
            data={payments}
            emptyText="Ödeme kaydı yok"
          />
        </section>
        <section className={styles.panel}>
          <h2>Bakım zamanı yaklaşan aletler</h2>
          <Table
            columns={[
              { key: 'equipment_name', header: 'Alet' },
              { key: 'next_maintenance_date', header: 'Sonraki bakım', render: (r) => formatDate(r.next_maintenance_date) },
              { key: 'equipment_status', header: 'Alet durumu', render: (r) => <StatusBadge value={r.equipment_status} /> },
            ]}
            data={maint}
            emptyText="Kayıt yok"
          />
        </section>
      </div>
    </div>
  );
}
