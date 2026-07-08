# Findings — Ödeal D2D Entegrasyonu

Araştırma ve keşifler. Kaynak: `/Users/sahinord/Downloads/POS Api/` postman koleksiyonları + intent dökümanı + JetPos kod tabanı.

## Ödeal D2D API gerçekleri (postman koleksiyonlarından)

- **Base (stage):** `https://stage.odealapp.com/api/v1/`  · prod ayrı base URL (Ödeal'den alınacak).
- **Auth:** her istekte iki header — `X-ODEAL-SECRET-KEY` + `X-ODEAL-MERCHANT-KEY` (bayi kimlik bilgileri).
- **Cihaz eşleşmesi:** `externalDeviceKey` (PAX cihaz kodu) — Ödeal panelinde "cihazlarım"a girilir; sepet bu koda göre terminale düşer.

### Endpoint'ler
| İşlem | Method | Path |
|---|---|---|
| Sepet gönder | POST | `/api/v1/basket` (INDIVIDUAL/CORPORATE) |
| Konfigürasyon (callback URL kaydı) | POST | `/api/v1/configuration` |
| Sepet listeleme | GET | `/api/v1/basket/list` (header: `externalDeviceKey`) |
| Sepet silme | DELETE | `/api/v1/basket/delete` |
| Tamamlanmış ödeme iptal | DELETE | `/api/v1/payment/cancel/{paxId}/{referenceCode}` |
| İşlem raporu (mutabakat) | GET | `/api/v1/report/transactions?beginDate=&endDate=&externalDeviceKey=` |
| Birimler | GET | `/api/v1/unit` |

### `POST /api/v1/basket` gövdesi (özet)
```
{
  "referenceCode": "<GUID, her sepette benzersiz>",
  "externalDeviceKey": "<PAX cihaz kodu>",
  "receiptInfo": { "SiparisNo": "...", "Garson": "..." },   // opsiyonel
  "customer": { "referenceCode","type":"INDIVIDUAL","name","surname",
                "identityNumber","gsmNumber","email","city","town","address" },
  "price": { "grossPrice": 80 },
  "items": [ ... ]
}
```
- Nihai tüketici: `identityNumber` = `11111111111`, name/surname = NİHAİ TÜKETİCİ.

### `items[]` — tam yapı (fiş/fatura için kritik)
Her kalem tüm ürün detayını taşır → ÖKC **itemize mali fiş** basabilir, Ödeal e-Arşiv/e-Fatura üretebilir:
```
"items": [{
  "quantity": 1,
  "product": {
    "unitCode": "C62",              // UN/ECE birim (C62 = adet)
    "name": "EKMEK",
    "referenceCode": "EKM1234",
    "price": { "grossPrice": 80, "vatRatio": 0, "sctRatio": 0 }  // KDV, ÖTV
  }
}]
```
Ayrıca `receiptInfo` (SiparisNo, Garson) fişe basılabilir; `paymentOptions:[{amount,type}]` ödeme tipi.

### Fiş / ÖKC gerçeği
- A910S bir **ÖKC** (Ödeme Kaydedici Cihaz). Kart ödemesi alınınca **mali fiş cihazda basılır** (JetPos basmaz).
- JetPos sepeti **kalem kalem** (ad/adet/fiyat/KDV) gönderdiği için fişte **ürünler yazabilir** ve Ödeal aynı kalemlerden **e-fatura/e-arşiv** keser (`eInvoiceIntegrator: ODEAL`).
- → JetPos'un kendi termal fişi (rawprint) kart satışında **opsiyonel** olur; yasal belge ÖKC fişi.
- Baskı düzeni (itemize mi özet mi) Ödeal/ÖKC tarafında — stage testinde doğrulanacak.

### `POST /api/v1/configuration` (callback kaydı)
Alanlar: `paymentSucceededUrl`, `paymentFailedUrl`, `paymentCancelledUrl`,
`eInvoiceCreatedUrl`, `eInvoiceCancelledUrl`, `callbackPayoutUrl`, `basketCancelledUrl`,
`eInvoiceIntegrator` ("ODEAL"), **`odealRequestKey`** (callback doğrulama sırrı), `intentUrl` (A2A için).

## A2A (App-to-App) — bu senaryoda KULLANILMIYOR
- Sonuç HTTP callback değil, **Android intent dönüşü** ile gelir (`?basketReferenceCode=&result=true/false&reason=`).
- App'in **cihazda** (A910S) çalışmasını gerektirir. JetPos PC'de olduğu için elenmiştir. (Karar: task_plan.md)

## JetPos kod tabanı gerçekleri (entegrasyonun oturacağı yerler)

- **Deployment:** client Next.js → Vercel `https://jetpos-app-71jf.vercel.app` (public). API route'ları serverless çalışır → **callback'ler buraya gelmeli** (masaüstü Electron dışarıdan callback alamaz).
- **`create_pos_invoice(p_tenant_id UUID, p_invoice_data JSONB, p_items_data JSONB)`** — `supabase/migrations/20260205_create_pos_invoice_rpc.sql`. `SECURITY DEFINER`; fatura + `invoice_items` + **stok düşümü** hepsini atomik yapar. Callback satışı bununla tamamlamalı. Çağrı örneği: `jetpos-mobile/app/pos/page.tsx:290`.
- **`integration_settings`** tablosu — tenant bazlı entegrasyon ayarları (`platform, type, settings, api_config, tenant_id`). Bkz. `client/src/lib/tenant-settings.ts` (`getTenantSettings`). Ödeal anahtarları buraya (yalnızca sunucu tarafı).
- **`getTenantSettings(tenantId)`** — `client/src/lib/tenant-settings.ts`: service-role ile tenant `settings` + `integration_settings` okur. Ödeal ayarını buradan çekeriz.
- **`verifyTenantAccess(req, claimedTenantId?)`** — `client/src/lib/server-tenant-auth.ts`: outbound (JetPos→Ödeal) route'larda tenant header doğrulaması için.
- **Middleware** — `client/src/middleware.ts`: prod'da tüm `/api/*` ya HMAC ya tenant header ister; `/auth/callback` **muaf**. Ödeal callback'i Ödeal sunucularından gelir (bu header'ları gönderemez) → **callback path'i middleware'den muaf tutulmalı**, doğrulama route içinde `odealRequestKey` ile yapılmalı.
- **Webhook auth deseni (örnek alınacak):** `jetpos-mobile/lib/hepsiburada-webhook.ts` — `timingSafeEqual` ile sabit-zaman sır karşılaştırması. `odealRequestKey` doğrulaması aynı desenle.
- **Hızlı Satış "Kart" akışı:** desktop POS (`client/src/components/POS/POS.tsx`) — Kart butonu buradan tetiklenecek. (Detay Faz 4'te incelenecek.)
- **RLS:** header-tabanlı ("Tenant Isolation Policy"). Realtime bu tablolarda güvenilir tetiklenmiyor → masaüstü **poll** etmeli (realtime'a güvenme).

## Kritik kısıtlar / riskler
1. **Callback'i masaüstü alamaz** → Vercel'e gelmeli, sonuç Supabase'e yazılmalı, masaüstü poll ile görmeli.
2. **Webhook %100 değil** → callback (hızlı yol) + `report/transactions` poll (kesin kaynak) + mutabakat taraması. "callback yok = ödeme yok" varsayma.
3. **Idempotency** → `referenceCode` benzersiz; çift callback'te stok tek sefer düşmeli.
4. **Güvenlik** → callback route `odealRequestKey` doğrulamazsa herkes "ödeme başarılı" gönderip stok eritir.
5. **A910S internet** → cihaz online olmalı (WiFi/SIM), yoksa sepet düşmez.
6. **Anahtarlar sunucu tarafında** → SECRET/MERCHANT key asla client bundle'ına girmez.
