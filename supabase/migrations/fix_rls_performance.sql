-- ==============================================================================
-- JETPOS PERFORMANS GÜNCELLEMESİ (Supabase RLS Performance Fix)
-- ==============================================================================
-- Supabase Uyarısı: "Tenant Isolation Policy re-evaluates current_setting() for each row"
-- Çözüm: current_setting() fonksiyonunu (select current_setting()) içine alarak 
-- PostgreSQL'in bunu her satır yerine sorgu başında sadece 1 kez çalıştırmasını sağlamak.
-- Bu, büyük verilerde inanılmaz bir hız (performans) artışı sağlar.

-- 1. SALES Tablosu
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.sales;
DROP POLICY IF EXISTS "sales_isolation" ON public.sales;
CREATE POLICY "Tenant Isolation Policy" ON public.sales
FOR ALL TO public
USING (tenant_id::text = (select current_setting('app.current_tenant_id', true)))
WITH CHECK (tenant_id::text = (select current_setting('app.current_tenant_id', true)));

-- 2. SALE_ITEMS Tablosu
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.sale_items;
DROP POLICY IF EXISTS "sale_items_isolation" ON public.sale_items;
CREATE POLICY "Tenant Isolation Policy" ON public.sale_items
FOR ALL TO public
USING (
  sale_id IN (
    SELECT id FROM sales 
    WHERE tenant_id::text = (select current_setting('app.current_tenant_id', true))
  )
);

-- 3. PRODUCTS Tablosu
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.products;
DROP POLICY IF EXISTS "product_isolation" ON public.products;
CREATE POLICY "Tenant Isolation Policy" ON public.products
FOR ALL TO public
USING (tenant_id::text = (select current_setting('app.current_tenant_id', true)))
WITH CHECK (tenant_id::text = (select current_setting('app.current_tenant_id', true)));

-- 4. CATEGORIES Tablosu
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.categories;
DROP POLICY IF EXISTS "category_isolation" ON public.categories;
CREATE POLICY "Tenant Isolation Policy" ON public.categories
FOR ALL TO public
USING (tenant_id::text = (select current_setting('app.current_tenant_id', true)))
WITH CHECK (tenant_id::text = (select current_setting('app.current_tenant_id', true)));

-- 5. TENANTS Tablosu (Sadece UPDATE ve SELECT)
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.tenants;
DROP POLICY IF EXISTS "tenant_isolation_select" ON public.tenants;
DROP POLICY IF EXISTS "tenant_isolation_update" ON public.tenants;

CREATE POLICY "Tenant Isolation Policy Select" ON public.tenants
FOR SELECT TO public
USING (
  id::text = (select current_setting('app.current_tenant_id', true))
  OR status = 'active'
);

CREATE POLICY "Tenant Isolation Policy Update" ON public.tenants
FOR UPDATE TO public
USING (id::text = (select current_setting('app.current_tenant_id', true)));
