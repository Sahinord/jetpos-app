-- =============================================
-- 1. ÖNCE PASSWORD KOLONU EKLE
-- =============================================

ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS password TEXT;

-- Company name NULL yapılabilir (opsiyonel)
ALTER TABLE tenants 
ALTER COLUMN company_name DROP NOT NULL;

-- =============================================
-- 2. ADMIN TENANT OLUŞTUR
-- =============================================

-- Önce varsa sil
DELETE FROM users WHERE tenant_id IN (SELECT id FROM tenants WHERE license_key = 'ADM257SA67');
DELETE FROM tenants WHERE license_key = 'ADM257SA67';

-- Admin tenant oluştur
INSERT INTO tenants (
  license_key,
  company_name,
  status,
  contact_email,
  password,
  features
) VALUES (
  'ADM257SA67',
  'JetPos Admin',
  'active',
  'admin@jetpos.com',
  'ADM257SA67',  -- ŞİFRE = LİSANS
  '{
    "pos": true,
    "products": true,
    "sales_history": true,
    "profit_calculator": true,
    "price_simulator": true,
    "reports": true,
    "trendyol_go": true,
    "invoice": true
  }'::jsonb
);

-- Admin user oluştur
INSERT INTO users (
  tenant_id,
  username,
  email,
  role
)
SELECT 
  id,
  'superadmin',
  'admin@jetpos.com',
  'admin'
FROM tenants 
WHERE license_key = 'ADM257SA67';

-- =============================================
-- 3. KONTROL ET
-- =============================================
SELECT 
  license_key,
  company_name,
  password,
  status
FROM tenants 
WHERE license_key = 'ADM257SA67';

-- =============================================
-- BAŞARILI!
-- =============================================
SELECT 
  '✅ Tamamlandı!' AS status,
  'Lisans: ADM257SA67' AS license,
  'Şifre: ADM257SA67' AS password;
