-- ============================================================================
-- 20260906_lock_licenses.sql
-- KRİTİK GÜVENLİK DÜZELTMESİ — licenses tablosunu anon erişimine kapat.
--
-- SORUN: licenses tablosunda anon + authenticated rollerine TAM yetki (SELECT/
-- INSERT/UPDATE/DELETE/TRUNCATE) verilmiş ve RLS politikası FOR ALL USING(true).
-- Tablo password, master_pin, openrouter_api_key, is_super_admin, license_key
-- gibi hassas alanlar içeriyor. Yani public anon anahtarını (tarayıcı bundle'ında)
-- bilen HERKES tüm müşterilerin şifrelerini/anahtarlarını okuyabiliyor, kendini
-- süper admin yapabiliyor, tabloyu silebiliyordu.
--
-- GÜVENLİ Mİ? Evet. Login akışı licenses'ı KULLANMIYOR — find_tenant_by_license /
-- validate_license / verify_tenant_password RPC'leri SECURITY DEFINER olup
-- tenants tablosunu okuyor. licenses'a yalnızca artık RENDER EDİLMEYEN eski
-- AdminPortal.tsx anon ile erişiyordu. SuperAdmin paneli service-role admin
-- route'larını (/api/admin/*) kullanıyor; service_role RLS'i ve REVOKE'u bypass
-- eder, dolayısıyla panel çalışmaya devam eder.
--
-- UYGULAMA: Supabase Dashboard → SQL Editor (proje grlwmcuxobbgubphovhd) → çalıştır.
-- ============================================================================

ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

-- 1) Açık RLS politikalarını kaldır (isimler geçmiş migration'lardan)
DROP POLICY IF EXISTS "Manage licenses policy"                 ON public.licenses;
DROP POLICY IF EXISTS "Public can manage licenses"             ON public.licenses;
DROP POLICY IF EXISTS "Public can check licenses"              ON public.licenses;
DROP POLICY IF EXISTS "Public can update licenses for activation" ON public.licenses;
DROP POLICY IF EXISTS "Admin can manage all licenses"          ON public.licenses;

-- 1b) Güvenlik ağı: tablo üzerinde anon/authenticated'a AİT KALAN her politikayı düşür.
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'licenses'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.licenses', pol.policyname);
  END LOOP;
END $$;
-- Artık licenses'ta HİÇBİR politika yok → RLS default-deny (anon/authenticated okuyamaz/yazamaz).

-- 2) Tablo düzeyi GRANT'ları da geri al (RLS ve GRANT ayrı katmanlar).
REVOKE ALL ON public.licenses FROM anon;
REVOKE ALL ON public.licenses FROM authenticated;

-- service_role'a dokunmuyoruz — admin route'lar ve SECURITY DEFINER fonksiyonlar
-- bu REVOKE'tan etkilenmez.

-- 3) Doğrulama (çalıştırınca boş/deny dönmeli):
-- SELECT * FROM pg_policies WHERE tablename='licenses';           -- 0 satır beklenir
-- SELECT grantee, privilege_type FROM information_schema.role_table_grants
--   WHERE table_name='licenses' AND grantee IN ('anon','authenticated'); -- 0 satır beklenir
