-- Cross-Tenant Veri Paylaşım Sistemi
-- JETPOS-ADMIN → JETPOS-KARDESLER-KASAP veri erişimi

-- 1. Tenant Permissions Tablosu (Lisans İzinleri)
CREATE TABLE IF NOT EXISTS public.tenant_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    allowed_tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    can_view_products BOOLEAN DEFAULT true,
    can_view_categories BOOLEAN DEFAULT true,
    can_view_sales BOOLEAN DEFAULT false,
    can_view_stock BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(owner_tenant_id, allowed_tenant_id)
);

-- 2. RLS Politikalarını Güncelle - Products
DROP POLICY IF EXISTS products_cross_tenant_view ON public.products;
CREATE POLICY products_cross_tenant_view ON public.products
    FOR SELECT
    USING (
        tenant_id = current_setting('app.current_tenant_id', true)::uuid
        OR 
        tenant_id IN (
            SELECT owner_tenant_id 
            FROM public.tenant_permissions 
            WHERE allowed_tenant_id = current_setting('app.current_tenant_id', true)::uuid
            AND can_view_products = true
        )
    );

-- 3. RLS Politikalarını Güncelle - Categories
DROP POLICY IF EXISTS categories_cross_tenant_view ON public.categories;
CREATE POLICY categories_cross_tenant_view ON public.categories
    FOR SELECT
    USING (
        tenant_id = current_setting('app.current_tenant_id', true)::uuid
        OR 
        tenant_id IN (
            SELECT owner_tenant_id 
            FROM public.tenant_permissions 
            WHERE allowed_tenant_id = current_setting('app.current_tenant_id', true)::uuid
            AND can_view_categories = true
        )
    );

-- 4. İzin Yönetimi Fonksiyonları
CREATE OR REPLACE FUNCTION grant_tenant_access(
    p_owner_tenant_id UUID,
    p_allowed_tenant_id UUID,
    p_can_view_products BOOLEAN DEFAULT true,
    p_can_view_categories BOOLEAN DEFAULT true,
    p_can_view_sales BOOLEAN DEFAULT false,
    p_can_view_stock BOOLEAN DEFAULT true
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_permission_id UUID;
BEGIN
    INSERT INTO public.tenant_permissions (
        owner_tenant_id,
        allowed_tenant_id,
        can_view_products,
        can_view_categories,
        can_view_sales,
        can_view_stock
    ) VALUES (
        p_owner_tenant_id,
        p_allowed_tenant_id,
        p_can_view_products,
        p_can_view_categories,
        p_can_view_sales,
        p_can_view_stock
    )
    ON CONFLICT (owner_tenant_id, allowed_tenant_id) 
    DO UPDATE SET
        can_view_products = EXCLUDED.can_view_products,
        can_view_categories = EXCLUDED.can_view_categories,
        can_view_sales = EXCLUDED.can_view_sales,
        can_view_stock = EXCLUDED.can_view_stock,
        updated_at = now()
    RETURNING id INTO v_permission_id;
    
    RETURN v_permission_id;
END;
$$;

-- 5. İzin İptal Fonksiyonu
CREATE OR REPLACE FUNCTION revoke_tenant_access(
    p_owner_tenant_id UUID,
    p_allowed_tenant_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.tenant_permissions
    WHERE owner_tenant_id = p_owner_tenant_id
    AND allowed_tenant_id = p_allowed_tenant_id;
    
    RETURN FOUND;
END;
$$;

-- 6. RLS Enable
ALTER TABLE public.tenant_permissions ENABLE ROW LEVEL SECURITY;

-- 7. Tenant Permissions RLS Politikaları
CREATE POLICY tenant_permissions_view ON public.tenant_permissions
    FOR SELECT
    USING (
        owner_tenant_id = current_setting('app.current_tenant_id', true)::uuid
        OR allowed_tenant_id = current_setting('app.current_tenant_id', true)::uuid
    );

CREATE POLICY tenant_permissions_manage ON public.tenant_permissions
    FOR ALL
    USING (owner_tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- 8. JETPOS-ADMIN -> JETPOS-KARDESLER-KASAP izin ver
-- Manuel tenant ID'ler (screenshot'tan alındı)
SELECT grant_tenant_access(
    'b0ef2324-9c31-456e-8f12-94e95f0f0820'::uuid, -- JETPOS-ADMIN (owner)
    '725df0a2-fee1-4da5-907d-37d28012dc87'::uuid, -- JETPOS-KARDESLER-KASAP (allowed)
    true, -- can_view_products
    true, -- can_view_categories
    true, -- can_view_sales
    true  -- can_view_stock
);
