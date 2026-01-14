# TRENDYOL GO API ENTEGRASYON TALEBİ - MAİL ŞABLONU

---

## 📧 MAİL #1: İlk İletişim (Genel Talep)

**Kime:** partner@trendyol.com  
**Konu:** Trendyol GO Hızlı Market API Entegrasyonu Talebi

---

Sayın Trendyol GO Ekibi,

Ben [FİRMA ADI] firmasından [ADI SOYADI], [ÜNVAN] olarak görev yapmaktayım.

Firmamız olarak Trendyol GO by Uber Eats platformunda aktif olarak market ve kasap ürünleri satışı yapmaktayız. Operasyonlarımızı daha verimli hale getirmek ve müşterilerimize daha iyi hizmet sunabilmek amacıyla **Trendyol GO Hızlı Market API Entegrasyonu** kurmak istiyoruz.

### 🎯 Entegrasyon Amacımız:

Kendi ERP/Muhasebe sistemimiz ile Trendyol GO platformu arasında otomatik veri akışı sağlamak istiyoruz. Bu kapsamda aşağıdaki işlemleri gerçekleştirmeyi planlıyoruz:

1. **Stok Senkronizasyonu:**
   - Kendi sistemimizde yapılan stok güncellemelerinin Trendyol GO'ya otomatik yansıtılması
   - Şube bazlı stok ve fiyat yönetimi

2. **Sipariş Yönetimi:**
   - Trendyol GO üzerinden gelen siparişlerin otomatik olarak sistemimize aktarılması
   - Sipariş durumlarının takibi ve güncellenmesi

3. **İade Yönetimi:**
   - İade siparişlerinin otomatik takibi
   - İade süreçlerinin sistemimize entegrasyonu

### 📋 Talep Ettiğimiz Bilgiler:

Entegrasyon sürecine başlayabilmemiz için aşağıdaki bilgilere ihtiyacımız bulunmaktadır:

1. **Supplier ID** (Satıcı ID bilgimiz)
2. **Store ID(ler)** (Şubelerimize ait ID bilgileri)
3. **API Credentials:**
   - Agent Name (Entegratör adı)
   - Executor User bilgisi
4. **Test Ortamı Erişimi (STAGE):**
   - Test ortamı API URL'leri
   - Test ortamı credentials
   - Test şubesi bilgileri

### 🔧 Teknik Detaylar:

- Kullanacağımız API servisleri:
  - Sipariş Paketlerini Çekme (`/packages`)
  - Stok ve Fiyat Güncelleme (`/products/price-and-inventory`)
  - Ürün Filtreleme (`/products`)
  - İade Yönetimi (`/claims`)

- Programlama Dili: TypeScript/Node.js
- Planlanan Senkronizasyon: Her 5 dakikada bir otomatik
- Şube Sayısı: [ŞUBE SAYISI]
- Ürün Kategorileri: Market ürünleri, Kasap ürünleri (gramajlı)

### 📞 İletişim Bilgilerimiz:

**Firma Adı:** [FİRMA ADI]  
**Yetkili Kişi:** [ADI SOYADI]  
**Ünvan:** [ÜNVAN]  
**E-posta:** [EMAIL]  
**Telefon:** [TELEFON]  
**Trendyol Satıcı Hesap No:** [SATICI NO - varsa]

### ⏱️ Zaman Planı:

Entegrasyon sürecini mümkün olan en kısa sürede tamamlamayı hedefliyoruz. Test ortamında gerekli testleri yaptıktan sonra production ortamına geçiş yapmayı planlıyoruz.

Bu konuda bizlere yardımcı olacağınızdan emin olup, süreç hakkında bilgilendirme yapmanızı rica ederim.

Saygılarımla,

[ADI SOYADI]  
[ÜNVAN]  
[FİRMA ADI]  
[TELEFON]  
[EMAIL]

---

## 📧 MAİL #2: Takip Maili (1 hafta sonra cevap gelmezse)

**Kime:** partner@trendyol.com  
**Konu:** RE: Trendyol GO Hızlı Market API Entegrasyonu Talebi - Takip

---

Sayın Trendyol GO Ekibi,

[TARİH] tarihinde Trendyol GO Hızlı Market API Entegrasyonu talebi ile ilgili mail göndermiştim.

