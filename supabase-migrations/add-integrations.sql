-- ============================================
-- INTEGRATIONS SETTINGS
-- ============================================

-- 1. Integration Settings Tablosu
CREATE TABLE IF NOT EXISTS integration_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'trendyol_go', 'getir', 'qnb_invoice'
    settings JSONB DEFAULT '{}'::jsonb NOT NULL,
    is_active BOOLEAN DEFAULT false,
    last_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, type)
);

-- RLS Temizliği ve Kurulumu
ALTER TABLE integration_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Settings - Own Tenant All" ON integration_settings;
CREATE POLICY "Settings - Own Tenant All"
    ON integration_settings FOR ALL
    USING (tenant_id = get_current_tenant_id())
    WITH CHECK (tenant_id = get_current_tenant_id());

-- 2. Trendyol GO Siparişleri için log tablosu
CREATE TABLE IF NOT EXISTS trendyol_go_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    order_number VARCHAR(100) UNIQUE NOT NULL,
    customer_name VARCHAR(255),
    total_price DECIMAL(10, 2),
    status VARCHAR(50),
    items JSONB,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Temizliği ve Kurulumu
ALTER TABLE trendyol_go_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Trendyol Orders - Own Tenant All" ON trendyol_go_orders;
CREATE POLICY "Trendyol Orders - Own Tenant All"
    ON trendyol_go_orders FOR ALL
    USING (tenant_id = get_current_tenant_id())
    WITH CHECK (tenant_id = get_current_tenant_id());

-- 3. Stok Eksiltme RPC Fonksiyonu
DROP FUNCTION IF EXISTS decrement_stock(UUID, NUMERIC);
CREATE OR REPLACE FUNCTION decrement_stock(product_id UUID, qty NUMERIC)
RETURNS VOID AS $$
BEGIN
    UPDATE products
    SET stock_quantity = stock_quantity - qty,
        status = CASE WHEN (stock_quantity - qty) <= 0 THEN 'passive' ELSE status END
    WHERE id = product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Entegrasyon Ayarlarını Kaydet (Upsert)
DROP FUNCTION IF EXISTS upsert_integration_settings(UUID, TEXT, JSONB, BOOLEAN);
CREATE OR REPLACE FUNCTION upsert_integration_settings(
    p_tenant_id UUID,
    p_type TEXT,
    p_settings JSONB,
    p_is_active BOOLEAN
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO integration_settings (tenant_id, type, settings, is_active)
    VALUES (p_tenant_id, p_type, p_settings, p_is_active)
    ON CONFLICT (tenant_id, type)
    DO UPDATE SET
        settings = EXCLUDED.settings,
        is_active = EXCLUDED.is_active,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Entegrasyon Ayarlarını Getir (RLS Bypass)
DROP FUNCTION IF EXISTS get_integration_settings(UUID, TEXT);
CREATE OR REPLACE FUNCTION get_integration_settings(p_tenant_id UUID, p_type TEXT)
RETURNS JSONB AS $$
DECLARE
    v_settings JSONB;
BEGIN
    SELECT settings INTO v_settings 
    FROM integration_settings 
    WHERE tenant_id = p_tenant_id AND type = p_type;
    
    RETURN v_settings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- BAŞARILI!
SELECT 'Entegrasyon tabloları ve politikaları hazır!' AS status;
