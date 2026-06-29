# Güvenlik Açıkları + Test Altyapısı Yol Haritası

**Amaç:** JetPos'taki bilinen güvenlik açıklarını kapatmak ve şu an hiç olmayan
otomatik test altyapısını kurmak. Bu doküman canlı/güncellenen bir çalışma
planıdır — diğer `*_RAPORU.md` dosyaları gibi tarihsel bir döküm değil, üzeri
çizilerek ilerlenecek bir kontrol listesidir.

İlgili geçmiş döküman: [`RLS_POLICY_AUDIT_REPORT.md`](RLS_POLICY_AUDIT_REPORT.md)
(2026-01-22 tarihli, kısmen güncel).

---

## 0. 2026-06-29 — Geniş Tarama Sonuçları (RLS + secrets + API + XSS + PIN)

Bu turda RLS politikaları (tüm migration dosyaları), hardcoded secret'lar (4 uygulama),
API route auth eksiklikleri, XSS riskleri ve PIN/lisans doğrulama ayrı ayrı tarandı.

### 0.1 🔴 KRİTİK — Düzeltildi: middleware + IDOR zinciri

`client/src/middleware.ts`, tüm `/api/*` route'larını koruyan tek katmandı ama web
fallback'i sadece bir `Authorization` header'ının **var olup olmadığına** bakıyordu
(değerini hiç doğrulamıyordu) — `curl -H "Authorization: x" ...` ile bypass edilebiliyordu.
Bunun arkasındaki şu route'lar da `tenantId` parametresine körü körüne güveniyordu
(service-role key ile, RLS tamamen bypass edilerek):

- `client/src/app/api/invoices/archive/route.ts` (GET+DELETE)
- `client/src/app/api/analyze-invoice/route.ts`
- `client/src/app/api/trendyol/sync-orders/route.ts`
- `client/src/app/api/trendyol/sync-stock/route.ts`
- `client/src/app/api/trendyol/settings/route.ts` (kimlik doğrulama olmadan API key/secret döndürüyordu)
- `client/src/app/api/admin/save-tenant/route.ts` — "admin şifresi" `NEXT_PUBLIC_ADMIN_PASSWORD`'du, yani client bundle'ına gömülüydü, gerçek koruma yoktu

