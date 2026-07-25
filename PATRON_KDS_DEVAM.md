# Patron Paneli + KDS/Mutfak — Durum & Devam Notu

**Son güncelleme:** 24 Temmuz 2026
**Amaç:** Patron paneli, rol bazlı alan adları (garson/mutfak/patron) ve masaüstü .exe kabuğu işinde
nerede kaldığımızı ve sıradaki adımları tek yerde tutmak. Bir sonraki oturumda buradan devam.

İlgili planlar: `PATRON_PERSONEL_PLANI.md` (asıl plan, dilimler), `ADISYON_DOMAIN_PLANI.md` (host-mod mimarisi).

---

## 1. Şu ana kadar YAPILANLAR ✅

### Rol bazlı alan adı modu (host-mode)
- **`jetpos-mobile/lib/role-host.ts`** — host'tan mod çözer:
  `garson.` → `garson`, `mutfak.` → `mutfak`, `patron.` → `patron`, diğeri → `full`.
  Yerel test override: `?mode=patron` (veya garson/mutfak) + `localStorage.jp_app_mode`.
  Yardımcılar: `getAppMode()`, `isGarsonHost/isMutfakHost/isPatronHost/isFullHost`,
  `isRoleLockedHost()`, `modeHomePath()`.
- **`app/page.tsx`** (root) — lisans varsa `modeHomePath()`'e yönlendirir:
  garson→`/adisyon`, mutfak→`/kds`, patron→`/patron`, full→`/dashboard`.
