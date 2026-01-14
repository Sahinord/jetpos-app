-- ZAM GEÇMİŞİ TABLOSU
-- Bu tabloyu Supabase SQL Editor'dan çalıştırın

CREATE TABLE IF NOT EXISTS price_change_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    product_barcode TEXT,
    old_price DECIMAL(10, 2) NOT NULL,
    new_price DECIMAL(10, 2) NOT NULL,
    increase_rate DECIMAL(5, 2) NOT NULL,
    increase_amount DECIMAL(10, 2) NOT NULL,
    changed_by TEXT DEFAULT 'admin',
    notes TEXT
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_price_change_logs_created_at ON price_change_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_price_change_logs_product_id ON price_change_logs(product_id);

-- RLS Policies (herkese okuma izni)
ALTER TABLE price_change_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON price_change_logs
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON price_change_logs
    FOR INSERT WITH CHECK (true);

COMMENT ON TABLE price_change_logs IS 'Ürün fiyat değişikliği geçmişi - seçili ürünlere uygulanan zamlar';
