
-- Faturalar tablosuna yeni alanlar ekle
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS pdf_url TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS service_oid TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS external_id TEXT; -- Platform ID (Trendyol Order ID vb.)

-- RLS hatası almamak için policy'yi güncelle (zaten varsa dokunma ama garanti olsun)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'invoices' AND policyname = 'invoices_tenant_isolation'
    ) THEN
        ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
        CREATE POLICY invoices_tenant_isolation ON invoices
            FOR ALL
            USING (tenant_id::text = current_setting('app.current_tenant_id', true))
            WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));
    END IF;
END $$;
