# JetPos Domain Geçiş Planı — `jetpos-app-71jf.vercel.app` → `app.jetpos.shop`

**Hazırlanma tarihi:** 18 Temmuz 2026
**Kapsam:** POS uygulamasının (client) yayın adresinin kendi domainimize taşınması.
**Hedef:** Kesintisiz geçiş. Hiçbir kasa, hiçbir an durmayacak.

---

## 1. Neden yapıyoruz

Şu an POS uygulaması `jetpos-app-71jf.vercel.app` adresinden yükleniyor. Bu adres Vercel'e ait; proje adı değişirse, hesap taşınırsa ya da Vercel bir gün bu formatı değiştirirse **kurulu tüm kasalar açılmaz hale gelir**. Kendi domainimizde olduğumuzda adres bize ait olur ve altındaki barındırma sağlayıcısını istediğimiz zaman değiştirebiliriz — kasalar bunu hiç fark etmez.

İkinci sebep kurumsal görünüm: müşteri fatura yazdırırken, QR menü açarken ya da destek alırken `vercel.app` yerine `jetpos.shop` görmeli.

---

## 2. Geçişi kesintisiz yapan temel fikir

**Eski adres kapatılmayacak.** Vercel'de bir projeye birden fazla domain bağlanabilir ve hepsi aynı dağıtımı sunar. Yani geçiş boyunca:

- `jetpos-app-71jf.vercel.app` → çalışmaya devam eder (eski kurulumlar buradan yüklenir)
- `app.jetpos.shop` → aynı uygulamayı sunar (yeni kurulumlar buradan yüklenir)

İkisi de **aynı kodu, aynı veritabanını, aynı API'yi** kullanır. Bu yüzden "geçiş anı" diye bir kırılma noktası yoktur; iki adres aylarca yan yana yaşar ve kasalar kendi hızında yeni adrese kayar.

---

## 3. Aşama 0 — Kod hazırlığı ✅ (tamamlandı)

Geçişten önce koddaki en büyük kırılma riski kapatıldı.

**Sorun neydi:** `client/src/lib/api.ts` içinde API adresi sabit yazılıydı (`PROD_API_BASE = 'https://jetpos-app-71jf.vercel.app'`). Uygulama `app.jetpos.shop` üzerinden açılsa bile API çağrıları eski adrese gidecekti. Bu **cross-origin** istek demek; tarayıcı CORS kontrolüne takılır ve **tüm API çağrıları çöker** (ödeme, fatura, entegrasyonlar).

**Ne yapıldı:** API tabanı artık sabit değil, sayfanın kendi origin'inden türetiliyor. Uygulama hangi adresten açıldıysa API'yi de o adresten çağırıyor. Sonuç:

- CORS hiç devreye girmiyor
- Domain değişince kod güncellemeye gerek yok
- Eski kurulum eski adresten, yeni kurulum yeni adresten sorunsuz çalışıyor

Ayrıca `jetpos-web/src/middleware.ts` içindeki `mainDomains` listesine `app.jetpos.shop` eklendi — istek yanlışlıkla tanıtım sitesi projesine düşerse QR menü rotasına (`/qr/app`) yönlendirilmesin diye güvenlik ağı.

> Bu iki değişiklik geçişten **önce** yayına alınmalı. Sırası önemli.

---

## 4. Domain aktarımı — Hostinger tarafı ve süreler

### 4.1 Domaini Vercel'e "aktarmaya" gerek YOK

Sık yapılan bir karışıklık var, önce onu netleştirelim. İki farklı şey birbirine karışıyor:

| | Nedir | Bize gerekli mi |
|---|---|---|
| **Registrar aktarımı** | Domainin sahipliğinin/faturasının Hostinger'dan Vercel'e taşınması | **Hayır** |
| **DNS yönetimi** | Domainin hangi sunucuyu gösterdiğinin ayarlanması | **Evet** |

`jetpos.shop` sonsuza kadar Hostinger'da kayıtlı kalabilir. Vercel'in ihtiyacı olan tek şey, domainin kendisini göstermesi. Kayıt yeri hiç değişmeden bu olur.

**Registrar aktarımı neden önerilmiyor:**

- ICANN kuralı gereği domain, kaydından veya önceki bir aktarımdan sonraki **60 gün** boyunca aktarılamaz
- Aktarım için domainin kilidinin açılması ve **EPP (auth) kodunun** alınması gerekir
- Süreç tipik olarak **5-7 gün** sürer, aksilikte 20 güne kadar uzayabilir
- Bir yıllık yenileme ücreti kadar maliyeti vardır
- Karşılığında bize hiçbir fayda sağlamaz

