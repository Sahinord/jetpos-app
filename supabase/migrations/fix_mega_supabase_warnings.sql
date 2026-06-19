-- ==============================================================================
-- JETPOS GÜVENLİK VE PERFORMANS YAMASI (Mega Kapsayıcı Temizlik)
-- ==============================================================================
-- Bu script, bugüne kadar gördüğün ve yeni attığın ekran görüntülerindeki 
-- TÜM tabloları tarar, üzerlerindeki bütün eski/çakışan kuralları siler 
-- ve yerlerine tek bir tane, en hızlı yeni nesil kuralı kurar.

DO $$ 
DECLARE
    t_name TEXT;
    has_tenant_id BOOLEAN;
    -- Şimdiye kadarki tüm tabloların BİRLEŞTİRİLMİŞ ve GENİŞLETİLMİŞ listesi:
    tables_to_fix TEXT[] := ARRAY[
        -- Önceki listemiz
        'support_tickets', 'notifications', 'cari_gruplar', 'cari_ozel_kodlar', 
        'invoice_payments', 'cari_ilgililer', 'trendyol_go_orders', 'integration_settings', 
        'cari_bankalar', 'cari_adresler', 'demo_requests', 'about_content', 
        'audit_logs', 'blog_posts',
        
        -- Yeni gönderdiğin listedeki tablolar
        'tenant_devices', 'bankalar', 'banka_hareketleri', 'products', 
        'categories', 'product_change_logs', 'tenant_permissions', 'external_mappings', 
        'shifts', 'employee_sales', 'tenant_groups', 'expenses', 
        'inventory_counts', 'licenses'
    ];
    p_record RECORD;
BEGIN
    FOREACH t_name IN ARRAY tables_to_fix
    LOOP
        -- Eğer tablo veritabanında yoksa atla (hata vermesin)
        IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = t_name) THEN
            CONTINUE;
        END IF;

        -- 1. ADIM: Tablodaki tüm eski ve çakışan kuralları sil ("Multiple Permissive Policies" hatasını çözer)
        FOR p_record IN 
            SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = t_name
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p_record.policyname, t_name);
        END LOOP;

        -- 2. ADIM: Tabloda tenant_id (bayi id) var mı kontrol et
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = t_name AND column_name = 'tenant_id'
        ) INTO has_tenant_id;

        -- 3. ADIM: Tek bir tane, optimize edilmiş kural kur ("Auth RLS Initialization Plan" hatasını çözer)
        IF has_tenant_id THEN
            EXECUTE 'CREATE POLICY "Tenant Isolation Policy" ON public.' || quote_ident(t_name) || ' 
                     FOR ALL TO public 
                     USING (tenant_id::text = (SELECT current_setting(''app.current_tenant_id'', true))) 
                     WITH CHECK (tenant_id::text = (SELECT current_setting(''app.current_tenant_id'', true)));';
        ELSE
            EXECUTE 'CREATE POLICY "Auth Only Policy" ON public.' || quote_ident(t_name) || ' 
                     FOR ALL TO authenticated 
                     USING (true) 
                     WITH CHECK (true);';
        END IF;
    END LOOP;
END $$;

-- İşlem tamamlandı mesajı
SELECT 'Devasa temizlik başarıyla tamamlandı, tüm yeni tablolar optimize edildi!' as sonuc;
