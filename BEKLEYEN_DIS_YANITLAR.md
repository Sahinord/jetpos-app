# JetPos — Bekleyen Dış Yanıtlar (Gelen Kutusu Takibi)

**Son güncelleme:** 20 Temmuz 2026
**Amaç:** Dışarıdan (Ödeal, Getir, Trendyol, Yemeksepeti) beklediğimiz yanıtların tek listesi. "Kime ne sorduk, ne bekliyoruz, gelince ne açılır." Yanıt gelince o satırı işaretle.

---

## 1. ⏳ Ödeal

### 1.1 e-Fatura / e-Arşiv / e-İrsaliye API entegrasyonu
- **Sorduğumuz:** POS cihazı dışında, API ile belge kesimi mümkün mü? Online/cihazsız satışlarda müşterilere e-Fatura/e-Arşiv kesebilir miyiz? Ayrı anlaşma/doküman gerekiyor mu?
- **Bekleyen:** Yanıt + varsa e-fatura entegrasyon dokümanı
- **Gelince açılır:** Cihaz dışı belge kesme hattı (ya Ödeal altyapısı ya QNB/Paraşüt'e yönlenme kararı)
- **Durum:** ⏳ Mail gönderildi

### 1.2 Bilgi fişi vs e-Arşiv
- **Sorduğumuz:** Cihazdan çıkan "bilgi fişi" için e-Arşiv gerekiyor mu? İşyeri VKN eksikliği mi sebep?
- **Kontrol:** Ödeal panelinde işyeri VKN tanımlı mı (bizim tarafımızda bakılacak)
- **Durum:** ⏳ Yanıt bekleniyor

---

## 2. ⏳ Yemeksepeti (Delivery Hero — Partner API)

- **Sorduğumuz:** Partner API kimliği (`client_id` / `client_secret`, `chain_id`) + test vendor. POS sağlayıcısı (chain) sıfatıyla başvuru.
- **Not:** İlk mail son-kullanıcı destek hattına gitti, yanlış kapı çıktı → doğru kanal: **restoran iş ortağı paneli / hesap yöneticisi**. Ayhan (Kullanıcı Çözümleri) bizi iş birliği kanalına yönlendirdi.
- **Bekleyen:** Doğru ekibe ulaşma + kimlik + test vendor
- **Gelince açılır:** Yemeksepeti çekirdek kodu ZATEN HAZIR (webhook + order-action + bildirim) → sadece SuperAdmin formu + widget + sidebar kalır
- **Durum:** ⏳ Doğru kanal aranıyor / test vendor talebi gönderildi
- **En hızlı yol:** Kardeşler Kasap'ın Yemeksepeti restoran panelindeki temsilci

---

## 3. ⏳ Trendyol GO

- **Sorduğumuz:** Stage/test satıcı hesabı (sellerId + apiKey + apiSecret) + test mağazası; yemek (food) ve market (grocery) test erişimi; güncel entegrasyon dokümanı.
- **Bekleyen:** Test kimliği + doküman
- **Gelince açılır:**
  - Yemek uçlarındaki ⚠️ TEYİT notları kapanır (endpoint doğrulama)
  - Market (grocery) stok/fiyat senkronu gerçek test edilir
- **Durum:** ⏳ Mail gönderildi
- **Not:** Market tarafı kod olgun (updateBulkStock + widget + eşleme). Yemek tarafı endpoint teyidi bekliyor.

---

## 4. 🟡 Getir (Çarşı) — YANIT GELDİ (20.07.2026)

Getir cevapladı. Soruların çoğu netleşti; sadece **test ortamı** bekleniyor.

- ✅ **Stok/availability API TEYİTLİ:** `POST /products/price-and-quantity`.
  `quantity=0` → satışa kapanır, `quantity>0` → açılır. **Buffer istiyorlar:** stok
  eşiğin (örn. 5) altına düşünce **quantity ve price = 0** gönder.
- ✅ **Sipariş webhook'u sorunsuz** — eksik yok.
- ⏳ **Test ortamı gecikmiş** — API kimliği + test işletmesi "en kısa sürede" gelecek.
- 📄 **Doküman:** GetirÇarşı API Google Doc + Swagger `product` servisleri → test ortamı tanımlanınca erişilecek.

- **Gelince açılır:** Getir Çarşı stok/availability push (`PLATFORM_STOK_SENKRON_PLANI.md` dilim 3). Endpoint + buffer mantığı KESİN; sadece outbound auth (base URL + kimlik header'ı) test env'den gelecek.

### 🔴 DİKKAT — canlıya geçerken düzeltilecek
- Getir'e verilen webhook adresi **`jetpos-client-test.vercel.app/api/getir-carsi/new-order`** — bu **ESKİ test domaini!** Artık POS `app.jetpos.shop`'ta. Canlıya geçerken Getir'e:
  - **Doğru webhook URL'i:** `https://app.jetpos.shop/api/getir-carsi/new-order`
  - Belirlenen **`x-api-key`** değeri
  yeniden bildirilmeli (Getir bunu özellikle hatırlattı).

## 4-b. ⏳ Getir Yemek
- Ayrı kanal; test hesabı aynı Getir sürecinde istenebilir. Kod TGO/Getir modelinde hazır.

---

## 5. Bu yanıtlar gelince yapılacak işler (özet)

| Yanıt gelince | Yapılacak | İlgili plan |
|---|---|---|
| Yemeksepeti kimliği | SuperAdmin form + widget + sidebar | (kod hazır) |
| Trendyol GO test | Yemek endpoint teyidi + market senkron testi | — |
| Getir Çarşı availability cevabı | Availability push + stok senkron motoru | `PLATFORM_STOK_SENKRON_PLANI.md` |
| Ödeal e-fatura cevabı | Cihaz dışı belge kesme kararı | — |
| Tüm test hesapları | Platform stok/satışta-durumu motoru (3-6. dilim) | `PLATFORM_STOK_SENKRON_PLANI.md` |

---

## 6. Bizim tarafta bloklamayan, şimdi yapılabilecekler

Test hesapları beklerken ilerletilebilecek (dış bağımlılık yok):

- Platform stok senkron **1. dilim**: platform başına ayar toggle'ları (Trendyol'da çalışır, diğerleri kimlik gelince bağlanır)
- Platform stok senkron **2. dilim**: availability veri modeli (outbox) + "satıştaki ürünler" görünümü hesabı
- Terazi entegrasyonu (pilot barkod fotoğrafı gelince)
- Patron/personel sistemi kalan dilimleri (`PATRON_PERSONEL_PLANI.md`)

---

## 7. İlgili dokümanlar

- `PLATFORM_STOK_SENKRON_PLANI.md` — platform stok/availability senkron mimarisi
- `PATRON_PERSONEL_PLANI.md` — patron paneli + personel
- `TERAZI_ENTEGRASYON_PLANI.md` — terazi
- `JETPOS_YOL_HARITASI.md` — ana durum panosu
