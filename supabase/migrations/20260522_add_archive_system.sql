-- 🗄️ ARŞİV SİSTEMİ: Ürün Arşivleme Desteği
-- Bu migrasyon; ürünlerin arşivlenmesi ve geri çıkarılması özelliğini aktif eder.
-- Supabase Dashboard -> SQL Editor kısmına yapıştırıp RUN (Çalıştır) demeniz yeterlidir!

-- 1. Products tablosuna archived_at sütunu ekle
ALTER TABLE products ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

-- 2. Status constraint'ini güncelle (archived değerini ekle)
-- Mevcut constraint'i kaldır
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_status_check;

-- Yeni constraint oluştur
ALTER TABLE products ADD CONSTRAINT products_status_check 
  CHECK (status IN ('active', 'passive', 'pending', 'deleted', 'archived'));

-- 3. Arşivlenmiş ürünler için index (performans)
CREATE INDEX IF NOT EXISTS idx_products_archived_at ON products (archived_at) WHERE archived_at IS NOT NULL;

-- Schema cache yenilemek için
NOTIFY pgrst, 'reload schema';