Konuyla ilgili henüz bir geri dönüş alamadığımdan, talep durumumuz hakkında bilgi almak istiyorum.

Entegrasyon sürecine başlayabilmemiz için gerekli bilgileri (Supplier ID, Store ID'ler, API Credentials ve Test Ortamı Erişimi) bizimle paylaşabilir misiniz?

Bu konuda yetkili birim veya kişi ile görüşmem gerekiyorsa, lütfen ilgili iletişim bilgilerini benimle paylaşabilir misiniz?

Yardımlarınız için şimdiden teşekkür ederim.

Saygılarımla,

[ADI SOYADI]  
[FİRMA ADI]  
[TELEFON]

---

## 📧 MAİL #3: Bilgi Alındıktan Sonra (Teşekkür + Test Talebi)

**Kime:** [Trendyol GO İlgili Kişi]  
**Konu:** RE: Trendyol GO API Entegrasyonu - Test Süreci

---

Sayın [İLGİLİ KİŞİ],

API erişim bilgilerini bizimle paylaştığınız için teşekkür ederiz.

Aldığımız bilgiler:
- ✅ Supplier ID: [ID]
- ✅ Store ID: [ID]
- ✅ Agent Name: [...]
- ✅ Executor User: [...]

Bu bilgiler ile **test ortamında (STAGE)** entegrasyon çalışmalarına başladık. 

### Test Sürecimiz:

1. **API Bağlantı Testi** - ✅ Tamamlandı
2. **Sipariş Çekme Testi** - 🔄 Devam ediyor
3. **Stok Güncelleme Testi** - ⏳ Beklemede
4. **İade Yönetimi Testi** - ⏳ Beklemede

Test sürecinde karşılaştığımız teknik sorular veya sorunlar olması durumunda sizinle iletişime geçebilir miyiz?

Ayrıca, test ortamında test siparişi oluşturmak için gerekli adımları bize yönlendirebilir misiniz?

Test sürecini başarıyla tamamladıktan sonra **production ortamına geçiş** için yapılması gerekenleri de öğrenmek isteriz.

Teşekkürler,

[ADI SOYADI]  
[FİRMA ADI]

---

## ⚡ HIZLI İPUÇLARI:

### ✅ Mail Göndermeden Önce Kontrol Et:

- [ ] Firma adını güncelledin mi?
- [ ] Ad-soyad ve ünvanı güncelledin mi?
- [ ] İletişim bilgilerini güncelledin mi?
- [ ] Şube sayısını belirttin mi?
- [ ] Trendyol satıcı hesap numaranı ekledin mi? (varsa)

### 📞 Alternatif İletişim Kanalları:

Eğer mailden cevap alamazsan:

1. **Trendyol Satıcı Paneli:**
   - https://partner.trendyol.com
   - Destek > Yeni Talep Oluştur
   - Kategori: "Entegrasyon" veya "Teknik Destek"

2. **Trendyol Çağrı Merkezi:**
   - Satıcı Destek Hattı: 0850 XXX XX XX (Satıcı panelinde bulabilirsin)
   - "Trendyol GO API entegrasyonu" isteğinizi iletin

3. **Trendyol GO Kategori Yöneticiniz:**
   - Satıcı panelinden kategori yöneticinize ulaşın
   - API entegrasyon talebinizi iletin

---

## 🎁 BONUS: İlk Görüşmede Sorulacak Sorular Listesi

Eğer telefon görüşmesi olursa şu soruları sor:

1. API dokümantasyonunun en güncel haline nereden ulaşabiliriz?
2. Test ortamında ne kadar süre çalışma yapabiliriz?
3. Production'a geçiş için özel bir onay süreci var mı?
4. API rate limiting var mı? (Dakikada max kaç istek?)
5. Webhook desteği var mı? (Gerçek zamanlı bildirim için)
6. Şube ID'lerini nasıl öğrenebiliriz?
7. Teknik sorunlar için doğrudan iletişim kurabileceğimiz bir developer desteği var mı?
8. API'de breaking change olduğunda nasıl bilgilendiriliyoruz?

---

## 📝 SONUÇ:

Bu mail şablonlarını kullanarak profesyonel bir şekilde Trendyol GO ekibiyle iletişime geç. Genellikle 2-5 iş günü içinde dönüş alırsın.

Bol şans! 🚀
