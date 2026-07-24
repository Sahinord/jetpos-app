# JetPos — Terazi (Tartı) Entegrasyon Planı

**Tarih:** 20 Temmuz 2026
**Kapsam:** Barkodlu/barkod basan terazi + kasaya bağlı terazi, kg bazlı ürünler, ağırlık gömülü barkod, fiyat etiketi
**Kullanım örneği:** Manav, kasap, şarküteri, kuruyemiş — "tartıya koy → etiket çıkar → kasada barkodu okut → hızlı satışa düşsün"

---

## 1. Önce iki terazi türünü ayıralım

Sektörde "terazi entegrasyonu" iki çok farklı şeyi kastediyor. İkisi ayrı iş, ayrı akış:

### Tür A — Barkod Basan Terazi (Label-printing scale)
Reyonda durur. Personel malı koyar, ürüne basar, terazi **ağırlık + fiyatı gömülü bir barkod etiketi** basar. Müşteri malı kasaya getirir, kasiyer o barkodu okutur, ürün ağırlık ve fiyatıyla **otomatik sepete düşer.**
- Örnek cihazlar: Dijital/Desis/Baykon/CAS reyon terazileri
- **Entegrasyon noktası: barkod formatı.** Terazi ile JetPos konuşmaz; ortak dil bastığı barkoddur.
- Manav/kasap için **en yaygın** senaryo budur.

### Tür B — Kasaya Bağlı Terazi (POS scale)
Kasanın yanında durur, POS'a kabloyla bağlıdır. Kasiyer ürünü seçer, "Tart" der, **canlı ağırlık** terazi ekranından okunur, fiyat anında hesaplanır.

- Örnek cihazlar: CAS PD-II, tezgah terazileri
- **Entegrasyon noktası: seri port okuma** (Web Serial).
- Küçük dükkân / tek kasa senaryosu.

**Çoğu manav ikisini birden ister:** reyonda A, kasada B. Plan ikisini de kapsıyor ama **Tür A önce** — daha yaygın ve mevcut kodda hiç yok.

---

## 2. Mevcut durum — kod taramasının sonucu

### ✅ Zaten var
- **`readScaleWeight()`** (`client/src/lib/hardware.ts`) — Web Serial ile canlı ağırlık okuyor (CAS protokolü, 9600 baud). **Tür B'nin temeli hazır.**
- **`unit: 'Adet' | 'KG'`** — ürünlerde birim alanı var, ProductModal'da seçilebiliyor
- **KG bazlı hesaplama** — `calculations.ts` ağırlıklı ürünleri ayrı topluyor (`totalStockKg`)
- **`printBarcodeLabel()` + `ProductLabelDesigner.tsx`** — barkod etiketi basma ve tasarım aracı var

### ❌ Hiç yok — asıl eksik burası
- **Ağırlık gömülü barkod ayrıştırma:** Taramada `weight-embedded barcode` / `2x prefix` mantığı için **sıfır eşleşme.** Yani terazinin bastığı barkodu kasa okuttuğunda içindeki ağırlık/fiyat çözülemiyor. **Tür A'nın kalbi eksik.**
- **Terazi barkod formatı ayarı** — hangi önek, kaç hane PLU, kaç hane ağırlık/fiyat: tanımlanamıyor
- **Reyon terazisine ürün/PLU aktarımı** — teraziye ürün listesi yüklemek
- **kg ürünü POS'ta canlı tartma butonu** — `readScaleWeight` var ama POS akışına bağlı değil
- **Mobilde** terazinin hiçbiri yok (Web Serial mobil tarayıcıda zaten çalışmaz — bu bilinçli sınır)

---

## 3. Tür A — Ağırlık Gömülü Barkod (asıl iş)

### 3.1 Nasıl çalışır

Terazinin bastığı barkod EAN-13'tür ama içine anlam gömülüdür. Türkiye'de yaygın format:

```
2 8 P P P P P A A A A A C
│ │ └──┬──┘ └──┬──┘ └ kontrol hanesi
│ │    │       └ ağırlık (gram) VEYA fiyat (kuruş) — 5 hane
│ │    └ ürün kodu / PLU — 5 hane
│ └ format öneki (ağırlık mı fiyat mı)
└ mağaza içi barkod öneki (genelde 2)
```

