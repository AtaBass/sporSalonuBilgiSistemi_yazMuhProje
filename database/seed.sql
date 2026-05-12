-- Örnek veriler (temizleyip tekrar yüklemek için önce tabloları boşaltın veya yeni DB kullanın)
TRUNCATE TABLE repair_records, maintenance_records, payments, subscriptions, health_reports, package_days, membership_packages, equipments, members, users RESTART IDENTITY CASCADE;

INSERT INTO users (username, password, role, is_active) VALUES
  ('yonetici', '$2b$10$QZeNrpTJTEah648R7nsoGeFki2PUtCNVfRfp8Ksq5US6.p7WJHjOO', 'YONETICI', true),
  ('personel', '$2b$10$5GXPwB6.rJET1iRl3kQLPuQtyXj72hph8/V0c9QRzqELvug2Yc5Xq', 'PERSONEL', true);

INSERT INTO members (first_name, last_name, phone, email, birth_date, gender, registration_date, is_active) VALUES
  ('Ahmet', 'Yılmaz', '05321112233', 'ahmet.yilmaz@email.com', '1990-03-15', 'Erkek', '2025-01-10', true),
  ('Ayşe', 'Demir', '05324445566', 'ayse.demir@email.com', '1988-07-22', 'Kadın', '2025-02-05', true),
  ('Mehmet', 'Kaya', '05327778899', 'mehmet.kaya@email.com', '1995-11-01', 'Erkek', '2025-03-12', true),
  ('Zeynep', 'Öztürk', '05320001122', 'zeynep.ozturk@email.com', '1992-05-18', 'Kadın', '2024-11-20', true),
  ('Can', 'Arslan', '05323334455', 'can.arslan@email.com', '1985-09-30', 'Erkek', '2025-04-01', false);

INSERT INTO membership_packages (package_name, description, weekly_day_count, start_time, end_time, duration_month, price, is_active) VALUES
  ('Standart', 'Haftada 3 gün sınırsız kullanım', 3, '08:00', '22:00', 1, 899.00, true),
  ('Premium', 'Haftada 5 gün + grup dersleri', 5, '06:00', '23:00', 3, 2499.00, true),
  ('Yıllık Full', 'Tüm günler tam erişim', 7, '06:00', '23:00', 12, 8999.00, true);

INSERT INTO package_days (package_id, day_name) VALUES
  (1, 'Pazartesi'), (1, 'Çarşamba'), (1, 'Cuma'),
  (2, 'Pazartesi'), (2, 'Salı'), (2, 'Perşembe'), (2, 'Cuma'), (2, 'Cumartesi'),
  (3, 'Pazartesi'), (3, 'Salı'), (3, 'Çarşamba'), (3, 'Perşembe'), (3, 'Cuma'), (3, 'Cumartesi'), (3, 'Pazar');

INSERT INTO health_reports (member_id, institution_name, report_date, expiry_date, status) VALUES
  (1, 'Özel Sağlık Polikliniği', '2025-04-01', '2026-04-01', 'GECERLI'),
  (2, 'Medikal Check-up', '2024-01-10', '2025-01-10', 'SURESI_DOLMUS'),
  (3, 'Aile Hekimi', '2025-05-01', '2026-05-01', 'GECERLI'),
  (4, NULL, NULL, NULL, 'EKSIK');

INSERT INTO subscriptions (member_id, package_id, start_date, end_date, status) VALUES
  (1, 1, '2026-04-01', '2026-05-01', 'AKTIF'),
  (2, 2, '2025-11-01', '2026-02-01', 'SURESI_DOLMUS'),
  (3, 1, '2026-05-01', '2026-06-01', 'AKTIF'),
  (1, 2, '2025-08-01', '2025-11-01', 'IPTAL');

INSERT INTO payments (subscription_id, payment_date, due_date, amount, paid_amount, payment_method, status) VALUES
  (1, '2026-04-01', '2026-04-01', 899.00, 899.00, 'Kredi Kartı', 'ODENDI'),
  (1, '2026-05-01', '2026-05-05', 899.00, 0, NULL, 'GECIKTI'),
  (2, '2025-11-01', '2025-11-01', 2499.00, 1500.00, 'Havale', 'KISMI_ODENDI'),
  (3, NULL, '2026-06-01', 899.00, 0, NULL, 'BEKLIYOR'),
  (4, '2025-08-01', '2025-08-01', 2499.00, 2499.00, 'Nakit', 'ODENDI');

INSERT INTO equipments (equipment_name, brand, model, serial_number, purchase_date, location, status) VALUES
  ('Koşu Bandı', 'Life Fitness', 'T5', 'SN-KB-001', '2023-01-15', 'Kardiyo Alanı', 'AKTIF'),
  ('Dumbbell Set', 'Technogym', 'Pro', 'SN-DB-002', '2022-06-01', 'Ağırlık Alanı', 'AKTIF'),
  ('Eliptik Bisiklet', 'Matrix', 'E30', 'SN-EL-003', '2023-03-20', 'Kardiyo Alanı', 'BAKIMDA'),
  ('Smith Machine', 'Hammer Strength', 'SM-100', 'SN-SM-004', '2021-11-10', 'Ağırlık Alanı', 'TAMIRDE'),
  ('Leg Press', 'Cybex', 'VR3', 'SN-LP-005', '2022-09-05', 'Ağırlık Alanı', 'KULLANIM_DISI');

INSERT INTO maintenance_records (equipment_id, maintenance_date, staff_name, description, cost, next_maintenance_date) VALUES
  (1, '2026-04-10', 'personel', 'Kayış gerginliği ve yağlama', 350.00, '2026-07-10'),
  (2, '2026-03-01', 'yonetici', 'Genel kontrol', 0, '2026-06-01'),
  (3, '2026-05-01', 'personel', 'Elektronik kart kontrolü', 1200.00, '2026-08-01');

INSERT INTO repair_records (equipment_id, service_name, sent_date, return_date, fault_description, repair_description, cost) VALUES
  (4, 'FitServis A.Ş.', '2026-04-15', NULL, 'Kilitleme mekanizması arızası', NULL, 0),
  (1, 'Life Fitness Yetkili', '2025-12-01', '2025-12-20', 'Motor titreşimi', 'Motor ayarı yapıldı', 2800.00);
