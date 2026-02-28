
-- Trendyol GO Siparişleri için RLS politikalarını güncelle
ALTER TABLE public.trendyol_go_orders ENABLE ROW LEVEL SECURITY;

-- Mevcut politikaları temizle (varsa)
DROP POLICY IF EXISTS "Users can view their own tenant's trendyol orders" ON public.trendyol_go_orders;
DROP POLICY IF EXISTS "Service role can do everything" ON public.trendyol_go_orders;

-- Yeni politikalar
CREATE POLICY "Users can view their own tenant's trendyol orders"
ON public.trendyol_go_orders
FOR SELECT
TO authenticated
USING (tenant_id::text = (auth.jwt() ->> 'tenant_id')::text);

CREATE POLICY "Service role can do everything"
ON public.trendyol_go_orders
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Eğer tenant_id bir UUID ise cast gerekebilir, ama genellikle meta veride string olarak tutulur.
-- Bazı durumlarda anonim erişim gerekebilir (test için)
CREATE POLICY "Allow anon read for trendyol_go_orders (TEMP)"
ON public.trendyol_go_orders
FOR SELECT
TO anon
USING (true);
