-- =============================================
-- COMPANY_NAME KOLONUNU OPSİYONEL YAP
-- =============================================

-- company_name NULL olabilir hale getir
ALTER TABLE tenants 
ALTER COLUMN company_name DROP NOT NULL;

-- Kontrol et
SELECT 
    column_name, 
    is_nullable, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'tenants' 
  AND column_name = 'company_name';

-- =============================================
-- BAŞARILI!
-- =============================================
SELECT '✅ company_name artık NULL olabilir! Boş lisans oluşturabilirsiniz.' AS status;
