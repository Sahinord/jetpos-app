-- ================================================
-- KASA VE ODA TABLOLARI RLS POLICY FIX
-- INSERT için WITH CHECK clause ekleniyor
-- ================================================

-- KASA TANIMLARI
DROP POLICY IF EXISTS kasa_tanimlari_all_access ON kasa_tanimlari;

CREATE POLICY kasa_tanimlari_select ON kasa_tanimlari
    FOR SELECT
    USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);

CREATE POLICY kasa_tanimlari_insert ON kasa_tanimlari
    FOR INSERT
    WITH CHECK (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);

CREATE POLICY kasa_tanimlari_update ON kasa_tanimlari
    FOR UPDATE
    USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid)
    WITH CHECK (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);

CREATE POLICY kasa_tanimlari_delete ON kasa_tanimlari
    FOR DELETE
    USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);

-- ODALAR
DROP POLICY IF EXISTS odalar_all_access ON odalar;

CREATE POLICY odalar_select ON odalar
    FOR SELECT
    USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);

CREATE POLICY odalar_insert ON odalar
    FOR INSERT
    WITH CHECK (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);

CREATE POLICY odalar_update ON odalar
    FOR UPDATE
    USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid)
    WITH CHECK (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);

CREATE POLICY odalar_delete ON odalar
    FOR DELETE
    USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);

-- KASA FİŞLERİ
DROP POLICY IF EXISTS kasa_fisleri_all_access ON kasa_fisleri;

CREATE POLICY kasa_fisleri_select ON kasa_fisleri
    FOR SELECT
    USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);

CREATE POLICY kasa_fisleri_insert ON kasa_fisleri
    FOR INSERT
    WITH CHECK (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);

CREATE POLICY kasa_fisleri_update ON kasa_fisleri
    FOR UPDATE
    USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid)
    WITH CHECK (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);

CREATE POLICY kasa_fisleri_delete ON kasa_fisleri
    FOR DELETE
    USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);

-- KASA FİŞ SATIRLARI
DROP POLICY IF EXISTS kasa_fis_satirlari_all_access ON kasa_fis_satirlari;

CREATE POLICY kasa_fis_satirlari_select ON kasa_fis_satirlari
    FOR SELECT
    USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);

CREATE POLICY kasa_fis_satirlari_insert ON kasa_fis_satirlari
    FOR INSERT
    WITH CHECK (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);

CREATE POLICY kasa_fis_satirlari_update ON kasa_fis_satirlari
    FOR UPDATE
    USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid)
    WITH CHECK (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);

CREATE POLICY kasa_fis_satirlari_delete ON kasa_fis_satirlari
    FOR DELETE
    USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);
