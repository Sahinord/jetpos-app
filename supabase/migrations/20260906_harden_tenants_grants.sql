-- ============================================================================
-- 20260906_harden_tenants_grants.sql
-- tenants tablosu — GÜVENLİ ilk sertleştirme (uygulamayı bozmaz).
--
-- DURUM: anon + authenticated rollerine tenants'ta TAM yetki verilmiş
-- (SELECT/INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER). tenants; password,
-- master_pin, openrouter_api_key, is_super_admin içeriyor.
--
-- Bu migration YALNIZCA uygulamanın HİÇ kullanmadığı yıkıcı izinleri geri alır:
--   • TRUNCATE  → anon tabloyu komple boşaltamasın
--   • INSERT    → yeni tenant açma yalnızca admin (service-role /api/admin/create-tenant)
--                 ve register_tenant RPC'si (SECURITY DEFINER) üzerinden olur
--   • DELETE    → tenant silme yalnızca service-role /api/admin/delete-tenant üzerinden
--   • REFERENCES/TRIGGER → PostgREST istemcisinin hiç ihtiyacı olmayan izinler
--
-- SELECT ve UPDATE BİLEREK BIRAKILIYOR — normal uygulama (TenantProfile logo,
-- etiket şablonu ayarları vb.) ve mevcut SuperAdmin paneli bunları anon ile
-- kullanıyor. Bunları kısıtlamak = 2. AŞAMA (SuperAdmin'i service-role route'lara
-- taşıdıktan sonra). Bkz. aşağıdaki NOT.
-- ============================================================================

REVOKE INSERT, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.tenants FROM anon;
REVOKE INSERT, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.tenants FROM authenticated;

-- Doğrulama (çalıştırınca yalnızca SELECT, UPDATE kalmalı):
-- SELECT grantee, privilege_type FROM information_schema.role_table_grants
--   WHERE table_name='tenants' AND grantee IN ('anon','authenticated')
--   ORDER BY grantee, privilege_type;

-- ============================================================================
-- ⚠️ 2. AŞAMA (bu migration'DA YOK — ayrıca yapılacak):
-- Şu an anon hâlâ tenants'ta TÜM satırları OKUYABİLİYOR (password/master_pin/
-- openrouter_api_key dahil) çünkü SuperAdmin paneli anon ile select('*') yapıp
-- tüm müşterileri listeliyor. Okumayı "kendi tenant'ın" ile sınırlamadan önce
-- SuperAdmin'in şu işlemleri SERVICE-ROLE admin route'una taşınmalı:
--   • Tüm tenant listesi (SuperAdmin.tsx:240 select('*'))
--   • Başka tenant'ın ayar/anahtar güncellemeleri (:564, :634, :681, :729, :906, :953)
-- Taşındıktan sonra tenants RLS'i şu şekilde daraltılacak (cari_* deseni):
--   SELECT/UPDATE  USING (id = current_setting('app.current_tenant_id', true)::uuid)
-- Böylece her tenant yalnızca kendini görür; süper admin işlemleri service-role'dan gider.
-- ============================================================================
