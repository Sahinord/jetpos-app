-- =============================================
-- TENANTS TABLOSUNA ŞİFRE KOLONU EKLE
-- =============================================

-- Şifre kolonu ekle (nullable - sonradan her tenant için set edilebilir)
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS password TEXT;

-- Default şifre set et (varolan tenantlar için)
UPDATE tenants 
SET password = '12345678' 
WHERE password IS NULL;

-- Admin için şifre
UPDATE tenants 
SET password = 'admin123' 
WHERE license_key = 'ADM257SA67';

-- =============================================
-- KONTROL ET
-- =============================================
SELECT 
    license_key,
    company_name,
    password,
    status
FROM tenants;

-- =============================================
-- BAŞARILI!
-- =============================================
SELECT '✅ Şifre kolonu eklendi! Varsayılan şifre: 12345678 (Admin: admin123)' AS status;
