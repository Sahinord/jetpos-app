# JetPos — Güvenlik Taraması Raporu

**Tarih:** 25 Temmuz 2026
**Kapsam:** client (Electron+Next.js), jetpos-mobile, API route'ları, Supabase RLS/RPC, sır yönetimi
**Yöntem:** Statik tarama — sır sızıntısı, tenant izolasyonu, API/webhook auth, injection (XSS/SQL/SSRF)

---

## Özet

Genel duruş **iyi**: çok kiracılı erişim `verifyTenantAccess` ile sağlam doğrulanıyor,
webhook'lar (Getir) imzalı/rate-limitli, SSRF köprüleri allowlist'li, XSS/eval yok,
service_role anahtarı tarayıcıya sızmıyor. Bu taramada **2 yüksek**, **2 orta**, birkaç
düşük/bilgi bulgusu çıktı. Yüksek olanların kod tarafı **düzeltildi**; birkaçı env/rotasyon
(senin tarafında) gerektiriyor.

| # | Bulgu | Önem | Durum |
|---|---|---|---|
| 1 | `/api/invoices/send` kimlik doğrulaması yoktu (IDOR — başkası adına e-fatura) | 🔴 Yüksek | ✅ Düzeltildi (kod) |
| 2 | `NEXT_PUBLIC_OPENROUTER_API_KEY` tarayıcıya sızıyor (ücretli anahtar) | 🔴 Yüksek | ⚠️ Kısmi (env+rotasyon sende) |
| 3 | `/api/vision-analyze` kimlik doğrulaması yok (açık AI proxy — maliyet) | 🟠 Orta | ⚠️ Öneri |
| 4 | Ödeal webhook'larında imza yok (sahte "ödeme başarılı" teorik riski) | 🟠 Orta | ⚠️ Öneri |
| 5 | PostgREST `.or()` filtrelerinde arama girdisi enterpole ediliyor | 🟡 Düşük | ⚠️ Öneri (RLS sınırlı) |
| 6 | `supabase-admin.ts`'te `server-only` guard yok | 🟡 Düşük | ⚠️ Öneri |
| 7 | Anon key koda gömülü fallback | ⚪ Bilgi | Kabul (public key) |

---

## 🔴 1. `/api/invoices/send` — kimliksiz e-fatura kesimi (IDOR) — DÜZELTİLDİ

**Sorun:** Uç, body'deki `tenantId`'yi alıp o işletmenin e-fatura kimlik bilgileriyle
GİB'e **resmi belge** kesiyordu; hiçbir kimlik doğrulaması yoktu. Saldırgan herhangi bir
`tenantId` ile POST atıp **başka bir işletme adına fatura kesebilirdi** (mali/hukuki risk).

**Düzeltme:** `verifyTenantAccess(req, tenantId)` eklendi — `x-tenant-id` + `x-license-key`
doğrulanır ve body'deki `tenantId` ile eşleşmek zorundadır. Çağıran (`InvoicePanel`) zaten
`apiFetch` ile bu header'ları gönderdiği için **akış bozulmadı**.

## 🔴 2. OpenRouter AI anahtarı tarayıcıya sızıyor — ROTASYON GEREKLİ

**Sorun:** `NEXT_PUBLIC_OPENROUTER_API_KEY` — `NEXT_PUBLIC_` önekli olduğu için
**tarayıcı paketine gömülür**. Uygulamayı açan herkes anahtarı çıkarıp ücretli AI API'sini
senin hesabından kullanabilir.

**Yapılan (kod):** `vision-analyze` artık önce server-only `OPENROUTER_API_KEY`'i kullanıyor
(NEXT_PUBLIC yalnızca geçici fallback).

**Senin yapman gerekenler (ÖNEMLİ):**
1. OpenRouter panelinden mevcut anahtarı **iptal et / yenile** (sızmış sayılır).
2. Vercel'de yeni anahtarı **`OPENROUTER_API_KEY`** (NEXT_PUBLIC'siz) olarak gir.
3. `NEXT_PUBLIC_OPENROUTER_API_KEY` değişkenini **sil**.

## 🟠 3. `/api/vision-analyze` — açık AI proxy

**Sorun:** Uçta kimlik doğrulaması yok; kimliksiz herkes görüntü gönderip AI çağrısı
tetikleyebilir (maliyet/DoS). Çağıran `SmartScanner` düz `fetch` kullanıyor (tenant header yok).