- **`app/dashboard/page.tsx`** — normal app'in dashboard'undan **blanket `can_access_reports` PIN
  kilidi kaldırıldı**. Normal (full) mobil artık açılışta PIN İSTEMEZ. (Bug buydu: garson PIN'i
  normal app'e sızıyordu.) Hassas sayfalar kendi `RequirePermission` kilitlerini koruyor.
- **`components/BottomNav.tsx`** — `isRoleLockedHost()` → garson/mutfak/patron modunda alt menü
  gizli (kiosk/rol netliği). Sidebar'a **"Patron Paneli"** maddesi eklendi (`can_manage_employees`).

### Patron paneli
- **`app/patron/page.tsx`** (YENİ) — 3 sekme:
  - **Erişim kilidi:** patron host'ta cihaz bağlı değilse `StaffLoginGate` (işletme kodu+PIN);
    oturum yoksa `EmployeePinGate`; sadece patron/owner/müdür rolü veya `can_manage_employees`
    açar. Full modda (uygulama içinden) sahibin cihazı olduğu için doğrudan geçer.
  - **Özet (canlı, 30sn poll):** bugünkü ciro + düne göre %, aktif masa (dolu/toplam),
    mutfak kuyruğu, canlı yemek siparişi, online personel + "şu an çalışan" listesi.
  - **Personel:** işletme kodu kartı (kopyala), personel ekle/düzenle (ad, rol, PIN 4-6,
    rol→varsayılan yetki, 10'lu yetki matrisi, aktif/pasif). Doğrudan `employees` tablosu.
  - **Performans:** garson başına masa / sipariş / aktif masa / **açık hesap toplamı** (dolu
    masaların `table_orders` toplamı) + online rozeti + CSS bar.
  - Tüm sorgular **savunmacı** (try/catch) — eksik tablo/kolon sayfayı kırmaz.

### PC masaüstü .exe kabuğu (yeni proje)
- **`jetpos-panel/`** — ince Electron kabuğu; canlı subdomain'i native pencere gibi açar,
  içerik web'den geldiği için **otomatik güncellenir**.
  - `roles.js` — rol tanımları (patron/mutfak/garson: url, productName, appId, kiosk, keepAwake).
  - `main.js` — pencere, origin dışına çıkışı engelle, dış link→tarayıcı, offline "Tekrar Dene",
    mutfak/garson'da `powerSaveBlocker` (ekran uyumaz), mutfak kiosk/fullscreen.
  - `scripts/set-role.js` + `electron-builder.config.js` — role göre installer:
    `JetPatron.exe / JetMutfak.exe / JetGarson.exe` (ayrı appId, ayrı dist klasörü).
  - `npm run build:patron|mutfak|garson|all`. **Windows'ta derlenmeli** (NSIS).
  - Node ile doğrulandı; gerçek electron-builder derlemesi kullanıcıda.

### KDS / Mutfak (mevcut, bu oturumdan önce)
- **`app/kds/page.tsx`** (486 satır) — çalışıyor: `kitchen_orders` canlı (realtime),
  durumlar new/preparing/ready, **çoklu istasyon** desteği (`kitchen_stations`, `station_id`,
  istasyon filtresi). `mutfak.jetpos.shop` → `/kds`, `JetMutfak.exe` bunu açar.

---

## 2. Kaldığımız yer / SIRADAKİ adımlar ⏭️

### A. Dağıtım (kod hazır, dış işlem bekliyor)
- [ ] **Vercel'de alan adları:** jetpos-mobile projesine `patron.jetpos.shop`,
      `garson.jetpos.shop`, `mutfak.jetpos.shop` ekle (+ `mobile.jetpos.shop`).
- [ ] jetpos-web middleware'ine bu subdomainleri tanıt (gerekliyse).
- [ ] `jetpos-panel` → Windows'ta `npm i && npm run build:all`, 3 exe'yi test et.

### B. Dinamik manifest (PWA kimliği) — telefon tarafı
- [ ] **`app/manifest.ts`** (statik `public/manifest.json` yerine) host'a göre isim/ikon dönsün:
      patron→"JetPatron", mutfak→"JetMutfak", garson→"JetGarson", diğeri→"JetPos".
      Böylece telefonda "Ana ekrana ekle" ayrı ikon+isimle kurar. (Plan dilim 2'nin kalanı.)
- [ ] Role özel ikonlar (şu an `jetpos-panel/build/icon.png` üçünde ortak).

### C. KDS/Mutfak iyileştirme
- [ ] **Wake lock / ekran uyanık** — PWA tarafında (Screen Wake Lock API) mutfak `/kds`'te.
      (.exe tarafında `powerSaveBlocker` zaten var; PWA için ayrı gerekli.)
- [ ] Kiosk/tam ekran kısayolu + "yeni sipariş" sesli/görsel uyarı gözden geçir.
- [ ] Çoklu istasyon senaryosu: `mutfak.jetpos.shop?istasyon=bar` gibi derin bağlantı
      (station_id zaten var) — patron panelde istasyon bazlı kuyruk özeti eklenebilir.

### D. Patron paneli — veri sağlamlaştırma
- [ ] **Garson günlük ciro:** şu an "açık hesap toplamı" gösteriliyor (kapanan satış faturaya
      garson id yazmadığı için). Sağlam metrik için: adisyon **hesap kapatma** akışında
      `invoices.employee_id` (veya `waiter_id`) set et → sonra performansta günlük ciro-per-garson.
- [ ] Kasa/banka bakiye kartı (şu an Özet'te yok/opsiyonel) — kaynak tablo netleşince ekle.
- [ ] Canlı yemek kartı tablo adlarını gerçek şemayla doğrula
      (`yemeksepeti_orders`/`getir_orders`/`tgo_food_orders` best-effort deneniyor).
- [ ] Bahşiş/puan: `waiter_ratings` varsa performans kartına ekle.
- [ ] Haftalık/aylık görünüm + basit grafik (şu an sadece bugün).

### E. Client (masaüstü ana uygulama) entegrasyonu — plan dilim 6
- [ ] Aynı patron paneli + personel yönetimini `client/` sidebar'ında bir ekran olarak da ver
      (masaüstü kullanıcısı için). `EmployeeManager.tsx` zaten var; patron özeti/performans eklenecek.

### F. Doğrulama
- [ ] Gerçek cihazda uçtan uca: patron girişi (kod+PIN), personel ekle→PIN'le garson girişi,
      masa aç→performansa yansıma, mutfak .exe kiosk.

---

## 3. Açık kararlar (netleşince ilerler)
1. Garson günlük cirosu için faturaya `employee_id` yazımı — hesap kapatmayı kim yapıyor
   (garson mı, kasa mı)? Ödeme garson modunda mı alınacak?
2. Mutfak çoklu istasyon: ayrı ekran/subdomain mi, tek ekranda filtre mi? (İkisi de mümkün.)
3. Çok şubeli işletmede patron paneli tüm şubeleri mi, tek şubeyi mi gösterecek?

---

## 4. Dosya haritası (bu iş için dokunulanlar)

| Dosya | Durum |
|---|---|
| `jetpos-mobile/lib/role-host.ts` | YENİ — host-mod (garson/mutfak/patron/full) |
| `jetpos-mobile/app/page.tsx` | mod'a göre yönlendirme |
| `jetpos-mobile/app/dashboard/page.tsx` | blanket PIN kilidi kaldırıldı |
| `jetpos-mobile/components/BottomNav.tsx` | rol modunda gizli + "Patron Paneli" maddesi |
| `jetpos-mobile/app/patron/page.tsx` | YENİ — patron paneli (Özet/Personel/Performans) |
| `jetpos-mobile/app/kds/page.tsx` | mevcut — mutfak/KDS (istasyon destekli) |
| `jetpos-panel/` (roles.js, main.js, set-role.js, electron-builder.config.js, README) | YENİ — PC .exe kabuğu |

**Not:** Tüm değişiklikler local commit; `git push` ve Supabase migration çalıştırma
kullanıcı tarafında bekliyor (önceki oturumlardan devam eden aynı durum).

---

## 5. Hızlı hatırlatma — nasıl test edilir
- Telefon/tarayıcı: `mobile.jetpos.shop` normal app (PIN yok). `?mode=patron` ile patron
  panelini yerelde simüle et. Garson: `?mode=garson` → `/adisyon`, PIN keypad orada.
- PC: `cd jetpos-panel && npm i && npm run dev:mutfak` (Windows'ta build:all → exe'ler).
