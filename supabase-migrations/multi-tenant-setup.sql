-- ============================================
-- JETPOS MULTI-TENANT DATABASE SCHEMA
-- ============================================
-- Her lisansın kendi verileri
-- Çapraz erişim desteği
-- Logo upload sistemi
-- ============================================

-- 1. TENANTS (Lisanslar) Tablosu
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  license_key VARCHAR(255) UNIQUE NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  logo_url TEXT,
  status VARCHAR(50) DEFAULT 'active', -- active, suspended, expired
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  
  -- İletişim bilgileri
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  
  -- Limitler
  max_users INTEGER DEFAULT 5,
  max_products INTEGER DEFAULT 10000,
  
  -- Özellikler
  features JSONB DEFAULT '{"trendyol_go": false, "getir": false, "qnb_invoice": false}'::jsonb
);

-- 2. USERS (Kullanıcılar) Tablosu
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  username VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user', -- admin, manager, user
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, username)
);

-- 3. TENANT ACCESS (Çapraz Erişim) Tablosu
CREATE TABLE IF NOT EXISTS tenant_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  access_level VARCHAR(50) DEFAULT 'read', -- read, write, admin
  granted_by UUID REFERENCES users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, tenant_id)
);

-- 4. PRODUCTS tablosuna tenant_id ekle
ALTER TABLE products ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_products_tenant ON products(tenant_id);

-- 5. CATEGORIES tablosuna tenant_id ekle
ALTER TABLE categories ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_categories_tenant ON categories(tenant_id);

-- 6. SALES tablosuna tenant_id ekle
ALTER TABLE sales ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_sales_tenant ON sales(tenant_id);

-- 7. SALE_ITEMS tablosuna tenant_id ekle  
ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_sale_items_tenant ON sale_items(tenant_id);

-- 8. EXPENSES tablosuna tenant_id ekle (eğer varsa)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'expenses') THEN
    ALTER TABLE expenses ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_expenses_tenant ON expenses(tenant_id);
  END IF;
END $$;

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Tenants tablosu RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tenant"
  ON tenants FOR SELECT
  USING (
    id IN (
      SELECT tenant_id FROM users WHERE username = current_user
    )
  );

CREATE POLICY "Users can view accessible tenants"
  ON tenants FOR SELECT
  USING (
    id IN (
      SELECT t.id FROM tenants t
      JOIN tenant_access ta ON ta.tenant_id = t.id
      JOIN users u ON u.id = ta.user_id
      WHERE u.username = current_user
    )
  );

-- Products tablosu RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their tenant products"
  ON products FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE username = current_user
    )
  );

CREATE POLICY "Users can view accessible tenant products"
  ON products FOR SELECT
  USING (
    tenant_id IN (
      SELECT ta.tenant_id FROM tenant_access ta
      JOIN users u ON u.id = ta.user_id
      WHERE u.username = current_user
    )
  );

CREATE POLICY "Users can insert their tenant products"
  ON products FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE username = current_user
    )
  );

CREATE POLICY "Users can update their tenant products"
  ON products FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE username = current_user
    )
  );

CREATE POLICY "Users can delete their tenant products"
  ON products FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE username = current_user
    )
  );

-- Categories tablosu RLS (aynı mantık)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their tenant categories"
  ON categories FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE username = current_user
    )
  );

-- Sales tablosu RLS
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their tenant sales"
  ON sales FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE username = current_user
    )
  );

-- Sale Items tablosu RLS
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their tenant sale items"
  ON sale_items FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE username = current_user
    )
  );

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Current User'ın Tenant ID'sini al
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM users WHERE username = current_user LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Kullanıcının belirli bir tenant'a erişimi var mı?
CREATE OR REPLACE FUNCTION has_tenant_access(target_tenant_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users u
    WHERE u.username = current_user
    AND (
      u.tenant_id = target_tenant_id
      OR EXISTS (
        SELECT 1 FROM tenant_access ta
        WHERE ta.user_id = u.id
        AND ta.tenant_id = target_tenant_id
      )
    )
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- ============================================
-- DEMO DATA (Test için)
-- ============================================

-- Demo Tenant 1: Kardeşler Kasap
INSERT INTO tenants (license_key, company_name, contact_email, status)
VALUES (
  'DEMO-KARDESLER-2026',
  'Kardeşler Kasap',
  'info@kardeslerkasap.com',
  'active'
) ON CONFLICT (license_key) DO NOTHING;

-- Demo Tenant 2: Market Plus
INSERT INTO tenants (license_key, company_name, contact_email, status)
VALUES (
  'DEMO-MARKETPLUS-2026',
  'Market Plus Gıda',
  'info@marketplus.com',
  'active'
) ON CONFLICT (license_key) DO NOTHING;

-- Demo User 1 (Kardeşler Kasap)
INSERT INTO users (tenant_id, username, email, role)
SELECT id, 'admin', 'admin@kardeslerkasap.com', 'admin'
FROM tenants WHERE license_key = 'DEMO-KARDESLER-2026'
ON CONFLICT (tenant_id, username) DO NOTHING;

-- Demo User 2 (Market Plus)
INSERT INTO users (tenant_id, username, email, role)
SELECT id, 'admin', 'admin@marketplus.com', 'admin'
FROM tenants WHERE license_key = 'DEMO-MARKETPLUS-2026'
ON CONFLICT (tenant_id, username) DO NOTHING;

-- ============================================
-- STORAGE BUCKET (Logo için)
-- ============================================

-- Logo bucket'ı oluştur (Supabase Dashboard'dan manuel yapılmalı)
-- Bucket name: tenant-logos
-- Public: true
-- File size limit: 5MB
-- Allowed mime types: image/jpeg, image/png, image/webp

-- ============================================
-- INDEXES (Performance)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_tenant_access_user_id ON tenant_access(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_access_tenant_id ON tenant_access(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenants_license_key ON tenants(license_key);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);

-- ============================================
-- TRIGGERS (Auto-update)
-- ============================================

-- Tenant updated_at trigger
CREATE OR REPLACE FUNCTION update_tenant_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tenant_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION update_tenant_timestamp();

-- ============================================
-- COMMENTS (Dokümantasyon)
-- ============================================

COMMENT ON TABLE tenants IS 'Lisans bilgileri - Her şirket için ayrı tenant';
COMMENT ON TABLE users IS 'Kullanıcılar - Her kullanıcı bir tenant''e ait';
COMMENT ON TABLE tenant_access IS 'Çapraz erişim - Bir kullanıcının başka tenant''lara erişimi';
COMMENT ON COLUMN tenants.license_key IS 'Benzersiz lisans anahtarı';
COMMENT ON COLUMN tenants.features IS 'Aktif özellikler (JSON): trendyol_go, getir, qnb_invoice';
COMMENT ON COLUMN tenant_access.access_level IS 'Erişim seviyesi: read, write, admin';

-- ============================================
-- BAŞARILI!
-- ============================================

SELECT 'Multi-Tenant Schema başarıyla oluşturuldu!' AS status;
