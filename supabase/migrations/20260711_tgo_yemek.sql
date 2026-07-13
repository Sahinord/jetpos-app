-- ═══════════════════════════════════════════════════════════════════
--  Uber Eats · Trendyol Go — YEMEK entegrasyonu
--  Manuel uygulanır: Supabase Dashboard > SQL Editor
--
--  Çoklu mağaza: her tenant birden çok restoran/mağaza tanımlar
--  (tenants.settings.tgoYemek.stores[]). Siparişler store_id ile ayrışır.
--  Idempotency: (tenant_id, tgo_order_id) benzersiz.
--  RLS: sales/cari_* deseni — USING + WITH CHECK (INSERT için ŞART).
-- ═══════════════════════════════════════════════════════════════════

create table if not exists public.tgo_yemek_orders (
    id            uuid primary key default gen_random_uuid(),
    tenant_id     uuid not null,
    channel       text not null default 'tgo',        -- bağlantı: 'tgo' (Trendyol Go · Uber Eats) | 'getir' (Getir Yemek)
    store_id      text not null default '',          -- restoran/şube anahtarı (bağlantının storeId'si)
    store_name    text,                               -- gösterim: marka (Uber Eats / Trendyol Yemek / Getir Yemek)
    tgo_order_id  text not null,                      -- TGO paket/sipariş id (idempotency)
    package_id    text,                               -- durum güncellemesi için paket id
    order_number  text,                               -- müşteriye görünen sipariş no
    customer_name text,
    total_price   numeric default 0,
    tgo_status    text,                               -- platformdaki ham statü
    status        text not null default 'new',        -- JetPos içi: new/accepted/preparing/ready/on_way/delivered/cancelled
    is_cancelled  boolean default false,
    delivery_type text,
    items         jsonb default '[]'::jsonb,
    raw_data      jsonb,
    created_at    timestamptz default now(),
    updated_at    timestamptz default now(),
    unique (tenant_id, tgo_order_id)
);

create index if not exists idx_tgo_yemek_orders_tenant_store
    on public.tgo_yemek_orders (tenant_id, store_id);
create index if not exists idx_tgo_yemek_orders_status
    on public.tgo_yemek_orders (tenant_id, status);

alter table public.tgo_yemek_orders enable row level security;

-- Eski/çakışan politikaları temizle
do $$
declare r record;
begin
    for r in
        select policyname from pg_policies
        where schemaname = 'public' and tablename = 'tgo_yemek_orders'
    loop
        execute format('drop policy if exists %I on public.tgo_yemek_orders', r.policyname);
    end loop;
end $$;

-- Doğru politika: USING + WITH CHECK (WITH CHECK olmadan INSERT sessizce düşer)
create policy "tgo_yemek_orders_tenant_isolation" on public.tgo_yemek_orders
    for all
    to public
    using (tenant_id::text = (select current_setting('app.current_tenant_id', true)))
    with check (tenant_id::text = (select current_setting('app.current_tenant_id', true)));

comment on table public.tgo_yemek_orders is
    'Uber Eats · Trendyol Go yemek siparişleri (çoklu mağaza, store_id ile ayrışır).';
