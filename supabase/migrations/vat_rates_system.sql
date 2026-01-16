-- ===========================================
-- KDV ORANLARI ALTYAPISI
-- ===========================================

-- 1. Products tablosuna vat_rate kolonu ekle (yoksa)
ALTER TABLE products ADD COLUMN IF NOT EXISTS vat_rate DECIMAL(5,2) DEFAULT 1;

-- 2. Categories tablosuna varsayılan KDV oranı ekle
ALTER TABLE categories ADD COLUMN IF NOT EXISTS default_vat_rate DECIMAL(5,2) DEFAULT 1;

-- 3. Kategori bazlı KDV oranlarını güncelle (örnek değerler)
-- Gıda kategorileri
UPDATE categories SET default_vat_rate = 1 WHERE LOWER(name) LIKE '%gıda%' OR LOWER(name) LIKE '%et%' OR LOWER(name) LIKE '%meyve%' OR LOWER(name) LIKE '%sebze%';

-- Süt ürünleri / Şarküteri
UPDATE categories SET default_vat_rate = 10 WHERE LOWER(name) LIKE '%süt%' OR LOWER(name) LIKE '%şarküteri%' OR LOWER(name) LIKE '%peynir%' OR LOWER(name) LIKE '%mandıra%';

-- Temizlik
UPDATE categories SET default_vat_rate = 20 WHERE LOWER(name) LIKE '%temizlik%' OR LOWER(name) LIKE '%deterjan%';

-- Züccaciye
UPDATE categories SET default_vat_rate = 20 WHERE LOWER(name) LIKE '%züccaciye%' OR LOWER(name) LIKE '%mutfak%';

-- Kozmetik
UPDATE categories SET default_vat_rate = 20 WHERE LOWER(name) LIKE '%kozmetik%' OR LOWER(name) LIKE '%kişisel%' OR LOWER(name) LIKE '%parfüm%';

-- 4. Ürünlerin KDV oranlarını kategorilerinden al (eğer ürünün kendisinde tanımlı değilse)
UPDATE products p
SET vat_rate = c.default_vat_rate
FROM categories c
WHERE p.category_id = c.id 
AND (p.vat_rate IS NULL OR p.vat_rate = 1);

-- 5. KDV oranları için lookup tablosu
CREATE TABLE IF NOT EXISTS vat_rates (
    id SERIAL PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    category_pattern VARCHAR(100) NOT NULL,
    vat_rate DECIMAL(5,2) NOT NULL DEFAULT 1,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Varsayılan KDV oranları (tenant_id NULL = tüm tenantlar için geçerli)
INSERT INTO vat_rates (tenant_id, category_pattern, vat_rate, description) VALUES 
(NULL, 'gıda', 1, 'Temel gıda maddeleri'),
(NULL, 'et', 1, 'Et ve et ürünleri'),
(NULL, 'tavuk', 1, 'Tavuk ve kümes hayvanları'),
(NULL, 'balık', 1, 'Balık ve deniz ürünleri'),
(NULL, 'meyve', 1, 'Meyve'),
(NULL, 'sebze', 1, 'Sebze'),
(NULL, 'bakliyat', 1, 'Bakliyat'),
(NULL, 'un', 1, 'Un ve unlu mamuller'),
(NULL, 'ekmek', 1, 'Ekmek'),
(NULL, 'yumurta', 1, 'Yumurta'),
(NULL, 'süt', 10, 'Süt ve süt ürünleri'),
(NULL, 'peynir', 10, 'Peynir'),
(NULL, 'yoğurt', 10, 'Yoğurt'),
(NULL, 'tereyağ', 10, 'Tereyağı ve margarinler'),
(NULL, 'şarküteri', 10, 'Şarküteri ürünleri'),
(NULL, 'temizlik', 20, 'Temizlik malzemeleri'),
(NULL, 'deterjan', 20, 'Deterjanlar'),
(NULL, 'züccaciye', 20, 'Züccaciye'),
(NULL, 'kozmetik', 20, 'Kozmetik ürünler'),
(NULL, 'kişisel', 20, 'Kişisel bakım'),
(NULL, 'parfüm', 20, 'Parfüm ve deodorant'),
(NULL, 'kırtasiye', 20, 'Kırtasiye'),
(NULL, 'elektronik', 20, 'Elektronik')
ON CONFLICT DO NOTHING;

-- 6. RLS aktif et
ALTER TABLE vat_rates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vat_rates_tenant_or_global" ON vat_rates;
CREATE POLICY "vat_rates_tenant_or_global" ON vat_rates
    FOR SELECT 
    USING (tenant_id IS NULL OR tenant_id = get_current_tenant_id());

-- 7. Ürün adından KDV oranı bulan fonksiyon
CREATE OR REPLACE FUNCTION get_vat_rate_for_product(product_name TEXT, tenant_uuid UUID DEFAULT NULL)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    rate DECIMAL(5,2);
    pattern_row RECORD;
BEGIN
    -- Önce tenant'a özel, sonra genel kuralları kontrol et
    FOR pattern_row IN 
        SELECT category_pattern, vat_rate 
        FROM vat_rates 
        WHERE (tenant_id IS NULL OR tenant_id = tenant_uuid)
        ORDER BY tenant_id NULLS LAST
    LOOP
        IF LOWER(product_name) LIKE '%' || LOWER(pattern_row.category_pattern) || '%' THEN
            RETURN pattern_row.vat_rate;
        END IF;
    END LOOP;
    
    -- Varsayılan %1
    RETURN 1;
END;
$$ LANGUAGE plpgsql;
