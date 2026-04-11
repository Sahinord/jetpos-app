
-- RLS Engellerini Aşmak İçin Admin RPC Tanımları
-- Tarih: 2026-04-11

DROP FUNCTION IF EXISTS admin_upsert_employee(JSONB);
DROP FUNCTION IF EXISTS admin_delete_employee(UUID);
DROP FUNCTION IF EXISTS admin_get_employees(UUID);
DROP FUNCTION IF EXISTS verify_tenant_password(UUID, TEXT);

-- 1. Personel Ekleme/Güncelleme için SECURITY DEFINER fonksiyonu
-- Bu fonksiyon RLS kısıtlamalarına takılmaz.
CREATE OR REPLACE FUNCTION admin_upsert_employee(p_employee JSONB)
RETURNS JSON AS $$
DECLARE
    v_id UUID;
    v_res RECORD;
BEGIN
    -- Eğer ID varsa UPDATE, yoksa INSERT
    IF (p_employee->>'id') IS NOT NULL AND (p_employee->>'id') != '' THEN
        UPDATE employees SET
            first_name = p_employee->>'first_name',
            last_name = p_employee->>'last_name',
            email = p_employee->>'email',
            phone = p_employee->>'phone',
            position = p_employee->>'position',
            status = p_employee->>'status',
            pin_code = p_employee->>'pin_code',
            permissions = (p_employee->'permissions')::JSONB,
            updated_at = NOW()
        WHERE id = (p_employee->>'id')::UUID;
        v_id := (p_employee->>'id')::UUID;
    ELSE
        INSERT INTO employees (
            tenant_id, first_name, last_name, email, phone, position, status, pin_code, permissions
        ) VALUES (
            (p_employee->>'tenant_id')::UUID,
            p_employee->>'first_name',
            p_employee->>'last_name',
            p_employee->>'email',
            p_employee->>'phone',
            p_employee->>'position',
            COALESCE(p_employee->>'status', 'active'),
            p_employee->>'pin_code',
            (p_employee->'permissions')::JSONB
        ) RETURNING id INTO v_id;
    END IF;

    RETURN json_build_object('success', true, 'id', v_id);
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Personel Silme için SECURITY DEFINER
CREATE OR REPLACE FUNCTION admin_delete_employee(p_id UUID)
RETURNS JSON AS $$
BEGIN
    DELETE FROM employees WHERE id = p_id;
    RETURN json_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Yönetici Şifresi Doğrulama (Master Giriş İçin)
CREATE OR REPLACE FUNCTION verify_tenant_password(p_tenant_id UUID, p_password TEXT)
RETURNS JSON AS $$
DECLARE
    v_success BOOLEAN;
    v_db_pass TEXT;
    v_db_master TEXT;
BEGIN
    -- 1. İşletmeyi bul
    SELECT password, master_pin INTO v_db_pass, v_db_master FROM tenants WHERE id = p_tenant_id;
    
    IF v_db_pass IS NULL AND v_db_master IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Sistem hatası: İşletme kaydı bulunamadı.');
    END IF;

    -- 2. Şifreleri karşılaştır (Boşlukları temizle)
    IF (v_db_pass IS NOT NULL AND TRIM(v_db_pass) = TRIM(p_password)) OR 
       (v_db_master IS NOT NULL AND TRIM(v_db_master) = TRIM(p_password)) THEN
        RETURN json_build_object('success', true);
    ELSE
        RETURN json_build_object('success', false, 'message', 'Geçersiz şifre veya Master PIN');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
