import { useCallback, useEffect, useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Select from '../components/UI/Select';
import Modal from '../components/UI/Modal';
import Table from '../components/UI/Table';
import StatusBadge from '../components/UI/StatusBadge';
import { formatDate, addMonths } from '../utils/formatDate';
import styles from './Subscriptions.module.css';

const empty = { member_id: '', package_id: '', start_date: '', end_date: '', status: 'AKTIF' };

export default function Subscriptions() {
  const { isAdmin } = useAuth();
  const [rows, setRows] = useState([]);
  const [members, setMembers] = useState([]);
  const [packages, setPackages] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    const [s, m, p] = await Promise.all([
      axiosInstance.get('/subscriptions'),
      axiosInstance.get('/members'),
      axiosInstance.get('/packages'),
    ]);
    setRows(s.data);
    setMembers(m.data);
    setPackages(p.data);
  }, []);

  useEffect(() => {
    load().catch(() => setToast({ type: 'error', text: 'Veri yüklenemedi' }));
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const selectedPkg = packages.find((p) => String(p.id) === String(form.package_id));

  function suggestEnd() {
    if (!form.start_date || !selectedPkg) return;
    const end = addMonths(form.start_date, selectedPkg.duration_month);
    setForm((f) => ({ ...f, end_date: end }));
  }

  async function save(e) {
    e.preventDefault();
    try {
      if (form.id) {
        await axiosInstance.put(`/subscriptions/${form.id}`, form);
        setToast({ type: 'success', text: 'Abonelik güncellendi' });
      } else {
        const { data } = await axiosInstance.post('/subscriptions', form);
        setToast({
          type: data.warning ? 'warn' : 'success',
          text: data.warning || 'Abonelik oluşturuldu',
        });
      }
      setModal(false);
      setForm(empty);
      await load();
    } catch (err) {
      setToast({ type: 'error', text: err.response?.data?.message || 'Kayıt başarısız' });
    }
  }

  async function remove(id) {
    if (!window.confirm('Aboneliği silmek istiyor musunuz?')) return;
    try {
      await axiosInstance.delete(`/subscriptions/${id}`);
      setToast({ type: 'success', text: 'Silindi' });
      await load();
    } catch (err) {
      setToast({ type: 'error', text: err.response?.data?.message || 'Silinemedi' });
    }
  }

  return (
    <div className="pageGrid">
      {toast && <div className={`toast ${toast.type}`}>{toast.text}</div>}
      <h1 className="pageTitle">Abonelikler</h1>
      {isAdmin && (
        <div className="toolbar">
          <Button
            onClick={() => {
              setForm(empty);
              setModal(true);
            }}
          >
            + Yeni abonelik
          </Button>
        </div>
      )}
      <Table
        searchKeys={['first_name', 'last_name', 'package_name']}
        columns={[
          { key: 'member', header: 'Abone', render: (r) => `${r.first_name} ${r.last_name}` },
          { key: 'package_name', header: 'Paket' },
          { key: 'start_date', header: 'Başlangıç', render: (r) => formatDate(r.start_date) },
          { key: 'end_date', header: 'Bitiş', render: (r) => formatDate(r.end_date) },
          { key: 'status', header: 'Durum', render: (r) => <StatusBadge value={r.status} /> },
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
                        member_id: r.member_id,
                        package_id: r.package_id,
                        start_date: r.start_date?.slice(0, 10),
                        end_date: r.end_date?.slice(0, 10),
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
                </div>
              ) : null,
          },
        ]}
        data={rows}
      />

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={form.id ? 'Abonelik düzenle' : 'Yeni abonelik'}
        footer={
          <>
            <Button variant="secondary" type="button" onClick={() => setModal(false)}>
              Vazgeç
            </Button>
            <Button type="submit" form="sub-form">
              Kaydet
            </Button>
          </>
        }
      >
        <form id="sub-form" className={styles.form} onSubmit={save}>
          <Select label="Abone" value={form.member_id} onChange={(e) => setForm({ ...form, member_id: e.target.value })} required>
            <option value="">Seçin</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.first_name} {m.last_name}
              </option>
            ))}
          </Select>
          <Select
            label="Paket"
            value={form.package_id}
            onChange={(e) => setForm({ ...form, package_id: e.target.value })}
            required
          >
            <option value="">Seçin</option>
            {packages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.package_name} ({p.duration_month} ay)
              </option>
            ))}
          </Select>
          <div className={styles.row}>
            <Input
              label="Başlangıç"
              type="date"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              onBlur={suggestEnd}
              required
            />
            <Input label="Bitiş" type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} required />
          </div>
          <Button type="button" variant="secondary" onClick={suggestEnd}>
            Bitiş tarihini pakete göre öner
          </Button>
          <Select label="Durum" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="AKTIF">AKTIF</option>
            <option value="SURESI_DOLMUS">SURESI_DOLMUS</option>
            <option value="IPTAL">IPTAL</option>
          </Select>
          <p className={styles.hint}>Geçerli sağlık raporu olmayan aboneler için sistem uyarısı döner.</p>
        </form>
      </Modal>
    </div>
  );
}
