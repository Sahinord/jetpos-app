
-- RBAC ve Çalışan Giriş Sistemi Güncellemesi
-- Tarih: 2026-04-11

-- 1. Users tablosuna şifre desteği
ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pin_code VARCHAR(10);

-- 2. Tenants tablosuna ayar desteği (Zaten JSONB features var, ama isterseniz settings'e de ekleyebiliriz)
-- Mevcut features JSONB üzerinden 'employee_login' flag'i kullanılacak.

-- 3. Güvenli giriş kontrolü fonksiyonu (RPC)
CREATE OR REPLACE FUNCTION verify_employee_pin(p_tenant_id UUID, p_pin_code TEXT)
RETURNS JSON AS $$
DECLARE
    v_employee RECORD;
BEGIN
    SELECT * INTO v_employee 
    FROM employees 
    WHERE tenant_id = p_tenant_id 
    AND pin_code = p_pin_code 
    AND status = 'active'
    LIMIT 1;

    IF v_employee.id IS NOT NULL THEN
        RETURN json_build_object(
            'success', true,
            'employee', json_build_object(
                'id', v_employee.id,
                'first_name', v_employee.first_name,
                'last_name', v_employee.last_name,
                'position', v_employee.position,
                'permissions', v_employee.permissions
            )
        );
    ELSE
        RETURN json_build_object('success', false, 'message', 'Geçersiz PIN kodu');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Kullanıcı Login fonksiyonu (Admin/Manager için)
CREATE OR REPLACE FUNCTION login_user_v1(p_tenant_id UUID, p_username TEXT, p_password TEXT)
RETURNS JSON AS $$
DECLARE
    v_user RECORD;
BEGIN
    SELECT * INTO v_user 
    FROM users 
    WHERE tenant_id = p_tenant_id 
    AND username = p_username 
    AND password = p_password -- Not: Üretim ortamında bCrypt kullanılmalı, şimdilik basit tutuyoruz
    AND is_active = true
    LIMIT 1;

    IF v_user.id IS NOT NULL THEN
        RETURN json_build_object(
            'success', true,
            'user', json_build_object(
                'id', v_user.id,
                'username', v_user.username,
                'role', v_user.role
            )
        );
    ELSE
        RETURN json_build_object('success', false, 'message', 'Kullanıcı adı veya şifre hatalı');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
