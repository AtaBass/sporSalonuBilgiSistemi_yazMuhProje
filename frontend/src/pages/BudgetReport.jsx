import { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import StatCard from '../components/UI/StatCard';
import Table from '../components/UI/Table';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import styles from './BudgetReport.module.css';

function monthDefaults() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const fmt = (d) => d.toISOString().slice(0, 10);
  return { start: fmt(start), end: fmt(end) };
}

export default function BudgetReport() {
  const defaults = monthDefaults();
  const [start, setStart] = useState(defaults.start);
  const [end, setEnd] = useState(defaults.end);
  const [data, setData] = useState(null);
  const [toast, setToast] = useState(null);

  async function load() {
    try {
      const { data: d } = await axiosInstance.get('/budget', { params: { startDate: start, endDate: end } });
      setData(d);
    } catch (err) {
      setToast({ type: 'error', text: err.response?.data?.message || 'Rapor alınamadı' });
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const movements = data?.movements || [];

  return (
    <div className="pageGrid">
      {toast && <div className={`toast ${toast.type}`}>{toast.text}</div>}
      <h1 className="pageTitle">Bütçe Raporu</h1>
      <div className={styles.filters}>
        <Input label="Başlangıç" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        <Input label="Bitiş" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        <Button onClick={load}>Uygula</Button>
      </div>
      <div className={styles.cards}>
        <StatCard icon="↑" label="Toplam gelir" value={formatCurrency(data?.income)} />
        <StatCard icon="↓" label="Toplam gider" value={formatCurrency(data?.expense)} />
        <StatCard icon="◐" label="Bakım gideri" value={formatCurrency(data?.maintenanceExpense)} />
        <StatCard icon="✎" label="Tamir gideri" value={formatCurrency(data?.repairExpense)} />
        <StatCard icon="≡" label="Net bütçe" value={formatCurrency(data?.net)} />
      </div>
      <section>
        <h2 className={styles.h2}>Gelir — gider hareketleri</h2>
        <Table
          columns={[
            { key: 'type', header: 'Tip' },
            { key: 'movement_date', header: 'Tarih', render: (r) => formatDate(r.movement_date) },
            { key: 'detail', header: 'Açıklama' },
            {
              key: 'amount',
              header: 'Tutar',
              render: (r) => (r.type === 'GELIR' ? formatCurrency(r.paid_amount) : formatCurrency(r.amount)),
            },
            { key: 'status', header: 'Durum', render: (r) => r.status || '—' },
          ]}
          data={movements}
          emptyText="Bu aralıkta hareket yok"
        />
      </section>
    </div>
  );
}
