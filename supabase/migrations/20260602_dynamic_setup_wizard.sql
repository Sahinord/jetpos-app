-- 1. Add setup columns and ensure business fields exist on tenants
ALTER TABLE tenants
    ADD COLUMN IF NOT EXISTS setup_completed BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS module_setup JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS address TEXT;

-- 2. Create RPC to complete Initial Setup (Business & Owner)
CREATE OR REPLACE FUNCTION complete_tenant_initial_setup(
    p_tenant_id UUID,
    p_business_name TEXT,
    p_phone TEXT,
    p_email TEXT,
    p_address TEXT,
    p_owner_name TEXT,
    p_owner_pin TEXT,
    p_tenant_password TEXT DEFAULT NULL
)
RETURNS UUID -- Returns the created owner's employee_id
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_employee_id UUID;
    v_pin_hash TEXT;
BEGIN
    -- Validate PIN length (4-6 digits)
    IF p_owner_pin !~ '^\d{4,6}$' THEN
        RAISE EXCEPTION 'PIN kodu 4 ile 6 haneli rakamlardan oluşmalıdır.';
    END IF;

    -- Update Tenant info (Assuming name is the business name column based on schema)
    UPDATE tenants
    SET 
        name = COALESCE(nullif(p_business_name, ''), name),
        phone = COALESCE(nullif(p_phone, ''), phone),
        address = COALESCE(nullif(p_address, ''), address)
    WHERE id = p_tenant_id;

    -- Update Tenant Master Password if provided
    IF p_tenant_password IS NOT NULL AND p_tenant_password != '' THEN
        UPDATE tenants
        SET password = crypt(p_tenant_password, gen_salt('bf'))
        WHERE id = p_tenant_id;
    END IF;

    -- Check if owner exists
    SELECT id INTO v_employee_id 
    FROM employees 
    WHERE tenant_id = p_tenant_id AND role = 'owner' 
    ORDER BY created_at ASC 
    LIMIT 1;
    
    -- Hash PIN using pgcrypto
    v_pin_hash := crypt(p_owner_pin, gen_salt('bf'));

    IF v_employee_id IS NULL THEN
        INSERT INTO employees (tenant_id, first_name, last_name, position, role, pin_hash, status, is_online)
        VALUES (
            p_tenant_id, 
            split_part(p_owner_name, ' ', 1), 
            COALESCE(nullif(split_part(p_owner_name, ' ', 2), ''), 'Yönetici'),
            'İşletme Sahibi', 
            'owner', 
            v_pin_hash,
            'active',
            false
        ) RETURNING id INTO v_employee_id;
    ELSE
        UPDATE employees
        SET pin_hash = v_pin_hash,
            first_name = split_part(p_owner_name, ' ', 1),
            last_name = COALESCE(nullif(split_part(p_owner_name, ' ', 2), ''), 'Yönetici')
        WHERE id = v_employee_id;
    END IF;

    -- Audit log
    INSERT INTO audit_logs (tenant_id, event_type, description)
    VALUES (p_tenant_id, 'SETUP_INITIAL_COMPLETED', 'İşletme ve yönetici hesap bilgileri oluşturuldu.');

    RETURN v_employee_id;
END;
$$;

GRANT EXECUTE ON FUNCTION complete_tenant_initial_setup(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;

-- 3. Create RPC to update module setup status
CREATE OR REPLACE FUNCTION set_tenant_module_setup(
    p_tenant_id UUID,
    p_employee_id UUID,
    p_module_name TEXT,
    p_is_completed BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_features JSONB;
BEGIN
    -- Owner Auth Check
    IF NOT EXISTS (SELECT 1 FROM employees WHERE id = p_employee_id AND tenant_id = p_tenant_id AND role = 'owner') THEN
        RAISE EXCEPTION 'Yetkisiz işlem: Bu işlem için owner yetkisi gereklidir.';
    END IF;

    -- Get current features to validate if module exists
    SELECT features INTO v_features FROM tenants WHERE id = p_tenant_id;
    
    -- Validate module exists and is active in features
    IF NOT (v_features ? p_module_name AND (v_features->>p_module_name)::boolean = true) THEN
        RAISE EXCEPTION 'Bu modül lisansınız kapsamında bulunmamaktadır: %', p_module_name;
    END IF;

    UPDATE tenants
    SET module_setup = jsonb_set(
        COALESCE(module_setup, '{}'::jsonb),
        ARRAY[p_module_name],
        to_jsonb(p_is_completed)
    )
    WHERE id = p_tenant_id;
    
    -- Audit log
    INSERT INTO audit_logs (tenant_id, event_type, description)
    VALUES (p_tenant_id, 'SETUP_MODULE_COMPLETED', p_module_name || ' modülünün kurulumu tamamlandı.');

    RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION set_tenant_module_setup(UUID, UUID, TEXT, BOOLEAN) TO anon, authenticated;

-- 4. Create RPC to mark final setup as completed
CREATE OR REPLACE FUNCTION complete_setup_wizard(
    p_tenant_id UUID,
    p_employee_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_features JSONB;
    v_module_setup JSONB;
    v_key TEXT;
    v_val JSONB;
BEGIN
    -- Owner Auth Check
    IF NOT EXISTS (SELECT 1 FROM employees WHERE id = p_employee_id AND tenant_id = p_tenant_id AND role = 'owner') THEN
        RAISE EXCEPTION 'Yetkisiz işlem: Bu işlem için owner yetkisi gereklidir.';
    END IF;

    SELECT features, module_setup INTO v_features, v_module_setup FROM tenants WHERE id = p_tenant_id;
    
    -- Validate all active features have been setup
    FOR v_key, v_val IN SELECT * FROM jsonb_each(v_features)
    LOOP
        IF (v_val::text = 'true') AND (v_module_setup->>v_key)::boolean IS NOT true THEN
            RAISE EXCEPTION 'Kurulum eksik. Tamamlanmayan adım: %', v_key;
        END IF;
    END LOOP;

    UPDATE tenants
    SET setup_completed = true
    WHERE id = p_tenant_id;
    
    -- Audit log
    INSERT INTO audit_logs (tenant_id, event_type, description)
    VALUES (p_tenant_id, 'SETUP_FULLY_COMPLETED', 'Tüm modüllerin kurulumu başarıyla tamamlandı ve sistem canlıya alındı.');

    RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION complete_setup_wizard(UUID, UUID) TO anon, authenticated;
