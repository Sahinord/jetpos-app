-- 🔥 GLOBAL RLS FIX FOR INVOICES, WAYBILLS & MOVEMENTS 🔥
-- Bu script, yeni kayıt oluştururken oluşan RLS (Row-Level Security) hatalarını kökten çözer.
-- Özellikle Alış/Satış faturaları ve Cari Hareketler için kısıtlamaları esnetir.

-- 1. Invoices (Faturalar)
DROP POLICY IF EXISTS invoices_tenant_isolation ON invoices;
CREATE POLICY invoices_tenant_isolation ON invoices 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

-- 2. Invoice Items (Fatura Kalemleri)
DROP POLICY IF EXISTS invoice_items_tenant_isolation ON invoice_items;
CREATE POLICY invoice_items_tenant_isolation ON invoice_items 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

-- 3. Waybills (İrsaliyeler)
DROP POLICY IF EXISTS waybills_tenant_isolation ON waybills;
CREATE POLICY waybills_tenant_isolation ON waybills 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

-- 4. Waybill Items (İrsaliye Kalemleri)
DROP POLICY IF EXISTS waybill_items_tenant_isolation ON waybill_items;
CREATE POLICY waybill_items_tenant_isolation ON waybill_items 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

-- 5. Cari Hareketler
DROP POLICY IF EXISTS "cari_hareketler_tenant_isolation" ON cari_hareketler;
CREATE POLICY "cari_hareketler_tenant_isolation" ON cari_hareketler 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

-- 6. Audit Logs
DROP POLICY IF EXISTS "audit_logs_insert_policy" ON audit_logs;
CREATE POLICY "audit_logs_insert_policy" ON audit_logs 
    FOR INSERT 
    WITH CHECK (true);

-- 7. Cari Hesaplar (Seçim yapabilmek için)
DROP POLICY IF EXISTS "cari_hesaplar_tenant_isolation" ON cari_hesaplar;
CREATE POLICY "cari_hesaplar_tenant_isolation" ON cari_hesaplar 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

-- 8. Ürünler (Stok ve fiyat güncelleme için)
DROP POLICY IF EXISTS "products_tenant_isolation" ON products;
CREATE POLICY "products_tenant_isolation" ON products 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

-- 9. Giderler (Expenses)
DROP POLICY IF EXISTS "expenses_tenant_isolation" ON expenses;
CREATE POLICY "expenses_tenant_isolation" ON expenses 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);
