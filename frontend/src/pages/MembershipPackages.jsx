import { useCallback, useEffect, useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Modal from '../components/UI/Modal';
import Table from '../components/UI/Table';
import styles from './MembershipPackages.module.css';

const WEEK_DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

const emptyForm = {
  package_name: '',
  description: '',
  weekly_day_count: '',
  start_time: '',
  end_time: '',
  duration_month: 1,
  price: '',
  is_active: true,
  days: [],
};

export default function MembershipPackages() {
  const { isAdmin } = useAuth();
  const [rows, setRows] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    const { data } = await axiosInstance.get('/packages');
    setRows(data);
  }, []);

  useEffect(() => {
    load().catch(() => setToast({ type: 'error', text: 'Paketler yüklenemedi' }));
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  function toggleDay(day) {
    setForm((f) => {
      const has = f.days.includes(day);
      return { ...f, days: has ? f.days.filter((d) => d !== day) : [...f.days, day] };
    });
  }

  async function save(e) {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        weekly_day_count: form.weekly_day_count ? Number(form.weekly_day_count) : null,
        duration_month: Number(form.duration_month),
        price: Number(form.price),
      };
      if (form.id) {
        await axiosInstance.put(`/packages/${form.id}`, payload);
        setToast({ type: 'success', text: 'Paket güncellendi' });
      } else {
        await axiosInstance.post('/packages', payload);
        setToast({ type: 'success', text: 'Paket oluşturuldu' });
      }
      setModal(false);
      setForm(emptyForm);
      await load();
    } catch (err) {
      setToast({ type: 'error', text: err.response?.data?.message || 'Kayıt başarısız' });
    }
  }

  async function remove(id) {
    if (!window.confirm('Paketi silmek istiyor musunuz?')) return;
    try {
      await axiosInstance.delete(`/packages/${id}`);
      setToast({ type: 'success', text: 'Silindi' });
      await load();
    } catch (err) {
      setToast({ type: 'error', text: err.response?.data?.message || 'Silinemedi' });
    }
  }

  return (
    <div className="pageGrid">
      {toast && <div className={`toast ${toast.type}`}>{toast.text}</div>}
      <h1 className="pageTitle">Abonelik Paketleri</h1>
      {isAdmin && (
        <div className="toolbar">
          <Button
            onClick={() => {
              setForm(emptyForm);
              setModal(true);
            }}
          >
            + Yeni paket
          </Button>
        </div>
      )}
      <Table
        searchKeys={['package_name', 'description']}
        columns={[
          { key: 'package_name', header: 'Paket' },
          { key: 'duration_month', header: 'Süre (ay)' },
          { key: 'price', header: 'Ücret (₺)', render: (r) => Number(r.price).toFixed(2) },
          { key: 'weekly_day_count', header: 'Haftalık gün' },
          {
            key: 'hours',
            header: 'Saat',
            render: (r) =>
              r.start_time && r.end_time ? `${String(r.start_time).slice(0, 5)} – ${String(r.end_time).slice(0, 5)}` : '—',
          },
          {
            key: 'days',
            header: 'Günler',
            render: (r) => (r.days || []).map((d) => d.day_name).join(', ') || '—',
          },
          {
            key: 'actions',
            header: '',
            render: (r) =>
              isAdmin ? (
                <div className={styles.actions}>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setForm({
                        id: r.id,
                        package_name: r.package_name,
                        description: r.description || '',
                        weekly_day_count: r.weekly_day_count ?? '',
                        start_time: r.start_time ? String(r.start_time).slice(0, 5) : '',
                        end_time: r.end_time ? String(r.end_time).slice(0, 5) : '',
                        duration_month: r.duration_month,
                        price: r.price,
                        is_active: r.is_active,
                        days: (r.days || []).map((d) => d.day_name),
                      });
                      setModal(true);
                    }}
                  >
                    Düzenle
                  </Button>
                  <Button variant="ghost" onClick={() => remove(r.id)}>
                    Sil
                  </Button>
                </div>
              ) : null,
          },
        ]}
        data={rows}
      />

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={form.id ? 'Paket güncelle' : 'Yeni paket'}
        footer={
          <>
            <Button variant="secondary" type="button" onClick={() => setModal(false)}>
              Vazgeç
            </Button>
            <Button type="submit" form="pkg-form">
              Kaydet
            </Button>
          </>
        }
      >
        <form id="pkg-form" className={styles.form} onSubmit={save}>
          <Input label="Paket adı" value={form.package_name} onChange={(e) => setForm({ ...form, package_name: e.target.value })} required />
          <label className={styles.lbl}>
            Açıklama
            <textarea className={styles.ta} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
          </label>
          <div className={styles.row}>
            <Input label="Haftalık gün sayısı" type="number" min={0} value={form.weekly_day_count} onChange={(e) => setForm({ ...form, weekly_day_count: e.target.value })} />
            <Input label="Süre (ay)" type="number" min={1} value={form.duration_month} onChange={(e) => setForm({ ...form, duration_month: e.target.value })} required />
          </div>
          <div className={styles.row}>
            <Input label="Başlangıç saati" type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
            <Input label="Bitiş saati" type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
          </div>
          <Input label="Ücret (₺)" type="number" step="0.01" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
          <fieldset className={styles.days}>
            <legend>Günler</legend>
            <div className={styles.dayGrid}>
              {WEEK_DAYS.map((d) => (
                <label key={d} className={styles.day}>
                  <input type="checkbox" checked={form.days.includes(d)} onChange={() => toggleDay(d)} />
                  {d}
                </label>
              ))}
            </div>
          </fieldset>
          <label className={styles.check}>
            <input type="checkbox" checked={!!form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            Aktif
          </label>
        </form>
      </Modal>
    </div>
  );
}
