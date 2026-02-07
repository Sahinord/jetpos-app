-- 🔥 NUCLEAR CLEANUP SCRIPT 🔥
-- Bu script sistemdeki TÜM ürünleri, satışları ve kategorileri temizler.
-- DİKKAT: Bu işlem geri alınamaz! 

-- 1. Satış Detaylarını Temizle (Foreign Key bağımlılığı nedeniyle ilk bu)
TRUNCATE TABLE sale_items CASCADE;

-- 2. Satış Özetlerini Temizle
TRUNCATE TABLE sales CASCADE;

-- 3. Ürün Stok Geçmişini Temizle (Eğer tablo varsa)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'product_stock_history') THEN
        EXECUTE 'TRUNCATE TABLE product_stock_history CASCADE';
    END IF;
END $$;

-- 4. Ürünleri Temizle
TRUNCATE TABLE products CASCADE;

-- 5. Kategorileri Temizle
TRUNCATE TABLE categories CASCADE;

-- 6. Bildirimleri Temizle (Opsiyonel, temizlik olsun diye)
TRUNCATE TABLE notifications CASCADE;

-- 7. Destek Taleplerini Temizle (Opsiyonel)
TRUNCATE TABLE support_tickets CASCADE;

-- NOT: 'tenants' (Lisanslar) ve 'integration_settings' (AI Anahtarları vb.) tablosuna DOKUNULMADI.
-- Lisanslarınız ve ayarlarınız güvende kalacak.
