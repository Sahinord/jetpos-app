-- =========================================================
-- Login RPC'leri — RETURNS TABLE yerine RETURNS json kullanıyor
-- (column type mismatch hatasını tamamen önler)
-- Supabase SQL Editor'da çalıştır
-- =========================================================

DROP FUNCTION IF EXISTS find_tenant_by_license(text);
DROP FUNCTION IF EXISTS verify_tenant_password(uuid, text);
DROP FUNCTION IF EXISTS validate_license(uuid, text);

-- 1. Lisans key ile tenant bul (şifre HARİÇ)
CREATE OR REPLACE FUNCTION find_tenant_by_license(p_license_key text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
BEGIN
    SELECT row_to_json(t) INTO result
    FROM (
        SELECT
            id, license_key, company_name, contact_email,
            logo_url, status, features, settings
        FROM tenants
        WHERE license_key = p_license_key
          AND status      = 'active'
        LIMIT 1
    ) t;

    RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION find_tenant_by_license(text) TO anon;
GRANT EXECUTE ON FUNCTION find_tenant_by_license(text) TO authenticated;


-- 2. Şifre doğrula (server-side — plaintext asla client'a gitmiyor)
CREATE OR REPLACE FUNCTION verify_tenant_password(p_tenant_id uuid, p_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    stored_password text;
BEGIN
    SELECT password INTO stored_password
    FROM tenants
    WHERE id = p_tenant_id AND status = 'active';

    IF stored_password IS NULL THEN
        RETURN false;
    END IF;

    RETURN stored_password = p_password;
END;
$$;

GRANT EXECUTE ON FUNCTION verify_tenant_password(uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION verify_tenant_password(uuid, text) TO authenticated;


-- 3. Tenant ID + license key ile doğrula (sayfa yenileme / tenant-context için)
CREATE OR REPLACE FUNCTION validate_license(p_tenant_id uuid, p_license_key text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
BEGIN
    SELECT row_to_json(t) INTO result
    FROM (
        SELECT
            id, license_key, company_name, contact_email,
            logo_url, status, features, settings
        FROM tenants
        WHERE id          = p_tenant_id
          AND license_key = p_license_key
          AND status      = 'active'
        LIMIT 1
    ) t;

    RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION validate_license(uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION validate_license(uuid, text) TO authenticated;
