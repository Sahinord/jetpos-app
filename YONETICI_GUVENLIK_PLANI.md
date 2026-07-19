# JetPos Yönetici Paneli — Güvenlik Sertleştirme Planı

**Tarih:** 20 Temmuz 2026
**Kapsam:** `admin.jetpos.shop` ve süper yönetici yetkisiyle erişilen her şey
**Durum:** Panel ayrı alan adına taşındı, lisans anahtarı istemci kodundan çıkarıldı. Aşağıdakiler henüz açık.

---

## 1. Neden bu doküman

Süper yönetici yetkisi bu sistemdeki **en yüksek yetki**. Bu yetkiyi ele geçiren biri:

- Tüm işletmelerin satış, cari, stok ve müşteri verilerini okuyabilir
- Herhangi bir işletmenin oturumuna geçebilir (impersonation)
- Lisansları iptal edebilir, işletmeleri silebilir
- Ödeal, Getir, Trendyol entegrasyon anahtarlarını görebilir

Yani bu tek yetkinin güvenliği, tüm müşteri tabanının güvenliğine eşit. Şu anki koruma seviyesi bu riskin altında.

---

## 2. Mevcut durum — bulunan açıklar

Aşağıdakiler kod taramasıyla doğrulanmış, varsayım değil.

### 🔴 K1 — Yönetici anahtarı aylarca herkese açıktı

`ADM257SA67` anahtarı `page.tsx`, `TopBar.tsx` ve `SuperAdmin.tsx` dosyalarında sabit yazılıydı. Bu dosyalar tarayıcıya giden JavaScript paketine dahil. Yani uygulamayı açan **herkes** paketin içinde arama yapıp anahtarı okuyabilirdi.

Anahtar koddan kaldırıldı, ancak **daha önce yayınlandığı için ele geçmiş sayılmalı.**

**Kapatma:** `supabase/migrations/20260720_rotate_admin_key.sql` çalıştırılacak. Yeni anahtar üretimi: `openssl rand -hex 16`.

**Durum:** SQL hazır, henüz çalıştırılmadı.

---

### 🔴 K2 — Kaba kuvvet (brute force) koruması yok

`components/Auth/LicenseGate.tsx`, `find_tenant_by_license` RPC'sini **doğrudan tarayıcıdan, anon anahtarla** çağırıyor. Aradaki sunucu katmanı yok, deneme sayısı sınırı yok, gecikme yok, hesap kilitleme yok.

Bu şu demek: bir saldırgan basit bir betikle saniyede yüzlerce lisans anahtarı deneyebilir. Sadece yönetici anahtarı için değil, **her müşterinin** anahtarı için geçerli.

Panel artık `admin.jetpos.shop` gibi tahmin edilebilir bir adreste olduğu için bu saldırının hedefi de belli.

**Kapatma:**

1. Lisans doğrulamayı doğrudan RPC yerine bir API route'una taşı (`/api/auth/license`), böylece sunucu tarafında sayaç tutulabilir.
2. IP başına dakikada en fazla 5 deneme; aşılırsa artan gecikme (1 dk → 5 dk → 30 dk).
3. Aynı IP'den 20 başarısız denemeden sonra o IP'yi 24 saat blokla.
4. Başarısız denemeleri `audit_log` tablosuna yaz (IP, zaman, denenen anahtarın ilk 4 karakteri — **tamamını asla loglama**).

Projede bu deseni zaten kullanan örnek var: `lib/odeal/odeal-auth.ts` içindeki `rateLimited()` fonksiyonu.

---

### 🔴 K3 — Kimlik tek faktörlü ve paylaşımlı

Şu an yönetici kimliği = **tek bir metin dizesi**. Bunun sonuçları:

- Kullanıcı kavramı yok — kimin ne yaptığı ayırt edilemiyor
- İkinci faktör yok — anahtar sızarsa hiçbir engel kalmıyor
- İptal edilebilirlik yok — bir çalışan ayrılırsa anahtarı değiştirmekten başka yol yok, o da herkesi etkiliyor
- Anahtar `localStorage`'da açık duruyor

**Kapatma (kalıcı çözüm):** Yönetici girişini Supabase Auth'a taşı:

