-- ============================================
-- JETPOS MULTI-TENANT FIX
-- ============================================
-- 1. Şifre ekleme
-- 2. RLS düzeltme (license_key bazlı)
-- 3. Tenant context otomasyonu
-- 4. Çapraz database desteği
-- ============================================

-- 1. Tenants tablosuna password ekle
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS password VARCHAR(255);

-- 2. Mevcut RLS policies'i temizle
DROP POLICY IF EXISTS "Users can view their own tenant" ON tenants;
DROP POLICY IF EXISTS "Users can view accessible tenants" ON tenants;
DROP POLICY IF EXISTS "Users can view their tenant products" ON products;
DROP POLICY IF EXISTS "Users can view accessible tenant products" ON products;
DROP POLICY IF EXISTS "Users can insert their tenant products" ON products;
DROP POLICY IF EXISTS "Users can update their tenant products" ON products;
DROP POLICY IF EXISTS "Users can delete their tenant products" ON products;
DROP POLICY IF EXISTS "Users can manage their tenant categories" ON categories;
DROP POLICY IF EXISTS "Users can manage their tenant sales" ON sales;
DROP POLICY IF EXISTS "Users can manage their tenant sale items" ON sale_items;
DROP POLICY IF EXISTS "Products - Own Tenant Select" ON products;
DROP POLICY IF EXISTS "Products - Own Tenant Insert" ON products;
DROP POLICY IF EXISTS "Products - Own Tenant Update" ON products;
DROP POLICY IF EXISTS "Products - Own Tenant Delete" ON products;
DROP POLICY IF EXISTS "Products - Accessible Tenants Select" ON products;
DROP POLICY IF EXISTS "Categories - Own Tenant All" ON categories;
DROP POLICY IF EXISTS "Sales - Own Tenant All" ON sales;
DROP POLICY IF EXISTS "Sale Items - Own Tenant All" ON sale_items;

-- 3. Session tenant_id için helper function
CREATE OR REPLACE FUNCTION set_current_tenant(tenant_id TEXT)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_tenant_id', tenant_id, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
BEGIN
  RETURN current_setting('app.current_tenant_id', true)::UUID;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 4. Tenant Grouping tablosu (tenant_access yerine)
