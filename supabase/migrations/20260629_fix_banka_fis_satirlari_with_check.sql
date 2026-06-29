-- GUVENLIK_VE_TEST_PLANI.md Faz 1, madde 2 icin somut fix.
--
-- fix_supabase_warnings_final.sql, banka_fis_satirlari'ya su policy'yi koymustu:
--   FOR ALL USING (fis_id IN (SELECT id FROM banka_fisleri WHERE tenant_id = current_tenant))
-- WITH CHECK YOK. Postgres, WITH CHECK belirtilmemis FOR ALL policy'lerde USING
-- ifadesini WITH CHECK icin de kullanir - yani INSERT/UPDATE tamamen yetkisiz
-- degil, ama tek kontrol fis_id'nin sahibi uzerinden dolayli yapiliyor; satirin
-- KENDI tenant_id kolonu hic dogrulanmiyor. Sonuc: gecerli bir fis_id'ye sahip
-- bir tenant, o satira BASKA bir tenant_id degeri yazabilir (sahte/yanlis
-- tenant_id ile kayit) - bu da bu kolonu .eq('tenant_id', ...) ile okuyan butun
-- diger sorgularda veri kaybolmasina/yanlis atfa yol acar.
--
-- Fix: cari_hesaplar'daki temiz pattern'i mirror'la - satirin kendi tenant_id'sini
-- DOGRUDAN dogrula, fis_id sahiplik kontrolunu de ekstra savunma olarak tut.

DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.banka_fis_satirlari;

CREATE POLICY "Tenant Isolation Policy" ON public.banka_fis_satirlari
FOR ALL TO public
USING (
    tenant_id::text = (SELECT current_setting('app.current_tenant_id', true))
)
WITH CHECK (
    tenant_id::text = (SELECT current_setting('app.current_tenant_id', true))
    AND fis_id IN (
        SELECT id FROM banka_fisleri
        WHERE tenant_id::text = (SELECT current_setting('app.current_tenant_id', true))
    )
);
