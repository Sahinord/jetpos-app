# Task Plan — JetPos ↔ Ödeal D2D Ödeme Entegrasyonu

## Hedef
PC'de çalışan masaüstü JetPos'ta Hızlı Satış'ta **Kart**'a basılınca sepetin Ödeal buluta gönderilmesi,
yanındaki PAX A910S terminalinde ödeme alınması, sonucun callback + poll ile geri gelmesi ve ödeme
onaylanınca satış/faturanın oluşup **stoğun idempotent düşmesi**.

## Mimari kararlar (kesinleşmiş)
- **Model: D2D** (A2A değil — JetPos cihazda değil PC'de. Gerekçe: findings.md).
- **Callback hedefi: Vercel** (masaüstü callback alamaz). Callback → Supabase yaz → masaüstü poll ile görür.
- **Stok düşümü: sunucu tarafında, callback içinde**, mevcut `create_pos_invoice` RPC ile. Masaüstünde DEĞİL (masaüstü kapanırsa tutarsızlık olmasın).
- **Güvence katmanı:** callback (hızlı) + `report/transactions` poll (kesin kaynak) + periyodik mutabakat. Idempotent.
- **Anahtarlar:** `integration_settings`'te, tenant bazlı, yalnızca sunucu tarafı.
- **Callback auth:** `odealRequestKey` + `timingSafeEqual` (Hepsiburada webhook deseni). Callback path'i middleware'den muaf.

## Veri modeli (yeni)
`odeal_pending_payments` (Supabase, yeni migration):
- `reference_code` (TEXT, UNIQUE) — Ödeal ile ortak anahtar
- `tenant_id` (UUID)
- `status` (TEXT): `pending | paid | failed | cancelled`
- `basket_snapshot` (JSONB) — sepet kalemleri + tutar (callback'in stok düşmek için ihtiyacı)
- `invoice_id` (UUID, null) — tamamlanınca `create_pos_invoice`'un döndürdüğü fatura
- `odeal_result` (JSONB, null) — callback ham yanıtı
- `external_device_key` (TEXT)
- `created_at`, `updated_at`
- Idempotency: `reference_code` UNIQUE + `status` kontrolü (zaten `paid` ise tekrar işlem yok).

## Fazlar

### Faz 1 — Ayarlar & Konfigürasyon altyapısı
- [ ] `integration_settings`'e Ödeal alanları: `secretKey`, `merchantKey`, `externalDeviceKey`, `baseUrl` (stage/prod), `odealRequestKey`, `enabled`.
- [ ] `lib/tenant-settings.ts` → `getTenantSettings` içine `odeal` map'i.
- [ ] Ayarlar UI (Settings/Integrations) — Ödeal formu (anahtarlar + cihaz kodu + stage/prod).
- [ ] `POST /api/v1/configuration` çağıran bir "kurulum" aksiyonu (callback URL'lerini Ödeal'e kaydeder). URL'ler Vercel domain'i.

### Faz 2 — Ödeal istemcisi (server-side lib)
- [ ] `lib/odeal-client.ts` — `sendBasket()`, `getTransactions()`, `cancelPayment()`, `postConfiguration()`. Header'lar + base URL tenant ayarından.
- [ ] Sepet gövdesi eşleme: JetPos cart → Ödeal `basket` (customer, price.grossPrice, items). Nihai tüketici varsayılanı.

### Faz 3 — Backend route'ları (Vercel)
- [ ] `POST /api/odeal/basket` (outbound) — `verifyTenantAccess`; `odeal_pending_payments`'a `pending` yazar; Ödeal'e sepet gönderir; `referenceCode` döner.
- [ ] `POST /api/odeal/callback/payment-succeeded` — **middleware muaf**; `odealRequestKey` doğrula; `reference_code` bul; `status=paid` değilse `create_pos_invoice` çağır (stok düş) + `status=paid`; **idempotent**.
- [ ] `POST /api/odeal/callback/payment-failed` ve `.../payment-cancelled` — status güncelle.
- [ ] `GET /api/odeal/status?referenceCode=` (poll) — masaüstünün sonucu öğrenmesi için; kayıt `pending` ve eski ise Ödeal `report/transactions`'tan mutabakat yapıp kapatır.
- [ ] Middleware'e callback path muafiyeti (`/api/odeal/callback` — `auth/callback` gibi).

### Faz 4 — Masaüstü Hızlı Satış entegrasyonu
- [ ] `POS.tsx` Kart akışı: Kart'a basınca `POST /api/odeal/basket` → `referenceCode` al → "Terminalde ödeme bekleniyor" modalı.
- [ ] Poll: `GET /api/odeal/status` 2 sn'de bir; `paid` → başarı + fiş + sepet temizle; `failed/cancelled` → hata, sepet durur; timeout (2 dk) → mutabakat sorgusu + kullanıcıya seçenek.
- [ ] İptal butonu → `payment/cancel` (gerekirse).

### Faz 5 — Mutabakat & sağlamlık
- [ ] Periyodik mutabakat: eski `pending` kayıtları `report/transactions` ile kapatan job (cron/edge veya masaüstü açılışında).
- [ ] Idempotency testi (çift callback), kayıp-callback testi (sadece poll ile kapanma), yanlış `odealRequestKey` reddi.

### Faz 6 — Stage → Prod
- [ ] Prod base URL + gerçek merchant key'ler.
- [ ] E-fatura akışı (Ödeal keser: `eInvoiceCreatedUrl`) — kapsама dahil mi? (açık soru).

## Kararlar (kullanıcı onayı — 2026-07-07)
1. **E-fatura/fiş:** **Ödeal ÖKC keser.** A910S ödeme kaydedici cihaz; kart ödemesinde **mali fişi cihaz basar**, e-fatura/e-arşiv'i **Ödeal** üretir (`eInvoiceIntegrator: ODEAL`). JetPos sepeti **kalem kalem** gönderir → fişte ürünler yazar. QNB akışı kart satışları için gerekmez. JetPos termal fiş (rawprint) kart satışında opsiyonel.
2. **Çoklu terminal:** Varsayılan **1 A910S/dükkan** ama **fazlası mümkün** → model çoklu cihazı desteklemeli (`external_device_key` liste/seçim; ilk sürüm tek cihazla çalışır ama şema kilitlemez).
3. **Nakit:** Ödeal sadece kart; nakit JetPos'ta kalır.
4. **Domain:** İlk test **Vercel** (`jetpos-app-71jf.vercel.app`); custom domain sonra.
5. **Cron:** (henüz net değil) — ilk sürümde **masaüstü-tetikli poll/mutabakat** yeterli; kayıp-callback için gün-sonu/açılış taraması. Vercel Cron sonra değerlendirilir.

## Fiş / ÖKC akışı (netleşen)
- Kart ödemesinde yasal belge **A910S ÖKC fişi** — JetPos basmaz.
- JetPos'un görevi: sepeti **kalemli** gönderip (`items[].product`: name, quantity, unitCode, price.grossPrice, vatRatio) fişin/faturanın itemize çıkmasını sağlamak.
- e-Fatura/e-Arşiv Ödeal tarafında; `eInvoiceCreatedUrl` callback'i ile JetPos'a bilgi düşer (kayıt/eşleştirme için).
- Baskı düzeni stage testinde doğrulanacak.

## İlerleme
- Durum: **PLANLAMA** (kod yazılmadı).
- Sonraki adım: açık soruların yanıtı → Faz 1'den başla.
