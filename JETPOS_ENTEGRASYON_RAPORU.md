# 🚀 JetPOS Entegrasyon & Merkezi Stok Yönetimi Yol Haritası

Bu rapor, JetPOS uygulamasının pazaryeri devleri (Getir, Yemeksepeti, Trendyol) ve banka sistemleri ile nasıl entegre edileceğini ve merkezi stok yönetiminin teknik detaylarını kapsar.

---

## 1. Pazaryeri API & Başvuru Rehberi

Platformlar ile haberleşmek için "Teknoloji İş Ortağı" veya "Entegratör" statüsünde API erişimi gereklidir.

### 🛵 GetirYemek / GetirÇarşı
- **API Portalı:** [getirapi.com](https://getirapi.com/)
- **Başvuru:** `getiryemekapi@getir.com` adresine kurumsal başvuru yapılır. 
- **Gereksinim:** Entegratör onayı sonrası her restoran için özel `App Token` alınır.
- **Kritik Fonksiyon:** `updateProductAvailability` (Stok bittiğinde ürünü kapatma).

### 🍔 Yemeksepeti (Delivery Hero)
- **API Portalı:** [developer.yemeksepeti.com](https://developer.yemeksepeti.com/)
- **Başvuru:** Portal üzerinden developer hesabı açılır.
- **Gereksinim:** Restoranın "Vendor ID" bilgisi.
- **Kritik Fonksiyon:** Webhook entegrasyonu (Yeni sipariş düştüğünde JetPOS'a bildirim atılması).

### 🍊 Trendyol Yemek
- **API Portalı:** [developers.trendyol.com](https://developers.trendyol.com/)
- **Başvuru:** Partner paneli üzerinden API anahtarları oluşturulur.
- **Gereksinim:** `Seller ID`, `API Key`, `API Secret`.
- **Kritik Fonksiyon:** `updateStockByQuantity` (Adet bazlı stok senkronizasyonu).

---

## 2. Merkezi Stok Yönetimi (Omnichannel Inventory)

Bu sistemin amacı, stok adetlerinin tüm platformlarda gerçek zamanlı olarak senkronize kalmasını sağlamaktır.

### A. Ürün Eşleştirme (Mapping)
Her platformun kendi ID yapısı olduğu için JetPOS ürünleri ile dış platform ürünleri eşleştirilmelidir:
- **Tablo Yapısı:** `external_listings`
  - `jetpos_product_id` (Internal)
  - `platform_name` (Getir, Trendyol, vb.)
  - `external_product_id` (Pazaryeri ID'si)
  - `sync_enabled` (Boolean)

### B. Senkronizasyon Akışı
1. **JetPOS İçi Satış:** Kasa veya POS üzerinden ürün satıldığında yerel stok düşer.
2. **Trigger (Tetikleyici):** Supabase `AFTER UPDATE` trigger'ı çalışır.
3. **Edge Function:** Stok değişimi algılandığında tüm bağlı API'lere eş zamanlı güncelleme gönderilir.
   - *Stok > 0:* Trendyol'da adedi güncelle, Getir/YS'de ürünü "Açık" yap.
   - *Stok <= 0:* Tüm platformlarda ürünü "Kapalı/Pasif"e çek.

---

## 3. Banka Entegrasyonu (Open Banking)

Türkiye'deki **TÖDEB** ve Açık Bankacılık mevzuatına göre finansal hareketlerin çekilmesi:

- **Entegratörler:** Finrota (NetEkstre), Vomsis, veya bankaların kendi Developer portalları.
- **Kabiliyet:** 
  - Anlık hesap bakiyesi sorgulama.
  - Gelen havale/EFT bildirimleri.
  - Cari hesaplar ile banka dekontlarının otomatik eşleştirilmesi.

---

## 4. Teknik Gereksinimler & Yapılacaklar Listesi

- [ ] **DB Şeması:** `external_listings` ve `integration_settings` tablolarının oluşturulması.
- [ ] **Eşleştirme Ekranı:** Kullanıcının JetPOS ürünlerini Getir/Trendyol ürünleriyle eşleyebileceği UI.
- [ ] **Sipariş Webhook'u:** Pazaryerlerinden gelen sipariş verilerini standart JetPOS sipariş formatına dönüştüren API endpoint.
- [ ] **Stok Sync İşçisi (Worker):** Edge function üzerinde çalışan ve API limitlerini (Rate Limit) yöneten senkronizasyon servisi.

---

## 5. Müşteriye Faydası (Value Proposition)

1. **İptallere Son:** "Elimizde kalmadı" diyerek iptal edilen siparişler biter, mağaza puanı korunur.
2. **Zaman Tasarrufu:** 3-4 farklı tableti kontrol etme yükü kalkar, her şey tek ekrandan yönetilir.
3. **Finansal Netlik:** Banka, Kasa ve Pazaryeri alacakları tek bir raporda birleşir.

---
*Hazırlayan: JetPOS AI Entegrasyon Ekibi*
