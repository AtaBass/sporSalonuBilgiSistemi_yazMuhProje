import { useMemo, useState } from 'react';
import styles from './Table.module.css';
import Input from './Input';

export default function Table({ columns, data, searchKeys, emptyText = 'Kayıt yok' }) {
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    if (!q.trim() || !searchKeys?.length) return data || [];
    const needle = q.trim().toLowerCase();
    return (data || []).filter((row) =>
      searchKeys.some((k) => String(row[k] ?? '').toLowerCase().includes(needle))
    );
  }, [data, q, searchKeys]);

  return (
    <div className={styles.wrap}>
      {searchKeys?.length > 0 && (
        <div className={styles.search}>
          <Input
            placeholder="Ara..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Tabloda ara"
          />
        </div>
      )}
      <div className={styles.scroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key}>{c.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={columns.length} className={styles.empty}>
                  {emptyText}
                </td>
              </tr>
            )}
            {filtered.map((row, i) => (
              <tr key={row.id ?? i}>
                {columns.map((c) => (
                  <td key={c.key}>{c.render ? c.render(row) : row[c.key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