İki değişken var:
- **Ağırlık gömülü:** barkodda gram yazar, fiyatı JetPos ürünün kg fiyatından hesaplar
- **Fiyat gömülü:** barkodda TL yazar, JetPos direkt kullanır (terazi zaten hesaplamış)

**Örnek (ağırlık gömülü):** `28 00042 01500 C` → PLU 42, 1500 gram = 1.5 kg. JetPos PLU 42'yi bulur, kg fiyatı 80 TL ise → 120 TL, sepete düşer.

### 3.2 Yapılacaklar

**a) Ürüne PLU alanı**
`products` tablosuna `plu_code` (kısa sayısal kod). Terazi 13 haneli barkod değil, 4-5 haneli PLU kullanır. Ürün ↔ PLU eşlemesi bununla kurulur.

**b) Barkod format ayarı** (SuperAdmin ya da işletme ayarı)
Her terazi markası farklı format kullandığı için sabitlenemez, ayarlanabilir olmalı:
```
{ prefix: "28", pluDigits: 5, valueDigits: 5, valueType: "weight"|"price", weightUnit: "gram" }
```

**c) Barkod ayrıştırıcı** — `lib/scale-barcode.ts`
Okutulan barkod ayara uyuyorsa (önekle başlıyorsa) PLU + ağırlık/fiyatı çöz, uymuyorsa normal barkod muamelesi yap. **Tek fonksiyon, saf mantık, kolay test edilir.**

**d) POS'a bağla**
Barkod dinleyici (zaten var, `barcodeMapRef`) önce ayrıştırıcıdan geçirsin. Terazi barkoduysa: PLU'dan ürünü bul, ağırlığı `quantity` yap, sepete ekle. Kasiyer hiçbir şey yapmadan ürün ağırlığıyla düşer — **"hızlı satışa düşmesi" tam olarak bu.**

### 3.3 Reyon terazisine ürün aktarımı (opsiyonel, 2. faz)
Reyon terazisinin PLU'ları JetPos'takiyle aynı olmalı. İki yol:
- **Elle:** işletme teraziyi kendi yazılımından yükler, JetPos'ta sadece aynı PLU'yu girer (basit, çoğu işletme böyle yapıyor)
- **Otomatik:** JetPos ürün listesini terazinin istediği dosya formatında (genelde CSV/TXT) dışa aktarır, işletme teraziye yükler (marka bağımlı, ayrı iş)

İlk fazda **elle** yeterli; otomatik aktarım markaya göre sonra eklenir.

---

## 4. Tür B — Kasaya Bağlı Terazi (canlı tartma)

Temel hazır (`readScaleWeight`), sadece POS'a bağlanacak.

**Yapılacaklar:**
- kg birimli ürüne tıklanınca miktar sormak yerine **"Teraziden Tart"** seçeneği çıksın
- `readScaleWeight()` çağrılsın, gelen kg `quantity` olsun, fiyat = kg fiyatı × ağırlık
- Terazi bağlı değilse elle kg girme her zaman açık kalsın (yedek)
- Terazi portu bir kez seçilip hatırlansın (her tartışta port seçtirme)

**Sınır:** Web Serial yalnızca masaüstü Chrome/Electron'da çalışır. Yani Tür B **sadece masaüstü/PC kasada** olur, mobilde olmaz. Mobilde kg ürün için elle giriş ya da Tür A barkodu kullanılır. Bu teknik bir sınır, tasarım tercihi değil.

---

## 5. Fiyat etiketi düzenlemeleri

`ProductLabelDesigner.tsx` zaten var. kg ürünler için eklenecekler:

- Etikette **birim fiyat** gösterimi ("₺/kg") — kg ürünlerde zorunlu alan
- Ağırlık gömülü barkod **üretimi** (sadece okuma değil): işletme kendi etiketini bastırmak isterse JetPos da bu formatta barkod çizebilmeli
- Etiket şablonunda kg/adet ayrımı — kg ürün etiketi farklı düzen (birim fiyat + ağırlık alanı)

---

## 6. kg bazlı ürünlerde dikkat edilecekler

Bunlar entegrasyondan bağımsız ama kg satış doğru çalışsın diye şart:

