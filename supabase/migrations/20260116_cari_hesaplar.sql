-- ===========================================
-- CARİ HESAP TAKİBİ - MULTI-TENANT SETUP
-- ===========================================

-- Gerekli fonksiyonlar (eğer yoksa oluştur)
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_tenant_id', true), '')::UUID;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Otomatik tenant_id set fonksiyonu (cari tablolar için)
CREATE OR REPLACE FUNCTION auto_set_cari_tenant_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    NEW.tenant_id := get_current_tenant_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated_at fonksiyonu (eğer yoksa)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- TABLOLAR
-- ===========================================

-- Cari Hesaplar Tablosu
CREATE TABLE IF NOT EXISTS cari_hesaplar (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Genel Bilgiler
    cari_kodu VARCHAR(50) NOT NULL,
    unvani VARCHAR(255) NOT NULL,
    unvani_2 VARCHAR(255),
    vergi_dairesi VARCHAR(100),
    vergi_no VARCHAR(20),
    durum VARCHAR(20) DEFAULT 'Aktif',
    cari_tipi VARCHAR(50),
    grup_kodu VARCHAR(50),
    ozel_kodu VARCHAR(50),
    yetki_kodu VARCHAR(50),
    sektor_kodu VARCHAR(50),
    bolge_kodu VARCHAR(50),
    para_birimi VARCHAR(10) DEFAULT 'TRY',
    hesap_tipi VARCHAR(50),
    mutabakat BOOLEAN DEFAULT FALSE,
    
    -- Adres ve İlgililer
    kur_hesaplama VARCHAR(50),
    kdv_tipi_as VARCHAR(20),
    kdv_kapsami VARCHAR(50),
    fiyat_tipi VARCHAR(50),
    iskonto_orani DECIMAL(5,2) DEFAULT 0,
    vade_orani DECIMAL(5,2) DEFAULT 0,
    vade_gun_tarih DATE,
    odeme_plan_no VARCHAR(50),
    kredi_limiti DECIMAL(15,2) DEFAULT 0,
    risk_limiti DECIMAL(15,2) DEFAULT 0,
    musteri_kodu VARCHAR(50),
    personel_kodu VARCHAR(50),
    
    -- Bankalar ve Notlar
    firma_sirk_no VARCHAR(50),
    satici_kodu_1 VARCHAR(50),
    satici_kodu_2 VARCHAR(50),
    ana_cari_kodu VARCHAR(50),
    uretim_konusu VARCHAR(255),
    calisma_alani VARCHAR(255),
    odeme_bilgisi VARCHAR(255),
    diger_isk_orn DECIMAL(5,2) DEFAULT 0,
    eo_isk_orn DECIMAL(5,2) DEFAULT 0,
    brm_isk_orn VARCHAR(50),
    vade_tarihi_2 DATE,
    depo_no VARCHAR(50),
    sprs_tarih_gun DATE,
    sirkular BOOLEAN DEFAULT FALSE,
    
    -- Kimlik Bilgileri
    h_kesim_tipi VARCHAR(50),
    hk_gun_tar DATE,
    sa_tipi VARCHAR(50),
    sa_gun_tar DATE,
    acik_teminat DECIMAL(15,2) DEFAULT 0,
    banka_teminati DECIMAL(15,2) DEFAULT 0,
    ipotek_teminati DECIMAL(15,2) DEFAULT 0,
    teminat_ceki DECIMAL(15,2) DEFAULT 0,
    teminat_senedi DECIMAL(15,2) DEFAULT 0,
    diger_teminat DECIMAL(15,2) DEFAULT 0,
    teminat_tutari DECIMAL(15,2) DEFAULT 0,
    sube_kodu_adi VARCHAR(100),
    
    -- İletişim
    web_sitesi VARCHAR(255),
    email VARCHAR(255),
    referanslar TEXT,
    
    -- Bakiye Bilgileri (Otomatik hesaplanır)
    borc_toplami DECIMAL(15,2) DEFAULT 0,
    alacak_toplami DECIMAL(15,2) DEFAULT 0,
    bakiye DECIMAL(15,2) DEFAULT 0,
    
    -- Meta
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, cari_kodu)
);