- E-posta + parola ile gerçek kullanıcı hesapları
- **TOTP tabanlı iki faktörlü doğrulama** (Google Authenticator vb.) — Supabase Auth bunu yerleşik destekliyor
- Her yöneticinin ayrı hesabı, ayrı denetim izi
- Ayrılan kişinin hesabı tek tıkla kapatılır

Bu, listedeki en büyük iş ama en yüksek getirili olan. Lisans anahtarı sistemi işletmeler için kalabilir; **yönetici katmanı ayrı ve gerçek kimlik doğrulamaya geçmeli.**

---

### 🟠 K4 — Oturum hiç sona ermiyor

Giriş bilgileri `localStorage`'a yazılıyor ve süresiz kalıyor. Yönetici bir kez giriş yaptıktan sonra o tarayıcı sonsuza kadar yetkili. Bilgisayar çalınır, ödünç verilir ya da ortak kullanılırsa yetki devam eder.

**Kapatma:**

- Yönetici oturumuna süre koy: **8 saat hareketsizlik → otomatik çıkış**
- Oturum bilgisini `localStorage` yerine `sessionStorage`'da tut (tarayıcı kapanınca silinir)
- Panelde görünür bir "Tüm cihazlardan çıkış yap" düğmesi

---

### 🟠 K5 — Sunucu tarafında sabit anahtar

