-- Ürünlerin pazaryeri (Trendyol) senkronizasyon durumunu takip etmek için flag ekle
ALTER TABLE products ADD COLUMN IF NOT EXISTS sync_trendyol BOOLEAN DEFAULT FALSE;

-- Mevcut external_price'ı (Trendyol fiyatı) olan ürünleri varsayılan olarak aktif işaretleyelim (Opsiyonel ama kolaylık sağlar)
UPDATE products SET sync_trendyol = TRUE WHERE external_price IS NOT NULL AND external_price \> 0;
