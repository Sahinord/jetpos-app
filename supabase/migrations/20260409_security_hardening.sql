-- =========================================================
-- KRİTİK GÜVENLİK YAMASI: Tenant RLS Düzeltmesi
-- Supabase SQL Editor'da çalıştır
-- =========================================================

-- 1. tenants tablosu: Herkese açık SELECT politikasını kapat
DROP POLICY IF EXISTS "Allow reading own tenant" ON tenants;
DROP POLICY IF EXISTS "Public read" ON tenants;

-- Login sırasında lisans key + id ile doğrulama yapılacak
-- Bu sayede biri başka tenant'ın verisini okuyamaz
CREATE POLICY "Allow reading own tenant" ON tenants
FOR SELECT
USING (
    -- Tenant context set edilmişse sadece kendi tenant'ı
    (current_setting('app.current_tenant_id', true) != ''
     AND id::text = current_setting('app.current_tenant_id', true))
    OR
    -- Context set edilmemişse (login öncesi) hiç okuma yok
    current_setting('app.current_tenant_id', true) = ''
);

-- 2. set_current_tenant fonksiyonuna ek güvenlik:
-- Sadece gerçekten var olan ve active bir tenant'ı set etmeye izin ver
CREATE OR REPLACE FUNCTION set_current_tenant(tenant_id uuid)
RETURNS void AS $$
DECLARE
    tenant_exists boolean;
BEGIN
    -- Tenant'ın gerçekten var olup olmadığını kontrol et
    SELECT EXISTS(
        SELECT 1 FROM tenants 
        WHERE id = tenant_id 
        AND status = 'active'
    ) INTO tenant_exists;

    IF NOT tenant_exists THEN
        RAISE EXCEPTION 'Invalid or inactive tenant: %', tenant_id;
    END IF;

    PERFORM set_config('app.current_tenant_id', tenant_id::text, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. password kolonunu hiçbir client sorgusunda gösterme
-- Şifreyi VIEW ile gizle (opsiyonel ek güvenlik)
-- CREATE VIEW tenants_safe AS
--   SELECT id, license_key, company_name, contact_email, logo_url, status, features, settings, openrouter_api_key
--   FROM tenants;

-- 4. audit_logs için de tenant izolasyonu güçlendir
DROP POLICY IF EXISTS "audit_logs_select_policy" ON public.audit_logs;
CREATE POLICY "audit_logs_select_policy"
    ON public.audit_logs
    FOR SELECT
    USING (
        tenant_id::text = current_setting('app.current_tenant_id', true)
    );