`lib/server-tenant-auth.ts` içinde `SUPER_ADMIN_KEY = 'ADM257SA67'` sabiti duruyor. Bu dosya tarayıcıya gitmiyor (yalnızca API route'larından import ediliyor), dolayısıyla **sızıntı riski yok**. Ancak anahtarı kodda tutmak, her değiştirmede yeni dağıtım gerektiriyor.

**Kapatma:** `ADMIN_SECRET_TOKEN` ortam değişkenine taşı. Böylece anahtar rotasyonu koda dokunmadan, Vercel panelinden yapılabilir hale gelir.

---

### 🟠 K6 — Panel internete tamamen açık

`admin.jetpos.shop` şu an dünyanın her yerinden erişilebilir. Tek engel lisans anahtarı.

Seçenekler ve dürüst değerlendirme aşağıda, **bölüm 3**'te.

---

### 🟡 K7 — Yönetici işlemleri denetlenmiyor

Projede `auditLog()` fonksiyonu var ve satışlarda kullanılıyor, ancak yönetici işlemleri (lisans iptali, işletme silme, oturuma geçme, entegrasyon anahtarı görüntüleme) kaydedilmiyor.

Bir olay yaşandığında "ne oldu, kim yaptı, ne zaman" sorusunun cevabı yok.

**Kapatma:** Şu işlemleri zorunlu logla — işletme oluşturma/silme, lisans durumu değişikliği, impersonation başlatma/bitirme, entegrasyon kimlik bilgisi okuma/yazma, yönetici girişi (başarılı ve başarısız).

---

### 🟡 K8 — Güvenlik başlıkları eksik

Yönetici alan adına özel katı başlıklar yok: `X-Frame-Options: DENY` (clickjacking), `Strict-Transport-Security`, katı `Content-Security-Policy`, `Referrer-Policy: no-referrer`.

**Kapatma:** `next.config.js` içinde host bazlı başlık kuralları.

---

### 🔵 K9 — Depo dışı sızıntılar

Bu dokümanın kapsamı dışında ama aynı hesabı etkiliyor:

- **GitHub kişisel erişim token'ı `.git/config` içinde açık metin.** İptal edip yenile, kimlik doğrulamayı credential manager'a bırak.
- **`openrouter_api_key` istemciye gönderiliyor** (`tenant-context.tsx` içinde tenant nesnesine ekleniyor). AI çağrıları sunucu tarafına taşınmalı, anahtar tarayıcıya hiç inmemeli.

---

## 3. Büyük markalar nasıl yapıyor — sektör modeli

"Herkese açık internetten girilemesin" talebinin sektördeki gerçek karşılığına bakalım, çünkü cevap sanılanın tersi.

### 3.1 Hiçbiri IP kısıtına güvenmiyor

**Shopify** — mağaza yönetim paneli `admin.shopify.com`, dünyanın her yerinden erişilebilir. Koruma: parola + 2FA + cihaz tanıma + şüpheli giriş uyarısı + hız sınırı. Milyonlarca mağaza bu modelle çalışıyor. ikas ve Ticimax da aynı modeli kullanır: panel herkese açık adreste, güvenlik girişte.

**Google** — 2017'de tüm çalışanlarını fiziksel güvenlik anahtarına (YubiKey benzeri) geçirdi; o günden beri hesap ele geçirme amaçlı başarılı phishing raporlamadı. Daha da ileri gidip **BeyondCorp** mimarisini yayınladı: kurumsal VPN'i bile kaldırdılar, her istek ağdan bağımsız olarak kimlik + cihaz durumuyla doğrulanıyor.

**Meta/Instagram, Amazon** — çalışan panellerinde SSO + zorunlu donanım anahtarı. Ağ konumu bir güven kaynağı değil.

**Stripe ve bankacılık panelleri** — internete açık; 2FA + kısa oturum + anomali tespiti + her işlemin denetim kaydı.

### 3.2 Neden böyle? "Zero Trust" ilkesi

Sektörün vardığı sonuç şu: **ağ çevresi her zaman delinir.** VPN'li saldırgan içeri girer, ofis ağındaki bir bilgisayar ele geçirilir, IP listesindeki bir adres el değiştirir. Bu yüzden modern güvenlik mimarisi "ağa değil, kimliğe güven" (Zero Trust) ilkesine geçti:

> Erişim kararı, isteğin NEREDEN geldiğine değil, KİMİN yaptığına ve isteği yapanın bunu kanıtlayabilmesine dayanır.

IP kısıtının ayrıca pratik bir tuzağı var: **yanlış güven hissi.** "Panel IP'li, gerisi önemsiz" düşüncesi, asıl korumaların (2FA, hız sınırı, denetim) ihmal edilmesine yol açar. Çevre delindiğinde içeride hiçbir savunma kalmaz.

### 3.3 Bu modelin JetPos'a uyarlanmış EN GÜVENLİ hali

Aşağıdaki mimari, yukarıdaki şirketlerin yaklaşımının bizim ölçeğimizdeki tam karşılığı. Katmanlar sırayla; her biri bir öncekinin delinmesi ihtimaline karşı var.

**Katman 1 — Kimlik: Supabase Auth + zorunlu TOTP 2FA**
Paylaşımlı lisans anahtarı yönetici girişi olmaktan tamamen çıkar. Her yöneticinin e-posta + parola hesabı olur ve **2FA'sız hesap panele giremez** (kurulumu atlanamaz, zorunlu). Kod tabanı büyüyünce bir üst adım: TOTP yerine **WebAuthn/passkey** (fiziksel anahtar veya Face/Touch ID) — Google'ın sıfır-phishing sonucunu veren teknoloji bu ve Supabase Auth destekliyor.

**Katman 2 — Giriş yüzeyi: hız sınırı + kilitleme + sayma yok**
IP başına dakikada 5 deneme, artan gecikme, 20 hatada 24 saat blok. Hatalı girişte "anahtar mı yanlış, hesap mı yok" ayrımı verilmez (hesap keşfini engeller). Başarısız girişler loglanır.

**Katman 3 — Oturum: kısa ömür + tek oturum**
8 saat hareketsizlikte düşer; `sessionStorage` (tarayıcı kapanınca biter); "tüm cihazlardan çıkış" düğmesi; kritik işlemler (işletme silme, anahtar görüntüleme) öncesi **2FA kodunu yeniden sorma** (step-up authentication — bankaların havale onayında yaptığı şey).

**Katman 4 — Yetki: RLS + en az yetki**
Zaten mevcut olan taban: veri erişimi veritabanında RLS ile zorlanıyor, arayüz sadece görünüm. Ek olarak yönetici rolleri ayrıştırılabilir (tam yetkili / yalnızca-okuma destek hesabı) — destek personeline tam yetki vermemek için.

**Katman 5 — Gözlemlenebilirlik: her şey iz bırakır**
Tüm yönetici işlemleri denetim kaydına düşer (kim, ne, ne zaman, hangi IP). Yeni cihazdan/ülkeden girişte yöneticinin e-postasına uyarı gider. Denetim kaydı yöneticiler tarafından silinemez.

**Katman 6 (isteğe bağlı) — Ağ: IP listesi EK katman olarak**
Sabit IP'li bir ofis varsa, yukarıdakilerin ÜSTÜNE IP listesi eklenebilir. Ama tek başına asla — ve acil erişim yolu (Vercel panelinden env değişkenini güncelleme) her zaman hazır olmalı. Not: 2FA + WebAuthn doğru kurulduysa bu katmanın kattığı ek güvenlik küçüktür; asıl değeri paneli taramalardan görünmez kılmasıdır (eşleşmeyen IP'ye 404).

