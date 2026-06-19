-- ==============================================================================
-- JETPOS GÜVENLİK YAMASI (Fonksiyonlar ve Storage İzinleri)
-- ==============================================================================
-- Bu script:
-- 1. Tüm Security Definer fonksiyonlara güvenli "search_path" ekler.
-- 2. Dışarıya açık olmaması gereken fonksiyonları PUBLIC (anonim) erişiminden çıkarıp
--    sadece giriş yapmış (authenticated) kullanıcılara özel hale getirir.
-- 3. Login, Kayıt vb. zorunlu fonksiyonları dışarıya açık bırakır.

DO $$ 
DECLARE
    f_record RECORD;
    -- Anonim (giriş yapmamış) kullanıcıların erişmesi ŞART olan fonksiyonlar:
    public_functions TEXT[] := ARRAY[
        'login_user_v1', 
        'register_tenant', 
        'reset_tenant_password', 
        'verify_tenant_password', 
        'check_tenant_access',
        'complete_tenant_initial_setup',
        'find_tenant_by_license'
    ];
BEGIN
    -- Public şemasındaki tüm SECURITY DEFINER fonksiyonları bul
    FOR f_record IN 
        SELECT p.proname, pg_get_function_identity_arguments(p.oid) as args, p.prosecdef
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
    LOOP
        -- 1. ADIM: Güvenli search_path ekle (Supabase'in en çok uyarı verdiği konu)
        IF f_record.prosecdef THEN
            EXECUTE format('ALTER FUNCTION public.%I(%s) SET search_path = public', f_record.proname, f_record.args);
        END IF;

        -- 2. ADIM: Sadece yetkili kullanıcıların erişmesi gerekenleri kısıtla
        -- Eğer fonksiyon bizim "public_functions" beyaz listemizde YOKSA:
        IF NOT (f_record.proname = ANY(public_functions)) THEN
            -- Anonim erişimi tamamen kapat
            EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM PUBLIC', f_record.proname, f_record.args);
            EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM anon', f_record.proname, f_record.args);
            
            -- Sadece sisteme giriş yapmış kullanıcılara izin ver
            EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I(%s) TO authenticated', f_record.proname, f_record.args);
            EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I(%s) TO service_role', f_record.proname, f_record.args);
        END IF;
    END LOOP;
END $$;

-- İşlem tamamlandı mesajı
SELECT 'Fonksiyon izinleri başarıyla güncellendi ve kilitlendi!' as sonuc;
