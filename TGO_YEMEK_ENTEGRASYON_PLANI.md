# Uber Eats · Trendyol Go — YEMEK Entegrasyon Planı (JetPos)

> Tarih: 2026-07-11 · Durum: Planlama · Kapsam: JetPos ↔ Uber Eats Trendyol Go **Yemek** (restoran) API

---

## 0. Özet (TL;DR)

- **"Getir Yemek" artık bağımsız bir API değil.** Uber, Trendyol Go'nun %85'ini (~$700M, Mayıs 2025) ve ardından **Getir'in yemek operasyonunu** ($335M) satın aldı. Getir Yemek restoranları **Uber Eats · Trendyol Go** platformuna taşınıyor. Dolayısıyla entegre olunacak yer **Getir'in eski portalı değil**, birleşik geliştirici platformu: **developers.tgoapps.com** (API host: **`tgoapis.com`**).
- **İyi haber:** JetPos'ta bu platformun **market (grocery)** tarafı zaten kurulu (`TrendyolGoClient`, `api/trendyol/*`, `TrendyolGOWidget`). Yemek entegrasyonu sıfırdan değil, **mevcut client'ın "food/meal" uçlarıyla genişletilmesi** demek — **aynı base URL, aynı Basic auth**, farklı path segment ve sipariş yaşam döngüsü.
- **Sipariş akışı** market'ten farklı: restoran siparişi *kabul et → hazırla → yola çıktı → teslim edildi* durum makinesine sahip ve JetPos'un **KDS + Adisyon** ekranlarına düşmeli.
- Önerilen isim/feature: **`tgo_yemek`** ("Uber Eats · Trendyol Go — Yemek").

---

## 1. Birleşme durumu — hangi API?

| Marka | Bugünkü durum | JetPos hedefi |
|---|---|---|
| Trendyol Go | Uber %85 hisse (Mayıs 2025) | ✅ Birleşik platform (tgoapis.com) |
| Uber Eats TR | Trendyol Go üzerinden geldi | ✅ Aynı platform |
| Getir Yemek | Yemek işi Uber'e satıldı, TGO'ya taşınıyor | ✅ Aynı platform (ayrı Getir API'sine gerek yok) |
| Getir Çarşı / market | Getir Süper App'te kalıyor | ↔ JetPos'ta ayrı entegrasyon (mevcut) |

**Sonuç:** Yemek için **tek entegrasyon** yeterli → Uber Eats · Trendyol Go **Yemek** API. `developers.getir.com` (eski, JS-render, GetirYemek+GetirÇarşı) ikincil/legacy — yemek için tgoapps esas alınır. (Getir Çarşı market dikeyi JetPos'ta zaten ayrı duruyor, ona dokunmuyoruz.)

---

## 2. Neyi yeniden kullanıyoruz (mevcut altyapı)

JetPos'ta hazır ve **birebir örnek alınacak** parçalar:

**a) `src/lib/trendyol-go-client.ts` — `TrendyolGoClient`**
- Base URL: prod `https://api.tgoapis.com/integrator`, stage `https://stageapi.tgoapis.com/integrator`.
- Auth: `Authorization: Basic base64(apiKey:apiSecret)` + header'lar `x-agentname`, `x-executor-user: {sellerId}`, `User-Agent`.
- Server-side doğrudan `fetch` + retry/timeout; client-side `/api/proxy` üzerinden (CORS bypass).
- Şu an **grocery** uçları: `/order/grocery/suppliers/{sellerId}/packages`, `/product/grocery/...`, `/claim/grocery/...`.
- **Yemek = aynı client mantığı, `grocery` yerine `food`/`meal` path'i** (kesin segment doc'tan teyit edilecek — §5).

**b) Getir Çarşı webhook deseni — `src/lib/getir-carsi/webhook-auth.ts` + `api/getir-carsi/new-order`**
- Timing-safe `x-api-key`, IP rate-limit, **tenant'ı body'ye güvenmeden mağaza-kimliğinden çözme**, XSS `clean()`, toleranslı `pick()` alan okuma, `(tenant, order_id)` üzerinde **idempotent upsert**.
- Yemek'te inbound webhook varsa → bu dosya template. Polling varsa → grocery `getOrders()` template.

