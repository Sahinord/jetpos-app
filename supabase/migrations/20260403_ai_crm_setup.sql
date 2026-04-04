-- ===========================================
-- JETPOS AI CRM & LOYALTY SYSTEM
-- ===========================================

-- 1. Sadakat Ayarları (Her tenant için özel)
CREATE TABLE IF NOT EXISTS loyalty_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    point_ratio DECIMAL(10,4) DEFAULT 0.01, -- 1 TL = 0.01 Puan (100 TL'ye 1 TL)
    min_spend_for_points DECIMAL(15,2) DEFAULT 0,
    point_expiry_days INTEGER DEFAULT 365,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id)
);

-- 2. Sadakat Puan Hareketleri
CREATE TABLE IF NOT EXISTS loyalty_points (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    cari_id UUID REFERENCES cari_hesaplar(id) ON DELETE CASCADE,
    sale_id UUID, -- Satış ile ilişkili ise
    points_earned DECIMAL(15,2) DEFAULT 0,
    points_used DECIMAL(15,2) DEFAULT 0,
    description TEXT,
    expiry_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Müşteri Segmentleri (AI Analizi Sonucu)
CREATE TABLE IF NOT EXISTS customer_segments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- Örn: "VIP", "Kaybedilen", "Yeni"
    description TEXT,
    min_monetary_value DECIMAL(15,2),
    min_frequency INTEGER,
    color_code VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

-- Cari Hesaplar Tablosuna Segment ve Toplam Puan Alanı Ekleme
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='cari_hesaplar' AND COLUMN_NAME='loyalty_points_total') THEN
        ALTER TABLE cari_hesaplar ADD COLUMN loyalty_points_total DECIMAL(15,2) DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='cari_hesaplar' AND COLUMN_NAME='segment_id') THEN
        ALTER TABLE cari_hesaplar ADD COLUMN segment_id UUID REFERENCES customer_segments(id);
    END IF;
END $$;

-- 4. Kampanya Yönetimi
CREATE TABLE IF NOT EXISTS marketing_campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    campaign_type VARCHAR(50), -- "Discount", "PointMultiplier", "Coupon"
    discount_rate DECIMAL(5,2),
    point_multiplier DECIMAL(5,2) DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Kupon Kodları
CREATE TABLE IF NOT EXISTS customer_coupons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
    cari_id UUID REFERENCES cari_hesaplar(id) ON DELETE CASCADE,
    coupon_code VARCHAR(50) NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMPTZ,
    expiry_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, coupon_code)
);

-- ===========================================
-- RLS POLİTİKALARI
-- ===========================================
ALTER TABLE loyalty_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "loyalty_settings_isolation" ON loyalty_settings FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY "loyalty_points_isolation" ON loyalty_points FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY "customer_segments_isolation" ON customer_segments FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY "marketing_campaigns_isolation" ON marketing_campaigns FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY "customer_coupons_isolation" ON customer_coupons FOR ALL USING (tenant_id = get_current_tenant_id());

-- ===========================================
-- TRİGGERLAR
-- ===========================================

-- Puan Değiştiğinde Cari Toplamı Güncelleme
CREATE OR REPLACE FUNCTION update_cari_loyalty_total()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE cari_hesaplar 
        SET loyalty_points_total = loyalty_points_total + (NEW.points_earned - NEW.points_used)
        WHERE id = NEW.cari_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE cari_hesaplar 
        SET loyalty_points_total = loyalty_points_total - (OLD.points_earned - OLD.points_used)
        WHERE id = OLD.cari_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_loyalty_total
AFTER INSERT OR DELETE ON loyalty_points
FOR EACH ROW EXECUTE FUNCTION update_cari_loyalty_total();

-- Otomatik Tenant Set (Diğer tablolar için mevcut fonksiyona benzer)
CREATE TRIGGER set_loyalty_settings_tenant BEFORE INSERT ON loyalty_settings FOR EACH ROW EXECUTE FUNCTION auto_set_cari_tenant_id();
CREATE TRIGGER set_loyalty_points_tenant BEFORE INSERT ON loyalty_points FOR EACH ROW EXECUTE FUNCTION auto_set_cari_tenant_id();
CREATE TRIGGER set_customer_segments_tenant BEFORE INSERT ON customer_segments FOR EACH ROW EXECUTE FUNCTION auto_set_cari_tenant_id();
CREATE TRIGGER set_marketing_campaigns_tenant BEFORE INSERT ON marketing_campaigns FOR EACH ROW EXECUTE FUNCTION auto_set_cari_tenant_id();
CREATE TRIGGER set_customer_coupons_tenant BEFORE INSERT ON customer_coupons FOR EACH ROW EXECUTE FUNCTION auto_set_cari_tenant_id();