- **Stok kg tutulmalı** — `stock_quantity` kg ürünlerde ondalıklı (1.5 kg). Kod `toFixed(3)` kullanıyor, iyi.
- **Stok düşme ondalık** — `decrement_stock` RPC'si `decimal` alıyor (kontrol ettim, uyumlu)
- **Ödeal'e giden sepet:** kg ürün `unitCode: "KGM"` gitmeli (`C62` = adet). Şu an hepsi C62 gidiyor — **bunu düzeltmek gerek**, yoksa Ödeal fişinde birim yanlış çıkar
- **Fiş görünümü:** "1.5 kg × ₺80 = ₺120" formatı, "1.5 adet" değil
- **Para üstü/yuvarlama** — kg × fiyat küsuratlı çıkar, kuruş yuvarlaması net olmalı

---

## 7. Uygulama sırası

| Faz | İş | Neden önce | Süre |
|---|---|---|---|
| **1** | `plu_code` alanı + migration | Her şeyin temeli | 0.5 gün |
| **1** | `scale-barcode.ts` ayrıştırıcı + testler | Tür A'nın kalbi | 1 gün |
| **1** | Barkod format ayarı (işletme ayarı) | Marka bağımsızlık | 0.5 gün |
| **1** | POS'a bağla (client) — barkod → sepet | "Hızlı satışa düşmesi" | 1 gün |
| **2** | Ödeal kg birim kodu (KGM) düzeltmesi | Fiş doğruluğu | 0.5 gün |
| **2** | Tür B — POS'a canlı tartma butonu | Kasa terazisi | 1 gün |
| **2** | Etiket: birim fiyat + kg düzeni | Fiyat etiketi | 1 gün |
| **3** | Ağırlık barkodu **üretimi** (kendi etiketi) | İşletme kendi bassın | 1 gün |
| **3** | Reyon terazisine PLU dışa aktarım | Marka bağımlı | 1-2 gün |
| **1** | Doğrulama (barkod ayrıştırma birim testleri) | Kritik — yanlış fiyat = para kaybı | 0.5 gün |

**Faz 1 (çekirdek): ~4 gün** — barkodlu teraziyle çalışan bir manav/kasap bununla satış yapabilir.
**Faz 2: ~2.5 gün** — kasa terazisi + etiket + Ödeal düzeltmesi.
**Faz 3: marka bağımlı** — ihtiyaç doğdukça.

---

## 8. Kritik uyarı: yanlış barkod = yanlış fiyat = para kaybı

Terazi barkodu doğrudan paraya çevriliyor. Bir ayrıştırma hatası (yanlış hane, yanlış çarpan, kontrol hanesi atlanması) her satışta yanlış tutar demek. Bu yüzden:

- **Kontrol hanesi (checksum) doğrulanmalı** — barkod bozuksa sepete düşürme, uyar
- **Ayrıştırıcı için kapsamlı birim testi** — gerçek barkod örnekleriyle (ağırlık gömülü + fiyat gömülü + normal barkod karışık)
- **Pilot işletmede ilk gün gözlemli** — birkaç tartımı elle doğrula
- **Format ayarı yanlışsa fark edilir olmalı** — "PLU bulunamadı" sık çıkıyorsa format yanlıştır, sessizce 0 TL geçme

---

## 9. Karar bekleyen sorular

1. **Hangi terazi markası?** Format öneki ve hane yapısı markaya göre değişir. Pilot işletmenin terazisinin markası/modeli ve örnek bir barkod fotoğrafı, formatı kesinleştirir. **Bu olmadan ayrıştırıcı tahmine dayanır.**
2. **Ağırlık gömülü mü, fiyat gömülü mü?** Terazi gramı mı yazıyor yoksa fiyatı zaten hesaplayıp TL mi basıyor? (İkisini de destekleyeceğiz ama pilotun hangisi olduğunu bilmek test için lazım.)
3. **Reyon terazisi mi, kasa terazisi mi, ikisi de mi?** Önceliği belirler.
4. **PLU eşlemesi elle mi yeter, otomatik aktarım şart mı?** İlk faz elle; otomatik gerekiyorsa marka SDK'sı araştırılmalı.

**En kritik olan 1. soru.** Pilot terazinin bir barkod fotoğrafını gönderirsen formatı birebir çözerim, ayrıştırıcı tahminle değil gerçek veriyle yazılır.
