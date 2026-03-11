-- 1. E-Ticaret Entegrasyon Ayarları Tablosu (Master Switch & Mode)
CREATE TABLE IF NOT EXISTS integration_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    platform TEXT NOT NULL, -- 'trendyol', 'getir', 'yemeksepeti'
    is_active BOOLEAN DEFAULT false, -- Master Switch
    mode TEXT DEFAULT 'test' CHECK (mode IN ('test', 'live')), 
    api_config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, platform)
);

-- 2. Ürün Eşleştirme (Mapping) Tablosu
CREATE TABLE IF NOT EXISTS external_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    external_product_id TEXT NOT NULL, -- Platformdaki Item ID
    external_sku TEXT, -- Platformdaki Barkod/SKU
    sync_enabled BOOLEAN DEFAULT false, -- Ürün bazlı switch
    last_sync_status TEXT DEFAULT 'pending',
    last_sync_error TEXT,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, product_id, platform)
);

-- 3. RLS (Row Level Security) Politikaları
ALTER TABLE integration_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_mappings ENABLE ROW LEVEL SECURITY;

-- integration_settings politikası
CREATE POLICY "Tenants can manage their own integration settings"
    ON integration_settings
    FOR ALL
    USING (tenant_id::text = auth.jwt() ->> 'tenant_id');

-- external_mappings politikası
CREATE POLICY "Tenants can manage their own mappings"
    ON external_mappings
    FOR ALL
    USING (tenant_id::text = auth.jwt() ->> 'tenant_id');

-- 4. Performans Indexleri
CREATE INDEX IF NOT EXISTS idx_mappings_product_id ON external_mappings(product_id);
CREATE INDEX IF NOT EXISTS idx_mappings_tenant_platform ON external_mappings(tenant_id, platform);
CREATE INDEX IF NOT EXISTS idx_settings_tenant ON integration_settings(tenant_id);

-- 5. Updated At Trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_integration_settings_updated_at
    BEFORE UPDATE ON integration_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_external_mappings_updated_at
    BEFORE UPDATE ON external_mappings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
