-- =============================================
-- ADMIN TENANT OLUŞTUR (FİNAL VERSİYON)
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
  logo_url,
  password,
  features,
  created_at,
  updated_at
) VALUES (
  'ADM257SA67',
  'JetPos Admin',
  'active',
  'admin@jetpos.com',
  null,
  'ADM257SA67',  -- ŞİFRE = LİSANS ANAHTARI
  '{
    "pos": true,
    "products": true,
    "sales_history": true,
    "profit_calculator": true,
    "price_simulator": true,
    "reports": true,
    "trendyol_go": true,
    "invoice": true
  }'::jsonb,
  NOW(),
  NOW()
);

-- Admin user oluştur
INSERT INTO users (
  tenant_id,
  username,
  email,
  role,
  created_at
)
SELECT 
  id,
  'superadmin',
  'admin@jetpos.com',
  'admin',
  NOW()
FROM tenants 
WHERE license_key = 'ADM257SA67';

-- =============================================
-- KONTROL ET
-- =============================================
SELECT 
  license_key,
  company_name,
  password,
  status,
  features
FROM tenants 
WHERE license_key = 'ADM257SA67';

-- =============================================
-- BAŞARILI!
-- =============================================
SELECT '✅ Admin tenant oluşturuldu!' AS status,
       'Lisans: ADM257SA67' AS license,
       'Şifre: ADM257SA67' AS password;
