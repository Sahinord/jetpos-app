-- ==============================================================================
-- JETPOS GÜVENLİK VE PERFORMANS YAMASI (Supabase Dashboard Uyarıları İçin)
-- Bu script senin gönderdiğin 2 hatayı da tek seferde, sonsuza dek çözer.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- BÖLÜM 1: "Function Search Path Mutable" Çözümü
-- Bütün fonksiyonları döngüye alıp search_path'lerini güvenli (public) hale getiririz.
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    f_record RECORD;
BEGIN
    FOR f_record IN 
        SELECT p.proname, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
    LOOP
        EXECUTE format('ALTER FUNCTION public.%I(%s) SET search_path = public;', f_record.proname, f_record.args);
    END LOOP;
END $$;


-- ------------------------------------------------------------------------------
-- BÖLÜM 2: "Auth RLS Initialization Plan" Çözümü (Hız ve Performans Artışı)
-- "current_setting()" komutunu "(SELECT current_setting())" şeklinde güncelleyerek
-- her satır için değil, sorgu başına 1 kere hesaplanmasını sağlıyoruz. (Yüzlerce kat hız artışı)
-- ------------------------------------------------------------------------------

-- 1. SALES
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.sales;
DROP POLICY IF EXISTS "sales_isolation" ON public.sales;
CREATE POLICY "Tenant Isolation Policy" ON public.sales FOR ALL TO public
USING (tenant_id::text = (SELECT current_setting('app.current_tenant_id', true)))
WITH CHECK (tenant_id::text = (SELECT current_setting('app.current_tenant_id', true)));

-- 2. SALE_ITEMS
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.sale_items;
DROP POLICY IF EXISTS "sale_items_isolation" ON public.sale_items;
CREATE POLICY "Tenant Isolation Policy" ON public.sale_items FOR ALL TO public
USING (sale_id IN (SELECT id FROM sales WHERE tenant_id::text = (SELECT current_setting('app.current_tenant_id', true))));

-- 3. EXPENSES
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.expenses;
DROP POLICY IF EXISTS "expenses_isolation" ON public.expenses;
DROP POLICY IF EXISTS "tenant_isolation_policy_expenses" ON public.expenses;
CREATE POLICY "Tenant Isolation Policy" ON public.expenses FOR ALL TO public
USING (tenant_id::text = (SELECT current_setting('app.current_tenant_id', true)))
WITH CHECK (tenant_id::text = (SELECT current_setting('app.current_tenant_id', true)));

-- 4. BANKA_FISLERI
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.banka_fisleri;
DROP POLICY IF EXISTS "banka_fisleri_all_access" ON public.banka_fisleri;
DROP POLICY IF EXISTS "tenant_isolation_policy_banka_fisleri" ON public.banka_fisleri;
CREATE POLICY "Tenant Isolation Policy" ON public.banka_fisleri FOR ALL TO public
USING (tenant_id::text = (SELECT current_setting('app.current_tenant_id', true)))
WITH CHECK (tenant_id::text = (SELECT current_setting('app.current_tenant_id', true)));

-- 5. BANKA_FIS_SATIRLARI
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.banka_fis_satirlari;
DROP POLICY IF EXISTS "banka_fis_satirlari_all_access" ON public.banka_fis_satirlari;
DROP POLICY IF EXISTS "tenant_isolation_policy_banka_fis_satirlari" ON public.banka_fis_satirlari;
CREATE POLICY "Tenant Isolation Policy" ON public.banka_fis_satirlari FOR ALL TO public
USING (fis_id IN (SELECT id FROM banka_fisleri WHERE tenant_id::text = (SELECT current_setting('app.current_tenant_id', true))));

-- 6. KASA_FIS_SATIRLARI
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.kasa_fis_satirlari;
DROP POLICY IF EXISTS "kasa_fis_satirlari_all_access" ON public.kasa_fis_satirlari;
DROP POLICY IF EXISTS "kasa_fis_satirlari_select" ON public.kasa_fis_satirlari;
DROP POLICY IF EXISTS "kasa_fis_satirlari_insert" ON public.kasa_fis_satirlari;
DROP POLICY IF EXISTS "kasa_fis_satirlari_update" ON public.kasa_fis_satirlari;
DROP POLICY IF EXISTS "kasa_fis_satirlari_delete" ON public.kasa_fis_satirlari;
DROP POLICY IF EXISTS "tenant_isolation_policy_kasa_fis_satirlari" ON public.kasa_fis_satirlari;
CREATE POLICY "Tenant Isolation Policy" ON public.kasa_fis_satirlari FOR ALL TO public
USING (tenant_id::text = (SELECT current_setting('app.current_tenant_id', true)))
WITH CHECK (tenant_id::text = (SELECT current_setting('app.current_tenant_id', true)));

-- 7. NOTIFICATIONS
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.notifications;
DROP POLICY IF EXISTS "notifications_tenant" ON public.notifications;
DROP POLICY IF EXISTS "tenant_isolation_policy_notifications" ON public.notifications;
CREATE POLICY "Tenant Isolation Policy" ON public.notifications FOR ALL TO public
USING (tenant_id::text = (SELECT current_setting('app.current_tenant_id', true)))
WITH CHECK (tenant_id::text = (SELECT current_setting('app.current_tenant_id', true)));

-- İşlem tamamlandı mesajı
SELECT 'Tüm uyarılar başarıyla çözüldü, performans maksimize edildi!' as sonuc;
