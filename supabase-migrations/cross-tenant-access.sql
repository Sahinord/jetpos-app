-- =============================================
-- CROSS-TENANT ACCESS TABLE (DÜZELTİLMİŞ)
-- =============================================

-- Önce eski tabloyu sil
DROP TABLE IF EXISTS tenant_access CASCADE;

-- Yeni tablo oluştur
CREATE TABLE tenant_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  accessible_tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(owner_tenant_id, accessible_tenant_id)
);

-- Index ekle
CREATE INDEX idx_tenant_access_owner ON tenant_access(owner_tenant_id);
CREATE INDEX idx_tenant_access_accessible ON tenant_access(accessible_tenant_id);

-- =============================================
-- RLS POLICIES - CROSS TENANT ACCESS
-- =============================================

-- RLS aktif et
ALTER TABLE tenant_access ENABLE ROW LEVEL SECURITY;

-- Products: Kendi + erişim verilen tenant'ların ürünleri
DROP POLICY IF EXISTS "product_isolation" ON products;
CREATE POLICY "product_isolation" ON products
FOR ALL
TO public
USING (
  tenant_id::text = current_setting('app.current_tenant_id', true)
  OR 
  tenant_id IN (
    SELECT accessible_tenant_id 
    FROM tenant_access 
    WHERE owner_tenant_id::text = current_setting('app.current_tenant_id', true)
  )
)
WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

-- Categories: Kendi + erişim verilen tenant'ların kategorileri  
DROP POLICY IF EXISTS "category_isolation" ON categories;
CREATE POLICY "category_isolation" ON categories
FOR ALL
TO public
USING (
  tenant_id::text = current_setting('app.current_tenant_id', true)
  OR 
  tenant_id IN (
    SELECT accessible_tenant_id 
    FROM tenant_access 
    WHERE owner_tenant_id::text = current_setting('app.current_tenant_id', true)
  )
)
WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

-- Sales: Kendi + erişim verilen tenant'ların satışları
DROP POLICY IF EXISTS "sales_isolation" ON sales;
CREATE POLICY "sales_isolation" ON sales
FOR ALL
TO public
USING (
  tenant_id::text = current_setting('app.current_tenant_id', true)
  OR 
  tenant_id IN (
    SELECT accessible_tenant_id 
    FROM tenant_access 
    WHERE owner_tenant_id::text = current_setting('app.current_tenant_id', true)
  )
)
WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Erişilebilir tenant'ları getir
CREATE OR REPLACE FUNCTION get_accessible_tenants(current_tenant uuid)
RETURNS TABLE(tenant_id uuid, company_name text, license_key text)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT t.id, t.company_name, t.license_key
  FROM tenants t
  WHERE t.id = current_tenant
  UNION
  SELECT t.id, t.company_name, t.license_key
  FROM tenants t
  JOIN tenant_access ta ON t.id = ta.accessible_tenant_id
  WHERE ta.owner_tenant_id = current_tenant;
$$;

-- =============================================
-- TEST
-- =============================================
SELECT 
  'tenant_access' as table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'tenant_access'
ORDER BY ordinal_position;

SELECT '✅ Cross-tenant access tablosu hazır! (owner_tenant_id, accessible_tenant_id)' AS status;
