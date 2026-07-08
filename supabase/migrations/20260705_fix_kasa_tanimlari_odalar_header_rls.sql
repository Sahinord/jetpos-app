-- ==============================================================================
-- KASA_TANIMLARI + ODALAR: HEADER TABANLI RLS'E GEÇİŞ
-- ==============================================================================
-- fix_rls_permissions.sql, tabloların RLS politikalarını her istekte taşınan
-- x-tenant-id / x-license-key header'larına geçirdi; ancak tablo listesinde
-- kasa_tanimlari ve odalar YOKTU. Bu iki tablo, fix_kasa_rls_policies.sql'in
-- kurduğu ve yalnızca "app.current_tenant_id" GUC'sine bakan eski politikalarla
-- kaldı. PostgREST bağlantı havuzunda bu GUC istekler arasında taşınmadığı için
-- REST üzerinden yapılan tüm sorgular BOŞ dönüyor (mobil Kasa İşlemleri sayfası
-- kasa_tanimlari okuyamıyor; desktop Kasa modülünde odalar aynı risk altında).
--
-- Doğrulama: anon key + header'lı istemciyle kasa_tanimlari count=0 dönerken
-- service role count=1 dönüyor (tenant: Kardeşler Kasap).
--
-- Bu betik, fix_rls_permissions.sql'deki "Tenant Isolation Policy" desenini
-- (USING + WITH CHECK, super admin istisnası dahil) aynen uygular.
-- Supabase Dashboard SQL Editor'de manuel çalıştırılmalıdır.
-- ==============================================================================

DO $$
DECLARE
    t_name TEXT;
    tables_to_fix TEXT[] := ARRAY['kasa_tanimlari', 'odalar'];
BEGIN
    FOREACH t_name IN ARRAY tables_to_fix
    LOOP
        IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = t_name) THEN
            CONTINUE;
        END IF;

        -- fix_kasa_rls_policies.sql'in kurduğu GUC tabanlı eski politikaları temizle
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t_name || '_select', t_name);
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t_name || '_insert', t_name);
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t_name || '_update', t_name);
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t_name || '_delete', t_name);
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t_name || '_all_access', t_name);
        EXECUTE format('DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.%I', t_name);

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
        RAISE NOTICE 'Tablo RLS politikası header tabanlı desene geçirildi: %', t_name;
    END LOOP;
END $$;
