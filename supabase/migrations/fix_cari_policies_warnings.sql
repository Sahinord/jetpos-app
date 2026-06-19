-- ==============================================================================
-- JETPOS GÜVENLİK VE PERFORMANS YAMASI (Cari Hesaplar Temizliği)
-- ==============================================================================

-- 1. CARI HESAPLAR
DROP POLICY IF EXISTS "Tenant isolation for cari_hesaplar" ON public.cari_hesaplar;
DROP POLICY IF EXISTS "cari_hesaplar_all_access" ON public.cari_hesaplar;
DROP POLICY IF EXISTS "cari_hesaplar_tenant_isolation" ON public.cari_hesaplar;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.cari_hesaplar;

CREATE POLICY "Tenant Isolation Policy" ON public.cari_hesaplar FOR ALL TO public
USING (tenant_id::text = (SELECT current_setting('app.current_tenant_id', true)))
WITH CHECK (tenant_id::text = (SELECT current_setting('app.current_tenant_id', true)));


-- 2. CARI HAREKETLER
DROP POLICY IF EXISTS "Tenant isolation for cari_hareketler" ON public.cari_hareketler;
DROP POLICY IF EXISTS "cari_hareketler_all_access" ON public.cari_hareketler;
DROP POLICY IF EXISTS "cari_hareketler_tenant_isolation" ON public.cari_hareketler;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.cari_hareketler;

CREATE POLICY "Tenant Isolation Policy" ON public.cari_hareketler FOR ALL TO public
USING (tenant_id::text = (SELECT current_setting('app.current_tenant_id', true)))
WITH CHECK (tenant_id::text = (SELECT current_setting('app.current_tenant_id', true)));


-- İşlem tamamlandı mesajı
SELECT 'Cari tablolarındaki çakışan kurallar başarıyla temizlendi ve optimize edildi!' as sonuc;
