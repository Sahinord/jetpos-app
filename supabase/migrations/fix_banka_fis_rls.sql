-- ================================================
-- TÜM TABLOLAR İÇİN RLS POLICY FIX
-- INSERT için WITH CHECK clause ekleniyor
-- ================================================

-- ===========================================
-- BANKA FİŞLERİ FIX
-- ===========================================

DROP POLICY IF EXISTS "banka_fisleri_tenant_isolation" ON banka_fisleri;

CREATE POLICY banka_fisleri_select ON banka_fisleri
    FOR SELECT
    USING (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY banka_fisleri_insert ON banka_fisleri
    FOR INSERT
    WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY banka_fisleri_update ON banka_fisleri
    FOR UPDATE
    USING (tenant_id::text = current_setting('app.current_tenant_id', true))
    WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY banka_fisleri_delete ON banka_fisleri
    FOR DELETE
    USING (tenant_id::text = current_setting('app.current_tenant_id', true));

-- BANKA FİŞ SATIRLARI

DROP POLICY IF EXISTS "banka_fis_satirlari_tenant_isolation" ON banka_fis_satirlari;

CREATE POLICY banka_fis_satirlari_select ON banka_fis_satirlari
    FOR SELECT
    USING (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY banka_fis_satirlari_insert ON banka_fis_satirlari
    FOR INSERT
    WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY banka_fis_satirlari_update ON banka_fis_satirlari
    FOR UPDATE
    USING (tenant_id::text = current_setting('app.current_tenant_id', true))
    WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY banka_fis_satirlari_delete ON banka_fis_satirlari
    FOR DELETE
    USING (tenant_id::text = current_setting('app.current_tenant_id', true));
