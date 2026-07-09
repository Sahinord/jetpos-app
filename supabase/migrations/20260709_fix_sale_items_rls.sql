-- ═══════════════════════════════════════════════════════════════════
--  sale_items RLS düzeltmesi
--  Manuel uygulanır: Supabase Dashboard > SQL Editor
--
--  SORUN: sale_items üzerindeki "FOR ALL" politikası yalnızca USING içeriyordu,
--  WITH CHECK YOKTU. Üstelik kontrol subquery bazlıydı
--  (sale_id IN (SELECT id FROM sales WHERE tenant_id = ...)). INSERT sırasında
--  bu, "new row violates row-level security policy for table sale_items"
--  hatasına yol açıyordu. (CLAUDE.md'de bahsedilen tekrarlayan bug sınıfı.)
--
--  ÇÖZÜM: Çalışan sales / cari_* deseni. sale_items zaten kendi tenant_id
--  kolonunu taşıyor ve uygulama INSERT'te tenant_id yazıyor (page.tsx). Bu yüzden
--  doğrudan tenant_id kontrolü + WITH CHECK kullanıyoruz.
-- ═══════════════════════════════════════════════════════════════════

-- 1) sale_items üzerindeki TÜM eski/çakışan politikaları temizle
DO $$
DECLARE r record;
BEGIN
    FOR r IN
        SELECT policyname FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'sale_items'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.sale_items', r.policyname);
    END LOOP;
END $$;

-- 2) RLS açık olsun
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

-- 3) Doğru politika (sales/cari_* ile birebir) — USING + WITH CHECK
CREATE POLICY "sale_items_tenant_isolation" ON public.sale_items
    FOR ALL
    TO public
    USING (tenant_id::text = (SELECT current_setting('app.current_tenant_id', true)))
    WITH CHECK (tenant_id::text = (SELECT current_setting('app.current_tenant_id', true)));

COMMENT ON POLICY "sale_items_tenant_isolation" ON public.sale_items IS
    'Tenant izolasyonu: kendi tenant_id kolonu + WITH CHECK (INSERT için gerekli).';
