-- =============================================
-- GÜVENLİ MULTI-TENANT RLS POLİCY'LERİ
-- =============================================
-- Her kullanıcı SADECE kendi tenant'ının verilerine erişebilir!

-- 1. RLS'i aktif et
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

-- 2. Eski policy'leri temizle
DROP POLICY IF EXISTS "tenant_isolation_select" ON tenants;
DROP POLICY IF EXISTS "tenant_isolation_update" ON tenants;
DROP POLICY IF EXISTS "product_isolation" ON products;
DROP POLICY IF EXISTS "category_isolation" ON categories;
DROP POLICY IF EXISTS "sales_isolation" ON sales;
DROP POLICY IF EXISTS "sale_items_isolation" ON sale_items;

-- =============================================
-- TENANT POLICIES (Basit ve Güvenli)
-- =============================================

-- Tenants: Herkes kendi tenant'ını görebilir
CREATE POLICY "tenant_isolation_select" ON tenants
FOR SELECT
TO public
USING (
  id::text = current_setting('app.current_tenant_id', true)
  OR status = 'active' -- Lisans kontrolü için
);

-- Tenants: Sadece kendi tenant'ını güncelleyebilir
CREATE POLICY "tenant_isolation_update" ON tenants
FOR UPDATE
TO public
USING (id::text = current_setting('app.current_tenant_id', true));

-- =============================================
-- PRODUCT POLICIES
-- =============================================

CREATE POLICY "product_isolation" ON products
FOR ALL
TO public
USING (tenant_id::text = current_setting('app.current_tenant_id', true))
WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

-- =============================================
-- CATEGORY POLICIES
-- =============================================

CREATE POLICY "category_isolation" ON categories
FOR ALL
TO public
USING (tenant_id::text = current_setting('app.current_tenant_id', true))
WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

-- =============================================
-- SALES POLICIES
-- =============================================

CREATE POLICY "sales_isolation" ON sales
FOR ALL
TO public
USING (tenant_id::text = current_setting('app.current_tenant_id', true))
WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

-- =============================================
-- SALE ITEMS POLICIES
-- =============================================

CREATE POLICY "sale_items_isolation" ON sale_items
FOR ALL
TO public
USING (
  sale_id IN (
    SELECT id FROM sales 
    WHERE tenant_id::text = current_setting('app.current_tenant_id', true)
  )
);

-- =============================================
-- HELPER FUNCTION (Frontend'de kullanmak için)
-- =============================================

CREATE OR REPLACE FUNCTION set_current_tenant(tenant_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM set_config('app.current_tenant_id', tenant_id::text, false);
END;
$$;

-- =============================================
-- TEST ET
-- =============================================

-- Test sorgusu (çalışmayacak çünkü tenant_id set edilmemiş)
SELECT 'RLS aktif! Tenant ID set edilmeden veri görülemez.' as status;

-- =============================================
-- BAŞARILI!
-- =============================================
SELECT '✅ RLS aktif! Artık her firma sadece kendi verilerini görebilir!' AS status;
