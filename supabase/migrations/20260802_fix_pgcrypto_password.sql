-- ═══════════════════════════════════════════════════════════════════
--  FIX: "function gen_salt(unknown, integer) does not exist"
--  Teşhis: pgcrypto 'extensions' şemasında (crypt, gen_salt orada).
--  SECURITY DEFINER şifre fonksiyonları o şemayı search_path'te görmüyordu.
--  Çözüm: pgcrypto çağrılarını DOĞRUDAN extensions.<fn> diye nitele
--  (search_path'e hiç bağlı kalmasın) — bulletproof.
--  Manuel uygulanır: Supabase Dashboard > SQL Editor (TAMAMINI çalıştır).
-- ═══════════════════════════════════════════════════════════════════

-- 1) verify_tenant_password (plaintext→bcrypt yükseltmesi gen_salt kullanıyor)
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

    IF stored_password IS NULL OR stored_password = '' THEN
        RETURN false;
    END IF;

    IF stored_password LIKE '$2%' THEN
        RETURN extensions.crypt(p_password, stored_password) = stored_password;
    ELSE
        IF stored_password = p_password THEN
            UPDATE tenants
            SET password = extensions.crypt(p_password, extensions.gen_salt('bf'::text, 10))
            WHERE id = p_tenant_id;
            RETURN true;
        ELSE
            RETURN false;
        END IF;
    END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION verify_tenant_password(uuid, text) TO anon, authenticated;

-- 2) register_tenant (kurulum ekranı — şifreyi bcrypt kaydeder)
CREATE OR REPLACE FUNCTION register_tenant(
    p_tenant_id     uuid,
    p_license_key   text,
    p_company_name  text,
    p_password      text,
    p_contact_email text DEFAULT NULL,
    p_logo_url      text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
BEGIN
    UPDATE tenants
    SET
        company_name  = p_company_name,
        password      = extensions.crypt(p_password, extensions.gen_salt('bf'::text, 10)),
        contact_email = COALESCE(p_contact_email, contact_email),
        logo_url      = COALESCE(p_logo_url, logo_url)
    WHERE id          = p_tenant_id
      AND license_key = p_license_key
      AND status      = 'active'
      AND (company_name IS NULL OR company_name = '');

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Kayıt yapılamadı: Geçersiz tenant veya zaten kayıtlı.';
    END IF;

    SELECT row_to_json(t) INTO result
    FROM (
        SELECT id, license_key, company_name, contact_email, logo_url, status, features, settings
        FROM tenants WHERE id = p_tenant_id LIMIT 1
    ) t;
    RETURN result;
END;
$$;
GRANT EXECUTE ON FUNCTION register_tenant(uuid, text, text, text, text, text) TO anon, authenticated;

-- 3) reset_tenant_password (SüperAdmin şifre sıfırlama)
CREATE OR REPLACE FUNCTION reset_tenant_password(p_tenant_id uuid, p_new_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE tenants
    SET password = extensions.crypt(p_new_password, extensions.gen_salt('bf'::text, 10))
    WHERE id = p_tenant_id;
    RETURN FOUND;
END;
$$;
GRANT EXECUTE ON FUNCTION reset_tenant_password(uuid, text) TO authenticated;
