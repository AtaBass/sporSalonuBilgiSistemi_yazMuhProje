import { useCallback, useEffect, useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Select from '../components/UI/Select';
import Modal from '../components/UI/Modal';
import Table from '../components/UI/Table';
import StatusBadge from '../components/UI/StatusBadge';
import { formatDate } from '../utils/formatDate';
import styles from './Members.module.css';

const emptyForm = {
  first_name: '',
  last_name: '',
  phone: '',
  email: '',
  birth_date: '',
  gender: '',
  is_active: true,
};

export default function Members() {
  const { isAdmin } = useAuth();
  const [rows, setRows] = useState([]);
  const [filterActive, setFilterActive] = useState('');
  const [modal, setModal] = useState(false);
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchList = useCallback(async () => {
    const { data } = await axiosInstance.get('/members', {
      params: { active: filterActive || undefined },
    });
    setRows(data);
  }, [filterActive]);

  useEffect(() => {
    fetchList().catch(() => setToast({ type: 'error', text: 'Liste alınamadı' }));
  }, [fetchList]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const dataFiltered = rows;

  async function openDetail(id) {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get(`/members/${id}`);
      setDetail(data);
    } catch {
      setToast({ type: 'error', text: 'Detay yüklenemedi' });
    } finally {
      setLoading(false);
    }
  }

  async function saveMember(e) {
    e.preventDefault();
    setLoading(true);
    try {
      if (form.id) {
        await axiosInstance.put(`/members/${form.id}`, form);
        setToast({ type: 'success', text: 'Abone güncellendi' });
      } else {
        await axiosInstance.post('/members', form);
        setToast({ type: 'success', text: 'Abone eklendi' });
      }
      setModal(false);
      setForm(emptyForm);
      await fetchList();
    } catch (err) {
      setToast({ type: 'error', text: err.response?.data?.message || 'Kayıt başarısız' });
    } finally {
      setLoading(false);
    }
  }

  async function deleteMember(id) {
    if (!window.confirm('Bu aboneyi silmek istediğinize emin misiniz?')) return;
    try {
      await axiosInstance.delete(`/members/${id}`);
      setToast({ type: 'success', text: 'Silindi' });
      if (detail?.id === id) setDetail(null);
      await fetchList();
    } catch (err) {
      setToast({ type: 'error', text: err.response?.data?.message || 'Silinemedi' });
    }
  }

  const activeSub = detail?.subscriptions?.find((s) => s.status === 'AKTIF');
  const latestHealth = detail?.healthReports?.[0];

  return (
    <div className="pageGrid">
      {toast && <div className={`toast ${toast.type}`}>{toast.text}</div>}
      <h1 className="pageTitle">Aboneler</h1>
      <div className="toolbar">
        <Select label="" name="active" value={filterActive} onChange={(e) => setFilterActive(e.target.value)} style={{ maxWidth: 200 }}>
          <option value="">Tümü</option>
          <option value="true">Aktif</option>
          <option value="false">Pasif</option>
        </Select>
        {isAdmin && (
          <Button
            onClick={() => {
              setForm(emptyForm);
              setModal(true);
            }}
          >
            + Yeni abone
          </Button>
        )}
      </div>
      <Table
        searchKeys={['first_name', 'last_name', 'phone', 'email']}
        columns={[
          { key: 'name', header: 'Ad Soyad', render: (r) => `${r.first_name} ${r.last_name}` },
          { key: 'phone', header: 'Telefon' },
          { key: 'email', header: 'E-posta' },
          { key: 'is_active', header: 'Durum', render: (r) => <span className={r.is_active ? styles.act : styles.pas}>{r.is_active ? 'Aktif' : 'Pasif'}</span> },
          {
            key: 'actions',
            header: '',
            render: (r) => (
              <div className={styles.actions}>
                <Button variant="ghost" onClick={() => openDetail(r.id)}>
                  Detay
                </Button>
                {isAdmin && (
                  <>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setForm({ ...r, birth_date: r.birth_date?.slice(0, 10) || '' });
                        setModal(true);
                      }}
                    >
                      Düzenle
                    </Button>
                    <Button variant="ghost" onClick={() => deleteMember(r.id)}>
                      Sil
                    </Button>
                  </>
                )}
              </div>
            ),
          },
        ]}
        data={dataFiltered}
      />

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={form.id ? 'Abone düzenle' : 'Yeni abone'}
        footer={
          <>
            <Button variant="secondary" type="button" onClick={() => setModal(false)}>
              Vazgeç
            </Button>
            <Button type="submit" form="member-form" disabled={loading}>
              Kaydet
            </Button>
          </>
        }
      >
        <form id="member-form" className={styles.form} onSubmit={saveMember}>
          <div className={styles.row}>
            <Input label="Ad" name="first_name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} required />
            <Input label="Soyad" name="last_name" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} required />
          </div>
          <Input label="Telefon" name="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="E-posta" type="email" name="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <div className={styles.row}>
            <Input label="Doğum tarihi" type="date" name="birth_date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} />
            <Select label="Cinsiyet" name="gender" value={form.gender || ''} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
              <option value="">—</option>
              <option value="Erkek">Erkek</option>
              <option value="Kadın">Kadın</option>
            </Select>
          </div>
          <label className={styles.check}>
            <input type="checkbox" checked={!!form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            Aktif
          </label>
        </form>
      </Modal>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail ? `${detail.first_name} ${detail.last_name}` : ''}>
        {detail && (
          <div className={styles.detail}>
            <section>
              <h3>Kişisel</h3>
              <p>
                <strong>Telefon:</strong> {detail.phone || '—'}
              </p>
              <p>
                <strong>E-posta:</strong> {detail.email || '—'}
              </p>
              <p>
                <strong>Doğum:</strong> {formatDate(detail.birth_date)}
              </p>
            </section>
            <section>
              <h3>Aktif abonelik</h3>
              {activeSub ? (
                <p>
                  {activeSub.package_name} · {formatDate(activeSub.start_date)} – {formatDate(activeSub.end_date)} ·{' '}
                  <StatusBadge value={activeSub.status} />
                </p>
              ) : (
                <p className={styles.muted}>Yok</p>
              )}
            </section>
            <section>
              <h3>Sağlık raporu</h3>
              {latestHealth ? (
                <p>
                  {latestHealth.institution_name || '—'} · Bitiş: {formatDate(latestHealth.expiry_date)} ·{' '}
                  <StatusBadge value={latestHealth.status} />
                </p>
              ) : (
                <p className={styles.muted}>Kayıt yok</p>
              )}
            </section>
            <section>
              <h3>Ödeme geçmişi</h3>
              <ul className={styles.list}>
                {(detail.payments || []).slice(0, 8).map((p) => (
                  <li key={p.id}>
                    {formatDate(p.due_date)} · {p.amount} ₺ · <StatusBadge value={p.status} />
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}
      </Modal>
    </div>
  );
}
