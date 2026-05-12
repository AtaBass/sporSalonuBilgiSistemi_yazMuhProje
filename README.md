# Spor Salonu Yönetim Bilgi Sistemi

Web tabanlı, yerel ortamda çalışan sade bir **spor salonu yönetim paneli**. Bireysel abonelikler, paketler, ödemeler, sağlık raporları, spor aletleri, bakım ve tamir süreçleri ile bütçe özetini tek yerden yönetmenizi sağlar.

## Kullanılan teknolojiler

| Katman | Teknoloji |
|--------|-----------|
| Frontend | React 18 (JavaScript), Vite, React Router, Axios |
| Stil | Plain CSS + CSS Modules |
| Backend | Node.js, Express.js |
| Veritabanı | PostgreSQL |
| API | REST + JSON Web Token (JWT) ile basit oturum |

## Proje klasör yapısı

```
├── backend/                 # Express REST API
│   ├── src/
│   │   ├── config/          # Veritabanı bağlantısı
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middlewares/
│   │   ├── services/        # İş kuralları (ödeme, bütçe vb.)
│   │   ├── utils/
│   │   ├── app.js
│   │   └── server.js
│   ├── package.json
│   └── .env.example
├── frontend/                # React arayüz
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── context/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── .env.example
├── database/
│   ├── schema.sql           # Tablo tanımları
│   └── seed.sql             # Örnek veriler
└── README.md
```

## PostgreSQL veritabanı oluşturma

1. [PostgreSQL](https://www.postgresql.org/download/) kurulu ve çalışır durumda olsun.
2. `psql` veya pgAdmin ile bağlanın ve veritabanı oluşturun:

```sql
CREATE DATABASE spor_salonu;
```

3. Bağlantı dizesini `backend/.env` içinde `DATABASE_URL` olarak tanımlayın (örnek `backend/.env.example` dosyasına bakın).

## Şema ve örnek veriler

PowerShell örneği (yol ve kullanıcı adını kendi ortamınıza göre düzenleyin):

```powershell
psql -U postgres -d spor_salonu -f database/schema.sql
psql -U postgres -d spor_salonu -f database/seed.sql
```

`seed.sql` çalıştırmadan önce tabloların `schema.sql` ile oluşturulmuş olması gerekir. Seed, tabloları temizleyip (`TRUNCATE ... CASCADE`) örnek kayıtları yeniden yükler.

## Backend’i başlatma

```powershell
cd backend
copy .env.example .env
# .env içinde DATABASE_URL ve JWT_SECRET değerlerini düzenleyin
npm install
npm run dev
```

API varsayılan adres: `http://localhost:5000`  
Sağlık kontrolü: `GET http://localhost:5000/api/health`

## Frontend’i başlatma

Ayrı bir terminalde:

```powershell
cd frontend
copy .env.example .env
# Gerekirse VITE_API_URL değerini düzenleyin
npm install
npm run dev
```

Arayüz: `http://localhost:5173`

## Demo kullanıcılar

| Kullanıcı adı | Şifre | Rol |
|---------------|-------|-----|
| yonetici | admin123 | Yönetici |
| personel | personel123 | Personel |

Yönetici tüm CRUD ve bütçe raporuna erişir. Personel çoğu listeyi görüntüleyebilir; abonelik paketi / abonelik / ödeme / sağlık / tamir oluşturma gibi işlemler yöneticiye bırakılmıştır. Bakım kaydı oluşturabilir ve alet durumunu güncelleyebilir.

## API uç noktaları (özet)

Tüm korumalı uçlar `Authorization: Bearer <token>` ister.

| Grup | Metot | Yol |
|------|--------|-----|
| Auth | POST | `/api/auth/login` |
| Dashboard | GET | `/api/dashboard/summary` |
| Aboneler | GET, GET/:id, POST, PUT/:id, DELETE/:id | `/api/members` |
| Paketler | GET, GET/:id, POST, PUT/:id, DELETE/:id | `/api/packages` |
| Abonelikler | GET, GET/:id, POST, PUT/:id, DELETE/:id | `/api/subscriptions` |
| Ödemeler | GET, GET/late, POST, PUT/:id, DELETE/:id | `/api/payments` |
| Sağlık | GET, GET/expired, GET/missing, POST, PUT/:id, DELETE/:id | `/api/health-reports` |
| Aletler | GET, GET/:id, POST, PUT/:id, DELETE/:id | `/api/equipments` |
| Bakım | GET, GET/upcoming, POST, PUT/:id, DELETE/:id | `/api/maintenance-records` |
| Tamir | GET, POST, PUT/:id, DELETE/:id | `/api/repair-records` |
| Bütçe | GET/summary, GET?startDate&endDate | `/api/budget` |

## İş kuralları (kısa)

- Geçerli sağlık raporu olmayan aboneye abonelik açılabilir; API uyarı mesajı döner.
- Sağlık raporunda bitiş tarihi boş bırakılırsa rapor tarihine göre 1 yıl sonrası önerilir.
- Ödeme durumu tutar, ödenen ve vade tarihine göre sunucuda hesaplanır (`ODENDI`, `KISMI_ODENDI`, `GECIKTI`, `BEKLIYOR`).
- Bütçe geliri: `payments` tablosunda `status = 'ODENDI'` olan kayıtların `paid_amount` toplamı (tarih aralığında `payment_date`).
- Gider: `maintenance_records.cost` + `repair_records.cost` (tarih aralığında ilgili tarih alanlarına göre).

## Lisans

Eğitim / proje amaçlı kullanım için hazırlanmıştır.
