-- ==============================================================================
-- JETPOS GÜVENLİK VE PERFORMANS YAMASI (Özel Durumlu "Items" Tabloları)
-- ==============================================================================

DO $$ 
DECLARE
    p_record RECORD;
BEGIN
    -- 1. SALE_ITEMS (Özel JOIN mantığı gerektirir)
    FOR p_record IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'sale_items'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.sale_items', p_record.policyname);
    END LOOP;
    
    CREATE POLICY "Tenant Isolation Policy" ON public.sale_items FOR ALL TO public
    USING (sale_id IN (SELECT id FROM sales WHERE tenant_id::text = (SELECT current_setting('app.current_tenant_id', true))));


    -- 2. TENANTS (tenant_id yerine id kullanır)
    FOR p_record IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tenants'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.tenants', p_record.policyname);
    END LOOP;

    CREATE POLICY "Tenant Isolation Policy Select" ON public.tenants FOR SELECT TO public
    USING (id::text = (SELECT current_setting('app.current_tenant_id', true)) OR status = 'active');
    
    CREATE POLICY "Tenant Isolation Policy Update" ON public.tenants FOR UPDATE TO public
    USING (id::text = (SELECT current_setting('app.current_tenant_id', true)));


    -- 3. INVENTORY_COUNT_ITEMS
    FOR p_record IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'inventory_count_items'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.inventory_count_items', p_record.policyname);
    END LOOP;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inventory_count_items' AND column_name = 'tenant_id') THEN
        CREATE POLICY "Tenant Isolation Policy" ON public.inventory_count_items FOR ALL TO public
        USING (tenant_id::text = (SELECT current_setting('app.current_tenant_id', true)))
        WITH CHECK (tenant_id::text = (SELECT current_setting('app.current_tenant_id', true)));
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inventory_count_items' AND column_name = 'count_id') THEN
        CREATE POLICY "Tenant Isolation Policy" ON public.inventory_count_items FOR ALL TO public
        USING (count_id IN (SELECT id FROM inventory_counts WHERE tenant_id::text = (SELECT current_setting('app.current_tenant_id', true))));
    ELSE
        CREATE POLICY "Auth Only Policy" ON public.inventory_count_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;


    -- 4. WAREHOUSE_TRANSFER_ITEMS
    FOR p_record IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'warehouse_transfer_items'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.warehouse_transfer_items', p_record.policyname);
    END LOOP;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'warehouse_transfer_items' AND column_name = 'tenant_id') THEN
        CREATE POLICY "Tenant Isolation Policy" ON public.warehouse_transfer_items FOR ALL TO public
        USING (tenant_id::text = (SELECT current_setting('app.current_tenant_id', true)))
        WITH CHECK (tenant_id::text = (SELECT current_setting('app.current_tenant_id', true)));
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'warehouse_transfer_items' AND column_name = 'transfer_id') THEN
        CREATE POLICY "Tenant Isolation Policy" ON public.warehouse_transfer_items FOR ALL TO public
        USING (transfer_id IN (SELECT id FROM warehouse_transfers WHERE tenant_id::text = (SELECT current_setting('app.current_tenant_id', true))));
    ELSE
        CREATE POLICY "Auth Only Policy" ON public.warehouse_transfer_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;

END $$;

-- İşlem tamamlandı mesajı
SELECT 'Özel Items tabloları başarıyla temizlendi ve kilitlendi!' as sonuc;
