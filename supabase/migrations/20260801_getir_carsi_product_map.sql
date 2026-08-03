-- ═══════════════════════════════════════════════════════════════════
--  Getir Çarşı — Ürün Eşleme (JetPos ürünü ↔ Getir getirId)
--  Stok/Fiyat senkronu (/v1/products/price-and-quantity) getirId ile yapılır.
--  Manuel uygulanır: Supabase Dashboard > SQL Editor.
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.getir_carsi_product_map (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    getir_id text NOT NULL,                 -- Getir ürün kimliği (bireysel işletme: getirId)
    max_cell_count integer,                 -- sepette max satış adedi (opsiyonel; 0 gönderilmez)
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT getir_carsi_map_unique UNIQUE (tenant_id, product_id),
    CONSTRAINT getir_carsi_map_getir_unique UNIQUE (tenant_id, getir_id)
);
CREATE INDEX IF NOT EXISTS idx_getir_carsi_map_tenant ON public.getir_carsi_product_map(tenant_id);

ALTER TABLE public.getir_carsi_product_map ENABLE ROW LEVEL SECURITY;

-- Tenant yalnızca kendi eşlemesini okur/yazar (app.current_tenant_id — proje standardı,
-- cari_* kalıbı: FOR ALL için hem USING hem WITH CHECK).
DROP POLICY IF EXISTS getir_carsi_map_tenant_all ON public.getir_carsi_product_map;
CREATE POLICY getir_carsi_map_tenant_all ON public.getir_carsi_product_map
    FOR ALL
    USING (tenant_id::text = current_setting('app.current_tenant_id', true))
    WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

COMMENT ON TABLE public.getir_carsi_product_map IS 'JetPos ürünü ↔ Getir Çarşı getirId eşlemesi; stok/fiyat senkronu için';
