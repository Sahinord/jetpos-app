-- ==============================================================================
-- JETPOS GÜVENLİK VE RLS İYİLEŞTİRME YAMASI (SECURE TENANT ISOLATION V2)
-- ==============================================================================
-- PostgREST stateless (durumsuz) yapısından ve connection pooling (bağlantı havuzu)
-- kararsızlığından dolayı "app.current_tenant_id" GUC değişkenine dayalı RLS
-- politikaları verilerin kaybolmasına ve yetki hatalarına yol açmaktadır.
--
-- Bu betik, RLS politikalarını her HTTP isteğinde taşınan "x-tenant-id" ve
-- "x-license-key" başlıkları ile doğrular.
--
-- GÜVENLİK GÜNCELLEMELERİ (V2):
--   1. is_super_admin Kolonu: Hardcoded admin lisansı politikadan kaldırıldı.
--      tenants tablosuna is_super_admin kolonu eklendi ve kontrol buna bağlandı.
--   2. Sızıntısız Tenant İzolasyonu: x-license-key ve x-tenant-id eşleşmesi 
--      veritabanı düzeyinde zorunlu tutularak tenant'lar arası erişim engellendi.
-- ==============================================================================

-- 1. Tenants tablosuna is_super_admin kolonu ekle ve admin lisansını işaretle
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false;

-- Mevcut admin lisansını super admin olarak güncelle
UPDATE tenants 
SET is_super_admin = true 
WHERE license_key = 'ADM257SA67';

DO $$ 
DECLARE
    t_name TEXT;
    has_tenant_id BOOLEAN;
    tables_to_fix TEXT[] := ARRAY[
        'support_tickets', 'notifications', 'cari_gruplar', 'cari_ozel_kodlar', 
        'invoice_payments', 'cari_ilgililer', 'trendyol_go_orders', 'integration_settings', 
        'cari_bankalar', 'cari_adresler', 'demo_requests', 'about_content', 
        'audit_logs', 'blog_posts', 'tenant_devices', 'bankalar', 'banka_hareketleri', 
        'products', 'categories', 'product_change_logs', 'tenant_permissions', 
        'external_mappings', 'shifts', 'employee_sales', 'tenant_groups', 'expenses', 
        'inventory_counts', 'licenses', 'warehouse_transfers', 'qr_menu_settings', 
        'warehouses', 'warehouse_stock', 'table_orders', 'restaurant_tables', 
        'tenant_invoices', 'financial_calendar_events', 'loyalty_settings', 
        'loyalty_points', 'employees', 'sales', 'cari_hesaplar', 'cari_hareketler',
        'kasa_fisleri', 'kasa_fis_satirlari', 'kasa_hareketleri', 'faturalar',
        'fatura_satirlari', 'irsaliyeler', 'irsaliye_satirlari', 'siparisler',
        'siparis_satirlari', 'stok_hareketleri', 'banka_fisleri', 'banka_fis_satirlari',
        'kredi_kartlari', 'pos_cihazlari', 'taksitler', 'cek_senetler'
    ];
    p_record RECORD;
BEGIN
    FOREACH t_name IN ARRAY tables_to_fix
    LOOP
        IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = t_name) THEN
            CONTINUE;
        END IF;

        -- Sadece bu scriptin yönettiği ve çakışan politikaları temizle
        FOR p_record IN 
            SELECT policyname FROM pg_policies 
            WHERE schemaname = 'public' 
              AND tablename = t_name 
              AND policyname IN ('Tenant Isolation Policy', 'Unified Employee Access Control', 'Unified Tenant Access Control')
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p_record.policyname, t_name);
        END LOOP;

        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = t_name AND column_name = 'tenant_id'
        ) INTO has_tenant_id;

        -- Güvenli, sızıntısız ve kararlı RLS politikasını kur
        IF has_tenant_id THEN
            EXECUTE 'CREATE POLICY "Tenant Isolation Policy" ON public.' || quote_ident(t_name) || ' 
                     FOR ALL TO public 
                     USING (
                         (
                             tenant_id::text = COALESCE(current_setting(''request.headers'', true)::json->>''x-tenant-id'', '''')
                             AND EXISTS (
                                 SELECT 1 FROM tenants 
                                 WHERE id::text = COALESCE(current_setting(''request.headers'', true)::json->>''x-tenant-id'', '''')
                                   AND license_key = COALESCE(current_setting(''request.headers'', true)::json->>''x-license-key'', '''')
                                   AND status = ''active''
                             )
                         )
                         OR
                         EXISTS (
                             SELECT 1 FROM tenants 
                             WHERE license_key = COALESCE(current_setting(''request.headers'', true)::json->>''x-license-key'', '''')
                               AND is_super_admin = true
                               AND status = ''active''
                         )
                     ) 
                     WITH CHECK (
                         (
                             tenant_id::text = COALESCE(current_setting(''request.headers'', true)::json->>''x-tenant-id'', '''')
                             AND EXISTS (
                                 SELECT 1 FROM tenants 
                                 WHERE id::text = COALESCE(current_setting(''request.headers'', true)::json->>''x-tenant-id'', '''')
                                   AND license_key = COALESCE(current_setting(''request.headers'', true)::json->>''x-license-key'', '''')
                                   AND status = ''active''
                             )
                         )
                         OR
                         EXISTS (
                             SELECT 1 FROM tenants 
                             WHERE license_key = COALESCE(current_setting(''request.headers'', true)::json->>''x-license-key'', '''')
                               AND is_super_admin = true
                               AND status = ''active''
                         )
                     );';
            RAISE NOTICE 'Tablo RLS politikası güncellendi: %', t_name;
        ELSE
            EXECUTE format('DROP POLICY IF EXISTS "Auth Only Policy" ON public.%I', t_name);
            EXECUTE 'CREATE POLICY "Auth Only Policy" ON public.' || quote_ident(t_name) || ' 
                     FOR ALL TO authenticated 
                     USING (true) 
                     WITH CHECK (true);';
        END IF;
    END LOOP;
END $$;
