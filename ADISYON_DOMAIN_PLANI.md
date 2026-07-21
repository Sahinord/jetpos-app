# Adisyon Sistemi — Rol Bazlı Alan Adı Planı

**Tarih:** 20 Temmuz 2026
**Soru:** Adisyon ve mutfak ekranlarını `adisyon.jetpos.shop` / `garson.jetpos.shop` gibi ayrı alan adlarına almak mantıklı mı, nasıl yapılmalı?

---

## 1. Kısa cevap

**Fikir doğru, ama "ayrı alan adı" ile "ayrı uygulama" aynı şey değil ve karıştırılırsa pahalıya patlar.**

Ayrı alan adları **evet** — rol netliği, kiosk modu, ayrı PWA ikonu, ayrı bildirim izni gibi gerçek kazançlar var.

Ayrı Vercel projesi / ayrı kod tabanı **hayır** — mevcut yapıda bunun bedeli çok ağır. Sebebi aşağıda.

---

## 2. Neden ayrı proje olmamalı: kod zaten iki kopya

Bugünkü durum:

| Dosya | Satır |
|---|---|
| `client/src/components/Adisyon/Adisyon.tsx` | 1.274 |
| `jetpos-mobile/app/adisyon/page.tsx` | 1.452 |
| `client/src/components/KDS/JetKDS.tsx` | 605 |
| `jetpos-mobile/app/kds/page.tsx` | 486 |

Adisyon ve KDS **zaten iki ayrı yerde, ayrı ayrı yazılmış** — aynı altı tabloya (`restaurant_tables`, `table_orders`, `order_groups`, `kitchen_orders`, `kitchen_order_items`, `table_calls`) iki farklı kod dokunuyor.

Projede monorepo aracı yok (workspaces/lerna yok, her uygulamanın kendi `node_modules`'ı var). Yani **uygulamalar arasında kod paylaşmanın bir mekanizması yok — paylaşım = kopyala-yapıştır.**

Yeni bir "garson uygulaması" projesi açarsak adisyon mantığı **üçüncü kopya** olur. Bir hata düzeltmesi ya da yeni özellik üç yerde ayrı ayrı yapılır. Bu, ilerledikçe her şeyi yavaşlatan türden bir borç.

---

## 3. Önerilen yol: tek uygulama, çok alan adı (host bazlı mod)

`admin.jetpos.shop`'ta tam olarak bunu yaptık ve sorunsuz çalışıyor: **aynı dağıtım, farklı alan adı, farklı ekran.**

Aynı deseni jetpos-mobile'a uygularız:

| Adres | Açılan ekran | Kullanıcı |
|---|---|---|
| `mobile.jetpos.shop` | Tam mobil uygulama (bugünkü hali) | Yönetici / çok işli personel |
| `garson.jetpos.shop` | **Sadece** adisyon — masa seç, sipariş al | Garson |
| `mutfak.jetpos.shop` | **Sadece** KDS — gelen siparişler, hazırlandı | Mutfak |

Üçü de **aynı Vercel projesi, aynı kod, tek deploy.** Fark sadece "hangi ekran açılıyor ve alt menü var mı".

### Nasıl çalışır

`lib/role-host.ts` (admin-host.ts'in kardeşi):

```
garson.  → mod: 'garson'  → doğrudan /adisyon, alt menü gizli
mutfak.  → mod: 'mutfak'  → doğrudan /kds, alt menü gizli
diğer    → mod: 'full'    → bugünkü davranış
```

Bir de **dinamik manifest** (`app/manifest.ts`): host'a göre farklı isim/ikon döner. Böylece garsonun telefonuna "JetGarson", mutfak tabletine "JetMutfak" olarak kurulur — ayrı ikon, ayrı isim, ayrı uygulama gibi görünür. Tek kod tabanıyla.

### Kazançlar

- **Kiosk modu:** mutfak tableti tek adrese kilitlenir, personel başka ekrana geçemez
- **Ayrı PWA kimliği:** ana ekranda ayrı ikon, ayrı isim
- **Ayrı oturum:** tarayıcı depolaması alan adı başına ayrıdır — mutfak tableti mutfak oturumunda kalır, garsonunki garsonda. Bu bir yan etki değil, **istediğimiz şey**
- **Ayrı bildirim izni:** mutfak yeni sipariş bildirimine izin verir, garson vermez
- **Rol netliği:** yanlış ekrana düşme ihtimali sıfır

### Bedeli

Yaklaşık **1 gün**. Yeni proje yok, yeni deploy hattı yok, kod kopyası yok.

---

## 4. `adisyon.jetpos.shop` mi `garson.jetpos.shop` mu?

İkisi aynı şeyi anlatıyor; ikisini birden açmak kafa karıştırır. Öneri:

- **`garson.jetpos.shop`** — kullanıcıyı tarif ediyor, personele anlatması kolay ("telefona garson yaz")
- **`mutfak.jetpos.shop`** — aynı mantık

`adisyon` bir modül adı, kullanıcı adı değil. Personele "adisyona gir" demek yerine "garsona gir" demek daha net. İstersen `adisyon.jetpos.shop`'u `garson`'a yönlendirme olarak da tutabiliriz.

---

## 5. PC tarafı

Sen "hem PWA hem PC" dedin. İkisi de bu planla çalışır:

- **PC'de masaüstü uygulaması:** Adisyon ve KDS zaten client içinde var, oradan kullanılır (değişiklik yok)
- **PC'de tarayıcı:** `mutfak.jetpos.shop`'u bir PC'de tam ekran açmak yeterli — mutfak ekranı için en yaygın kullanım bu (ucuz bir mini PC + monitör)

Yani mutfak için ayrı bir masaüstü uygulaması yazmaya gerek yok.

---

## 6. Asıl mesele: iki kopya problemi

Alan adı işi kolay kısım. Sorulması gereken asıl soru şu: **adisyon mantığı neden iki yerde ayrı yazılmış ve bu böyle devam etmeli mi?**

Üç seçenek:

**A) Olduğu gibi bırak.** Masaüstü kendi adisyonunu, mobil kendininkini kullanmaya devam eder. Kısa vadede bedava, uzun vadede her değişiklik iki kat iş.

**B) Masaüstündeki adisyonu mobile yönlendir.** Masaüstü uygulamasında adisyon sekmesi açıldığında içeride `garson.jetpos.shop`'u gömülü açar. Tek kod, tek bakım. Ama masaüstü kullanıcısı için deneyim biraz "web sayfası gömülü" hissi verir.

