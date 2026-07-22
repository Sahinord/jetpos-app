-- ═══════════════════════════════════════════════════════════════════
--  YEMEKSEPETİ (Delivery Hero) — Partner API entegrasyonu
--  Manuel uygulanır: Supabase Dashboard > SQL Editor
--
--  Mimari: Yemeksepeti sipariş olaylarını WEBHOOK ile iter (RECEIVED /
--  READY_FOR_PICKUP / DISPATCHED / CANCELLED / DELIVERED). Biz webhook
--  ucunda alır, bu tabloya işleriz. Sipariş güncellemesi (kabul/hazır/
--  kargoda/iptal) Partner API PUT /v2/orders/{order_id} ile yapılır.
--
--  Kimlik JetPos'a (chain) verilir; her işletme bir vendor_id.
--  Idempotency: (tenant_id, ys_order_id) benzersiz.
--  RLS: sales/cari_* deseni — USING + WITH CHECK (INSERT için ŞART).
-- ═══════════════════════════════════════════════════════════════════

create table if not exists public.yemeksepeti_orders (
    id            uuid primary key default gen_random_uuid(),
    tenant_id     uuid not null,
    vendor_id     text not null default '',           -- Yemeksepeti vendor (işletme/şube) id
    chain_id      text,                                -- JetPos chain id (bilgi amaçlı)
    ys_order_id   text not null,                       -- Yemeksepeti order id (UUID) — idempotency
    order_code    text,                                -- müşteriye görünen kısa kod
    customer_name text,
    total_price   numeric default 0,
    ys_status     text,                                -- platformdaki ham statü
    status        text not null default 'new',         -- JetPos içi: new/accepted/preparing/ready/on_way/delivered/cancelled
    is_cancelled  boolean default false,
    transport_type text,                               -- VENDOR_DELIVERY | PLATFORM_DELIVERY | PICKUP
    expedition_type text,                              -- delivery | pickup
    items         jsonb default '[]'::jsonb,
    raw_data      jsonb,
    created_at    timestamptz default now(),
    updated_at    timestamptz default now(),
    unique (tenant_id, ys_order_id)
);

create index if not exists idx_ys_orders_tenant_vendor
    on public.yemeksepeti_orders (tenant_id, vendor_id);
create index if not exists idx_ys_orders_status
    on public.yemeksepeti_orders (tenant_id, status);

alter table public.yemeksepeti_orders enable row level security;

-- Eski/çakışan politikaları temizle
do $$
declare r record;
begin
    for r in
        select policyname from pg_policies
        where schemaname = 'public' and tablename = 'yemeksepeti_orders'
    loop
        execute format('drop policy if exists %I on public.yemeksepeti_orders', r.policyname);
    end loop;
end $$;

-- Doğru politika: USING + WITH CHECK (WITH CHECK olmadan INSERT sessizce düşer)
create policy "yemeksepeti_orders_tenant_isolation" on public.yemeksepeti_orders
    for all
    to public
    using (tenant_id::text = (select current_setting('app.current_tenant_id', true)))
    with check (tenant_id::text = (select current_setting('app.current_tenant_id', true)));

-- Realtime: yeni sipariş bildirimleri için (OrderNotifier abone olacak)
do $$
begin
    begin
        alter publication supabase_realtime add table yemeksepeti_orders;
    exception when duplicate_object then null;
    end;
end $$;

comment on table public.yemeksepeti_orders is
    'Yemeksepeti (Delivery Hero) Partner API siparişleri. vendor_id ile şube ayrışır.';