CREATE TABLE IF NOT EXISTS tenant_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  target_tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  access_level VARCHAR(50) DEFAULT 'write',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, target_tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_groups_tenant ON tenant_groups(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_groups_target ON tenant_groups(target_tenant_id);

-- 5. YENİ RLS POLICIES (tenant_id bazlı)
-- Tenants
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenants - Public Read for Auth" ON tenants;
CREATE POLICY "Tenants - Public Read for Auth"
  ON tenants FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Tenants - Own Tenant Update" ON tenants;
CREATE POLICY "Tenants - Own Tenant Update"
  ON tenants FOR UPDATE
  USING (id = get_current_tenant_id());

-- Products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products - Own Tenant Select"
  ON products FOR SELECT
  USING (
    tenant_id = get_current_tenant_id()
    OR tenant_id IN (
      SELECT target_tenant_id 
      FROM tenant_groups
      WHERE tenant_id = get_current_tenant_id()
    )
  );

CREATE POLICY "Products - Own Tenant Insert"
  ON products FOR INSERT
  WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY "Products - Own Tenant Update"
  ON products FOR UPDATE
  USING (
    tenant_id = get_current_tenant_id()
    OR tenant_id IN (
      SELECT target_tenant_id 
      FROM tenant_groups
      WHERE tenant_id = get_current_tenant_id()
    )
  );

CREATE POLICY "Products - Own Tenant Delete"
  ON products FOR DELETE
  USING (
    tenant_id = get_current_tenant_id()
    OR tenant_id IN (
      SELECT target_tenant_id 
      FROM tenant_groups
      WHERE tenant_id = get_current_tenant_id()
    )
  );

-- Categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories - Own Tenant All"
  ON categories FOR ALL
  USING (
    tenant_id = get_current_tenant_id()
    OR tenant_id IN (
      SELECT target_tenant_id 
      FROM tenant_groups
      WHERE tenant_id = get_current_tenant_id()
    )
  )
  WITH CHECK (tenant_id = get_current_tenant_id());

-- Sales
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sales - Own Tenant All"
  ON sales FOR ALL
  USING (
    tenant_id = get_current_tenant_id()
    OR tenant_id IN (
      SELECT target_tenant_id 
      FROM tenant_groups
      WHERE tenant_id = get_current_tenant_id()
    )
  )
  WITH CHECK (tenant_id = get_current_tenant_id());

-- Sale Items
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sale Items - Own Tenant All"
  ON sale_items FOR ALL
  USING (
    tenant_id = get_current_tenant_id()
    OR tenant_id IN (
      SELECT target_tenant_id 
      FROM tenant_groups
      WHERE tenant_id = get_current_tenant_id()
    )
  )
  WITH CHECK (tenant_id = get_current_tenant_id());

-- 6. Eksik tablolara tenant_id ekle (eğer varsa)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'trendyol_products') THEN
    ALTER TABLE trendyol_products ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_trendyol_products_tenant ON trendyol_products(tenant_id);
    ALTER TABLE trendyol_products ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Trendyol Products - Own Tenant All" ON trendyol_products;
    CREATE POLICY "Trendyol Products - Own Tenant All"
      ON trendyol_products FOR ALL
      USING (tenant_id = get_current_tenant_id())
      WITH CHECK (tenant_id = get_current_tenant_id());
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'qnb_invoices') THEN
    ALTER TABLE qnb_invoices ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_qnb_invoices_tenant ON qnb_invoices(tenant_id);
    ALTER TABLE qnb_invoices ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "QNB Invoices - Own Tenant All" ON qnb_invoices;
    CREATE POLICY "QNB Invoices - Own Tenant All"
      ON qnb_invoices FOR ALL
      USING (tenant_id = get_current_tenant_id())
      WITH CHECK (tenant_id = get_current_tenant_id());
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'support_tickets') THEN
    ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_support_tickets_tenant ON support_tickets(tenant_id);
    ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Support Tickets - Own Tenant All" ON support_tickets;
    CREATE POLICY "Support Tickets - Own Tenant All"
      ON support_tickets FOR ALL
      USING (tenant_id = get_current_tenant_id())
      WITH CHECK (tenant_id = get_current_tenant_id());
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications') THEN
    ALTER TABLE notifications ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_notifications_tenant ON notifications(tenant_id);
    ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Notifications - Public or Own Tenant" ON notifications;
    -- Notifications özel: tenant_id NULL ise tüm tenantlar görebilir
    CREATE POLICY "Notifications - Public or Own Tenant"
      ON notifications FOR SELECT
      USING (tenant_id IS NULL OR tenant_id = get_current_tenant_id());
  END IF;
END $$;

-- 7. Admin lisansına şifre ekle (varsayılan: 1453)
UPDATE tenants 
SET password = '1453' 
WHERE license_key = 'ADM257SA67';

-- 8. Eski test verilerini temizle (yeni başlangıç için)
DO $$
BEGIN
  -- Tüm mevcut verileri sil (yeni başla)
  DELETE FROM sale_items;
  DELETE FROM sales;
  DELETE FROM products;
  DELETE FROM categories;
  
  RAISE NOTICE 'Tüm eski veriler temizlendi - yeni başlangıç!';
END $$;

-- 9. Products tablosuna trigger ekle - otomatik tenant_id
CREATE OR REPLACE FUNCTION set_tenant_id_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    NEW.tenant_id := get_current_tenant_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS products_set_tenant_id ON products;
CREATE TRIGGER products_set_tenant_id
  BEFORE INSERT ON products
  FOR EACH ROW
  EXECUTE FUNCTION set_tenant_id_on_insert();

DROP TRIGGER IF EXISTS categories_set_tenant_id ON categories;
CREATE TRIGGER categories_set_tenant_id
  BEFORE INSERT ON categories
  FOR EACH ROW
  EXECUTE FUNCTION set_tenant_id_on_insert();

DROP TRIGGER IF EXISTS sales_set_tenant_id ON sales;
CREATE TRIGGER sales_set_tenant_id
  BEFORE INSERT ON sales
  FOR EACH ROW
  EXECUTE FUNCTION set_tenant_id_on_insert();

DROP TRIGGER IF EXISTS sale_items_set_tenant_id ON sale_items;
CREATE TRIGGER sale_items_set_tenant_id
  BEFORE INSERT ON sale_items
  FOR EACH ROW
  EXECUTE FUNCTION set_tenant_id_on_insert();

-- ============================================
-- BAŞARILI!
-- ============================================

SELECT 'Multi-Tenant RLS düzeltmesi tamamlandı!' AS status;
