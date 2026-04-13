
-- JetPOS Super Admin Yetkilendirme Güncellemesi
-- Tarih: 2026-04-12

-- validate_license fonksiyonunu Super Admin (ADM257SA67) için bypass yetkisiyle güncelle.
-- Bu sayede Admin, herhangi bir tenant ID'si ve kendi admin key'i ile sisteme giriş yapabilir.

CREATE OR REPLACE FUNCTION validate_license(p_tenant_id uuid, p_license_key text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
    v_is_super_admin boolean;
BEGIN
    -- 1. Gelen key super admin key'i mi?
    v_is_super_admin := (p_license_key = 'ADM257SA67');

    IF v_is_super_admin THEN
        -- Super Admin ise: Herhangi bir tenant'ı (id ile) getirebilir.
        SELECT row_to_json(t) INTO result
        FROM (
            SELECT
                id, license_key, company_name, contact_email,
                logo_url, status, features, settings, max_stores, max_online_stores
            FROM tenants
            WHERE id = p_tenant_id
            LIMIT 1
        ) t;
    ELSE
        -- Normal kullanıcı ise: Hem ID hem Key eşleşmeli ve aktif olmalı.
        SELECT row_to_json(t) INTO result
        FROM (
            SELECT
                id, license_key, company_name, contact_email,
                logo_url, status, features, settings, max_stores, max_online_stores
            FROM tenants
            WHERE id          = p_tenant_id
              AND license_key = p_license_key
              AND status      = 'active'
            LIMIT 1
        ) t;
    END IF;

    RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION validate_license(uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION validate_license(uuid, text) TO authenticated;
