# Platform Stok / Satışta Durumu Senkron Planı

**Tarih:** 20 Temmuz 2026
**İstek:** Her platform için ayrı stok entegrasyonu; Trendyol'da sayısal stok, Getir & Yemeksepeti'nde adet yok → ürün varsa "satışta/aktif", bitince "offline". Anlık (event-driven), ama yalnızca entegrasyon bağlıysa. Bir de "hangi üründe hangi platformda aktif satışta" gösteren alan.

---

## 1. Üç farklı model — tek çatı altında

Kullanıcının dediği gibi **hepsi ayrı sistem.** Doğru kurmanın yolu, platformları modeline göre ayırmak:

| Platform | Model | Ne gönderilir |
|---|---|---|
| Trendyol Pazaryeri | **Sayısal stok** | adet + fiyat (`price-and-inventory`) — MEVCUT |
| Trendyol GO | **Sayısal stok** | adet + fiyat (grocery `price-and-inventory`) — MEVCUT |
| **Getir Çarşı** | **Var/Yok (availability)** | ürün aktif / offline — **YOK, kurulacak** |
| **Yemeksepeti** | **Var/Yok (availability)** | ürün available true/false — **YOK, kimlik bekliyor** |

**Availability mantığı (Getir + Yemeksepeti):**
```
JetPos stok > 0  VE  platform_prices[x].active == true   →  o platformda AKTİF (satışta)
JetPos stok <= 0  (ya da active=false)                    →  o platformda OFFLINE
```
Yani adet göndermiyoruz; sadece "aç/kapa" sinyali.

---

## 2. Ayarlar — platform başına AYRI açık/kapalı

İstenen: "Yemeksepeti / Getir / Trendyol stok entegrasyonu yapılsın mı" — ayrı ayrı.

Her platformun kendi bayrağı (`tenants.settings` altında):
```
stock_sync: {
  trendyol:     true|false,   // sayısal
  trendyol_go:  true|false,   // sayısal
  getir:        true|false,   // availability
  yemeksepeti:  true|false,   // availability
}
```

- Trendyol GO'da bu bayrak zaten var (`isStockSyncActive`) — çatıya alınacak.
- Getir + Yemeksepeti için yeni toggle'lar eklenecek.
- **Kapalıysa hiçbir şey gönderilmez** (kullanıcı "biz bağlayınca güncelleyecek" dedi — bağlı + açık olmadan sinyal gitmez).

---

## 3. Anlık tetikleme (event-driven)

Kullanıcı "anlık olsun" dedi. Tetikleyici: **ürünün stoğu değişince.**

Bunun olduğu yerler (ikisi de kapsanmalı):
- **Online satış** (`create_pos_invoice` → stok düşer)
- **Offline satış** (sync olunca stok düşer)
- Alış faturası / stok girişi (stok artar → geri aktif)
- Elle stok düzenleme

**Mimari — güvenli yol:**
Satış anına ağır API çağrısı KOYMAYIZ (POS akışı asla yavaşlamamalı — projede altın kural). Bunun yerine:

1. Stok değişince ürün bir **"availability outbox"** (bekleyen değişiklik kuyruğu) satırına işaretlenir — hafif, sadece DB.
2. Ayrı bir işleyici (kısa aralıklı ya da anlık tetiklenen) outbox'ı okur, ilgili platforma aç/kapa sinyalini gönderir.
3. Böylece satış anında sadece 1 satır yazılır; asıl API çağrısı arka planda olur → "anlık" ama POS'u bloklamaz.

Alternatif basit yol (ilk sürüm): stok değişiminde Supabase realtime + hafif bir sunucu ucu tetikler. Outbox daha sağlam; ilk sürümde ikisinden biriyle başlanır.

---

## 4. "Aktif satıştaki ürünler" alanı

Her platform için "şu an kaç ürün / hangi ürünler satışta aktif" görünümü.

**Kaynak (hesaplama, ekstra tablo gerekmez):**
- Bir ürün X platformunda **aktif** = `platform_prices[x].active == true` AND (Trendyol için stok>0 ya da sync kapalıysa her zaman) AND (Getir/YS için stok>0)
- Widget/panelde platform sekmeleri: "Trendyol'da 1.240 aktif · Getir'de 890 aktif · Yemeksepeti'nde 0" gibi
- Tıklayınca o platformda aktif/pasif ürün listesi + offline olanların sebebi (stok 0 mı, kapalı mı)

**Yer:** Her platformun entegrasyon panelinde bir "Satıştaki Ürünler" sekmesi (mevcut widget'lara eklenir).

---

## 5. Yapılacaklar (dilimler)

| # | Dilim | İçerik | Ön koşul |
|---|---|---|---|
| 1 | **Ayar toggle'ları** | Platform başına stok-sync aç/kapa (settings) | — |
| 2 | **Availability alanı DB** | `platform_availability` outbox + hesap görünümü | — |
| 3 | **Getir availability push** | Getir Çarşı ürün aç/kapa API ucu | **Getir dokümanı teyidi** |
| 4 | **Yemeksepeti availability push** | Catalog/inventory ile available true/false | **YS kimliği** |
| 5 | **Event tetikleyici** | Stok değişince outbox'a yaz (online+offline satış) | 2 |
| 6 | **Outbox işleyici** | Kuyruğu platforma gönder (sync açıksa) | 1,3,4,5 |
| 7 | **"Satıştaki Ürünler" görünümü** | Platform başına aktif/pasif liste + sayaç | 2 |
| 8 | Doğrulama | tsc + gerçek cihaz/sipariş testi | — |

**1. dilim (ayar toggle'ları) hemen yapılabilir** — kimlik/doküman beklemez.
**3-4. dilimler bloklu:** Getir'in ürün availability ucunu doküman teyidi ister; Yemeksepeti kimliği gelmeli.

---

## 6. Kritik uyarılar

- **POS akışı asla bloklanmamalı.** Availability push satış anında senkron çağrı OLMAYACAK — outbox deseni şart. Yanlış kurulursa her kartlı/nakit satış platform API'sini beklemeye başlar.
- **Yanlış offline = kayıp satış.** Stok 0 sanılıp offline çekilen ürün, aslında depoda varsa müşteri o platformda göremez. Stok kaynağı net olmalı (hangi depo? `warehouse_stock` mu ana `stock_quantity` mi). Platform mağazası bir warehouse olduğu için o mağazanın stoğu bakılmalı.
- **Getir availability ucu doğrulanmadan kodlanmamalı** — yoksa "gönderdik sandık, gitmedi" durumu olur (TGO Yemek'teki ⚠️ TEYİT durumunun aynısı).
- Her platform ayrı olduğu için tek bir "hepsini senkronla" butonu yanıltıcı olur; platform başına ayrı kontrol.

---

## 7. Kararlar

1. **Stok kaynağı: ✅ KARAR VERİLDİ — ana fiziksel stok (`products.stock_quantity`).**
   Tüm platformlar TEK fiziksel stoğu paylaşır. Trendyol'da satılınca da fiziksel
   stok düşer (ortak); fiziksel stok 0 olunca Getir/YS'de offline, >0 olunca aktif.
   Warehouse bazlı ayrım YOK — tek kaynak, basit.

## 7-b. Kalan karar
2. **Eşik:** "bitince offline" = stok `<= 0` mı, yoksa bir alt eşik (`<= min_quantity`) mı?
3. **İlk sürüm tetikleme:** Outbox mu, yoksa basit realtime tetik mi? (Önerim: outbox — sağlam.)

Bunlar netleşince 1-2. dilimden başlarım; 3-4 doküman/kimlik gelince.
