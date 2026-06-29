# Güvenlik Açıkları + Test Altyapısı Yol Haritası

**Amaç:** JetPos'taki bilinen güvenlik açıklarını kapatmak ve şu an hiç olmayan
otomatik test altyapısını kurmak. Bu doküman canlı/güncellenen bir çalışma
planıdır — diğer `*_RAPORU.md` dosyaları gibi tarihsel bir döküm değil, üzeri
çizilerek ilerlenecek bir kontrol listesidir.

İlgili geçmiş döküman: [`RLS_POLICY_AUDIT_REPORT.md`](RLS_POLICY_AUDIT_REPORT.md)
(2026-01-22 tarihli, kısmen güncel).

---

## 1. Mevcut Durum — Somut Bulgular

### 1.1 Açık/şüpheli güvenlik açıkları

| # | Konu | Durum | Kanıt |
|---|------|-------|-------|
| 1 | `kasa_fisleri`, `kasa_fis_satirlari`, `kasa_tanimlari`, `odalar` — RLS `FOR ALL` policy'lerinde `WITH CHECK` eksik | 🔴 **Büyük olasılıkla hâlâ açık** | `RLS_POLICY_AUDIT_REPORT.md` bunu "fix hazır" diyor ama `fix_kasa_rls_policies.sql` repo'da yok — uygulanmamış olabilir. `CLAUDE.md` hâlâ "kasa_*/banka_fisleri broken" diye şimdiki zamanla uyarıyor. |
| 2 | `banka_fisleri`, `banka_fis_satirlari` — aynı `WITH CHECK` eksikliği | 🔴 **Büyük olasılıkla hâlâ açık** | Aynı kanıt, `fix_banka_fis_rls.sql` da repo'da yok. |
| 3 | `invoice_items`, `waybills`, `waybill_items`, `products` — RLS `USING(true)` (herkese açık) | ✅ **Düzeltildi** | `supabase/migrations/20260622_fix_invoice_items_waybills_products_rls.sql` |
| 4 | `get_current_tenant_id_logged()` fonksiyonuna `anon`/`authenticated` GRANT EXECUTE eksikliği — 7 tabloyu (KDS, bildirimler, masa çağırma vb.) tamamen kırıyordu | ✅ **Düzeltildi (doğrulanmadı — kullanıcı ekrana hata gelmeye devam ettiğini bildirdi, kesin teyit alınamadı)** | `supabase/migrations/20260622_fix_get_current_tenant_id_logged_grant.sql` |
| 5 | jetpos-web admin paneli tek paylaşımlı statik şifre (`ADM257SA67`) | 🔴 **Açık** — kod içinde "yakında rotate et" yorumu var ama rotate edilmemiş | `jetpos-web/.env.local`, `ADMIN_SECRET_TOKEN` |
| 6 | Repo kökünde service-role key kullanan birçok `check_*.js`/`test_*.js` script'i serbestçe duruyor | 🟡 **Hijyen sorunu** (acil değil ama secrets sprawl riski) | Repo köküne `ls check_*.js test_*.js` |
| 7 | `decrement_stock`/`increment_stock` RPC'leri yanlış parametre adlarıyla çağrılıyordu (`product_id`/`qty` yerine `p_product_id`/`p_qty` gerekiyor) — stok hiç düşmüyordu | ✅ **Düzeltildi** (SatisIrsaliyesi.tsx, PerakendeSatisFaturasi.tsx) | Bu session'daki commit'ler |
| 8 | Birden fazla Invoice/Waybill bileşeninde geçersiz enum değerleri / yanlış kolon adları (sessiz başarısızlık) | ✅ **Düzeltildi** | AlisFaturasi, AlisIrsaliyesi, SatisIrsaliyesi, PerakendeSatisFaturasi, IadeFaturasi |

**Faz 1'in ilk işi:** madde 1, 2 ve 5'i doğrulayıp kapatmak — bunlar hâlâ açık görünüyor ve gerçek tenant-izolasyonu/erişim riskleri taşıyor.

### 1.2 Test altyapısı — şu an yok

- Repo'da `jest`, `vitest`, `playwright`, `cypress` config'i **yok** (4 alt projenin hiçbirinde).
- `.github/workflows/release.yml` sadece Electron build+publish yapıyor, **lint veya test adımı içermiyor**.
- Doğrulama yöntemi şu an: `npx eslint <dosya>` + repo köküne atılan tek seferlik `check_*.js` script'leriyle Supabase'e elle sorgu + manuel UI testi.
- Bu, küçük/hızlı hareket eden bir ekip için anlaşılır ama RLS gibi "bir satır unutulursa sessizce tüm tenant izolasyonu delinir" türü hatalar için yetersiz — bu session'da bulunan açıkların çoğu tam da bu yüzden fark edilmemiş.

---

## 2. Yol Haritası

### Faz 1 — Acil güvenlik kapatmaları (1-2 hafta, kod yazmadan başlanabilir)

- [ ] `kasa_fisleri`/`kasa_fis_satirlari`/`kasa_tanimlari`/`odalar` RLS policy'lerini gerçek Supabase projesinde sorgulayıp `WITH CHECK` var mı diye doğrula.
- [ ] Yoksa, `cari_*` tablolarındaki çalışan pattern'i mirror'layan yeni bir `supabase/migrations/YYYYMMDD_fix_kasa_banka_rls_with_check.sql` yaz ve **manuel olarak** Supabase Dashboard'dan çalıştır.
- [ ] Aynısını `banka_fisleri`/`banka_fis_satirlari` için yap.
- [ ] `get_current_tenant_id_logged()` GRANT'inin gerçekten etkili olduğunu KDS ekranında tekrar test ederek kapat (önceki turda kesin teyit alınamamıştı).
- [ ] jetpos-web admin paneli `ADMIN_SECRET_TOKEN`'ı rotate et, yeni değeri sadece `.env.local`'e koy (koda gömme).
- [ ] Repo kökündeki `check_*.js`/`test_*.js` dosyalarını gözden geçir: hâlâ gerekenler `scripts/` gibi ayrı bir klasöre taşınsın, gereksizler silinsin. Hiçbiri service-role key'i kod içine hardcode etmesin (hepsi `.env`'den okumalı — bazıları zaten öyle, kontrol edilmeli).

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