Bu altı katmanın tamamı kurulduğunda ulaşılan nokta: **anahtar sızsa girilemez (2FA), deneme yapılamaz (hız sınırı), oturum çalınsa kısa ömürlü, yetki aşılsa RLS durdurur, her şey iz bırakır.** Shopify/Stripe sınıfı koruma budur ve panelin internete açık olması artık bir zafiyet değildir.

---

## 3-ek. Erişim kısıtlama seçenekleri (özet karşılaştırma)

### Seçenek A — Sabit IP listesi (allowlist)

Yalnızca belirlenen IP adreslerinden erişime izin verilir. Diğer herkes paneli **hiç göremez**, giriş ekranı bile açılmaz.

**Nasıl:** `client/src/middleware.ts` oluşturulur; host `admin.` ile başlıyorsa istek IP'si (`x-forwarded-for`) ortam değişkenindeki listeyle karşılaştırılır, eşleşmezse 404 döner. (404, "burada bir şey yok" demek olduğu için 403'ten daha iyidir — panelin varlığını bile ele vermez.)

Vercel'de IP başlığı platform tarafından set edildiği için taklit edilemez.

**Artısı:** En güçlü koruma. Anahtar sızsa bile dışarıdan girilemez.

**Eksisi — ve bu ciddi:** Sen bir POS sağlayıcısısın. Müşteri ziyaretinde, evden, telefondan, tatildeyken panele girmen gerekebilir. Sabit IP'n yoksa (çoğu ev/işyeri internetinde IP dinamiktir, zamanla değişir) **kendini kilitlersin.** Ayrıca IP değişince fark etmen zordur; panel bir gün aniden 404 vermeye başlar.

**Uygunsa:** Ofisinde sabit IP'li bir internet aboneliğin varsa ve panele hep oradan giriyorsan.

### Seçenek B — İki faktörlü doğrulama (2FA)

Panel internete açık kalır ama anahtar tek başına yetmez; telefondaki uygulamadan üretilen 6 haneli kod da gerekir.

**Artısı:** Her yerden erişebilirsin, kilitlenme riski yok. Anahtar sızsa bile telefon olmadan girilemez. Sektör standardı çözüm.

**Eksisi:** Panelin varlığı gizlenmez; giriş ekranı herkese görünür (ama içeri girilemez).

### Seçenek C — İkisi birden (önerilen)

Sabit IP listesi **birincil** koruma, 2FA **her durumda** aktif. Listeye ofis IP'ni ve bir de "acil durum" yolu ekle (örneğin yalnızca 2FA ile geçilebilen ikinci bir gizli adres).

---

### Benim önerim

**Önce Seçenek B (2FA), sonra istersen A.**

Sebep: sabit IP kısıtı, elindeki gerçek riski (sızmış anahtar) 2FA kadar iyi kapatır ama **kendini kilitleme riski taşır** ve POS destek işinin doğasına ters. Önce 2FA'yı kur — riskin büyük kısmı kapanır, hiçbir esneklik kaybetmezsin. Ofiste sabit IP varsa üstüne IP listesini de ekleriz, o zaman iki katman olur.

Acil ve geçici bir önlem istersen, IP listesini **bugün** koyup 2FA hazır olunca gevşetebiliriz — ama o zaman IP'nin değişmesi ihtimaline karşı Vercel paneline erişimin olduğundan emin ol (oradan ortam değişkenini güncelleyip kendini geri alabilirsin).

