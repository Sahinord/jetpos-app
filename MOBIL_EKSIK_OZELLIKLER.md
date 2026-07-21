# JetPos Mobile — Client'ta Olup Mobilde Olmayan Özellikler

**Tarih:** 20 Temmuz 2026
**Yöntem:** `client/src/components/` klasörleri + masaüstü sekme listesi (`TopBar.tsx`) ile `jetpos-mobile/app/` rotalarının karşılaştırılması.

---

## 1. Önce bir çerçeve

Mobil, masaüstünün küçültülmüş kopyası değil — **sahada çalışan personel için** tasarlanmış bir PWA. Bu yüzden aşağıdaki listeyi "eksik iş" olarak değil, üç ayrı kategoride okumak lazım:

- 🟢 **Mobile ait** — sahada gerçekten lazım, eklenmeli
- 🟡 **Tartışmalı** — işletme tipine göre değişir
- ⚪ **Mobile ait değil** — masaüstünde kalması doğru

Şu an mobilde olanlar: POS, Adisyon, KDS, Ürünler, Alış Faturası, Cari, Kasa, Banka, Depo Transferi, Sayım, Az Stok, Dashboard, Entegrasyonlar, Scanner, Ayarlar.

---

## 2. 🟢 Mobile ait — öncelikli eksikler

### 2.1 Ödeal kartlı ödeme (EN KRİTİK)

Mobilde Ödeal entegrasyonu **hiç yok** — kod taramasında tek satır bile çıkmadı. Masaüstünde KART butonu sepeti fiziki cihaza gönderiyor, mobilde bu akış tamamen eksik.

Sahada kart ödemesi alınamıyorsa mobil POS yarım kalıyor. Pilot işletme canlıya geçtiğine göre bu artık ilk sıradaki iş.