**Öneri:** `SmartScanner`'ı `apiFetch`'e çevirip uca `verifyTenantAccess` eklemek + rate limit.
(İstenirse yapılır; çağıran değişikliği gerektirdiği için rapora bırakıldı.)

## 🟠 4. Ödeal webhook'ları — imza doğrulaması yok

**Durum:** `payment-succeeded/failed/cancelled` uçları gövde imzası doğrulamıyor; tek koruma
**tahmin edilemez `referenceCode`** (`JP-<tenant8>-<zaman>-<6hex>`) + rate limit + kaydın
önceden var olması. Teorik risk: aktif-bekleyen bir referansı ele geçiren biri sahte
"başarılı" gönderip satışı ödemeden kapatabilir (dar pencere, düşük olasılık).

**Öneri:** (a) Ödeal imza/secret sunuyorsa doğrula; (b) webhook'ta yalnızca `status='pending'`
kayıtları terminal duruma geçir (tekrar/replay'i sınırla). POS zaten "ilk gelen kazanır"
(mükerrer satış koruması) uyguluyor.

## 🟡 5. PostgREST `.or()` filtre enterpolasyonu

Arama kutuları `.or(\`unvani.ilike.%${term}%,...\`)` gibi kullanıcı girdisini doğrudan
gömüyor (POS, Cari, Depo aramaları). Özel karakterli (`,` `(` `)` `:`) girdi filtre
mantığını değiştirebilir; **ancak tüm sorgular RLS + tenant kapsamında** olduğu için
kiracı dışına çıkılamaz — etki kendi verisiyle sınırlı. **Öneri:** arama terimlerinden
`,()*:%` karakterlerini temizleyen küçük bir yardımcı.

## 🟡 6. `supabase-admin.ts` — `server-only` guard yok

Service_role client'ı hiçbir `'use client'` dosyası import etmiyor ve `SUPABASE_SERVICE_ROLE_KEY`
NEXT_PUBLIC değil → **şu an sızmıyor**. Yine de dosyanın başına `import 'server-only'` eklemek,
ileride kazara client'a import edilirse **build'i durdurarak** sızıntıyı önler. (Transitive
import zincirini kırma riski olmasın diye bu taramada otomatik eklenmedi; kontrollü eklenebilir.)

## ⚪ 7. Anon key koda gömülü fallback

`supabase.ts` içinde `NEXT_PUBLIC_SUPABASE_ANON_KEY` yoksa gömülü anon key kullanılıyor.
Anon key **public** (RLS ile korunur), sızıntı sayılmaz. Sadece rotasyonda fallback
bayatlar — kabul edilebilir.

---

## Doğrulanan (sağlam) alanlar ✅

- **Tenant doğrulama:** `verifyTenantAccess` — header + `validate_license` RPC + super admin
  (env token + DB `is_super_admin`); `claimedTenantId` eşleşme zorunlu. Eski sabit admin
  anahtarı (`ADM257SA67`) kaldırılmış.
- **Getir webhook:** timing-safe `x-api-key`, tenant yalnızca `shopId`'den (body'ye güvenmiyor),
  rate limit.
- **SSRF köprüleri:** `/api/qnb`, `/api/proxy` → `isAllowedProxyTarget` allowlist.
- **XSS:** app kodunda `dangerouslySetInnerHTML` yok; eski QR marquee XSS'i önceden düzeltilmiş.
- **eval / new Function:** yok.
- **service_role:** yalnızca sunucu (route) tarafında; client bundle'a girmiyor.
- **Bu oturumun eklentileri:** cari borç aktarma (RLS + tenant_id ile insert), terazi barkod
  (saf parse), dinamik manifest (host prefix), employee_id — güvenlik açısından temiz.

---

## Aksiyon listesi

**Kod (bu raporla düzeltildi):**
- [x] `/api/invoices/send` → `verifyTenantAccess`
- [x] `vision-analyze` → server-only anahtar tercihi

**Senin tarafında (env/rotasyon):**
- [ ] OpenRouter anahtarını **rote et** → `OPENROUTER_API_KEY` (server-only) olarak gir → `NEXT_PUBLIC_OPENROUTER_API_KEY`'i sil
- [ ] (varsa) Ödeal webhook imza/secret'ını sor; yoksa "yalnızca pending→terminal" kuralını ekleyelim

**İsteğe bağlı (sonraki tur):**
- [ ] `vision-analyze`'a auth (SmartScanner'ı apiFetch'e çevir) + rate limit
- [ ] Arama girdisi sanitizasyon yardımcısı (`.or()` sertleştirme)
- [ ] `supabase-admin.ts` → `import 'server-only'`
