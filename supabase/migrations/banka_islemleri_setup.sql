-- Banka Tanımları Tablosu
CREATE TABLE IF NOT EXISTS bankalar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    banka_kodu TEXT,
    tanimi TEXT NOT NULL,
    banka_adi TEXT,
    sube_adi TEXT,
    tcmb_kodu TEXT,
    iban_no TEXT,
    hesap_no TEXT,
    para_birimi TEXT DEFAULT 'TRY',
    telefon1 TEXT,
    telefon2 TEXT,
    fax_no TEXT,
    isyeri_kodu TEXT,
    son_cek_no TEXT,
    ozel_kodu TEXT,
    yetki_kodu TEXT,
    limit_tutari DECIMAL(12,2) DEFAULT 0,
    muh_kodu_mev TEXT,
    muh_kodu_cek TEXT,
    muh_kodu_takas TEXT,
    muh_kodu_tahsil TEXT,
    adres TEXT,
    kk_hes_gecis_gunu INTEGER DEFAULT 0,
    kk_komisyon_oran DECIMAL(5,2) DEFAULT 0,
    masraf_hesabi TEXT,
    havale_uygun BOOLEAN DEFAULT false,
    aktif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Banka Hareketleri Tablosu
CREATE TABLE IF NOT EXISTS banka_hareketleri (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    banka_id UUID REFERENCES bankalar(id) ON DELETE CASCADE,
    fis_no TEXT,
    tarih TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    fis_tipi TEXT NOT NULL, -- 'Bankadan Para Çekme', 'Bankaya Para Yatırma', 'Gelen Havale', 'Yapılan Havale', 'Banka Virman', 'Banka Devir'
    cari_id UUID REFERENCES cari_hesaplar(id) ON DELETE SET NULL,
    karsi_banka_id UUID REFERENCES bankalar(id) ON DELETE SET NULL,
    aciklama TEXT,
    borc DECIMAL(12,2) DEFAULT 0, -- Bankaya para girişi
    alacak DECIMAL(12,2) DEFAULT 0, -- Bankadan para çıkışı
    para_birimi TEXT DEFAULT 'TRY',
    kur DECIMAL(12,4) DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS Policies for bankalar
ALTER TABLE bankalar ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bankalar_tenant_isolation" ON bankalar;
CREATE POLICY "bankalar_tenant_isolation" ON bankalar
    FOR ALL 
    USING (tenant_id::text = current_setting('app.current_tenant_id', true))
    WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

-- RLS Policies for banka_hareketleri
ALTER TABLE banka_hareketleri ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "banka_hareketleri_tenant_isolation" ON banka_hareketleri;
CREATE POLICY "banka_hareketleri_tenant_isolation" ON banka_hareketleri
    FOR ALL 
    USING (tenant_id::text = current_setting('app.current_tenant_id', true))
    WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bankalar_tenant ON bankalar(tenant_id);
CREATE INDEX IF NOT EXISTS idx_banka_hareketleri_tenant ON banka_hareketleri(tenant_id);
CREATE INDEX IF NOT EXISTS idx_banka_hareketleri_banka ON banka_hareketleri(banka_id);
