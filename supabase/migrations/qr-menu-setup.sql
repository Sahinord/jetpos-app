-- QR Menü Sistemi Altyapısı
-- Multi-tenant uyumlu QR menü ayarları ve özel kategoriler

-- 1. QR Menü Ayarları Tablosu
CREATE TABLE IF NOT EXISTS qr_menu_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
    slug TEXT UNIQUE NOT NULL, -- restoran-adi.jetpos.shop
    primary_color TEXT DEFAULT '#3b82f6', -- Blue-500
    secondary_color TEXT DEFAULT '#1e293b', -- Slate-800
    font_family TEXT DEFAULT 'Inter',
    layout_type TEXT DEFAULT 'grid', -- grid, list
    banner_url TEXT,
    logo_url TEXT, -- Opsiyonel: Ana logodan farklı bir logo istenirse
    welcome_text TEXT DEFAULT 'Hoş Geldiniz!',
    about_text TEXT,
    is_active BOOLEAN DEFAULT true,
    dark_mode_enabled BOOLEAN DEFAULT false,
    fixed_header_text TEXT,
    marquee_text TEXT,
    marquee_bg_color TEXT DEFAULT '#ef4444',
    marquee_text_color TEXT DEFAULT '#ffffff',
    header_bg_color TEXT DEFAULT '#000000',
    header_text_color TEXT DEFAULT '#ffffff',
    element_order JSONB DEFAULT '["header", "logo", "marquee", "banner"]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Kategoriler tablosuna QR-Only özelliği ekle
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_qr_only BOOLEAN DEFAULT false;

-- 3. RLS (Row Level Security) - QR menü için public erişim izni
-- Not: Global RLS genelde kapalı olduğu için sadece yetkilendirme kontrolü yapıyoruz.
ALTER TABLE qr_menu_settings DISABLE ROW LEVEL SECURITY;

-- 4. İndeksler
CREATE INDEX IF NOT EXISTS idx_qr_menu_settings_tenant ON qr_menu_settings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_qr_menu_settings_slug ON qr_menu_settings(slug);

-- 5. Helper Function: Slug ile tenant_id al (Middleware için)
CREATE OR REPLACE FUNCTION get_tenant_by_qr_slug(target_slug TEXT)
RETURNS UUID AS $$
    SELECT tenant_id FROM qr_menu_settings WHERE slug = target_slug AND is_active = true LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER;

-- 6. Updated_at Trigger
CREATE OR REPLACE FUNCTION update_qr_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS tr_qr_menu_settings_updated_at ON qr_menu_settings;
CREATE TRIGGER tr_qr_menu_settings_updated_at
    BEFORE UPDATE ON qr_menu_settings
    FOR EACH ROW
    EXECUTE PROCEDURE update_qr_settings_updated_at();

COMMENT ON TABLE qr_menu_settings IS 'Restoranların QR menü özelleştirme ve domain ayarları';
