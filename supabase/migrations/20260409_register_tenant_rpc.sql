-- =========================================================
-- Bcrypt Şifre Güvenliği
-- Supabase SQL Editor'da çalıştır
-- =========================================================

-- pgcrypto extension'ı aktif et (Supabase'de genellikle zaten var)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- verify_tenant_password: Bcrypt destekli smooth geçiş
-- Eğer DB'de hâlâ plaintext şifre varsa:
--   1. Plaintext karşılaştırır
--   2. Eşleşirse anında hash'leyip kaydeder
--   3. Sonraki girişte artık bcrypt kullanır
DROP FUNCTION IF EXISTS verify_tenant_password(uuid, text);

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

    -- Bcrypt hash mi yoksa plaintext mi?
    IF stored_password LIKE '$2%' THEN
        -- Bcrypt karşılaştır
        RETURN crypt(p_password, stored_password) = stored_password;
    ELSE
        -- Eski plaintext şifre: karşılaştır ve anında hash'e dönüştür
        IF stored_password = p_password THEN
            -- Hash'le ve kaydet (bir daha girince bcrypt kullanılır)
            UPDATE tenants
            SET password = crypt(p_password, gen_salt('bf', 10))
            WHERE id = p_tenant_id;
            RETURN true;
        ELSE
            RETURN false;
        END IF;
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION verify_tenant_password(uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION verify_tenant_password(uuid, text) TO authenticated;


-- register_tenant: Yeni kayıtlarda şifreyi direkt bcrypt olarak kaydet
DROP FUNCTION IF EXISTS register_tenant(uuid, text, text, text, text, text);

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
        password      = crypt(p_password, gen_salt('bf', 10)),  -- ← Bcrypt!
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
        FROM tenants
        WHERE id = p_tenant_id
        LIMIT 1
    ) t;

    RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION register_tenant(uuid, text, text, text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION register_tenant(uuid, text, text, text, text, text) TO authenticated;


-- 3. SuperAdmin için Şifre Sıfırlama Fonksiyonu
CREATE OR REPLACE FUNCTION reset_tenant_password(p_tenant_id uuid, p_new_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE tenants
    SET password = crypt(p_new_password, gen_salt('bf', 10))
    WHERE id = p_tenant_id;
    
    RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION reset_tenant_password(uuid, text) TO authenticated;
-- Not: Güvenlik için anon (giriş yapmamış) kişilere kapatıldı.