**C) Ortak paket çıkar.** `packages/adisyon-core` gibi bir klasöre iş mantığını (veri erişimi, sipariş durumları, hesaplamalar) taşı, arayüz her uygulamada ayrı kalsın. Doğru çözüm ama monorepo kurulumu gerektirir — 2-3 günlük iş.

**Önerim: şimdilik A, alan adı işini yap; C'yi 3-6 ay sonra ürün otururken planla.** B'yi önermiyorum, iki dünyanın kötü yanlarını birleştiriyor.

Önemli olan, **şimdi üçüncü bir kopya çıkarmamak** — yani ayrı bir garson projesi açmamak. Bu plan tam olarak onu engelliyor.

---

## 7. Uygulama adımları

| # | İş | Süre |
|---|---|---|
| 1 | `lib/role-host.ts` — host'tan mod çözümleme | 1 saat |
| 2 | Mod'a göre yönlendirme + alt menüyü gizleme | 2 saat |
| 3 | Dinamik `app/manifest.ts` (host'a göre isim/ikon) | 2 saat |
| 4 | Garson modu sadeleştirme (sadece masa + sipariş) | 2 saat |
| 5 | Mutfak modu sadeleştirme + ekranı uyanık tutma | 2 saat |
| 6 | Vercel'de `garson` + `mutfak` alan adlarını ekle | 15 dk |
| 7 | jetpos-web middleware'ine iki alan adını ekle | 5 dk |

Toplam yaklaşık **1 gün**.

---

## 8. Karar bekleyen sorular

1. **İsimlendirme:** `garson` + `mutfak` mı, `adisyon` + `kds` mi?
2. **Garson modunda ödeme alınacak mı?** Alınacaksa hesap kapatma + Ödeal akışı da garson moduna girmeli; alınmayacaksa garson sadece sipariş girer, hesabı kasa kapatır.
3. **Mutfak ekranı çoklu istasyon destekleyecek mi?** (Sıcak mutfak / soğuk mutfak / bar ayrı ekranlar → `mutfak.jetpos.shop?istasyon=bar` gibi.) Veritabanında `station_id` alanı zaten var.

Bu üçünü netleştirince kodlamaya başlayabilirim.
