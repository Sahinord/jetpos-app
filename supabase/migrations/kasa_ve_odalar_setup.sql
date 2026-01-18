-- ===========================================
-- KASA VE ODA İŞLEMLERİ - DETAYLI KURULUM
-- ===========================================

-- 1. TABLOLAR

-- Kasa Tanımları (Görsel 0 baz alındı)
CREATE TABLE IF NOT EXISTS kasa_tanimlari (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    kasa_kodu VARCHAR(50) NOT NULL,
    kasa_adi VARCHAR(100) NOT NULL,
    yetkili_kisi VARCHAR(100),
    muh_kodu_1 VARCHAR(50),
    muh_kodu_2 VARCHAR(50),
    para_birimi VARCHAR(10) DEFAULT 'TRY',
    isyeri_kodu VARCHAR(50),
    ozel_kod VARCHAR(50),
    yetki_kodu VARCHAR(50),
    aciklama TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, kasa_kodu)
);

-- Odalar (Otel/Restoran için)
CREATE TABLE IF NOT EXISTS odalar (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    oda_no VARCHAR(50) NOT NULL,
    oda_adi VARCHAR(100),
    oda_tipi VARCHAR(50),
    durum VARCHAR(20) DEFAULT 'Bos', -- Bos, Dolu, Temizlik, Arizali
    kat_no INTEGER,
    fiyat DECIMAL(15,2) DEFAULT 0,
    para_birimi VARCHAR(10) DEFAULT 'TRY',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, oda_no)
);

-- Kasa Fişleri (Başlık Bölümü)
CREATE TABLE IF NOT EXISTS kasa_fisleri (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    fis_no VARCHAR(50) NOT NULL,
    fis_tipi VARCHAR(20) NOT NULL, -- Tahsilat, Tediye, Virman, Devir
    fis_tarihi DATE NOT NULL DEFAULT CURRENT_DATE,
    fis_saati TIME DEFAULT CURRENT_TIME,
    isyeri_kodu VARCHAR(50),
    belge_tarihi DATE,
    belge_tipi VARCHAR(50),
    belge_no VARCHAR(50),
    para_birimi VARCHAR(10) DEFAULT 'TRY',
    toplam_tutar DECIMAL(15,2) DEFAULT 0,
    aciklama TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, fis_no, fis_tipi)
);

-- Kasa Fiş Satırları (Detay Bölümü - Görseller baz alındı)
CREATE TABLE IF NOT EXISTS kasa_fis_satirlari (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    fis_id UUID REFERENCES kasa_fisleri(id) ON DELETE CASCADE,
    kasa_id UUID REFERENCES kasa_tanimlari(id) ON DELETE CASCADE,
    unvan VARCHAR(200),
    aciklama TEXT,
    tutar DECIMAL(15,2) DEFAULT 0,
    borc_tutari DECIMAL(15,2) DEFAULT 0,
    alacak_tutari DECIMAL(15,2) DEFAULT 0,
    hizmet_kodu VARCHAR(50),
    hizmet_adi VARCHAR(100),
    masraf_adi VARCHAR(100),
    pers_kodu VARCHAR(50),
    oda_id UUID REFERENCES odalar(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. RLS AYARLARI
ALTER TABLE kasa_tanimlari ENABLE ROW LEVEL SECURITY;
ALTER TABLE odalar ENABLE ROW LEVEL SECURITY;
ALTER TABLE kasa_fisleri ENABLE ROW LEVEL SECURITY;
ALTER TABLE kasa_fis_satirlari ENABLE ROW LEVEL SECURITY;

-- Politikalar
DO $$ 
BEGIN
    -- Kasa Tanımları
    EXECUTE 'DROP POLICY IF EXISTS kasa_tanimlari_all_access ON kasa_tanimlari';
    EXECUTE 'CREATE POLICY kasa_tanimlari_all_access ON kasa_tanimlari FOR ALL USING (tenant_id = (current_setting(''app.current_tenant_id'', true))::uuid)';

    -- Odalar
    EXECUTE 'DROP POLICY IF EXISTS odalar_all_access ON odalar';
    EXECUTE 'CREATE POLICY odalar_all_access ON odalar FOR ALL USING (tenant_id = (current_setting(''app.current_tenant_id'', true))::uuid)';

    -- Kasa Fişleri
    EXECUTE 'DROP POLICY IF EXISTS kasa_fisleri_all_access ON kasa_fisleri';
    EXECUTE 'CREATE POLICY kasa_fisleri_all_access ON kasa_fisleri FOR ALL USING (tenant_id = (current_setting(''app.current_tenant_id'', true))::uuid)';

    -- Kasa Fiş Satırları
    EXECUTE 'DROP POLICY IF EXISTS kasa_fis_satirlari_all_access ON kasa_fis_satirlari';
    EXECUTE 'CREATE POLICY kasa_fis_satirlari_all_access ON kasa_fis_satirlari FOR ALL USING (tenant_id = (current_setting(''app.current_tenant_id'', true))::uuid)';
END $$;

-- 3. INDEXLER
CREATE INDEX IF NOT EXISTS idx_kasa_tanimlari_tenant ON kasa_tanimlari(tenant_id);
CREATE INDEX IF NOT EXISTS idx_odalar_tenant ON odalar(tenant_id);
CREATE INDEX IF NOT EXISTS idx_kasa_fisleri_tenant ON kasa_fisleri(tenant_id);
CREATE INDEX IF NOT EXISTS idx_kasa_fis_satirlari_fis ON kasa_fis_satirlari(fis_id);
