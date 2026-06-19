-- ==============================================================================
-- JETPOS GÜVENLİK GÜNCELLEMESİ (Supabase RLS Fix)
-- Bu script SADECE RLS (Row-Level Security) kapalı olan, yani dışarıdan erişime 
-- açık unutulmuş tabloları bulur ve otomatik olarak kilitler.
-- ==============================================================================

DO $$ 
DECLARE
    t_record RECORD;
    has_tenant_id BOOLEAN;
BEGIN
    FOR t_record IN 
        -- Sadece public şemasındaki ve RLS Koruması KAPALI (false) olan tabloları bul
        SELECT relname as tablename
        FROM pg_class 
        JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace 
        WHERE nspname = 'public' AND relkind = 'r' AND relrowsecurity = false
    LOOP
        -- 1. Tablo için Güvenliği (RLS) Aktif Et
        EXECUTE 'ALTER TABLE public.' || quote_ident(t_record.tablename) || ' ENABLE ROW LEVEL SECURITY;';
        
        -- 2. Bu tabloda "tenant_id" kolonu var mı kontrol et (Multi-tenant mimarisi için)
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = t_record.tablename AND column_name = 'tenant_id'
        ) INTO has_tenant_id;

        IF has_tenant_id THEN
            -- Tenant ID varsa, JetPos'un standart bayi-izolasyonu kuralını ekle
            EXECUTE 'CREATE POLICY "tenant_isolation_policy_' || t_record.tablename || '" ON public.' || quote_ident(t_record.tablename) || ' 
                     FOR ALL TO public 
                     USING (tenant_id::text = (select current_setting(''app.current_tenant_id'', true))) 
                     WITH CHECK (tenant_id::text = (select current_setting(''app.current_tenant_id'', true)));';
        ELSE
            -- Tenant ID yoksa, sadece Supabase Auth üzerinden sisteme giriş yapmış kullanıcılar görebilsin
            EXECUTE 'CREATE POLICY "auth_only_policy_' || t_record.tablename || '" ON public.' || quote_ident(t_record.tablename) || ' 
                     FOR ALL TO authenticated 
                     USING (true) 
                     WITH CHECK (true);';
        END IF;
        
        RAISE NOTICE 'Güvenlik Aktif Edildi: %', t_record.tablename;
    END LOOP;
END $$;

-- Kontrol Amaçlı: Hala korumasız tablo kaldı mı? (Boş dönmesi lazım)
SELECT relname as "Hala Korumasiz Tablolar"
FROM pg_class 
JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace 
WHERE nspname = 'public' AND relkind = 'r' AND relrowsecurity = false;
