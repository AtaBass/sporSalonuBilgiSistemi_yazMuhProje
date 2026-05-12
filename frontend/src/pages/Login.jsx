import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/UI/Input';
import Button from '../components/UI/Button';
import styles from './Login.module.css';

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    const to = location.state?.from?.pathname || '/';
    return <Navigate to={to} replace />;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err.response?.data?.message || 'Giriş başarısız');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <span className={styles.logo}>S</span>
          <div>
            <h1 className={styles.title}>FitYönet</h1>
            <p className={styles.sub}>Spor Salonu Yönetim Bilgi Sistemi</p>
          </div>
        </div>
        <form className={styles.form} onSubmit={onSubmit}>
          <Input label="Kullanıcı adı" name="username" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
          <Input
            label="Şifre"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          {error && <p className={styles.error}>{error}</p>}
          <Button type="submit" disabled={loading} className={styles.submit}>
            {loading ? 'Giriş yapılıyor…' : 'Giriş Yap'}
          </Button>
        </form>
        <div className={styles.demo}>
          <strong>Demo:</strong> yönetici / admin123 · personel / personel123
        </div>
      </div>
    </div>
  );
}
