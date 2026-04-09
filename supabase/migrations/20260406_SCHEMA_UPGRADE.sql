-- 🛠️ SCHEMA UPGRADE: Sales History & Soft-Delete Support
-- Bu migrasyon; İptal/İade "Çöp Kutusu" ve Satış Geçmişi iyileştirmelerini aktif eder.
-- Supabase Dashboard -> SQL Editor kısmına yapıştırıp RUN (Çalıştır) demeniz yeterlidir!

-- 1. Sales (Satışlar) Tablosuna Eksik Sütunları Ekle
ALTER TABLE sales 
ADD COLUMN IF NOT EXISTS total_profit DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled', 'returned', 'partially_returned'));

-- 2. Products (Ürünler) Tablosuna Soft-Delete Sütunu Ekle
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'passive', 'pending', 'deleted'));
