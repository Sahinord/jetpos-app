
-- Master PIN ve RLS İyileştirmeleri
-- Tarih: 2026-04-11

-- 1. Tenants tablosuna Master PIN desteği
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS master_pin TEXT;

-- 2. RLS Politikaları için Güvenli Yardımcı Fonksiyon (Recursion'ı önler)
CREATE OR REPLACE FUNCTION is_super_admin() 
RETURNS BOOLEAN AS $$
BEGIN
    -- Security Definer olduğu için RLS'i bypass eder ve sonsuz döngüye girmez
    RETURN current_setting('app.current_tenant_id', true) = (SELECT id FROM tenants WHERE license_key = 'ADM257SA67' LIMIT 1)::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Employees tablosu RLS politikalarını güncelle
DROP POLICY IF EXISTS "SuperAdmin Manage All Employees" ON employees;
CREATE POLICY "SuperAdmin Manage All Employees" 
ON employees 
FOR ALL 
USING (is_super_admin());

-- 4. Tenants tablosu RLS politikalarını güncelle (Recursion Fix)
DROP POLICY IF EXISTS "SuperAdmin Manage All Tenants" ON tenants;
CREATE POLICY "SuperAdmin Manage All Tenants" 
ON tenants 
FOR ALL 
USING (
    -- Kendisi ise her şeyi yapabilir
    (license_key = 'ADM257SA67' AND current_setting('app.current_tenant_id', true) = id::text)
    OR
    -- Diğer durumlarda is_super_admin check
    is_super_admin()
);

-- Master PIN Doğrulama Fonksiyonu (verify_employee_pin içine entegre edelim)
CREATE OR REPLACE FUNCTION verify_employee_pin(p_tenant_id UUID, p_pin_code TEXT)
RETURNS JSON AS $$
DECLARE
    v_employee RECORD;
    v_master_pin TEXT;
    v_features JSONB;
BEGIN
    -- Önce Master PIN kontrolü yap (Eğer özellik açıksa)
    SELECT master_pin, features INTO v_master_pin, v_features FROM tenants WHERE id = p_tenant_id;
    
    IF v_features->>'master_pin_enabled' = 'true' AND v_master_pin IS NOT NULL AND p_pin_code = v_master_pin THEN
        RETURN json_build_object(
            'success', true,
            'is_master', true,
            'employee', json_build_object(
                'id', 'master-patron',
                'first_name', 'Sistem',
                'last_name', 'Patronu',
                'position', 'Patron',
                'permissions', jsonb_build_object(
                    'can_access_pos', true, 'can_access_adisyon', true, 'can_access_reports', true,
                    'can_access_settings', true, 'can_access_inventory', true, 'can_access_expenses', true,
                    'can_access_crm', true, 'can_manage_employees', true, 'can_apply_discount', true,
                    'can_delete_sales', true, 'can_manage_invoices', true
                )
            )
        );
    END IF;

    -- Normal personel kontrolüne devam et
    SELECT * INTO v_employee 
    FROM employees 
    WHERE tenant_id = p_tenant_id 
    AND pin_code = p_pin_code 
    AND status = 'active'
    LIMIT 1;

    IF v_employee.id IS NOT NULL THEN
        RETURN json_build_object(
            'success', true,
            'is_master', false,
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
