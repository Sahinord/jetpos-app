-- Banka Fişleri (Üst Bölüm)
CREATE TABLE IF NOT EXISTS banka_fisleri (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    fis_no TEXT NOT NULL,
    fis_tarihi TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    fis_tipi TEXT NOT NULL, -- 'Bankadan Para Çekme', 'Bankaya Para Yatırma', 'Gelen Havale', 'Yapılan Havale', 'Banka Virman', 'Banka Devir'
    belge_no TEXT,
    belge_tarihi DATE,
    para_birimi TEXT DEFAULT 'TRY',
    toplam_borc DECIMAL(15,2) DEFAULT 0,
    toplam_alacak DECIMAL(15,2) DEFAULT 0,
    aciklama TEXT,
    muh_aciklama TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(tenant_id, fis_no, fis_tipi)
);

-- Banka Fiş Satırları (Detay Bölümü)
CREATE TABLE IF NOT EXISTS banka_fis_satirlari (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    fis_id UUID REFERENCES banka_fisleri(id) ON DELETE CASCADE,
    banka_id UUID REFERENCES bankalar(id) ON DELETE CASCADE,
    karsi_hesap_tipi TEXT, -- 'Kasa', 'Cari', 'Banka', 'Masraf', 'Gelir'
    karsi_hesap_id UUID, -- cariler.id, kasalar.id, vb.
    karsi_hesap_unvan TEXT,
    aciklama TEXT,
    belge_no TEXT,
    borc DECIMAL(15,2) DEFAULT 0,
    alacak DECIMAL(15,2) DEFAULT 0,
    para_birimi TEXT DEFAULT 'TRY',
    kur DECIMAL(12,4) DEFAULT 1,
    hizmet_kodu TEXT,
    masraf_kodu TEXT,
    personel_kodu TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS Settings
ALTER TABLE banka_fisleri ENABLE ROW LEVEL SECURITY;
ALTER TABLE banka_fis_satirlari ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "banka_fisleri_tenant_isolation" ON banka_fisleri;
CREATE POLICY "banka_fisleri_tenant_isolation" ON banka_fisleri
    FOR ALL USING (tenant_id::text = current_setting('app.current_tenant_id', true));

DROP POLICY IF EXISTS "banka_fis_satirlari_tenant_isolation" ON banka_fis_satirlari;
CREATE POLICY "banka_fis_satirlari_tenant_isolation" ON banka_fis_satirlari
    FOR ALL USING (tenant_id::text = current_setting('app.current_tenant_id', true));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_banka_fisleri_tenant ON banka_fisleri(tenant_id);
CREATE INDEX IF NOT EXISTS idx_banka_fis_satirlari_fis ON banka_fis_satirlari(fis_id);
CREATE INDEX IF NOT EXISTS idx_banka_fis_satirlari_banka ON banka_fis_satirlari(banka_id);
