-- Logo Boyut Ayarı Güncellemesi

-- 1. Logo boyutu için kolon ekle (Pixel bazlı, varsayılan 80px)
ALTER TABLE qr_menu_settings ADD COLUMN IF NOT EXISTS logo_size INTEGER DEFAULT 80;
