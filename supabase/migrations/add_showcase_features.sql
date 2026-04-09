-- Showcase (Vitrin) Websitesi Özellikleri
-- Mevcut qr_menu_settings tablosunu vitrin özellikleri ile genişletiyoruz

ALTER TABLE qr_menu_settings 
ADD COLUMN IF NOT EXISTS is_showcase_active BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS showcase_hero_title TEXT,
ADD COLUMN IF NOT EXISTS showcase_hero_subtitle TEXT,
ADD COLUMN IF NOT EXISTS showcase_hero_image_url TEXT,
ADD COLUMN IF NOT EXISTS showcase_navbar_links JSONB DEFAULT '[{"label": "Anasayfa", "href": "#hero"}, {"label": "Ürünler", "href": "#products"}, {"label": "Hakkımızda", "href": "#about"}]'::jsonb,
ADD COLUMN IF NOT EXISTS showcase_footer_text TEXT,
ADD COLUMN IF NOT EXISTS showcase_primary_font TEXT DEFAULT 'Inter',
ADD COLUMN IF NOT EXISTS showcase_theme_selection TEXT DEFAULT 'premium',
ADD COLUMN IF NOT EXISTS marquee_text TEXT DEFAULT 'Premium Vitrin Deneyimi — Hemen Keşfedin — ',
ADD COLUMN IF NOT EXISTS marquee_speed INTEGER DEFAULT 25,
ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#0f172a',
ADD COLUMN IF NOT EXISTS showcase_use_automatic_products BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS showcase_selected_product_ids JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS showcase_about_title TEXT DEFAULT 'Biz Kimiz?',
ADD COLUMN IF NOT EXISTS showcase_about_content TEXT DEFAULT 'Şirketimiz hakkında kısa bir bilgi buraya gelecek...',
ADD COLUMN IF NOT EXISTS showcase_about_image_url TEXT;

COMMENT ON COLUMN qr_menu_settings.is_showcase_active IS 'Vitrin sitesinin aktiflik durumu';
COMMENT ON COLUMN qr_menu_settings.showcase_hero_title IS 'Vitrin hero başlığı';
COMMENT ON COLUMN qr_menu_settings.showcase_hero_subtitle IS 'Vitrin hero alt başlığı';
COMMENT ON COLUMN qr_menu_settings.showcase_hero_image_url IS 'Vitrin hero arka plan görseli';
COMMENT ON COLUMN qr_menu_settings.marquee_text IS 'Kayan duyuru yazısı';
COMMENT ON COLUMN qr_menu_settings.marquee_speed IS 'Kayan yazı hızı (saniye)';
COMMENT ON COLUMN qr_menu_settings.secondary_color IS 'Vitrin ana arka plan rengi';
COMMENT ON COLUMN qr_menu_settings.showcase_about_title IS 'Hakkımızda başlığı';
COMMENT ON COLUMN qr_menu_settings.showcase_about_content IS 'Hakkımızda içeriği';
COMMENT ON COLUMN qr_menu_settings.showcase_about_image_url IS 'Hakkımızda görseli';
