import { useCallback, useEffect, useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Select from '../components/UI/Select';
import Modal from '../components/UI/Modal';
import Table from '../components/UI/Table';
import StatusBadge from '../components/UI/StatusBadge';
import styles from './Equipments.module.css';

const empty = {
  equipment_name: '',
  brand: '',
  model: '',
  serial_number: '',
  purchase_date: '',
  location: '',
  status: 'AKTIF',
};

export default function Equipments() {
  const { isAdmin, user } = useAuth();
  const [rows, setRows] = useState([]);
  const [modal, setModal] = useState(false);
  const [statusModal, setStatusModal] = useState(null);
  const [form, setForm] = useState(empty);
  const [statusVal, setStatusVal] = useState('AKTIF');
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    const { data } = await axiosInstance.get('/equipments');
    setRows(data);
  }, []);

  useEffect(() => {
    load().catch(() => setToast({ type: 'error', text: 'Liste yüklenemedi' }));
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  async function save(e) {
    e.preventDefault();
    try {
      if (form.id) {
        await axiosInstance.put(`/equipments/${form.id}`, form);
        setToast({ type: 'success', text: 'Güncellendi' });
      } else {
        await axiosInstance.post('/equipments', form);
        setToast({ type: 'success', text: 'Eklendi' });
      }
      setModal(false);
      setForm(empty);
      await load();
    } catch (err) {
      setToast({ type: 'error', text: err.response?.data?.message || 'Kayıt başarısız' });
    }
  }

  async function saveStatus() {
    if (!statusModal) return;
    try {
      await axiosInstance.put(`/equipments/${statusModal.id}`, { status: statusVal });
      setToast({ type: 'success', text: 'Durum güncellendi' });
      setStatusModal(null);
      await load();
    } catch (err) {
      setToast({ type: 'error', text: err.response?.data?.message || 'Güncellenemedi' });
    }
  }

  async function remove(id) {
    if (!window.confirm('Silinsin mi?')) return;
    try {
      await axiosInstance.delete(`/equipments/${id}`);
      setToast({ type: 'success', text: 'Silindi' });
      await load();
    } catch (err) {
      setToast({ type: 'error', text: err.response?.data?.message || 'Silinemedi' });
    }
  }

  return (
    <div className="pageGrid">
      {toast && <div className={`toast ${toast.type}`}>{toast.text}</div>}
      <h1 className="pageTitle">Spor Aletleri</h1>
      <div className="toolbar">
        {isAdmin && (
          <Button
            onClick={() => {
              setForm(empty);
              setModal(true);
            }}
          >
            + Yeni alet
          </Button>
        )}
      </div>
      <Table
        searchKeys={['equipment_name', 'brand', 'model', 'serial_number', 'location']}
        columns={[
          { key: 'equipment_name', header: 'Ad' },
          { key: 'brand', header: 'Marka' },
          { key: 'model', header: 'Model' },
          { key: 'serial_number', header: 'Seri no' },
          { key: 'location', header: 'Konum' },
          { key: 'status', header: 'Durum', render: (r) => <StatusBadge value={r.status} /> },
          {
            key: 'a',
            header: '',
            render: (r) => (
              <div className={styles.actions}>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setStatusVal(r.status);
                    setStatusModal(r);
                  }}
                >
                  Durum
                </Button>
                {isAdmin && (
                  <>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setForm({
                          id: r.id,
                          equipment_name: r.equipment_name,
                          brand: r.brand || '',
                          model: r.model || '',
                          serial_number: r.serial_number || '',
                          purchase_date: r.purchase_date?.slice(0, 10) || '',
                          location: r.location || '',
                          status: r.status,
                        });
                        setModal(true);
                      }}
                    >
                      Düzenle
                    </Button>
                    <Button variant="ghost" onClick={() => remove(r.id)}>
                      Sil
                    </Button>
                  </>
                )}
              </div>
            ),
          },
        ]}
        data={rows}
      />

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={form.id ? 'Alet düzenle' : 'Yeni alet'}
        footer={
          <>
            <Button variant="secondary" type="button" onClick={() => setModal(false)}>
              Vazgeç
            </Button>
            <Button type="submit" form="eq-form">
              Kaydet
            </Button>
          </>
        }
      >
        <form id="eq-form" className={styles.form} onSubmit={save}>
          <Input label="Alet adı" value={form.equipment_name} onChange={(e) => setForm({ ...form, equipment_name: e.target.value })} required />
          <div className={styles.row}>
            <Input label="Marka" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
            <Input label="Model" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
          </div>
          <Input label="Seri numarası" value={form.serial_number} onChange={(e) => setForm({ ...form, serial_number: e.target.value })} />
          <div className={styles.row}>
            <Input label="Satın alma tarihi" type="date" value={form.purchase_date} onChange={(e) => setForm({ ...form, purchase_date: e.target.value })} />
            <Input label="Konum" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
          {isAdmin && (
            <Select label="Durum" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="AKTIF">AKTIF</option>
              <option value="BAKIMDA">BAKIMDA</option>
              <option value="TAMIRDE">TAMIRDE</option>
              <option value="KULLANIM_DISI">KULLANIM_DISI</option>
            </Select>
          )}
        </form>
      </Modal>

      <Modal
        open={!!statusModal}
        onClose={() => setStatusModal(null)}
        title={statusModal ? `Durum — ${statusModal.equipment_name}` : ''}
        footer={
          <>
            <Button variant="secondary" type="button" onClick={() => setStatusModal(null)}>
              Vazgeç
            </Button>
            <Button type="button" onClick={saveStatus}>
              Kaydet
            </Button>
          </>
        }
      >
        <p className={styles.meta}>Güncelleyen: {user?.username}</p>
        <Select label="Durum" value={statusVal} onChange={(e) => setStatusVal(e.target.value)}>
          <option value="AKTIF">AKTIF</option>
          <option value="BAKIMDA">BAKIMDA</option>
          <option value="TAMIRDE">TAMIRDE</option>
          <option value="KULLANIM_DISI">KULLANIM_DISI</option>
        </Select>
      </Modal>
    </div>
  );
}