**c) Creds saklama & panel deseni**
- Per-tenant ayarlar `tenants.settings` JSON'unda (`settings.trendyolGo`, `settings.getirCarsi`). SuperAdmin'den girilir, env değil.
- Server route'lar `verifyTenantAccess` + service-role. Feature-gate: `AVAILABLE_FEATURES` + `Sidebar` + `IntegrationsDashboard`.
- Widget deseni: `Integrations/TrendyolGOWidget.tsx`, `GetirCarsiWidget.tsx`, `OdealWidget.tsx`.

**d) JetPos operasyon ekranları**
- Gelen yemek siparişleri **KDS/** ve **Adisyon/** domainlerine düşecek (Getir Çarşı'nın KDS'e düşmesi gibi).

---

## 3. Mimari karar

```
Uber Eats · TGO Yemek API  (api.tgoapis.com)
        ▲   │
 (outbound) │ (sipariş çekme / durum güncelleme)
        │   ▼
   JetPos sunucu route'ları  (/api/tgo-yemek/*)   ──►  Supabase (tgo_yemek_orders)
        │                                                     │
        │ (per-tenant creds: tenants.settings.tgoYemek)       ▼
   SuperAdmin creds                                    KDS + Adisyon ekranı
```

- **Sipariş girişi (order intake):** İki olası model — (1) **polling** (`ymk-siparis-paketlerini-cekme`, grocery ile aynı desen; zamanlanmış görev/cron ile çek) veya (2) **webhook** (`tgo-uber-eats-webhook-entegrasyonu` doc'u market altında mevcut). **İkisini de destekleyecek şekilde tasarla**, önce polling ile başla (daha az bağımlılık), webhook'u faz-2'de ekle.
- **Durum güncelleme (outbound):** kabul/hazır/yola çıktı/teslim/iptal → `TgoYemekClient` metodları.
- **Çok kiracılılık:** her tenant kendi `sellerId`/restoran + apiKey/secret'ı ile. RLS `WITH CHECK` şart (CLAUDE.md kuralı).

---

## 4. Sipariş yaşam döngüsü (state machine)

```
[Yeni paket çekildi]
      │  ymk-siparis-paketlerini-cekme
      ▼
[Onay bekliyor] ──ymk-siparisi-kabul-etme──► [Kabul edildi] → JetPos KDS'e düş
      │                                             │ ymk-siparis-hazirliginin-bitmesi
      │ ymk-siparis-iptali                          ▼
      ▼                                        [Hazır]
[İptal]                                             │ ymk-siparisin-yola-cikmasi
                                                    ▼
                                              [Yolda] ──ymk-siparisin-teslim-edilmesi──► [Teslim]
İade: ymk-iade-siparisleri-cekme → ymk-iade-onaylama-reddetme
Fatura: ymk-fatura-besleme / ymk-fatura-silme
```

Her durum geçişi hem TGO'ya bildirilir hem `tgo_yemek_orders.status` güncellenir; KDS/Adisyon realtime dinler.

---

## 5. API yüzeyi (endpoint envanteri)

Sitemap'ten çıkarılan **Yemek** uçları (kesin request/response şemaları implementasyonda ilgili doc sayfasından alınacak — sayfalar JS-render, bu yüzden burada envanter + link):

**Kimlik & ortam**
- Authorization: `…/docs/authorization`
- Canlı/Test ortam bilgileri: `…/docs/canli-test-ortam-bilgileri`
- Servis limitleri (rate limit): `…/docs/trendyol-servis-limitleri`

**Restoran** (`…/trendyol-go-yemek-entegrasyonu/restoran-entegrasyonu/`)
- `ymk-restoranlarin-bilgilerinin-alinmasi` — restoran/şube bilgisi çek
- `ymk-restoranin-calisma-durumu-guncellemesi` — açık/kapalı
- `ymk-restoranin-calisma-saatlerinin-guncellenmesi` — çalışma saatleri
- `ymk-teslimat-bolgelerinin-alinmasi` / `...-guncellemesi` — teslimat bölgeleri
- `ymk-teslimat-suresi-guncelleme` — hazırlık/teslim süresi

**Menü** (`…/menu-entegrasyonu/`)
- `ymk-menulerin-alinmasi` — menüyü çek
- `ymk-kategori-satisa-acma-kapama` — kategori aç/kapa
- `ymk-urunleri-satisa-acma-kapama` — ürün aç/kapa
- `ymk-urun-fiyat-guncelleme` — fiyat güncelle
- `ymk-toplu-islem-kontrolu` — toplu işlem (batch) durumu

**Sipariş** (`…/siparis-entegrasyonu/`)
- `ymk-siparis-paketlerini-cekme` — sipariş paketlerini çek (polling)
- `ymk-siparisi-kabul-etme` — kabul
- `ymk-siparis-hazirliginin-bitmesi` — hazır
- `ymk-siparisin-yola-cikmasi` — yola çıktı
- `ymk-siparisin-teslim-edilmesi` — teslim
- `ymk-siparis-iptali` — iptal
- `ymk-paket-modelleri` — **sipariş veri modeli** (implementasyonda ilk okunacak)
- `ymk-fatura-besleme` / `ymk-fatura-silme` — fatura
- `ymk-test-siparisi-olusturma` — **test siparişi** (geliştirmede kritik)

**İade** (`…/iade-entegrasyonu/`)
- `ymk-iade-siparisleri-cekme`, `ymk-iade-onaylama-reddetme`

**Değerlendirme** (`…/restoran-degerlendirme-entegrasyonu/`)
- `ymk-restoran-yorumlari-cekme`, `ymk-restoran-scorelarini-cekme`, `ymk-restoran-cevap-verme`

**Webhook (opsiyonel/faz-2)**
- `…/siparis-entegrasyonu/tgo-uber-eats-webhook-entegrasyonu` (market altında; yemek için uygunluğu doğrulanacak)

---

## 6. Veri modeli (DB migration)

Yeni tablo `supabase/migrations/` altına (timestamp'li), Getir Çarşı `getir_carsi_orders` şemasını yansıtarak:

```sql
-- tgo_yemek_orders — Uber Eats · Trendyol Go yemek siparişleri
create table if not exists public.tgo_yemek_orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  tgo_order_id text not null,          -- idempotency
  tgo_package_id text,
  restaurant_id text,                  -- sellerId/storeId
  order_number text,
  customer_name text,
  total_price numeric default 0,
  tgo_status text,                     -- platform statüsü
  status text default 'new',           -- JetPos içi: new/accepted/preparing/ready/on_way/delivered/cancelled
  is_cancelled boolean default false,
  delivery_type text,
  items jsonb default '[]',
  raw_data jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (tenant_id, tgo_order_id)
);
alter table public.tgo_yemek_orders enable row level security;
create policy "tgo_yemek_orders_tenant_isolation" on public.tgo_yemek_orders
  for all to public
  using (tenant_id::text = (select current_setting('app.current_tenant_id', true)))
  with check (tenant_id::text = (select current_setting('app.current_tenant_id', true)));  -- WITH CHECK ŞART
```

> Not: Migration'lar **manuel** uygulanır (Supabase SQL Editor). `WITH CHECK` olmadan INSERT sessizce RLS'e takılır — CLAUDE.md'deki tekrarlayan bug sınıfı.

---

## 7. JetPos entegrasyon noktaları (dosya dosya)

| Katman | Dosya | Yapılacak |
|---|---|---|
| API client | `src/lib/tgo-yemek/tgo-yemek-client.ts` (yeni) | `TrendyolGoClient` mantığını food uçlarıyla klonla |
| Creds/tenant | `src/lib/tgo-yemek/creds.ts` (yeni) | `getTenantTgoYemekCreds()` — `tenants.settings.tgoYemek` |
| Sipariş çekme | `src/app/api/tgo-yemek/sync-orders/route.ts` | `verifyTenantAccess` + poll + upsert |
| Durum güncelleme | `src/app/api/tgo-yemek/order-status/route.ts` | kabul/hazır/yolda/teslim/iptal |
| Menü sync | `src/app/api/tgo-yemek/sync-menu/route.ts` | menü çek + fiyat/stok/aç-kapa |
| Webhook (faz-2) | `src/app/api/tgo-yemek/webhook/route.ts` | Getir Çarşı deseni (x-api-key, idempotent) |
| Panel | `src/components/Integrations/TgoYemekWidget.tsx` (yeni) | Genel bakış / siparişler / menü / ayarlar |
| Dashboard | `IntegrationsDashboard.tsx` | `isTgoYemek` + sekmeler + tema |
| Menü/erişim | `Common/Sidebar.tsx` | `{ id:"tgo_yemek", label:"Uber Eats · TGO (Yemek)", feature:"tgo_yemek" }` |
| Feature flag | `Admin/SuperAdmin.tsx` `AVAILABLE_FEATURES` | `{ id:'tgo_yemek', ... }` + creds modalı |
| Public path | `src/middleware.ts` | webhook eklenirse `PUBLIC_API_PATHS`'e ekle |
| Operasyon | `KDS/`, `Adisyon/` | yeni siparişleri realtime göster + durum butonları |

---

## 8. Yol haritası (fazlar)

| Faz | İçerik | Çıktı | Efor (kaba) |
|---|---|---|---|
| **0. Hazırlık** | Panel/hesap, sellerId + apiKey/secret + stage erişimi, `ymk-paket-modelleri` & `authorization` doc'larını okuma | Creds + şema netliği | 0.5 gün |
| **1. Client + creds** | `TgoYemekClient`, per-tenant creds, `testConnection` | Bağlantı testi geçer | 1 gün |
| **2. Sipariş girişi** | `sync-orders` (polling) + `tgo_yemek_orders` migration + idempotent upsert | Test siparişi DB'ye düşer | 1.5 gün |
| **3. KDS/Adisyon + durum** | Siparişi ekranda göster + kabul/hazır/yolda/teslim/iptal butonları → API | Uçtan uca sipariş yönetimi | 2 gün |
| **4. Menü senkron** | Menü çek, fiyat/stok/aç-kapa | JetPos ürünleri ↔ TGO menü | 2 gün |
| **5. İleri** | Webhook, iade, fatura besleme, değerlendirme cevapları, zamanlanmış poll | Tam kapsam | 2–3 gün |

---

## 9. Netleştirilecek açık sorular

1. **Food path segment:** grocery `/order/grocery/...` → yemek `/order/food/...` mı `/order/meal/...` mı? (`ymk-siparis-paketlerini-cekme` doc'undan kesinleştir.)
2. **Order intake modeli:** Yemek siparişi **polling** mi zorunlu, webhook mü destekleniyor? (`tgo-uber-eats-webhook-entegrasyonu`.)
3. **Kimlik:** Auth aynı Basic key:secret mı, yoksa yemek için ayrı `x-agentname`/entegrasyon referans kodu mu? (`authorization`.)
4. **Restoran kimliği:** `sellerId` mi `restaurantId`/`storeId` mi paketleri filtreliyor?
5. **Test ortamı:** stage `stageapi.tgoapis.com` yemek için de geçerli mi + test siparişi nasıl üretiliyor (`ymk-test-siparisi-olusturma`).
6. **Süre baskısı:** kabul için SLA (kaç saniyede onay) — KDS akışını ona göre kur.

> Bu 6 madde, exact JSON şemaları için implementasyonun ilk adımında ilgili doc sayfaları (JS-render) canlı taranarak kapatılır.

---

## 10. Riskler & güvenlik

- **RLS `WITH CHECK`** olmadan sipariş INSERT'i sessizce düşer → migration'da zorunlu.
- **Secret'lar server-only:** apiKey/secret asla `NEXT_PUBLIC_`, client bundle'ında veya log'da olmamalı; `tenants.settings` + service-role route.
- **Idempotency:** aynı sipariş tekrar geldiğinde (poll+webhook çakışması) `(tenant, tgo_order_id)` unique upsert.
- **Tenant çözümü body'ye güvenmeden** restoran-kimliği eşlemesinden (Getir Çarşı deseni).
- **Rate limit:** hem inbound (webhook flood) hem outbound (TGO servis limitleri — `trendyol-servis-limitleri`).
- **50+ işletme:** creds env değil per-tenant SuperAdmin'den (mevcut desen korunur).

---

## 11. Kaynaklar

- Uber Eats · Trendyol Go geliştirici dokümanı: https://developers.tgoapps.com/docs/intro
- Yemek entegrasyonu kategorisi: https://developers.tgoapps.com/docs/category/8-uber-eats-trendyol-go---yemek-entegrasyonu
- Uber ↔ Trendyol Go ($700M): https://techcrunch.com/2025/05/06/uber-eats-comes-to-turkey-via-700m-trendyol-go-acquisition/
- Uber ↔ Getir yemek işi ($335M): https://techcrunch.com/2026/02/09/uber-to-buy-delivery-arm-of-turkeys-getir/
- Uber yatırımcı duyurusu: https://investor.uber.com/news-events/news/press-release-details/2026/Uber-Doubles-Down-on-Trkiye-with-Agreement-to-Acquire-Getirs-Delivery-Business/default.aspx
- Mevcut JetPos kodu: `src/lib/trendyol-go-client.ts`, `src/lib/getir-carsi/webhook-auth.ts`, `src/app/api/getir-carsi/new-order/route.ts`
