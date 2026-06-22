-- fix_invoice_rls_final.sql, invoice_items / waybills / waybill_items / products
-- tablolarinda RLS politikalarini USING(true) WITH CHECK(true) yaparak tenant
-- izolasyonunu tamamen acmisti. invoices ve cari_hesaplar/cari_hareketler
-- sonradan duzeltildi (20260220_fix_invoices_rls.sql, fix_cari_policies_warnings.sql)
-- ama bu 4 tablo unutuldu. Hiçbirinde tenant_id NULL satir olmadigi
-- check_null_tenant_rows.js ile dogrulandi, bu yuzden NULL escape hatch'ine
-- gerek yok (invoices'taki gibi).

DROP POLICY IF EXISTS invoice_items_tenant_isolation ON invoice_items;
CREATE POLICY invoice_items_tenant_isolation ON invoice_items
    FOR ALL
    USING (tenant_id::text = current_setting('app.current_tenant_id', true))
    WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

DROP POLICY IF EXISTS waybills_tenant_isolation ON waybills;
CREATE POLICY waybills_tenant_isolation ON waybills
    FOR ALL
    USING (tenant_id::text = current_setting('app.current_tenant_id', true))
    WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

DROP POLICY IF EXISTS waybill_items_tenant_isolation ON waybill_items;
CREATE POLICY waybill_items_tenant_isolation ON waybill_items
    FOR ALL
    USING (tenant_id::text = current_setting('app.current_tenant_id', true))
    WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

DROP POLICY IF EXISTS products_tenant_isolation ON products;
CREATE POLICY products_tenant_isolation ON products
    FOR ALL
    USING (tenant_id::text = current_setting('app.current_tenant_id', true))
    WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));
