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
import styles from './RepairRecords.module.css';

const empty = {
  equipment_id: '',
  service_name: '',
  sent_date: '',
  return_date: '',
  fault_description: '',
  repair_description: '',
  cost: '0',
  set_equipment_tamirde: true,
};

export default function RepairRecords() {
  const { isAdmin } = useAuth();
  const [rows, setRows] = useState([]);
  const [equips, setEquips] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    const { data } = await axiosInstance.get('/repair-records');
    setRows(data);
  }, []);

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
      if (form.id) {
        await axiosInstance.put(`/repair-records/${form.id}`, {
          service_name: form.service_name,
          sent_date: form.sent_date,
          return_date: form.return_date || null,
          fault_description: form.fault_description,
          repair_description: form.repair_description,
          cost: Number(form.cost || 0),
          activate_equipment: form.activate_equipment !== false,
        });
        setToast({ type: 'success', text: 'Güncellendi' });
      } else {
        await axiosInstance.post('/repair-records', {
          equipment_id: Number(form.equipment_id),
          service_name: form.service_name,
          sent_date: form.sent_date,
          return_date: form.return_date || null,
          fault_description: form.fault_description,
          repair_description: form.repair_description,
          cost: Number(form.cost || 0),
          set_equipment_tamirde: form.set_equipment_tamirde !== false,
        });
        setToast({ type: 'success', text: 'Tamir kaydı oluşturuldu' });
      }
      setModal(false);
      setForm(empty);
      await load();
    } catch (err) {
      setToast({ type: 'error', text: err.response?.data?.message || 'Kayıt başarısız' });
    }
  }

  async function remove(id) {
    if (!window.confirm('Silinsin mi?')) return;
    try {
      await axiosInstance.delete(`/repair-records/${id}`);
      setToast({ type: 'success', text: 'Silindi' });
      await load();
    } catch (err) {
      setToast({ type: 'error', text: err.response?.data?.message || 'Silinemedi' });
    }
  }

  return (
    <div className="pageGrid">
      {toast && <div className={`toast ${toast.type}`}>{toast.text}</div>}
      <h1 className="pageTitle">Tamir Kayıtları</h1>
      {isAdmin && (
        <div className="toolbar">
          <Button
            onClick={() => {
              setForm(empty);
              setModal(true);
            }}
          >
            + Tamir kaydı
          </Button>
        </div>
      )}
      <Table
        searchKeys={['equipment_name', 'service_name', 'fault_description']}
        columns={[
          { key: 'equipment_name', header: 'Alet' },
          { key: 'service_name', header: 'Servis' },
          { key: 'sent_date', header: 'Gönderim', render: (r) => formatDate(r.sent_date) },
          { key: 'return_date', header: 'Dönüş', render: (r) => formatDate(r.return_date) },
          { key: 'cost', header: 'Maliyet', render: (r) => formatCurrency(r.cost) },
          {
            key: 'a',
            header: '',
            render: (r) =>
              isAdmin ? (
                <div className={styles.actions}>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setForm({
                        id: r.id,
                        equipment_id: r.equipment_id,
                        service_name: r.service_name || '',
                        sent_date: r.sent_date?.slice(0, 10),
                        return_date: r.return_date?.slice(0, 10) || '',
                        fault_description: r.fault_description || '',
                        repair_description: r.repair_description || '',
                        cost: r.cost,
                        activate_equipment: true,
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
        title={form.id ? 'Tamir düzenle' : 'Yeni tamir kaydı'}
        footer={
          <>
            <Button variant="secondary" type="button" onClick={() => setModal(false)}>
              Vazgeç
            </Button>
            <Button type="submit" form="r-form">
              Kaydet
            </Button>
          </>
        }
      >
        <form id="r-form" className={styles.form} onSubmit={save}>
          {!form.id && (
            <Select label="Alet" value={form.equipment_id} onChange={(e) => setForm({ ...form, equipment_id: e.target.value })} required>
              <option value="">Seçin</option>
              {equips.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.equipment_name}
                </option>
              ))}
            </Select>
          )}
          <Input label="Servis adı" value={form.service_name} onChange={(e) => setForm({ ...form, service_name: e.target.value })} />
          <div className={styles.row}>
            <Input label="Gönderim tarihi" type="date" value={form.sent_date} onChange={(e) => setForm({ ...form, sent_date: e.target.value })} required />
            <Input label="Dönüş tarihi" type="date" value={form.return_date} onChange={(e) => setForm({ ...form, return_date: e.target.value })} />
          </div>
          <label className={styles.lbl}>
            Arıza
            <textarea className={styles.ta} value={form.fault_description} onChange={(e) => setForm({ ...form, fault_description: e.target.value })} rows={2} />
          </label>
          <label className={styles.lbl}>
            Tamir açıklaması
            <textarea className={styles.ta} value={form.repair_description} onChange={(e) => setForm({ ...form, repair_description: e.target.value })} rows={2} />
          </label>
          <Input label="Maliyet (₺)" type="number" step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
          {!form.id && (
            <label className={styles.check}>
              <input
                type="checkbox"
                checked={form.set_equipment_tamirde !== false}
                onChange={(e) => setForm({ ...form, set_equipment_tamirde: e.target.checked })}
              />
              Aleti TAMIRDE yap
            </label>
          )}
          {form.id && (
            <label className={styles.check}>
              <input
                type="checkbox"
                checked={form.activate_equipment !== false}
                onChange={(e) => setForm({ ...form, activate_equipment: e.target.checked })}
              />
              Dönüş tarihi varsa aleti AKTIF yap
            </label>
          )}
        </form>
      </Modal>
    </div>
  );
}