Yani registrar aktarımı bir hafta bekleme ve para demek, kazanç sıfır. Domain Hostinger'da kalsın.

### 4.2 Gerçekten yapılacak olan: DNS

Vercel'de domain bağlamanın üç yöntemi var: **A kaydı**, **CNAME kaydı**, ve **nameserver** yöntemi.

Burada kritik bir kısıt var: **wildcard domainler (`*.jetpos.shop`) yalnızca nameserver yöntemiyle çalışır.** Vercel'in wildcard SSL sertifikası üretebilmesi için DNS kayıtlarını kendisinin yönetmesi gerekiyor.

### 4.3 Mevcut durum (18.07.2026 tespiti)

`jetpos.shop` ad sunucuları: `ns1.dns-parking.com` / `ns2.dns-parking.com` — yani **Hostinger'ın kendi ad sunucuları.** Domain Vercel'de değil, DNS'i Hostinger yönetiyor.

Ek tespit: QR menüler henüz bağlanmamış. Domain fiilen boşta.

### 4.4 Karar: nameserver'ları ŞİMDİ Vercel'e taşı

Nameserver taşımanın tek gerçek riski, mevcut DNS kayıtlarının devre dışı kalmasıdır. **Şu an ortada korunacak kayıt yok** — domain boşta, QR menü bağlı değil, e-posta kurulu değil.

Bu yüzden zamanlama tersine işliyor: taşımayı ertelemek riski **artırır**. Sonra e-posta kurulacak, QR menüler bağlanacak, işletmeler `<isletme>.jetpos.shop` adresli QR kodları bastıracak. O noktada aynı işlem gerçek bir kesinti riski taşır. En ucuz an şimdi.

İkinci sebep: kod zaten `<isletme>.jetpos.shop` adresleri üretiyor (`QRMenuManager.tsx`). Wildcard'a nasılsa ihtiyaç olacak ve wildcard **yalnızca** nameserver yöntemiyle mümkün. Şimdi taşırsak o iş de baştan çözülmüş olur.

**Adımlar:**

1. Hostinger → jetpos.shop → DNS bölgesine bak. Kayıt listesini **not al** (boş ya da varsayılan park kayıtları olmalı). MX kaydı varsa dur ve önce e-posta planını yap.
2. Vercel → **jetpos-web** projesi → Settings → Domains → `jetpos.shop` ekle.
3. Vercel "Nameservers" yöntemini gösterecek; verdiği iki değeri kopyala.
4. Hostinger → Ad Sunucularını değiştir → "özel ad sunucuları" → Vercel'in değerlerini yaz, kaydet.
5. Yayılmayı bekle (genelde 1-4 saat, resmi üst sınır 48 saat).
6. Vercel panelinde domain "Valid" görünene kadar bekle, SSL otomatik çıkar.

**Süre: 20 dakika aktif iş + 1-4 saat bekleme.**

### 4.5 Domain → proje eşlemesi

Nameserver'lar Vercel'e geçtikten sonra hepsi tek panelden yönetilir:

| Adres | Vercel projesi | Ne için |
|---|---|---|
| `jetpos.shop` | jetpos-web | Tanıtım sitesi |
| `www.jetpos.shop` | jetpos-web | Apex'e yönlendirme |
| `*.jetpos.shop` | jetpos-web | QR menüler (`<isletme>.jetpos.shop`) |
| `app.jetpos.shop` | **client** | POS uygulaması |

