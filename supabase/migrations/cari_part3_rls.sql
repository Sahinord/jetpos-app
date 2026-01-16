-- ===========================================
-- PART 3: RLS ve POLİTİKALAR (Basitleştirilmiş)
-- ===========================================

-- Önce tabloların var olduğundan emin ol
-- Supabase Table Editor'da şu tabloları kontrol et:
-- cari_hesaplar, cari_hareketler, cari_ilgililer, cari_bankalar, cari_adresler, cari_gruplar, cari_ozel_kodlar

-- RLS Aktif Et
ALTER TABLE cari_hesaplar ENABLE ROW LEVEL SECURITY;
ALTER TABLE cari_ilgililer ENABLE ROW LEVEL SECURITY;
ALTER TABLE cari_bankalar ENABLE ROW LEVEL SECURITY;
ALTER TABLE cari_adresler ENABLE ROW LEVEL SECURITY;
ALTER TABLE cari_hareketler ENABLE ROW LEVEL SECURITY;
ALTER TABLE cari_gruplar ENABLE ROW LEVEL SECURITY;
ALTER TABLE cari_ozel_kodlar ENABLE ROW LEVEL SECURITY;

-- Basit Politikalar - tenant_id text olarak karşılaştırma
DROP POLICY IF EXISTS "cari_hesaplar_tenant_isolation" ON cari_hesaplar;
CREATE POLICY "cari_hesaplar_tenant_isolation" ON cari_hesaplar
    FOR ALL 
    USING (tenant_id::text = current_setting('app.current_tenant_id', true))
    WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

DROP POLICY IF EXISTS "cari_hareketler_tenant_isolation" ON cari_hareketler;
CREATE POLICY "cari_hareketler_tenant_isolation" ON cari_hareketler
    FOR ALL 
    USING (tenant_id::text = current_setting('app.current_tenant_id', true))
    WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

DROP POLICY IF EXISTS "cari_ilgililer_tenant_isolation" ON cari_ilgililer;
CREATE POLICY "cari_ilgililer_tenant_isolation" ON cari_ilgililer
    FOR ALL 
    USING (tenant_id::text = current_setting('app.current_tenant_id', true))
    WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

DROP POLICY IF EXISTS "cari_bankalar_tenant_isolation" ON cari_bankalar;
CREATE POLICY "cari_bankalar_tenant_isolation" ON cari_bankalar
    FOR ALL 
    USING (tenant_id::text = current_setting('app.current_tenant_id', true))
    WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

DROP POLICY IF EXISTS "cari_adresler_tenant_isolation" ON cari_adresler;
CREATE POLICY "cari_adresler_tenant_isolation" ON cari_adresler
    FOR ALL 
    USING (tenant_id::text = current_setting('app.current_tenant_id', true))
    WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

DROP POLICY IF EXISTS "cari_gruplar_tenant_isolation" ON cari_gruplar;
CREATE POLICY "cari_gruplar_tenant_isolation" ON cari_gruplar
    FOR ALL 
    USING (tenant_id::text = current_setting('app.current_tenant_id', true))
    WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

DROP POLICY IF EXISTS "cari_ozel_kodlar_tenant_isolation" ON cari_ozel_kodlar;
CREATE POLICY "cari_ozel_kodlar_tenant_isolation" ON cari_ozel_kodlar
    FOR ALL 
    USING (tenant_id::text = current_setting('app.current_tenant_id', true))
    WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));
