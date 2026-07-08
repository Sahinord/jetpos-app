-- ═══════════════════════════════════════════════════════════════════
--  Getir ÇARŞI (market/bakkal dikeyi) webhook entegrasyonu
--  Not: Getir Yemek'ten AYRI bir kategoridir. İsimlendirme "mağaza"
--  (store) üzerinedir; restoran değil.
--  Manuel uygulanır: Supabase Dashboard > SQL Editor
--
--  Mimari: Getir Çarşı public webhook'ları (new-order / cancel-order) bu
--  tablolara yazar. Masaüstü app (client) veriyi Supabase'ten okur.
--  x-api-key TÜM webhook'lar için TEK/ortak; kodda GETIR_CARSI_WEBHOOK_API_KEY
--  env değişkeninde tutulur (DB'de saklanmaz, asla NEXT_PUBLIC_).
-- ═══════════════════════════════════════════════════════════════════

-- Sabit mağaza türleri (Getir Çarşı dikeyi) — enum benzeri referans tablo
CREATE TABLE IF NOT EXISTS public.getir_carsi_store_types (
    code text PRIMARY KEY,
    label text NOT NULL
);
INSERT INTO public.getir_carsi_store_types (code, label) VALUES
    ('market',    'Market / Bakkal'),
    ('buyukmarket','Büyük Market'),
    ('su',        'Su & Damacana'),
    ('tup',       'Tüp Bayi'),
    ('sarkuteri', 'Şarküteri / Kasap'),
    ('manav',     'Manav'),
    ('firin',     'Fırın / Pastane'),
    ('kozmetik',  'Kozmetik / Kişisel Bakım'),
    ('pet',       'Pet Shop'),
    ('diger',     'Diğer')
ON CONFLICT (code) DO NOTHING;

-- 1) Tenant ↔ Getir Çarşı eşlemesi
--    Projedeki mevcut kalıba uygun olarak per-tenant entegrasyon verisi
--    tenants.settings->'getirCarsi' altında tutulur (trendyolGo, qnb, parasut
--    gibi). SuperAdmin panelinden tenant başına girilir; env'e gerek yok.
--    Beklenen şekil:
--      settings.getirCarsi = {
--        "shopId":   "<Getir shopId>",   -- webhook tenant çözümü bu alandan yapılır
--        "username": "<Getir kullanıcı adı>",  -- outbound token (/v1/auth/token) için
--        "password": "<Getir şifresi>",
--        "storeType":"market",
--        "active":   true
--      }
--    Body'deki tenant_id'ye ASLA güvenilmez; tenant yalnızca shopId eşleşmesinden bulunur.
--
-- shopId ile hızlı arama için GIN index (50+ işletmede tam tarama sorun değil ama garanti):
CREATE INDEX IF NOT EXISTS idx_tenants_settings_gin ON public.tenants USING gin (settings);

-- 2) Getir Çarşı siparişleri (idempotency + ham veri)
CREATE TABLE IF NOT EXISTS public.getir_carsi_orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    getir_order_id text NOT NULL,               -- Getir sipariş kimliği (replay/tekrar koruması)
    getir_shop_id text,                         -- siparişin geldiği Getir shopId
    order_number text,
    customer_name text,
    total_price numeric(12,2),
    -- Getir statü kodu: 400=Onay Bekliyor, 500=Hazırlanıyor, 900=Teslim,
    -- 1500=Admin iptal, 1600=İşletme iptal (API dökümanı "Sipariş Statüleri")
    getir_status_code integer,
    delivery_type integer,                      -- 1=Getir Getirsin, 2=İşletme Getirsin
    status text NOT NULL DEFAULT 'new',         -- iç durum: new | cancelled
    is_cancelled boolean NOT NULL DEFAULT false,
    items jsonb NOT NULL DEFAULT '[]'::jsonb,    -- ürünler (type: count/gr, barkod, adet, fiyat)
    raw_data jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT getir_carsi_orders_unique UNIQUE (tenant_id, getir_order_id)
);
CREATE INDEX IF NOT EXISTS idx_getir_carsi_orders_tenant ON public.getir_carsi_orders(tenant_id, created_at DESC);

-- RLS: yazma yalnızca service role (webhook). Okuma tenant-scoped (cari_* kalıbı).
ALTER TABLE public.getir_carsi_store_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.getir_carsi_orders ENABLE ROW LEVEL SECURITY;

-- Mağaza türleri herkese okunur (referans veri)
DROP POLICY IF EXISTS getir_carsi_store_types_read ON public.getir_carsi_store_types;
CREATE POLICY getir_carsi_store_types_read ON public.getir_carsi_store_types
    FOR SELECT USING (true);

-- Tenant yalnızca kendi Getir Çarşı verisini okur (app.current_tenant_id — projedeki standart)
DROP POLICY IF EXISTS getir_carsi_orders_tenant_select ON public.getir_carsi_orders;
CREATE POLICY getir_carsi_orders_tenant_select ON public.getir_carsi_orders
    FOR SELECT
    USING (tenant_id::text = current_setting('app.current_tenant_id', true));

COMMENT ON TABLE public.getir_carsi_orders IS 'Getir Çarşı webhook siparişleri; (tenant_id, getir_order_id) tekil = idempotency';
COMMENT ON TABLE public.getir_carsi_store_types IS 'Getir Çarşı sabit mağaza türleri (market, su, tüp, manav, ...)';
