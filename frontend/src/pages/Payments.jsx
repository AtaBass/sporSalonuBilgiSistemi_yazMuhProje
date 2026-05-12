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
import { formatCurrency } from '../utils/formatCurrency';
import { previewPaymentStatus } from '../utils/paymentStatus';
import styles from './Payments.module.css';

const empty = { subscription_id: '', due_date: '', amount: '', paid_amount: '0', payment_method: '', payment_date: '' };

export default function Payments() {
  const { isAdmin } = useAuth();
  const [rows, setRows] = useState([]);
  const [subs, setSubs] = useState([]);
  const [lateOnly, setLateOnly] = useState(false);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    const url = lateOnly ? '/payments/late' : '/payments';
    const { data } = await axiosInstance.get(url);
    setRows(data);
  }, [lateOnly]);

  useEffect(() => {
    load().catch(() => setToast({ type: 'error', text: 'Ödemeler yüklenemedi' }));
  }, [load]);

  useEffect(() => {
    axiosInstance
      .get('/subscriptions')
      .then((r) => setSubs(r.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const preview = form.due_date && form.amount !== '' ? previewPaymentStatus(form.amount, form.paid_amount, form.due_date) : '';

  async function save(e) {
    e.preventDefault();
    try {
      if (form.id) {
        await axiosInstance.put(`/payments/${form.id}`, {
          due_date: form.due_date,
          amount: Number(form.amount),
          paid_amount: Number(form.paid_amount),
          payment_method: form.payment_method || null,
          payment_date: form.payment_date || null,
        });
        setToast({ type: 'success', text: 'Güncellendi' });
      } else {
        await axiosInstance.post('/payments', {
          subscription_id: Number(form.subscription_id),
          due_date: form.due_date,
          amount: Number(form.amount),
          paid_amount: Number(form.paid_amount),
          payment_method: form.payment_method || null,
          payment_date: form.payment_date || null,
        });
        setToast({ type: 'success', text: 'Ödeme eklendi' });
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
      await axiosInstance.delete(`/payments/${id}`);
      setToast({ type: 'success', text: 'Silindi' });
      await load();
    } catch (err) {
      setToast({ type: 'error', text: err.response?.data?.message || 'Silinemedi' });
    }
  }

  return (
    <div className="pageGrid">
      {toast && <div className={`toast ${toast.type}`}>{toast.text}</div>}
      <h1 className="pageTitle">Ödemeler</h1>
      <div className="toolbar">
        <label className={styles.check}>
          <input type="checkbox" checked={lateOnly} onChange={(e) => setLateOnly(e.target.checked)} />
          Yalnızca gecikenler
        </label>
        {isAdmin && (
          <Button
            onClick={() => {
              setForm(empty);
              setModal(true);
            }}
          >
            + Ödeme kaydı
          </Button>
        )}
      </div>
      <Table
        searchKeys={['first_name', 'last_name', 'package_name']}
        columns={[
          { key: 'member', header: 'Abone', render: (r) => `${r.first_name} ${r.last_name}` },
          { key: 'due_date', header: 'Son ödeme', render: (r) => formatDate(r.due_date) },
          { key: 'amount', header: 'Tutar', render: (r) => formatCurrency(r.amount) },
          { key: 'paid_amount', header: 'Ödenen', render: (r) => formatCurrency(r.paid_amount) },
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
                        subscription_id: r.subscription_id,
                        due_date: r.due_date?.slice(0, 10),
                        amount: r.amount,
                        paid_amount: r.paid_amount,
                        payment_method: r.payment_method || '',
                        payment_date: r.payment_date?.slice(0, 10) || '',
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
        title={form.id ? 'Ödeme düzenle' : 'Yeni ödeme'}
        footer={
          <>
            <Button variant="secondary" type="button" onClick={() => setModal(false)}>
              Vazgeç
            </Button>
            <Button type="submit" form="pay-form">
              Kaydet
            </Button>
          </>
        }
      >
        <form id="pay-form" className={styles.form} onSubmit={save}>
          {!form.id && (
            <Select label="Abonelik" value={form.subscription_id} onChange={(e) => setForm({ ...form, subscription_id: e.target.value })} required>
              <option value="">Seçin</option>
              {subs.map((s) => (
                <option key={s.id} value={s.id}>
                  #{s.id} — {s.first_name} {s.last_name} / {s.package_name}
                </option>
              ))}
            </Select>
          )}
          <Input label="Son ödeme tarihi" type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} required />
          <div className={styles.row}>
            <Input label="Tutar" type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            <Input label="Ödenen tutar" type="number" step="0.01" value={form.paid_amount} onChange={(e) => setForm({ ...form, paid_amount: e.target.value })} />
          </div>
          <Input label="Ödeme yöntemi" value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })} />
          <Input label="Ödeme tarihi (opsiyonel)" type="date" value={form.payment_date} onChange={(e) => setForm({ ...form, payment_date: e.target.value })} />
          {preview && (
            <p className={styles.preview}>
              Hesaplanan durum: <StatusBadge value={preview} />
            </p>
          )}
        </form>
      </Modal>
    </div>
  );
}
