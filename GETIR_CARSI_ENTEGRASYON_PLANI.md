# Getir Çarşı Entegrasyonu — Uygulama Planı (test ortamı)

**Tarih:** 25 Temmuz 2026 · **Durum:** Getir test erişimi geldi, yarın uygulanacak
**Ortam:** TEST (`*.develop.getirapi.com` / `artisandev`). Prod DEĞİL.

> ⚠️ GÜVENLİK — ÖNCE BUNU OKU
> Getir sohbette **düz metin kimlik** verdi (servis kullanıcı/şifre, panel hesabı, shopId).
> Bunlar **koda/git'e/loga ASLA yazılmaz.** Yalnızca Vercel **server-only env**'e girilir
> (aşağıdaki değişken adları). Pilot bitince **rotasyon** yapılır. Panel şifre-sıfırlama
> linki tek kullanımlık — hemen kullanıp hesabı güvene al.

---

## 1. Şu an elimizde ne var (kod)

Sadece **inbound webhook** iskeleti:
- `lib/getir-carsi/webhook-auth.ts` — timing-safe `x-api-key`, `resolveTenant(shopId)` (body'ye güvenmiyor), rate limit
- `app/api/getir-carsi/new-order/route.ts`, `.../cancel-order/route.ts`
- DB: `getir_carsi_integrations` (shopId→tenant eşlemesi), sipariş tablosu (önceki migration)

**Eksik (yarın yazılacak):** outbound client (token + sipariş çekme + aksiyon + stok/fiyat push), poll döngüsü, UI widget.

## 2. Getir'in verdiği model (poll)

- **Auth:** `username`/`password` → token (login akışı — doküman `bit.ly/3uD8ZNs`'ten teyit)
- **Aktif/yeni siparişler:** `GET /v1/orders/unapproved`
- **İptaller:** `GET /v1/orders/cancelled`
- **Test sipariş verme (manuel):** `web-workspace.develop.getirapi.com/carsi/isletmeler/`
- **Panel:** `panel-fe.artisandev.getirapi.com` (hesap: destek@jetpos.shop)
- **shopId:** pilot test mağazası (Jetpos Single)

Yani prod'da webhook gelse de **test'te poll** ile ilerliyoruz (Getir sunucusu bizim public
webhook'umuza test'te ulaşmıyor). İkisi de aynı sipariş tablosuna idempotent yazacak.

## 3. Env değişkenleri (Vercel — server-only, git'e YOK)

```
GETIR_CARSI_BASE_URL        = <dokümandaki API base — develop/artisandev host>
GETIR_CARSI_USERNAME        = <Getir'in verdiği servis kullanıcı>
GETIR_CARSI_PASSWORD        = <Getir'in verdiği servis şifre>
GETIR_CARSI_WEBHOOK_API_KEY = <mevcut inbound webhook anahtarı — zaten var>
```
Pilot **shopId** → tenant eşlemesi kodda değil, **`tenants.settings.getirCarsi.shopId`**
altında (SuperAdmin'den). Test shopId'yi pilot tenant'a (Kardeşler Kasap) bağla.

## 4. Yarınki iş sırası (dilimler)

**D1 — Doküman + auth teyidi (30 dk)**
- `bit.ly/3uD8ZNs`'i aç: base URL, login/token gövdesi (grant type? header?), token ömrü,
  sipariş alan şeması, aksiyon uçları (onayla/hazırla/teslim), iptal, `price-and-quantity` şeması.

**D2 — Outbound client `lib/getir-carsi/client.ts` (2 sa)**
- `getToken()` — username/password → token, ~ süre cache (Ödeal/TGO client deseni)
- `getUnapproved()` / `getCancelled()` → `/v1/orders/*`
- `orderAction(orderId, action)` → onayla/hazırla/hazırlandı/teslim (şema D1'den)
- `pushPriceAndQuantity(items)` → stok/fiyat + availability (quantity=0 kapatır, buffer eşiği)
- Base URL + kimlik env'den; `creds`'i `tenants.settings.getirCarsi`'dan çöz (webhook-auth'taki resolver'ı genişlet)

**D3 — `app/api/getir-carsi/sync-orders/route.ts` (poll) (1 sa)**
- `verifyTenantAccess` → creds çöz → `getUnapproved` + `getCancelled` → sipariş tablosuna
  **upsert** (order id ile idempotent) → yeni sipariş varsa `OrderNotifier`'a düş (ses+bildirim)
- TGO Yemek `sync-orders` birebir referans.

**D4 — `order-action` route + UI widget (2 sa)**
- `app/api/getir-carsi/order-action` — kabul/hazırla/teslim/iptal.
- Getir Çarşı canlı sipariş widget'ı (TGO Yemek widget pattern) + yeni sipariş bildirimi.
- Poll'u client'ta interval ile tetikle (dükkân açıkken), ya da cron.

**D5 — Stok/fiyat senkron (1 sa)**
- Ürün stok değişince / toggle'da `pushPriceAndQuantity`. Buffer eşiği ayarlanabilir
  (kullanıcı isteği: <5 yerine <1 de olabilmeli) — `tenants.settings.getirCarsi.stockBuffer`.

**D6 — Uçtan uca test (1 sa)**
- `web-workspace...` üfrom test sipariş ver → `sync-orders` çeker → widget'ta görünür →
  kabul et → `/v1/orders`'tan durum teyidi → `price-and-quantity` push → kapanma/açılma doğrula.

## 5. Webhook vs poll — karar

- **Test:** poll (D3) tek yol.
- **Prod:** Getir webhook (new-order/cancel-order) gönderiyorsa o da açık kalır; ikisi de
  **aynı tabloya order-id ile idempotent** yazdığı için çift kayıt olmaz. Poll, webhook
  kaçarsa güvenlik ağı olur.

## 6. Riskler / açık sorular (D1'de netleşir)

1. Login akışı tam olarak ne? (token endpoint + gövde) — dokümandan.
2. Sipariş aksiyon uçları ve durum makinesi (onay→hazırlanıyor→teslim) alan adları.
3. `price-and-quantity` tam şema + availability davranışı (buffer eşiği kaç?).
4. Test base URL ile prod base URL farkı (env ile ayrılır).

## 7. Güvenlik kapanışı (pilot sonrası)
- Getir servis şifresini **rote et**.
- Panel hesabını (destek@jetpos.shop) güçlü şifre + mümkünse 2FA.
- Env değerleri yalnızca Vercel'de; repo'da/loglarda görünmesin (client `post()` gövde/başlık loglamıyor — Ödeal deseni gibi koru).

---

## 8. UYGULANDI (1 Ağustos 2026) — outbound tamamlandı

Doküman V1.05 okundu, D2–D5 yazıldı. Yeni dosyalar:
- `lib/getir-carsi/getir-carsi-client.ts` — `/v1/auth/token` (Basic, 1 saat cache) → Bearer;
  `getUnapproved/getCancelled`, `verify/prepare/handover/deliver`, `cancelOptions/cancel`,
  `pushPriceAndQuantity` (max 1000, oldPrice>price kuralı), `getShopProducts`, `setWorkingStatus`.
  Base: test `locals-integration-api-gateway.artisandev...`, canlı `...artisan...` (stage toggle).
- `lib/getir-carsi/creds.ts` — `tenants.settings.getirCarsi` → client config (+ stockBuffer).
- `app/api/getir-carsi/sync-orders` — poll: unapproved+cancelled → `getir_carsi_orders` idempotent upsert, yeni sipariş bildirimi.
- `app/api/getir-carsi/order-action` — verify/prepare/handover/deliver/cancel (+cancel-options). Teslimat modeline (dt1/dt2) göre buton akışı.
- `app/api/getir-carsi/price-quantity` — mode=manual (elle) veya mode=sync (eşlemeden otomatik stok/fiyat, tampon uygulanır).
- `supabase/migrations/20260801_getir_carsi_product_map.sql` — ürün↔getirId eşleme tablosu.
- SuperAdmin Getir Çarşı formu: + agentName (User-Agent), + Test/Stage toggle, + stockBuffer.
- `GetirCarsiWidget`: "Getir'den Çek" (poll) + 30 sn otomatik poll + sipariş kartında Onayla/Hazırla/Teslim/İptal butonları + yeni sipariş sesi.

**Elle yapılacak adımlar (deploy):**
1. **Migration çalıştır** (Supabase SQL Editor): `20260801_getir_carsi_product_map.sql`
   (ilk kurulumda `20260702_getir_carsi_webhooks.sql` de).
2. **SuperAdmin > Getir Çarşı** (pilot tenant Kardeşler Kasap):
   - shopId `6a641cd751b0f125532f8aa8`, username `jetpos`, password `<reset sonrası>`, agentName `JetPos Yazılım`, **Test Ortamı = AÇIK**, stockBuffer `0`, Aktif.
3. **ŞİFRE SIFIRLA (kritik):** doküman diyor ki bizim verilen şifre `/v1/suppliers/password/reset` ile yenilenmeli, sonra token o yeni şifreyle alınır. Panel reset linki tek kullanımlık — bugün kullan.
4. Env (webhook için, opsiyonel): `GETIR_CARSI_WEBHOOK_API_KEY` (inbound webhook kullanılacaksa).
5. Test siparişi: `web-workspace.development.getirapi.com/carsi/isletmeler/` → widget "Getir'den Çek" → sipariş düşer → Onayla → Hazırla → Teslim.

**Şema teyidi (test sırasında doğrula):** token yanıt alanı (`token`/`accessToken`), `/unapproved` sipariş alan adları (client toleranslı okuyor ama gerçek yanıtla `F` map'i netleştirilebilir), `price-and-quantity` yanıtındaki `batchRequestId`.
