-- Elite QR Menü Özellikleri Güncellemesi

-- 1. Sosyal Medya & İletişim Kolonları
ALTER TABLE qr_menu_settings ADD COLUMN IF NOT EXISTS instagram_url TEXT;
ALTER TABLE qr_menu_settings ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;

-- 2. Wi-Fi Bilgileri
ALTER TABLE qr_menu_settings ADD COLUMN IF NOT EXISTS wifi_name TEXT;
ALTER TABLE qr_menu_settings ADD COLUMN IF NOT EXISTS wifi_password TEXT;

-- 3. Ürün Modalı & Sosyal Bar Sıralamada Gözüksün mü?
-- 'social_bar' ve 'wifi_info' element_order listesine eklenebilir.
-- Varsayılan sıralamayı güncelleyelim
ALTER TABLE qr_menu_settings 
ALTER COLUMN element_order SET DEFAULT ARRAY['header', 'logo', 'marquee', 'banner', 'social_bar', 'wifi_info'];
