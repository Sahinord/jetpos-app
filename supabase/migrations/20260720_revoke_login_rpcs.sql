-- ═══════════════════════════════════════════════════════════════════
--  LOGIN RPC'LERİNİN ANON İZNİNİ KAPAT — kaba kuvvet bypass'ını bitirir
--  Manuel uygulanır: Supabase Dashboard > SQL Editor
--
--  ⚠️⚠️ SIRALAMA KRİTİK — BUNU EN SON ÇALIŞTIR ⚠️⚠️
--  Önce ŞUNLAR yayında olmalı, yoksa TÜM GİRİŞLER KIRILIR:
--   1. client dağıtıldı  (LicenseGate + EmployeePinLogin artık /api/auth/license kullanıyor)
--   2. jetpos-mobile dağıtıldı  (mobil LicenseGate artık kendi /api/auth/license'ını kullanıyor)
--   3. Her İKİ Vercel projesinde de SUPABASE_SERVICE_ROLE_KEY env'i tanımlı
--   4. 20260720_login_attempts.sql çalıştırıldı
--
--  NEDEN: /api/auth/license'a hız sınırı koyduk ama RPC'lerin anon EXECUTE
--  izni durdukça saldırgan, paketteki anon anahtarıyla RPC'yi DOĞRUDAN
--  çağırıp sınırı tamamen atlayabilir. Bu dosya o kapıyı kapatır:
--  RPC'ler yalnızca service-role'dan (yani bizim sunucu uçlarımızdan) çağrılabilir.
--
--  GERİ ALMA (bir şey kırılırsa):
--    GRANT EXECUTE ON FUNCTION find_tenant_by_license(text) TO anon;
--    GRANT EXECUTE ON FUNCTION verify_tenant_password(uuid, text) TO anon;
-- ═══════════════════════════════════════════════════════════════════

-- Not: PUBLIC'ten de almak şart — Postgres'te fonksiyonlara varsayılan olarak
-- PUBLIC EXECUTE verilir; sadece anon'dan almak yetmez.
REVOKE EXECUTE ON FUNCTION public.find_tenant_by_license(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.verify_tenant_password(uuid, text) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.find_tenant_by_license(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.verify_tenant_password(uuid, text) TO service_role;

NOTIFY pgrst, 'reload schema';

-- Doğrulama: anon satırı KALMAMALI, service_role satırı olmalı
SELECT p.proname, r.rolname
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
CROSS JOIN LATERAL aclexplode(COALESCE(p.proacl, acldefault('f', p.proowner))) a
JOIN pg_roles r ON r.oid = a.grantee
WHERE n.nspname = 'public'
  AND p.proname IN ('find_tenant_by_license', 'verify_tenant_password')
ORDER BY p.proname, r.rolname;