✅ **Hepsi düzeltildi (2026-06-29):**
- `client/src/lib/server-tenant-auth.ts` (yeni) — `x-tenant-id`+`x-license-key` header'larını gerçek `tenants` tablosuna karşı doğrulayan ortak fonksiyon.
- `client/src/lib/api.ts` — `apiFetch` artık her `/api/` çağrısına bu header'ları otomatik ekliyor (localStorage'daki gerçek tenant kimliğinden).
- `middleware.ts` — sahte Authorization-varlık kontrolü kaldırıldı, gerçek header şekli kontrolüne çevrildi.
- 5 route'un hepsine `verifyTenantAccess()` eklendi. `save-tenant` artık gerçek admin tenant kimliğini DB'den doğruluyor (sadece bundle'dan okunan bir string yetmiyor).
- Gerçek anon/admin tenant kimlik bilgileriyle uçtan uca test edildi: sahte istek 401/403, gerçek kimlik 200.

### 0.2 🔴 KRİTİK — Düzeltildi: hardcoded service-role key (5 yeni dosya)

`client/check_tables.js`, `check_db_v3.js`, `get_schema.js`, `list_functions.js`,
`try_exec_sql.js` — service-role key (full RLS bypass) kaynak koda gömülüydü
(daha önce sadece kök dizindeki `check_tenants.js`'i bulmuştuk). Hepsi `.env.local`'den
okuyacak şekilde düzeltildi. **Bu key'ler git geçmişine commit edilmiş** — gerçek
remediation Supabase'den service-role key'i rotate etmek (bkz. madde 1.1 #6, hâlâ karar bekliyor).

### 0.3 🟡 Tespit edildi, henüz düzeltilmedi — kullanıcı kararı/zaman gerekiyor

- **`client/src/lib/gemini.ts` + `AIAssistantChat.tsx`** — `NEXT_PUBLIC_OPENROUTER_API_KEY` client bundle'ına gömülü, AI sohbet özelliği OpenRouter'ı **doğrudan tarayıcıdan** çağırıyor. Herkes bu key'i bundle'dan okuyup JetPos'un hesabına fatura çıkartabilir. Fix: bu özelliği server-side proxy route'a taşımak gerekiyor — bu bir mini-refactor, hemen yapılmadı.
- **`client/src/components/Admin/AdminPortal.tsx`** — aynı `NEXT_PUBLIC_ADMIN_PASSWORD` ile client-side-only login kontrolü var ama bu component hiçbir yerde render edilmiyor (dead code). Şu an risk değil, ileride birisi bunu bağlarsa risk olur.
- **`price_change_logs` tablosu** — RLS `USING(true)`, tamamen açık, `tenant_id` kolonu bile yok.
- **`sale_items` tablosu** — `FOR ALL` policy'de `WITH CHECK` yok (banka_fis_satirlari'yla aynı bug sınıfı), kendi `tenant_id` kolonu da yok — fix için `sale_id` üzerinden `sales.tenant_id`'yi doğrulayan bir `WITH CHECK` eklenmesi gerekiyor.
- **`jetpos-web/src/app/qr/[slug]/page.tsx:114`** — `marquee_text` (DB'den, tenant ayarı) escape edilmeden `dangerouslySetInnerHTML` ile public ziyaretçilere basılıyor. Stored XSS riski.
- **`client/src/app/api/proxy/route.ts`, `qnb/route.ts`** — hedef URL'de allowlist yok (SSRF riski).
- **Genel:** çoğu route `catch (e:any) { error: e.message }` ile iç hata detaylarını caller'a döndürüyor — tek tek kritik değil ama proje genelinde sıkılaştırılmaya değer.

### 0.4 🔴 KRİTİK OPERASYONEL BUG (güvenlik taraması sırasında bulundu) — PIN girişi şu an kırık olabilir

`verify_employee_pin` RPC'sinin migration'larda **3 farklı versiyonu** var. Gerçek DB'ye
test sorgusu attım: canlıda **bcrypt'li (güvenli) versiyon** çalışıyor (`employee_pin_attempts`
tablosu var ve erişilebilir) — AMA bcrypt için gereken `crypt()` fonksiyonu **çalışmıyor**:

```
RPC HATA: function crypt(text, text) does not exist
```

Bunun sebebi: `pgcrypto` extension'ı hiç etkinleştirilmemiş. İki ayrı migration bunu
yapmaya çalışmış (`20260409_register_tenant_rpc.sql`, `20260602_enable_pgcrypto.sql`)
ama ikisi de canlıda hiç çalıştırılmamış görünüyor. **Sonuç: employee_login özelliği
açık olan tenant'larda PIN ile giriş şu an muhtemelen tamamen başarısız oluyor.**

**ACİL — bunu Supabase Dashboard SQL Editor'den çalıştır:**
```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

## 1. Mevcut Durum — Somut Bulgular (2026-06-28 taraması)

### 1.1 Açık/şüpheli güvenlik açıkları

| # | Konu | Durum | Kanıt |
|---|------|-------|-------|
| 1 | `kasa_fisleri`, `kasa_fis_satirlari`, `kasa_tanimlari`, `odalar` — RLS `FOR ALL` policy'lerinde `WITH CHECK` eksik | ✅ **Doğrulandı: zaten düzgün** | Fix dosyaları repo kökünde değil `supabase/migrations/` altındaymış (`fix_kasa_rls_policies.sql`, `fix_supabase_warnings_final.sql`). Gerçek policy SQL'i okundu: `kasa_tanimlari`/`odalar`/`kasa_fisleri` split INSERT policy ile, `kasa_fis_satirlari` tek `FOR ALL` ile — hepsinde `WITH CHECK` mevcut. |
| 2 | `banka_fisleri`, `banka_fis_satirlari` — aynı `WITH CHECK` eksikliği | ✅ **`banka_fisleri` düzgündü, `banka_fis_satirlari` GERÇEKTEN kırıktı — düzeltildi** | `banka_fis_satirlari`'nın canlı policy'si sadece `fis_id` üzerinden dolaylı kontrol yapıyordu, satırın kendi `tenant_id`'sini hiç doğrulamıyordu (sahte tenant_id ile kayıt mümkündü). Fix: `supabase/migrations/20260629_fix_banka_fis_satirlari_with_check.sql` — **manuel çalıştırılması gerekiyor.** |
| 3 | `invoice_items`, `waybills`, `waybill_items`, `products` — RLS `USING(true)` (herkese açık) | ✅ **Düzeltildi** | `supabase/migrations/20260622_fix_invoice_items_waybills_products_rls.sql` |
| 4 | `get_current_tenant_id_logged()` fonksiyonuna `anon`/`authenticated` GRANT EXECUTE eksikliği — 7 tabloyu (KDS, bildirimler, masa çağırma vb.) tamamen kırıyordu | ✅ **Düzeltildi ve bu turda gerçek sorguyla doğrulandı** — anon key + tenant header ile `kitchen_orders`/`notifications`/`table_calls` sorguları başarıyla çalıştı. | `supabase/migrations/20260622_fix_get_current_tenant_id_logged_grant.sql` |
| 5 | jetpos-web admin paneli tek paylaşımlı statik şifre (`ADM257SA67`) | ✅ **Rotate edildi (2026-06-29)** — eski token artık 401 dönüyor, yeni token doğrulandı. | `jetpos-web/.env.local`, `ADMIN_SECRET_TOKEN` |
| 6 | Repo kökünde service-role key kullanan birçok `check_*.js`/`test_*.js` script'i serbestçe duruyor | 🟡 **Kısmen düzeltildi** — `check_tenants.js`'de service-role key kaynak koda **gömülüymüş** (env'den değil), bu düzeltildi. Ama bu key zaten git geçmişine commit edilmiş — **dosyadan silinmesi git history'den silindiği anlamına gelmiyor.** Gerçek remediation: Supabase Dashboard'dan service-role key'i rotate etmek (tüm uygulamaların `.env.local`'lerini güncellemek gerektirir — kapsamlı bir işlem, kullanıcı onayı gerekiyor). | `check_tenants.js` (artık `client/.env.local`'den okuyor) |
| 7 | `decrement_stock`/`increment_stock` RPC'leri yanlış parametre adlarıyla çağrılıyordu (`product_id`/`qty` yerine `p_product_id`/`p_qty` gerekiyor) — stok hiç düşmüyordu | ✅ **Düzeltildi** (SatisIrsaliyesi.tsx, PerakendeSatisFaturasi.tsx) | Bu session'daki commit'ler |
| 8 | Birden fazla Invoice/Waybill bileşeninde geçersiz enum değerleri / yanlış kolon adları (sessiz başarısızlık) | ✅ **Düzeltildi** | AlisFaturasi, AlisIrsaliyesi, SatisIrsaliyesi, PerakendeSatisFaturasi, IadeFaturasi |

**Faz 1 durumu (2026-06-29):** Madde 2 ve 5 düzeltildi, madde 4 doğrulandı, madde 6 kısmen düzeltildi (asıl key rotasyonu kullanıcı kararına kaldı). Tek kalan açık/aksiyon: `20260629_fix_banka_fis_satirlari_with_check.sql`'in Supabase Dashboard'dan manuel çalıştırılması.

### 1.2 Test altyapısı — şu an yok

- Repo'da `jest`, `vitest`, `playwright`, `cypress` config'i **yok** (4 alt projenin hiçbirinde).
- `.github/workflows/release.yml` sadece Electron build+publish yapıyor, **lint veya test adımı içermiyor**.
- Doğrulama yöntemi şu an: `npx eslint <dosya>` + repo köküne atılan tek seferlik `check_*.js` script'leriyle Supabase'e elle sorgu + manuel UI testi.
- Bu, küçük/hızlı hareket eden bir ekip için anlaşılır ama RLS gibi "bir satır unutulursa sessizce tüm tenant izolasyonu delinir" türü hatalar için yetersiz — bu session'da bulunan açıkların çoğu tam da bu yüzden fark edilmemiş.

---

## 2. Yol Haritası

### Faz 1 — Acil güvenlik kapatmaları (1-2 hafta, kod yazmadan başlanabilir)

- [x] `kasa_fisleri`/`kasa_fis_satirlari`/`kasa_tanimlari`/`odalar` RLS policy'lerini doğrula → hepsi zaten düzgündü (2026-06-29).
- [x] `banka_fisleri`/`banka_fis_satirlari` için aynı kontrol → `banka_fis_satirlari` kırıktı, fix migration'ı yazıldı: `supabase/migrations/20260629_fix_banka_fis_satirlari_with_check.sql`.
- [ ] **BUNU SEN ÇALIŞTIRMALISIN:** Yukarıdaki migration'ı Supabase Dashboard SQL Editor'den çalıştır.
- [x] `get_current_tenant_id_logged()` GRANT'inin etkili olduğu gerçek sorguyla doğrulandı (2026-06-29) — KDS/bildirim/masa-çağırma tabloları artık çalışıyor.
- [x] jetpos-web admin paneli `ADMIN_SECRET_TOKEN`'ı rotate edildi (2026-06-29), eski token reddediliyor doğrulandı.
- [ ] **BUNU SEN YAPMALISIN:** jetpos-web'i bir yere deploy ettiysen (Vercel vb.), o platformdaki `ADMIN_SECRET_TOKEN` env değişkenini de güncelle — yerel `.env.local` değişikliği canlıyı etkilemez.
- [x] Repo kökündeki `check_*.js` dosyaları incelendi: `check_tenants.js`'de service-role key kaynak koda **gömülüymüş**, `.env`'den okuyacak şekilde düzeltildi.
- [ ] **KARAR SENDE:** `check_tenants.js`'deki o key zaten git geçmişine commit edilmiş durumda — dosyadan silmek geçmişten silmiyor. Gerçek çözüm Supabase'den service-role key'i rotate etmek, ama bu TÜM uygulamaların (`client/`, `jetpos-web/`, `jetpos-shop/`) `.env.local`'ini güncellemeyi gerektiriyor. Bunu yapmak ister misin?

### Faz 2 — Test altyapısı kurulumu (2-4 hafta)

**Araç önerisi: [Vitest](https://vitest.dev/)** — Next.js/TypeScript projeleriyle sürtünmesiz çalışır, Jest'e göre çok daha hızlı, ek config yükü az. `client/` için önerilir; `jetpos-web`/`jetpos-shop` gibi daha basit sitelerde de aynı şekilde kullanılabilir.

Test piramidi, en yüksek faydadan başlayarak:

1. **RLS/tenant-izolasyon testleri (en kritik, en düşük çaba/fayda oranı)**
   Bu session'da zaten elle yapılan şeyi (anon key + `x-tenant-id` header + `set_current_tenant` RPC ile gerçek sorgu atıp hatayı/izolasyonu doğrulama) formelleştir:
   - `tests/rls/*.test.ts` altında, her kritik tablo için: "Tenant A'nın anon key'i Tenant B'nin verisini okuyamaz/yazamaz/silemez" senaryoları.
   - Özellikle `FOR ALL` policy'li tablolar (kasa, banka, cari) öncelikli — INSERT'in gerçekten `WITH CHECK` ile bloklandığını test et.
   - Bu testler gerçek (test/staging) Supabase projesine karşı çalışır, mock gerekmez — repo'nun zaten alışkın olduğu yaklaşım, sadece tekrarlanabilir hale getiriliyor.

2. **Saf iş mantığı birim testleri (kolay kazanım, DB gerektirmez)**
   - `calculateItemTotals()` (AlisFaturasi.tsx) — kısmi indirim/adet senaryoları.
   - VAT/KDV hesaplamaları (`SmartReports.tsx`, `VATReports.tsx`).
   - Stok hesaplama yardımcı fonksiyonları.
   - Bu fonksiyonlar şu an genelde component içine gömülü — test edilebilir olması için saf fonksiyon olarak component dışına çıkarılması gerekebilir (bu, testin kendisi kadar değerli bir refactor).

3. **Kritik akışlar için entegrasyon testi (orta vade)**
   - POS satış akışı: ürün ekle → öde → stok düşsün (gerçek `decrement_stock` RPC'siyle, bu session'da bulunan parametre-adı bug'ı gibi sorunları otomatik yakalardı).
   - Offline-sync outbox akışı (`pending_sales` → `synced`).

4. **E2E (en geç, opsiyonel)** — Playwright ile POS ekranı üzerinden gerçek tıklama senaryoları. Şu an öncelik değil, Faz 1-3 oturduktan sonra değerlendirilebilir.

### Faz 3 — CI entegrasyonu (Faz 2 ile paralel/sonrasında, ~1 hafta)

- `.github/workflows/` altına **yeni** bir `ci.yml` ekle (mevcut `release.yml`'i bozmadan, ayrı iş akışı):
  - Her PR/push'ta: `npm run lint` (her alt proje için) + `npx vitest run`.
  - RLS testleri için Supabase staging projesi secret'larını GitHub Actions secrets'a ekle.
- Bu sayede "lint temiz, dev server 200" türü manuel doğrulama, otomatik bir gate'e dönüşür.

### Faz 4 — Süreç/dokümantasyon (uzun vade, ISO 27001 ön hazırlığı — opsiyonel)

Bu faz, daha önce konuştuğumuz GİB özel entegratör/ISO 27001 konusuyla ilgili —
şu an gerekli değil ama ileride o yola gidilirse buradan başlanır:

- [ ] Yazılı bir bilgi güvenliği politikası (erişim kontrolü, secrets yönetimi, incident response).
- [ ] Migration'lar için formal değişiklik yönetimi süreci (şu an "elle SQL editöre yapıştır" — bu, denetlenebilir/geri alınabilir bir sürece dönüşmeli).
- [ ] Düzenli güvenlik denetimi takvimi (bu dokümanın kendisi gibi RLS taramalarının periyodik tekrarı).

---

## 3. Bugün/bu hafta yapılabilecek en somut 3 adım

1. Kasa/banka RLS `WITH CHECK` durumunu gerçek projede doğrula (Faz 1, madde 1-3).
2. `client/`'a Vitest'i kur (`npm install -D vitest`), tek bir basit `calculateItemTotals` testiyle altyapıyı kanıtla.
3. Admin paneli token'ını rotate et.
