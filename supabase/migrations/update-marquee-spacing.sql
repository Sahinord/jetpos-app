-- Kayan Yazı (Marquee) Boşluk Güncellemesi

-- 1. Marquee yazıları arası boşluk için kolon ekle (Pixel bazlı, varsayılan 80px)
ALTER TABLE qr_menu_settings ADD COLUMN IF NOT EXISTS marquee_spacing INTEGER DEFAULT 80;
