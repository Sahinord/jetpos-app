-- Tenants tablosuna integrasyon ayarlarını saklamak için 'settings' adında JSONB bir kolon ekleyelim

ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

-- Yorum Ekleme (Açıklama)
COMMENT ON COLUMN tenants.settings IS 'QNB, Trendyol ve diğer entegrasyonlar için dükkana (tenant) özel yapılandırma ayarlarını JSON formatında saklar.';
