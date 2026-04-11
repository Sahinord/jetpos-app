
-- RLS Hatası İçin Nihai ve Agresif Çözüm
-- Tarih: 2026-04-11

-- 1. Önce eski tüm çelişkili politikaları temizle
DROP POLICY IF EXISTS tenant_isolation_employees ON employees;
DROP POLICY IF EXISTS "SuperAdmin Manage All Employees" ON employees;

-- 2. Güvenli Admin Kontrol Fonksiyonu (Daha sağlam hale getirildi)
CREATE OR REPLACE FUNCTION is_super_admin_v2() 
RETURNS BOOLEAN AS $$
DECLARE
    v_admin_id UUID;
    v_current_id_text TEXT;
BEGIN
    SELECT id INTO v_admin_id FROM tenants WHERE license_key = 'ADM257SA67' LIMIT 1;
    v_current_id_text := current_setting('app.current_tenant_id', true);
    
    RETURN v_current_id_text = v_admin_id::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Employees için TEK ve TAM YETKİLİ politika
-- Hem SELECT (USING), hem INSERT/UPDATE (WITH CHECK) için geçerli
CREATE POLICY "Unified Employee Access Control" 
ON employees 
FOR ALL 
USING (
    is_super_admin_v2() 
    OR 
    tenant_id::text = current_setting('app.current_tenant_id', true)
)
WITH CHECK (
    is_super_admin_v2() 
    OR 
    tenant_id::text = current_setting('app.current_tenant_id', true)
);

-- 4. Tenants için de aynısını yapalım (Gerekli olabilir)
DROP POLICY IF EXISTS "SuperAdmin Manage All Tenants" ON tenants;
DROP POLICY IF EXISTS "tenant_isolation_select" ON tenants;
DROP POLICY IF EXISTS "tenant_isolation_update" ON tenants;

CREATE POLICY "Unified Tenant Access Control" 
ON tenants 
FOR ALL 
USING (
    is_super_admin_v2() 
    OR 
    id::text = current_setting('app.current_tenant_id', true)
)
WITH CHECK (
    is_super_admin_v2() 
    OR 
    id::text = current_setting('app.current_tenant_id', true)
);

-- 5. Public read izni (Lisans doğrulama aşamasında lazım)
-- Sadece SELECT için çok kısıtlı bir izin
CREATE POLICY "Tenant Public Read for Auth" 
ON tenants 
FOR SELECT 
USING (status = 'active');