İsteğe bağlı: `mobil.jetpos.shop` → jetpos-mobile (personel PWA'sı).

### 4.6 Yönlendirme çakışması kontrolü

`*.jetpos.shop` wildcard'ı `jetpos-web` projesine bağlıyken `app.jetpos.shop` client projesine bağlanacak. Vercel daha spesifik domaini önceliklendirir, dolayısıyla bu çalışır. Yine de tarayıcıda açtığında gelen ekranın **tanıtım sitesi değil POS** olduğunu gözle doğrula. Tanıtım sitesi geliyorsa wildcard önceliği devrededir ve spesifik domainin öne alınması gerekir.

---

## 5. Aşama 2 — Ortam değişkeni

Client projesinde `NEXT_PUBLIC_APP_URL = https://app.jetpos.shop` olarak ayarla ve yeniden dağıt.

Bu değişken sadece kozmetik değil: Ödeal callback adresleri bu değerden türetiliyor (`register-callbacks` route'u). Yanlış kalırsa ödeme bildirimleri eski adrese düşmeye devam eder — ki eski adres açık olduğu için **çalışır**, ama zamanla eski adrese bağımlılığı sürdürmüş oluruz.

---

## 6. Aşama 3 — Yeni Electron sürümü

Bu aşama en yavaş ilerleyen kısım, çünkü adres uygulamanın içine gömülü.

`client/main.js` içindeki satır:

```js
const PROD_URL = 'https://jetpos-app-71jf.vercel.app';
```

`https://app.jetpos.shop` yapılacak. Sonrasında:

1. `client/package.json` içinde sürüm numarasını artır
2. `npm run electron-build` ile Windows kurulumunu üret
3. GitHub'a yeni release olarak yükle

Kurulu kasalar `electron-updater` ile **saatlik** güncelleme kontrolü yapıyor; güncellemeyi indirip yeniden başlatınca yeni adrese geçerler. Kapalı ya da çevrimdışı kasalar açıldıklarında güncellenir.

**Kritik sonuç:** Bazı kasalar günlerce, hatta haftalarca eski adresi kullanmaya devam edecek. Bu yüzden:

> ### ⚠️ `jetpos-app-71jf.vercel.app` adresi KAPATILMAYACAK.
> En az 6 ay, tüm kurulumların güncellendiği doğrulanana kadar açık kalmalı. Kapatılırsa güncellenmemiş her kasa **beyaz ekrana düşer**.

---

## 7. Aşama 4 — Entegrasyon adreslerini yenile

Dış servisler bize webhook gönderiyor ve bu adresler onların tarafında kayıtlı. Eski adres açık kaldığı için **hiçbiri aciliyet taşımıyor** — sırayla, sakin sakin yapılabilir.

**Ödeal** — her işletme için SuperAdmin'den "Callback URL'lerini Kaydet" işlemini tekrar çalıştır. Bu, Ödeal'e dört adresi yeniden bildirir (`payment-succeeded`, `payment-failed`, `payment-cancelled`, `e-invoice-created`). `NEXT_PUBLIC_APP_URL` doğru ayarlandıysa yeni adres otomatik gider.

**Getir Çarşı / Getir Yemek** — Getir iş ortağı panelinde kayıtlı webhook adreslerini yeni domaine çevir.

**Uber Eats · Trendyol Go** — sipariş senkronizasyonu bizim taraftan çekme (poll) yöntemiyle çalışıyor, dolayısıyla onlarda kayıtlı bir adres yok. Eylem gerekmiyor.

**Trendyol Pazaryeri** — aynı şekilde çekme yöntemi; eylem gerekmiyor.

---

## 8. Aşama 5 — Doğrulama listesi

Geçiş sonrası tek tek kontrol et:

| Kontrol | Nasıl |
|---|---|
| Uygulama açılıyor | `https://app.jetpos.shop` → giriş ekranı |
| Lisans girişi | Bir test işletmesiyle giriş yap |
| API çağrıları | Konsolda CORS hatası **olmamalı** |
| Ürün listesi | Ürünler yükleniyor mu |
| Nakit satış | Fiş/para üstü ekranı doğru |
| Kartlı satış | Ödeal cihazına sepet düşüyor mu |
| Ödeme sonucu | Webhook geliyor, ekranda anında görünüyor |
| QR menü | `<isletme>.jetpos.shop` hâlâ açılıyor |
| Tanıtım sitesi | `jetpos.shop` etkilenmemiş |
| Eski adres | `jetpos-app-71jf.vercel.app` **hâlâ çalışıyor** |

Son satır en önemlisi. Eski adres çalışmıyorsa geçişi durdur.

---

## 9. Geri alma planı

Her aşama tek başına geri alınabilir:

- **Aşama 1-2 sorun çıkarırsa:** `app.jetpos.shop` domainini Vercel'den kaldır. Eski adres zaten çalışmaya devam ediyor, hiçbir kasa etkilenmez.
- **Aşama 3 sorun çıkarırsa:** `main.js` içindeki `PROD_URL`'i eski değere döndür, sürümü artır, yeni release yayınla. Kasalar bir sonraki güncelleme kontrolünde geri döner. Acil durumda kullanıcıya "güncellemeyi yükleme" demek yeterli.
- **Aşama 4 sorun çıkarırsa:** Callback adreslerini elle eski domaine çevir.

Kritik nokta: **eski adres açık kaldığı sürece geri dönüş her zaman mümkün.**

---

## 10. Süreler

### 10.1 Adım adım gerçekçi süreler

| Adım | Aktif iş | Bekleme |
|---|---|---|
| Aşama 0 — kod hazırlığı | ✅ bitti | — |
| Vercel'de domain ekleme | 5 dk | — |
| SSL sertifikası çıkması | — | 2-10 dk |
| Nameserver'ları Vercel'e çevirme | 20 dk | 1-4 saat (üst sınır 48 saat) |
| Domain → proje eşlemeleri (4 adet) | 15 dk | her biri 2-10 dk SSL |
| `NEXT_PUBLIC_APP_URL` + yeniden dağıtım | 5 dk | 2-3 dk |
| Doğrulama listesi (10 kontrol) | 20-30 dk | — |
| `main.js` güncelleme + build + release | 45-60 dk | — |
| Kasaların yeni sürüme geçmesi | — | **1 saat – haftalar** |
| Ödeal callback yeniden kaydı | işletme başına ~1 dk | — |
| Getir webhook adresleri | 10-15 dk | — |

### 10.2 Toplam süre

**Domainin yayına girmesi: aynı gün.** Sabah nameserver'ları çevirirsen öğleden sonra `app.jetpos.shop` çalışıyor olur. Aktif iş yaklaşık 1 saat, gerisi DNS beklemesi.

Domain boşta olduğu için taşınacak MX/e-posta kaydı yok — normalde en çok vakit alan ve en riskli kısım bizde tamamen devre dışı.

**Registrar aktarımı seçilirse:** +5-7 gün, 60 gün kilidi varsa daha da uzun. **Gerekmiyor, önerilmiyor.**

### 10.3 En uzun süren kısım: kasalar

Domain dakikalar içinde yayına girer ama kurulu kasaların yeni adrese geçmesi **haftalara yayılır**. Sebep: `electron-updater` saatlik kontrol yapıyor, kasa açıkken güncellemeyi indiriyor ve **yeniden başlatılınca** uygulanıyor. Sürekli açık kalan bir kasa günlerce eski sürümde kalabilir; tatildeki bir işletme haftalarca.

Bu bir sorun değil — eski adres açık kaldığı için o kasalar sorunsuz çalışmaya devam eder. Ama planlama açısından net olalım: **"geçiş bitti" demek için tüm kasaların yeni adrese geçmesini bekleme.** Geçiş, yeni adres çalışır çalışmaz bitmiştir; kasa göçü arka planda kendiliğinden tamamlanır.

### 10.4 Önerilen sıra

1. Ödeal ödemesi uçtan uca çalışsın (stage'de manuel giriş engeli kalksın)
2. Pilot işletmede birkaç gün sorunsuz kullanım
3. Aşama 0 yayına alınsın (kod hazırlığı — zaten hazır)
4. Hostinger DNS bölgesini kontrol et — MX kaydı **yoksa** devam et
5. Nameserver'ları Vercel'e çevir (§4.4) — hafta içi sabah
6. Yayılma sonrası 4 domain eşlemesini yap (§4.5) + `NEXT_PUBLIC_APP_URL`
7. Bir gün bekle, izle
8. Yeni Electron sürümü
9. Entegrasyon adresleri, birkaç güne yayarak

Aceleye gerek yok: eski adres açık kaldığı sürece hiçbir adım geri döndürülemez değil.

---

## 11. Özet kontrol listesi

- [ ] Aşama 0 kod değişiklikleri yayına alındı (api.ts + middleware) ✅ kodlandı
- [ ] Hostinger'da nameserver durumu kontrol edildi (Senaryo A mı B mi)
- [ ] Senaryo B ise: mevcut DNS kayıtları, özellikle **MX (e-posta)**, yedeklendi
- [ ] `app.jetpos.shop` Vercel client projesine bağlandı
- [ ] DNS kaydı girildi, SSL çıktı
- [ ] Tarayıcıdan POS ekranı doğrulandı (tanıtım sitesi değil)
- [ ] `NEXT_PUBLIC_APP_URL` ayarlandı, yeniden dağıtıldı
- [ ] `main.js` PROD_URL güncellendi
- [ ] Yeni sürüm build alındı ve GitHub release yayınlandı
- [ ] Ödeal callback'leri her işletme için yeniden kaydedildi
- [ ] Getir webhook adresleri güncellendi
- [ ] Doğrulama listesindeki 10 kontrol geçti
- [ ] Eski adresin açık kalacağı not edildi (en az 6 ay)
