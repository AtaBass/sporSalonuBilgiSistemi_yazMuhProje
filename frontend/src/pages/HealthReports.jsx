import { useCallback, useEffect, useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Select from '../components/UI/Select';
import Modal from '../components/UI/Modal';
import Table from '../components/UI/Table';
import StatusBadge from '../components/UI/StatusBadge';
import { formatDate, addYears } from '../utils/formatDate';
import styles from './HealthReports.module.css';

const empty = { member_id: '', institution_name: '', report_date: '', expiry_date: '', status: '' };

export default function HealthReports() {
  const { isAdmin } = useAuth();
  const [rows, setRows] = useState([]);
  const [members, setMembers] = useState([]);
  const [filter, setFilter] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    let url = '/health-reports';
    if (filter === 'expired') url = '/health-reports/expired';
    if (filter === 'missing') url = '/health-reports/missing';
    const { data } = await axiosInstance.get(url);
    setRows(data);
  }, [filter]);

  useEffect(() => {
    load().catch(() => setToast({ type: 'error', text: 'Liste yüklenemedi' }));
  }, [load]);

  useEffect(() => {
    axiosInstance
      .get('/members')
      .then((r) => setMembers(r.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  function onReportDateChange(val) {
    const exp = val ? addYears(val, 1) : '';
    setForm((f) => ({ ...f, report_date: val, expiry_date: exp }));
  }

  async function save(e) {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (form.id) {
        await axiosInstance.put(`/health-reports/${form.id}`, payload);
        setToast({ type: 'success', text: 'Güncellendi' });
      } else {
        await axiosInstance.post('/health-reports', payload);
        setToast({ type: 'success', text: 'Kayıt eklendi' });
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
      await axiosInstance.delete(`/health-reports/${id}`);
      setToast({ type: 'success', text: 'Silindi' });
      await load();
    } catch (err) {
      setToast({ type: 'error', text: err.response?.data?.message || 'Silinemedi' });
    }
  }

  return (
    <div className="pageGrid">
      {toast && <div className={`toast ${toast.type}`}>{toast.text}</div>}
      <h1 className="pageTitle">Sağlık Raporları</h1>
      <div className="toolbar">
        <Select label="" value={filter} onChange={(e) => setFilter(e.target.value)} className={styles.filter}>
          <option value="">Tümü</option>
          <option value="expired">Süresi dolmuş</option>
          <option value="missing">Eksik</option>
        </Select>
        {isAdmin && (
          <Button
            onClick={() => {
              setForm(empty);
              setModal(true);
            }}
          >
            + Rapor ekle
          </Button>
        )}
      </div>
      <Table
        searchKeys={['first_name', 'last_name', 'institution_name']}
        columns={[
          { key: 'member', header: 'Abone', render: (r) => `${r.first_name} ${r.last_name}` },
          { key: 'institution_name', header: 'Kurum' },
          { key: 'report_date', header: 'Rapor tarihi', render: (r) => formatDate(r.report_date) },
          { key: 'expiry_date', header: 'Geçerlilik', render: (r) => formatDate(r.expiry_date) },
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
                        institution_name: r.institution_name || '',
                        report_date: r.report_date?.slice(0, 10) || '',
                        expiry_date: r.expiry_date?.slice(0, 10) || '',
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
        title={form.id ? 'Rapor düzenle' : 'Yeni sağlık raporu'}
        footer={
          <>
            <Button variant="secondary" type="button" onClick={() => setModal(false)}>
              Vazgeç
            </Button>
            <Button type="submit" form="hr-form">
              Kaydet
            </Button>
          </>
        }
      >
        <form id="hr-form" className={styles.form} onSubmit={save}>
          {!form.id && (
            <Select label="Abone" value={form.member_id} onChange={(e) => setForm({ ...form, member_id: e.target.value })} required>
              <option value="">Seçin</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.first_name} {m.last_name}
                </option>
              ))}
            </Select>
          )}
          <Input label="Kurum adı" value={form.institution_name} onChange={(e) => setForm({ ...form, institution_name: e.target.value })} />
          <div className={styles.row}>
            <Input label="Rapor tarihi" type="date" value={form.report_date} onChange={(e) => onReportDateChange(e.target.value)} />
            <Input label="Geçerlilik bitişi" type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} />
          </div>
          <Select label="Durum (opsiyonel)" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="">Otomatik</option>
            <option value="GECERLI">GECERLI</option>
            <option value="SURESI_DOLMUS">SURESI_DOLMUS</option>
            <option value="EKSIK">EKSIK</option>
          </Select>
          <p className={styles.hint}>Rapor tarihi seçildiğinde geçerlilik varsayılan olarak 1 yıl sonrası atanır.</p>
        </form>
      </Modal>
    </div>
  );
}
