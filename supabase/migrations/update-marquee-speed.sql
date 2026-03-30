-- Kayan Yazı (Marquee) Hız ve Stil Güncellemesi

-- 1. Marquee hızı için kolon ekle (Saniye bazlı, varsayılan 20s)
ALTER TABLE qr_menu_settings ADD COLUMN IF NOT EXISTS marquee_speed INTEGER DEFAULT 20;

-- 2. Eğer varsa diğer kolonları da kontrol et
ALTER TABLE qr_menu_settings ADD COLUMN IF NOT EXISTS marquee_bg_color TEXT DEFAULT '#ef4444';
ALTER TABLE qr_menu_settings ADD COLUMN IF NOT EXISTS marquee_text_color TEXT DEFAULT '#ffffff';
