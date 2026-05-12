import { useCallback, useEffect, useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Select from '../components/UI/Select';
import Modal from '../components/UI/Modal';
import Table from '../components/UI/Table';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import styles from './MaintenanceRecords.module.css';

const empty = {
  equipment_id: '',
  maintenance_date: '',
  staff_name: '',
  description: '',
  cost: '0',
  next_maintenance_date: '',
  mark_equipment_bakimda: false,
};

export default function MaintenanceRecords() {
  const { isAdmin, user } = useAuth();
  const [rows, setRows] = useState([]);
  const [equips, setEquips] = useState([]);
  const [upcoming, setUpcoming] = useState(false);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    const { data } = await axiosInstance.get('/maintenance-records', {
      params: upcoming ? { upcoming: 'true' } : {},
    });
    setRows(data);
  }, [upcoming]);

  useEffect(() => {
    load().catch(() => setToast({ type: 'error', text: 'Liste yüklenemedi' }));
  }, [load]);

  useEffect(() => {
    axiosInstance
      .get('/equipments')
      .then((r) => setEquips(r.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  async function save(e) {
    e.preventDefault();
    try {
      await axiosInstance.post('/maintenance-records', {
        ...form,
        equipment_id: Number(form.equipment_id),
        cost: Number(form.cost || 0),
        staff_name: form.staff_name || user?.username,
        mark_equipment_bakimda: !!form.mark_equipment_bakimda,
      });
      setToast({ type: 'success', text: 'Bakım kaydı oluşturuldu' });
      setModal(false);
      setForm(empty);
      await load();
    } catch (err) {
      setToast({ type: 'error', text: err.response?.data?.message || 'Kayıt başarısız' });
    }
  }

  async function remove(id) {
    if (!isAdmin) return;
    if (!window.confirm('Silinsin mi?')) return;
    try {
      await axiosInstance.delete(`/maintenance-records/${id}`);
      setToast({ type: 'success', text: 'Silindi' });
      await load();
    } catch (err) {
      setToast({ type: 'error', text: err.response?.data?.message || 'Silinemedi' });
    }
  }

  return (
    <div className="pageGrid">
      {toast && <div className={`toast ${toast.type}`}>{toast.text}</div>}
      <h1 className="pageTitle">Bakım Kayıtları</h1>
      <div className="toolbar">
        <label className={styles.check}>
          <input type="checkbox" checked={upcoming} onChange={(e) => setUpcoming(e.target.checked)} />
          Yaklaşan bakımlar (30 gün)
        </label>
        <Button
          onClick={() => {
            setForm({ ...empty, staff_name: user?.username || '' });
            setModal(true);
          }}
        >
          + Bakım kaydı
        </Button>
      </div>
      <Table
        searchKeys={['equipment_name', 'staff_name', 'description']}
        columns={[
          { key: 'equipment_name', header: 'Alet' },
          { key: 'maintenance_date', header: 'Tarih', render: (r) => formatDate(r.maintenance_date) },
          { key: 'staff_name', header: 'Personel' },
          { key: 'cost', header: 'Maliyet', render: (r) => formatCurrency(r.cost) },
          { key: 'next_maintenance_date', header: 'Sonraki', render: (r) => formatDate(r.next_maintenance_date) },
          {
            key: 'a',
            header: '',
            render: (r) =>
              isAdmin ? (
                <Button variant="ghost" onClick={() => remove(r.id)}>
                  Sil
                </Button>
              ) : null,
          },
        ]}
        data={rows}
      />

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Yeni bakım kaydı"
        footer={
          <>
            <Button variant="secondary" type="button" onClick={() => setModal(false)}>
              Vazgeç
            </Button>
            <Button type="submit" form="m-form">
              Kaydet
            </Button>
          </>
        }
      >
        <form id="m-form" className={styles.form} onSubmit={save}>
          <Select label="Alet" value={form.equipment_id} onChange={(e) => setForm({ ...form, equipment_id: e.target.value })} required>
            <option value="">Seçin</option>
            {equips.map((e) => (
              <option key={e.id} value={e.id}>
                {e.equipment_name}
              </option>
            ))}
          </Select>
          <Input label="Bakım tarihi" type="date" value={form.maintenance_date} onChange={(e) => setForm({ ...form, maintenance_date: e.target.value })} required />
          <Input label="Personel" value={form.staff_name} onChange={(e) => setForm({ ...form, staff_name: e.target.value })} />
          <label className={styles.lbl}>
            Açıklama
            <textarea className={styles.ta} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
          </label>
          <div className={styles.row}>
            <Input label="Maliyet (₺)" type="number" step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
            <Input
              label="Sonraki bakım"
              type="date"
              value={form.next_maintenance_date}
              onChange={(e) => setForm({ ...form, next_maintenance_date: e.target.value })}
            />
          </div>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={!!form.mark_equipment_bakimda}
              onChange={(e) => setForm({ ...form, mark_equipment_bakimda: e.target.checked })}
            />
            Alet durumunu BAKIMDA yap
          </label>
        </form>
      </Modal>
    </div>
  );
}
