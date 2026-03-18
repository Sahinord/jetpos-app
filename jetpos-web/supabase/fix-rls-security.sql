-- ================================================================
-- RLS GÜVENLİK DÜZELTMESİ – blog_posts & about_content
-- Supabase SQL Editor'da çalıştırın
-- ================================================================

-- ── blog_posts ──────────────────────────────────────────────────
-- Eski herkese açık politikaları kaldır
drop policy if exists "Blog public read" on public.blog_posts;
drop policy if exists "Blog anon all" on public.blog_posts;

-- Yalnızca yayınlanmış yazılar herkese açık (okuma)
create policy "Blog public read published"
    on public.blog_posts for select
    using (published = true);

-- Yazma işlemleri YALNIZCA service_role (API route'lardan gelir)
-- service_role RLS'yi bypass eder, ek policy gerekmez.
-- Anon ve authenticated userlar sadece SELECT yapabilir.

-- ── about_content ────────────────────────────────────────────────
drop policy if exists "About public read" on public.about_content;
drop policy if exists "About anon all" on public.about_content;

-- Herkes okuyabilir (hakkımızda sayfası public)
create policy "About public read"
    on public.about_content for select
    using (true);

-- Yazma: service_role bypass eder, anon/auth userlar yazamaz.

-- ── demo_requests ────────────────────────────────────────────────
-- Anonim kullanıcı INSERT yapabilmeli (demo formu)
-- ama SELECT yapamamalı (başkasının verilerini göremez)
drop policy if exists "Demo requests insert" on public.demo_requests;
drop policy if exists "Demo requests select" on public.demo_requests;

alter table public.demo_requests enable row level security;

create policy "Demo anon insert"
    on public.demo_requests for insert
    to anon
    with check (true);

-- Okuma: service_role üzerinden (admin API route), anon göremez
-- (service_role zaten bypass eder)

-- ── contact_messages ─────────────────────────────────────────────
alter table if exists public.contact_messages enable row level security;

drop policy if exists "Contact anon insert" on public.contact_messages;
create policy "Contact anon insert"
    on public.contact_messages for insert
    to anon
    with check (true);

-- ── licenses ─────────────────────────────────────────────────────
alter table public.licenses enable row level security;

-- Lisanslar sadece portal login ile erişilebilir (kendi lisansı)
drop policy if exists "License owner read" on public.licenses;
create policy "License owner read"
    on public.licenses for select
    using (user_email = (select email from auth.users where id = auth.uid()));

-- Yazma: service_role API route üzerinden (admin paneli)
-- ================================================================
-- SONUÇ:
-- ✅ blog_posts  → Herkes yayınlananları okur, yazar yok (service_role hariç)
-- ✅ about_content → Herkes okur, yazar yok (service_role hariç)
-- ✅ demo_requests → Anon INSERT (form), okuma yok (service_role hariç)
-- ✅ licenses → Sadece kendi lisansını görebilir, admin service_role
-- ✅ contact_messages → Anon INSERT, okuma yok
-- ================================================================
