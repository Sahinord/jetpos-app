
-- Invoices RLS policy'sini tenant_id null olanları da görecek şekilde güncelle
DROP POLICY IF EXISTS invoices_tenant_isolation ON invoices;

CREATE POLICY invoices_tenant_isolation ON invoices
    FOR ALL
    USING (
        tenant_id::text = current_setting('app.current_tenant_id', true) 
        OR tenant_id IS NULL
    )
    WITH CHECK (
        tenant_id::text = current_setting('app.current_tenant_id', true)
    );

-- Eski (tenant_id null olan) faturaları, eğer varsa mevcut tenanta bağlamak için bir yardımcı fonksiyon veya script 
-- Ama şimdilik sadece görünür yapalım.
