-- =============================================
-- JETPOS CLEANUP SCRIPT
-- Tüm verileri sıfırlar (DEMO için)
-- =============================================

-- 1. Tüm sale items sil
DELETE FROM sale_items;

-- 2. Tüm sales sil
DELETE FROM sales;

-- 3. Tüm products sil
DELETE FROM products;

-- 4. Tüm categories sil
DELETE FROM categories;

-- 5. Tüm tenant access sil
DELETE FROM tenant_access;

-- 6. Tüm users sil
DELETE FROM users;

-- 7. Tüm tenants sil
DELETE FROM tenants;

-- =============================================
-- BAŞARILI!
-- =============================================
SELECT 'Tüm veriler temizlendi! Artık gerçek lisanslarla çalışabilirsiniz.' AS status;

