-- 📥 Supabase Migrations: Security, Auditing & Hardware Extensions
-- Bu migrasyon; İptal/İade takibi, Kasa Açılış Logları ve Google İşletme ayarlarını ekler.

-- 1. Satış (Sales) Tablosuna İptal/İade Sütunları Ekleme
ALTER TABLE sales 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled', 'returned', 'partially_returned')),
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS returned_at TIMESTAMP WITH TIME ZONE;

-- 2. Satış Kalemlerine Durum Ekleme (Kısmi iade için)
ALTER TABLE sale_items 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'returned', 'cancelled')),
ADD COLUMN IF NOT EXISTS return_reason TEXT;

-- 3. Audit Logs (Denetim Kayıtları) Tablosu
-- Bu tablo; Kasa Açma, Fiyat Değişimi, Stok Müdahalesi gibi kritik logları tutar.
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tenant_id UUID, -- Referencing the tenant
    event_type TEXT NOT NULL, -- 'CASH_DRAWER_OPEN', 'PRICE_CHANGE', 'SALE_CANCEL', 'STOCK_CORRECTION'
    description TEXT,
    metadata JSONB, -- O anki sepet tutarı, eski fiyat, yeni fiyat vb.
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Google İşletme & İnceleme Ayarları (qr_menu_settings tablosunu genişletiyoruz)
-- Not: qr_menu_settings tablosunun zaten var olduğunu varsayıyoruz (add_showcase_features.sql ile eklenmişti)
ALTER TABLE qr_menu_settings
ADD COLUMN IF NOT EXISTS google_business_link TEXT,
ADD COLUMN IF NOT EXISTS auto_review_request BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS review_request_delay_hours INTEGER DEFAULT 2;

-- 5. RLS Politikaları
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own audit logs') THEN
        CREATE POLICY "Users can view their own audit logs" ON audit_logs FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'System can insert audit logs') THEN
        CREATE POLICY "System can insert audit logs" ON audit_logs FOR INSERT WITH CHECK (true);
    END IF;
END $$;

COMMENT ON TABLE audit_logs IS 'Kritik sistem işlemlerinin ve güvenlik loglarının tutulduğu tablo';
COMMENT ON COLUMN audit_logs.event_type IS 'Olay tipi: CASH_DRAWER_OPEN, PRICE_CHANGE, SALE_CANCEL, vb.';