-- Cari İlgili Kişiler Tablosu
CREATE TABLE IF NOT EXISTS cari_ilgililer (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cari_id UUID REFERENCES cari_hesaplar(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    adi_soyadi VARCHAR(100),
    unvani VARCHAR(100),
    telefon_is VARCHAR(20),
    telefon_cep VARCHAR(20),
    telefon_fax VARCHAR(20),
    mail_adresi VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cari Banka Bilgileri Tablosu
CREATE TABLE IF NOT EXISTS cari_bankalar (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cari_id UUID REFERENCES cari_hesaplar(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    banka_adi VARCHAR(100),
    sube_adi VARCHAR(100),
    hesap_no VARCHAR(50),
    iban VARCHAR(34),
    para_birimi VARCHAR(10) DEFAULT 'TRY',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cari Adres Bilgileri Tablosu
CREATE TABLE IF NOT EXISTS cari_adresler (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cari_id UUID REFERENCES cari_hesaplar(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    adres_tipi VARCHAR(50),
    adres TEXT,
    il VARCHAR(50),
    ilce VARCHAR(50),
    posta_kodu VARCHAR(10),
    ulke VARCHAR(50) DEFAULT 'Türkiye',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cari Hareketler Tablosu
CREATE TABLE IF NOT EXISTS cari_hareketler (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cari_id UUID REFERENCES cari_hesaplar(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    hareket_tipi VARCHAR(50) NOT NULL,
    tarih DATE NOT NULL,
    vade_tarihi DATE,
    belge_no VARCHAR(50),
    aciklama TEXT,
    borc DECIMAL(15,2) DEFAULT 0,
    alacak DECIMAL(15,2) DEFAULT 0,
    bakiye DECIMAL(15,2) DEFAULT 0,
    para_birimi VARCHAR(10) DEFAULT 'TRY',
    kur DECIMAL(10,4) DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cari Gruplar Tablosu
CREATE TABLE IF NOT EXISTS cari_gruplar (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    grup_kodu VARCHAR(50) NOT NULL,
    grup_adi VARCHAR(100) NOT NULL,
    aciklama TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, grup_kodu)
);

-- Cari Özel Kodlar Tablosu
CREATE TABLE IF NOT EXISTS cari_ozel_kodlar (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    kod_tipi VARCHAR(50) NOT NULL,
    kod VARCHAR(50) NOT NULL,
    aciklama VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, kod_tipi, kod)
);

-- ===========================================
-- INDEXLER
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_cari_hesaplar_tenant ON cari_hesaplar(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cari_hesaplar_kodu ON cari_hesaplar(cari_kodu);
CREATE INDEX IF NOT EXISTS idx_cari_hareketler_cari ON cari_hareketler(cari_id);
CREATE INDEX IF NOT EXISTS idx_cari_hareketler_tarih ON cari_hareketler(tarih);
CREATE INDEX IF NOT EXISTS idx_cari_hareketler_tenant ON cari_hareketler(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cari_ilgililer_tenant ON cari_ilgililer(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cari_bankalar_tenant ON cari_bankalar(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cari_adresler_tenant ON cari_adresler(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cari_gruplar_tenant ON cari_gruplar(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cari_ozel_kodlar_tenant ON cari_ozel_kodlar(tenant_id);

-- ===========================================
-- ROW LEVEL SECURITY (RLS) - TENANT İZOLASYONU
-- ===========================================

ALTER TABLE cari_hesaplar ENABLE ROW LEVEL SECURITY;
ALTER TABLE cari_ilgililer ENABLE ROW LEVEL SECURITY;
ALTER TABLE cari_bankalar ENABLE ROW LEVEL SECURITY;
ALTER TABLE cari_adresler ENABLE ROW LEVEL SECURITY;
ALTER TABLE cari_hareketler ENABLE ROW LEVEL SECURITY;
ALTER TABLE cari_gruplar ENABLE ROW LEVEL SECURITY;
ALTER TABLE cari_ozel_kodlar ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- POLİTİKALAR
-- ===========================================

-- CARI HESAPLAR
DROP POLICY IF EXISTS "cari_hesaplar_tenant_isolation" ON cari_hesaplar;
CREATE POLICY "cari_hesaplar_tenant_isolation" ON cari_hesaplar
    FOR ALL 
    USING (tenant_id = get_current_tenant_id())
    WITH CHECK (tenant_id = get_current_tenant_id());

-- CARI HAREKETLER
DROP POLICY IF EXISTS "cari_hareketler_tenant_isolation" ON cari_hareketler;
CREATE POLICY "cari_hareketler_tenant_isolation" ON cari_hareketler
    FOR ALL 
    USING (tenant_id = get_current_tenant_id())
    WITH CHECK (tenant_id = get_current_tenant_id());

-- CARI İLGİLİLER
DROP POLICY IF EXISTS "cari_ilgililer_tenant_isolation" ON cari_ilgililer;
CREATE POLICY "cari_ilgililer_tenant_isolation" ON cari_ilgililer
    FOR ALL 
    USING (tenant_id = get_current_tenant_id())
    WITH CHECK (tenant_id = get_current_tenant_id());

-- CARI BANKALAR
DROP POLICY IF EXISTS "cari_bankalar_tenant_isolation" ON cari_bankalar;
CREATE POLICY "cari_bankalar_tenant_isolation" ON cari_bankalar
    FOR ALL 
    USING (tenant_id = get_current_tenant_id())
    WITH CHECK (tenant_id = get_current_tenant_id());

-- CARI ADRESLER
DROP POLICY IF EXISTS "cari_adresler_tenant_isolation" ON cari_adresler;
CREATE POLICY "cari_adresler_tenant_isolation" ON cari_adresler
    FOR ALL 
    USING (tenant_id = get_current_tenant_id())
    WITH CHECK (tenant_id = get_current_tenant_id());

-- CARI GRUPLAR
DROP POLICY IF EXISTS "cari_gruplar_tenant_isolation" ON cari_gruplar;
CREATE POLICY "cari_gruplar_tenant_isolation" ON cari_gruplar
    FOR ALL 
    USING (tenant_id = get_current_tenant_id())
    WITH CHECK (tenant_id = get_current_tenant_id());

-- CARI ÖZEL KODLAR
DROP POLICY IF EXISTS "cari_ozel_kodlar_tenant_isolation" ON cari_ozel_kodlar;
CREATE POLICY "cari_ozel_kodlar_tenant_isolation" ON cari_ozel_kodlar
    FOR ALL 
    USING (tenant_id = get_current_tenant_id())
    WITH CHECK (tenant_id = get_current_tenant_id());

-- ===========================================
-- TRİGGERLAR - Otomatik tenant_id
-- ===========================================

-- Cari Hesaplar
DROP TRIGGER IF EXISTS set_cari_hesaplar_tenant ON cari_hesaplar;
CREATE TRIGGER set_cari_hesaplar_tenant
    BEFORE INSERT ON cari_hesaplar
    FOR EACH ROW
    EXECUTE FUNCTION auto_set_cari_tenant_id();

-- Cari Hareketler
DROP TRIGGER IF EXISTS set_cari_hareketler_tenant ON cari_hareketler;
CREATE TRIGGER set_cari_hareketler_tenant
    BEFORE INSERT ON cari_hareketler
    FOR EACH ROW
    EXECUTE FUNCTION auto_set_cari_tenant_id();

-- Cari İlgililer
DROP TRIGGER IF EXISTS set_cari_ilgililer_tenant ON cari_ilgililer;
CREATE TRIGGER set_cari_ilgililer_tenant
    BEFORE INSERT ON cari_ilgililer
    FOR EACH ROW
    EXECUTE FUNCTION auto_set_cari_tenant_id();

-- Cari Bankalar
DROP TRIGGER IF EXISTS set_cari_bankalar_tenant ON cari_bankalar;
CREATE TRIGGER set_cari_bankalar_tenant
    BEFORE INSERT ON cari_bankalar
    FOR EACH ROW
    EXECUTE FUNCTION auto_set_cari_tenant_id();

-- Cari Adresler
DROP TRIGGER IF EXISTS set_cari_adresler_tenant ON cari_adresler;
CREATE TRIGGER set_cari_adresler_tenant
    BEFORE INSERT ON cari_adresler
    FOR EACH ROW
    EXECUTE FUNCTION auto_set_cari_tenant_id();

-- Cari Gruplar
DROP TRIGGER IF EXISTS set_cari_gruplar_tenant ON cari_gruplar;
CREATE TRIGGER set_cari_gruplar_tenant
    BEFORE INSERT ON cari_gruplar
    FOR EACH ROW
    EXECUTE FUNCTION auto_set_cari_tenant_id();

-- Cari Özel Kodlar
DROP TRIGGER IF EXISTS set_cari_ozel_kodlar_tenant ON cari_ozel_kodlar;
CREATE TRIGGER set_cari_ozel_kodlar_tenant
    BEFORE INSERT ON cari_ozel_kodlar
    FOR EACH ROW
    EXECUTE FUNCTION auto_set_cari_tenant_id();

-- Updated_at Trigger
DROP TRIGGER IF EXISTS update_cari_hesaplar_updated_at ON cari_hesaplar;
CREATE TRIGGER update_cari_hesaplar_updated_at
    BEFORE UPDATE ON cari_hesaplar
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
