-- Ürün Rozetleri (Badges) Güncellemesi

-- 1. Ürünlere rozet metni ve rengi ekle
ALTER TABLE products ADD COLUMN IF NOT EXISTS badge_text TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS badge_color TEXT DEFAULT '#ef4444'; -- Varsayılan Kırmızı

-- 2. Örnek olarak ilk birkaç ürüne "YENİ" rozeti takalım (Test için)
UPDATE products SET badge_text = 'YENİ', badge_color = '#3b82f6' WHERE id IN (SELECT id FROM products LIMIT 2);
