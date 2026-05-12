-- Spor Salonu Yönetim Bilgi Sistemi - PostgreSQL şeması

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('YONETICI', 'PERSONEL')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS members (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(30),
  email VARCHAR(150),
  birth_date DATE,
  gender VARCHAR(20),
  registration_date DATE DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS membership_packages (
  id SERIAL PRIMARY KEY,
  package_name VARCHAR(150) NOT NULL,
  description TEXT,
  weekly_day_count INTEGER,
  start_time TIME,
  end_time TIME,
  duration_month INTEGER NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS package_days (
  id SERIAL PRIMARY KEY,
  package_id INTEGER NOT NULL REFERENCES membership_packages(id) ON DELETE CASCADE,
  day_name VARCHAR(20) NOT NULL
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  package_id INTEGER REFERENCES membership_packages(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(30) NOT NULL CHECK (status IN ('AKTIF', 'SURESI_DOLMUS', 'IPTAL')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  subscription_id INTEGER NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  payment_date DATE,
  due_date DATE NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  paid_amount NUMERIC(10,2) DEFAULT 0,
  payment_method VARCHAR(50),
  status VARCHAR(30) NOT NULL CHECK (status IN ('ODENDI', 'BEKLIYOR', 'GECIKTI', 'KISMI_ODENDI')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS health_reports (
  id SERIAL PRIMARY KEY,
  member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  institution_name VARCHAR(150),
  report_date DATE,
  expiry_date DATE,
  status VARCHAR(30) NOT NULL CHECK (status IN ('GECERLI', 'SURESI_DOLMUS', 'EKSIK')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS equipments (
  id SERIAL PRIMARY KEY,
  equipment_name VARCHAR(150) NOT NULL,
  brand VARCHAR(100),
  model VARCHAR(100),
  serial_number VARCHAR(100),
  purchase_date DATE,
  location VARCHAR(100),
  status VARCHAR(30) NOT NULL CHECK (status IN ('AKTIF', 'BAKIMDA', 'TAMIRDE', 'KULLANIM_DISI')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS maintenance_records (
  id SERIAL PRIMARY KEY,
  equipment_id INTEGER NOT NULL REFERENCES equipments(id) ON DELETE CASCADE,
  maintenance_date DATE NOT NULL,
  staff_name VARCHAR(150),
  description TEXT,
  cost NUMERIC(10,2) DEFAULT 0,
  next_maintenance_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS repair_records (
  id SERIAL PRIMARY KEY,
  equipment_id INTEGER NOT NULL REFERENCES equipments(id) ON DELETE CASCADE,
  service_name VARCHAR(150),
  sent_date DATE NOT NULL,
  return_date DATE,
  fault_description TEXT,
  repair_description TEXT,
  cost NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_member ON subscriptions(member_id);
CREATE INDEX IF NOT EXISTS idx_payments_subscription ON payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_health_reports_member ON health_reports(member_id);
CREATE INDEX IF NOT EXISTS idx_package_days_package ON package_days(package_id);