**İş:** `/api/odeal/pay` + `/status` uçlarını mobile taşı (ya da client'ınkine yönlendir), KART butonunu bağla, realtime broadcast aboneliğini ekle.

### 2.2 Satış Geçmişi

Masaüstünde `history` sekmesi var; mobilde yok. Personel sattığı fişi göremiyor, iade/iptal yapamıyor. Sahada en çok istenecek şeylerden biri.

### 2.3 Çalışan PIN girişi ve vardiya

Masaüstünde `Employee/` (PIN ile giriş, yetki matrisi) ve `shift_manager` var. Mobilde çalışan katmanı yok — lisans + şifre girildikten sonra herkes her şeye erişiyor.

**Bu aynı zamanda bir güvenlik konusu:** telefonu eline alan herkes tam yetkili. Masaüstündeki PIN akışının mobile taşınması hem yetki hem denetim izi kazandırır.

### 2.4 Gider girişi

`Expenses/` masaüstünde var, mobilde yok. Sahada en doğal mobil işlerden biri (fiş fotoğrafı + tutar). Eksikliği belirgin.

### 2.5 Cari / Kasa / Banka — sadece görüntüleme

Üçü de mobilde **var ama yüzeysel** (150-175 satır, sadece liste). Masaüstünde her biri tam bir modül:

| Modül | Masaüstünde ayrıca olan |
|---|---|
| Cari | Borç/Alacak/Virman/Devir dekontu, bakiye, hareket, mutabakat, günlük hareket, analiz, grup ve özel kod tanımı |
| Kasa | Tahsil/Tediye/Virman/Devir fişi, oda tanımı, bakiye ve hareket raporu |
| Banka | Para çekme/yatırma, gelen/yapılan havale, virman, devir, bakiye ve hareket raporu |

Sahada muhtemelen hepsi gerekmez ama **en azından tahsilat girişi** (cari borç kapatma, kasa tahsil fişi) mobile ait — tahsilatçı personel bunu telefondan yapmalı.

---

## 3. 🟡 Tartışmalı — işletme tipine göre

### 3.1 İrsaliye modülü (`Waybill/`)

Masaüstünde 5 çeşit irsaliye var (alış, satış, satış iade, alış iade, sevk). Mobilde hiç yok. Depo/sevkiyat personeli varsa **sevk irsaliyesi** mobile çok yakışır; perakende dükkânda gereksiz.

### 3.2 Diğer fatura tipleri

Mobilde sadece Alış Faturası var. Masaüstünde ayrıca satış, perakende satış, iade, proforma, hizmet faturaları, fatura listesi, KDV listesi ve analiz raporu var. Sahada fatura kesilecekse en azından **satış faturası** eklenmeli.

### 3.3 Raporlar

`Reports/` (satış raporları), `Simulator/` (fiyat simülasyonu), `ai_insights` masaüstünde var. Mobil dashboard temel sayıları gösteriyor ama rapor yok. Patron telefondan bakacaksa değerli; kasiyer için gereksiz.

### 3.4 CRM ve sadakat

`CRM/` masaüstünde var. Mobilde müşteri seçimi POS içinde var ama CRM yönetimi yok.

### 3.5 QR Menü yönetimi

`QRMenu/` masaüstünde. Mobilde yok. Menü düzenleme telefondan yapılır mı, tartışılır.

---

## 4. ⚪ Mobile ait değil — masaüstünde kalmalı

Bunları eklemeye çalışmak zaman kaybı olur:

- **Etiket tasarımı** (`label_designer`) — tasarım işi, büyük ekran + yazıcı gerektirir
- **CFD müşteri ekranı** (`cfd`) — ikinci monitör özelliği
- **Vitrin tasarımı** (`Showcase/`) — aynı sebep
- **SuperAdmin** (`Admin/`) — zaten `admin.jetpos.shop`'a taşındı
- **Kurulum sihirbazı** (`Setup/`) — ilk kurulum masaüstünden yapılıyor
- **Araçlar** (`Tools/`: görsel dönüştürücü, döviz çevirici, QR üretici) — nice-to-have, öncelik yok
- **Mali takvim** (`Calendar/`) — masaüstü işi
- **Jetmatik** (`Jetmatik/`) — masaüstüne özel
- **Destek talepleri** (`Support/`) — masaüstünden yeterli

---

## 5. Önerilen sıra

Sahadaki gerçek kullanım sıklığına göre:

| # | İş | Neden | Tahmini |
|---|---|---|---|
| 1 | **Ödeal kartlı ödeme** | Mobil POS onsuz yarım | 1-2 gün |
| 2 | **Çalışan PIN + yetki** | Güvenlik + denetim izi | 1-2 gün |
| 3 | **Satış geçmişi + iade** | Personelin en sık ihtiyacı | 1 gün |
| 4 | **Tahsilat girişi** (cari/kasa) | Sahada tahsilat yapılıyorsa şart | 1-2 gün |
| 5 | **Gider girişi** | Doğal mobil iş | 1 gün |
| 6 | Satış faturası | Fatura kesiliyorsa | 1-2 gün |
| 7 | Sevk irsaliyesi | Depo/sevkiyat varsa | 1-2 gün |
| 8 | Raporlar (özet) | Patron kullanımı | 2 gün |

İlk üçü yaklaşık bir haftalık iş ve mobili "yarım POS"tan "sahada tek başına yeterli" seviyeye çıkarır.

---

## 6. Öncelik sırasını belirleyen soru

Bu listeyi kesinleştirmek için tek bir şey bilmek gerekiyor: **mobili kim kullanacak?**

- **Kasiyer/garson** → 1, 2, 3 yeter. Gerisi gürültü.
- **Depo/sevkiyat personeli** → 2, 7 öne çıkar; POS bile ikincil.
- **Saha tahsilatçısı** → 4 birinci sıraya geçer.
- **İşletme sahibi (mobil takip)** → 3, 8 öne çıkar; giriş ekranı bile farklı olmalı.

Şu an mobil hepsini birden olmaya çalışıyor. Hedef kullanıcıyı netleştirmek, yapılacak iş listesini yarıya indirir.
