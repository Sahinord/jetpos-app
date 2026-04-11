
-- Çalışan Yetkilendirme Sistemi Güncellemesi
-- Tarih: 2026-04-11

-- 1. Employees tablosuna permissions kolonu ekle
ALTER TABLE employees ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{
    "can_access_pos": true,
    "can_access_adisyon": true,
    "can_access_reports": false,
    "can_access_settings": false,
    "can_access_inventory": true,
    "can_access_expenses": false,
    "can_access_crm": false,
    "can_manage_employees": false,
    "can_apply_discount": false,
    "can_delete_sales": false
}'::JSONB;

-- 2. verify_employee_pin fonksiyonunu permissions döndürecek şekilde güncelle
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
                'name', v_employee.first_name || ' ' || v_employee.last_name,
                'position', v_employee.position,
                'permissions', v_employee.permissions
            )
        );
    ELSE
        RETURN json_build_object('success', false, 'message', 'Geçersiz PIN kodu');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
