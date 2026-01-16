-- ===========================================
-- CARİ TABLOLARI - HIZLI KURULUM (RLS'siz)
-- ===========================================

-- 1. TABLOLAR

-- Cari Gruplar
CREATE TABLE IF NOT EXISTS cari_gruplar (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    grup_kodu VARCHAR(50) NOT NULL,
    grup_adi VARCHAR(100) NOT NULL,
    aciklama TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, grup_kodu)
);

-- Cari Özel Kodlar
CREATE TABLE IF NOT EXISTS cari_ozel_kodlar (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    kod_tipi VARCHAR(50) NOT NULL,
    kod VARCHAR(50) NOT NULL,
    aciklama VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, kod_tipi, kod)
);

-- Cari Hesaplar
CREATE TABLE IF NOT EXISTS cari_hesaplar (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
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
    web_sitesi VARCHAR(255),
    email VARCHAR(255),
    referanslar TEXT,
    borc_toplami DECIMAL(15,2) DEFAULT 0,
    alacak_toplami DECIMAL(15,2) DEFAULT 0,
    bakiye DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, cari_kodu)
);

-- 2. RLS AÇIK AMA TAM ERİŞİM (Test için)
ALTER TABLE cari_gruplar ENABLE ROW LEVEL SECURITY;
ALTER TABLE cari_ozel_kodlar ENABLE ROW LEVEL SECURITY;
ALTER TABLE cari_hesaplar ENABLE ROW LEVEL SECURITY;

-- Tüm kullanıcılara izin ver (anon key için)
DROP POLICY IF EXISTS "cari_gruplar_all_access" ON cari_gruplar;
CREATE POLICY "cari_gruplar_all_access" ON cari_gruplar FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "cari_ozel_kodlar_all_access" ON cari_ozel_kodlar;
CREATE POLICY "cari_ozel_kodlar_all_access" ON cari_ozel_kodlar FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "cari_hesaplar_all_access" ON cari_hesaplar;
CREATE POLICY "cari_hesaplar_all_access" ON cari_hesaplar FOR ALL USING (true) WITH CHECK (true);

-- 3. INDEXLER
CREATE INDEX IF NOT EXISTS idx_cari_gruplar_tenant ON cari_gruplar(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cari_ozel_kodlar_tenant ON cari_ozel_kodlar(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cari_hesaplar_tenant ON cari_hesaplar(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cari_hesaplar_kodu ON cari_hesaplar(cari_kodu);
CREATE INDEX IF NOT EXISTS idx_cari_hareketler_tenant ON cari_hareketler(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cari_hareketler_tarih ON cari_hareketler(tarih);

-- 4. CARİ HAREKETLER TABLOSU (Borç/Alacak Dekontları için)
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

-- RLS
ALTER TABLE cari_hareketler ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cari_hareketler_all_access" ON cari_hareketler;
CREATE POLICY "cari_hareketler_all_access" ON cari_hareketler FOR ALL USING (true) WITH CHECK (true);
