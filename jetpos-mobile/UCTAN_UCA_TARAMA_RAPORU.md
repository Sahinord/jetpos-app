# jetpos-mobile — Uçtan Uca Tarama Raporu

> Tarih: 2026-07-17 · Kapsam: jetpos-mobile (app/ + components/ + lib/)

## ✅ Bu turda düzeltildi

### 1. Ürünler görünmüyordu (products/page.tsx)
- **Sorun:** Sorgu hatası **sessizce yutuluyordu** (`if (error) { hasMore=false; break; }`) → liste boş kalıyor, sebebi görünmüyordu ("Sonuç Yok"). Büyük tabloda sıralı (`order by name`) sorgu statement-timeout'a düşünce tüm liste boşalıyordu.
- **Düzeltme:**
  - En fazla **20.000 ürün** (sayfalı, 1000'lik bloklar).
  - Sıralı sorgu hata verirse **sırasız fallback** (böylece timeout'ta bile ürünler gelir).
  - Hata artık **ekranda kırmızı banner** + console'a düşüyor (sessiz değil).
  - `sale_price/purchase_price/stock_quantity` **Number()**'a çevriliyor (string gelirse `toFixed` patlamıyordu).
  - Arama **debounce** (200ms) — her tuşta 20k filtreleme yok.
  - Realtime değişiklikte **debounce'lu refetch** (1500ms) — her stok değişiminde full-refetch seli yok.

### 2. Beyaz ekran / PWA (bu oturumda daha önce)
- `public/sw.js` cache-first + sabit v1 → eski chunk'lara işaret → beyaz ekran. **Network-first + v2 + skipWaiting/claim** yapıldı.
- `components/PWARegister.tsx` → **localhost'ta SW kaydetmiyor + eski bozuk SW/cache'i otomatik siliyor**.

---

## 🔴 Kritik — güvenlik (öneri, henüz düzeltilmedi)

### OpenRouter API anahtarı tarayıcıya sızıyor
`app/pos/page.tsx:171`
```ts
const { data: licenseData } = await supabase.from('licenses').select('openrouter_api_key')...
if (licenseData?.openrouter_api_key) setOpenRouterKey(licenseData.openrouter_api_key);
```
- API anahtarı **client'a** çekiliyor → herkes DevTools/Network'ten görebilir, kötüye kullanabilir.
- **Çözüm:** OpenRouter çağrılarını bir **sunucu API route'una** taşı (anahtar env'de kalsın, `/api/ai/...` proxy'lesin). İstersen bunu ben yaparım.

---

## 🟠 Orta — performans (büyük tenant'larda)

1. **`.select('*')` yaygın** — `pos`, `dashboard`, `adisyon`, `cari`, `kasa`, `banka`, `kds`, `inventory-count`, `warehouse-transfer`. Gereksiz kolonlar (ör. `image_url`, uzun metinler) çekiliyor. 20k satırda ciddi veri/bellek. **Öneri:** sadece kullanılan kolonları seç.
2. **Realtime abonelikleri full-refetch** — `adisyon` (×3), `kds` (×2), `low-stock`, `warehouse-transfer`. Her değişimde tüm listeyi yeniden çekiyorlar (products'ta düzelttiğimiz sorunun aynısı). **Öneri:** debounce ya da tekil satır güncelleme.
3. **POS ürün yükleme** (`pos/page.tsx`) — `select('*')` + 20k cap yok (ama hata toast'la görünüyor, offline cache var). **Öneri:** kolonları daralt + 20k cap.

---

## 🟡 Düşük

- `components/TransferPortal.tsx:115,171` — **boş catch** (`catch (err) {}`), gerçek sync hatasını gizleyebilir. (Scanner bileşenlerindeki boş catch'ler zararsız — kamera/track durdurma.)
- `lib/supabase.ts` — Supabase URL + anon key kodda fallback olarak gömülü. Anon key zaten public'tir (sorun değil), ama ideali env-only.
- `dashboard/page.tsx` — sayfalı çekim var; hata yönetimi/kolon daraltma gözden geçirilebilir.

---

## Öncelik önerisi
1. 🔴 OpenRouter anahtarını server'a taşı (güvenlik).
2. 🟠 Realtime refetch'leri debounce'la (adisyon/kds/low-stock) — mobilde en çok hissedilen yavaşlık.
3. 🟠 Sık kullanılan sayfalarda `select('*')` → kolon daraltma.

> Not: Sandbox ağ-kısıtlı olduğu için `next build` alınamadı (SWC binary indirilemiyor); doğrulama `tsc --noEmit` ile yapıldı (temiz). Gerçek çalıştırma senin makinende.