---

## 4. Uygulama sırası

Etkiye göre sıralanmış. Üstteki üçü aynı hafta içinde yapılmalı.

| # | İş | Süre | Öncelik |
|---|---|---|---|
| 1 | Yönetici anahtarını değiştir (SQL hazır) | 10 dk | 🔴 Bugün |
| 2 | Sunucu anahtarını `ADMIN_SECRET_TOKEN` env'ine taşı | 30 dk | 🔴 Bugün |
| 3 | Lisans girişine hız sınırı + kilitleme | 3-4 saat | 🔴 Bu hafta |
| 4 | Yönetici oturumuna süre sınırı | 1-2 saat | 🟠 Bu hafta |
| 5 | Yönetici işlemleri denetim kaydı | 2-3 saat | 🟠 Bu hafta |
| 6 | Güvenlik başlıkları (host bazlı) | 1 saat | 🟠 Bu hafta |
| 7 | IP listesi (isteğe bağlı, bkz. bölüm 3) | 2 saat | 🟠 Karar bekliyor |
| 8 | Supabase Auth + zorunlu TOTP 2FA'ya geçiş (Katman 1) | 2-3 gün | 🔴 Bu ay |
| 9 | GitHub token'ını iptal et ve yenile | 15 dk | 🔵 Bu hafta |
| 10 | `openrouter_api_key`'i sunucuya taşı | 3-4 saat | 🔵 Bu ay |
| 11 | Kritik işlemlerde 2FA yeniden sorma (step-up) | 1 gün | 🟡 2FA sonrası |
| 12 | Yeni cihaz/konum girişinde e-posta uyarısı | 3-4 saat | 🟡 2FA sonrası |
| 13 | Yönetici rol ayrımı (tam / yalnızca-okuma) | 1-2 gün | 🟡 Ekip büyüyünce |
| 14 | WebAuthn/passkey desteği (TOTP'nin üstüne) | 1-2 gün | 🟢 Uzun vade |

**Not:** 8 numaralı madde listedeki en büyük iş ama kalıcı çözüm o. 1-7 arası, o gelene kadar riski yönetilebilir seviyeye indiren ara önlemler. 11-14, bölüm 3.3'teki "en güvenli hal"i tamamlayan katmanlar — 8 bittikten sonra sırayla.

---

## 5. Kontrol listesi

- [ ] Yeni yönetici anahtarı üretildi (`openssl rand -hex 16`) ve parola yöneticisine kaydedildi
- [ ] `20260720_rotate_admin_key.sql` Supabase'de çalıştırıldı
- [ ] `server-tenant-auth.ts` env değişkenine geçirildi, Vercel'e değişken eklendi
- [ ] Yeni anahtarla `admin.jetpos.shop`'a giriş doğrulandı
- [ ] Lisans girişine hız sınırı eklendi ve test edildi (6. denemede engellenmeli)
- [ ] Yönetici oturumu 8 saat sonra düşüyor
- [ ] Yönetici işlemleri `audit_log`'a düşüyor
- [ ] Güvenlik başlıkları yönetici alan adında aktif
- [ ] IP listesi kararı verildi (uygulandı / uygulanmadı)
- [ ] 2FA devreye alındı ve **2FA'sız yönetici girişi mümkün değil**
- [ ] Kritik işlemler step-up doğrulama istiyor
- [ ] Yeni cihaz girişinde e-posta uyarısı geliyor
- [ ] GitHub token'ı iptal edildi ve yenilendi
- [ ] `openrouter_api_key` artık tarayıcıya inmiyor
- [ ] Eski anahtarın (`ADM257SA67`) hiçbir yerde çalışmadığı doğrulandı

---

## 6. Son not

Bu listedeki maddelerin çoğu "bir gün lazım olur" türü değil. K1 (sızmış anahtar) ve K2 (kaba kuvvet koruması yok) **şu anda birlikte sömürülebilir durumda**: anahtar geçmişte yayınlandı, deneme sınırı yok ve panelin adresi artık belli. Üçü bir arada.

İlk iki maddeyi bugün kapatmak, geri kalan her şeyden daha önemli.
