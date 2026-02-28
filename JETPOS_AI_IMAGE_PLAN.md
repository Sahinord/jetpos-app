# JetPOS Yapay Zeka Destekli Ürün Görseli ve Koruma Sistemi Planı

Bu belge, JetPOS sistemine eklenecek olan AI tabanlı görsel düzenleme, logo giydirme ve telif koruma özelliklerinin uygulama adımlarını içerir.

## 1. Temel Özellikler
- **AI Görsel Şekillendirme (Restyling)**: Ham ürün fotoğraflarını profesyonel stüdyo kalitesine dönüştürme.
- **Akıllı Logo/Filigran**: Ürün görsellerine otomatik olarak dükkan logosu basılması.
- **Kopyalama Koruması**: Ürün görsellerinin izinsiz indirilmesini zorlaştıran teknik önlemler.
- **Güvenli Depolama**: Görsellerin tenant bazlı RLS (Row Level Security) ile korunması.

## 2. Teknik Mimari

### 📸 Görsel Yakalama ve Hazırlık
- **Kamera Entegrasyonu**: Tarayıcı üzerinden doğrudan fotoğraf çekme (Webcam API).
- **Ön İşleme**: Görselin kırpılması ve boyutlandırılması (Canvas API).

### 🤖 AI Görsel İşleme (OpenRouter)
- **Model**: Flux Pro veya DALL-E 3 (Image-to-Image).
- **Akış**: 
  1. Ham resim ve seçilen stil AI'ya gönderilir.
  2. AI arkaplanı temizler ve ürünü seçilen konsepte yerleştirir.
  3. Yeni profesyonel görsel kullanıcıya sunulur.

### 🎨 Branding & Watermarking
- **Canvas Engine**: `@/lib/image-processor.ts` (Yeni)
- **Otomatik Logo**: AI'dan dönen resmin üzerine dükkan logosu şeffaf filigran olarak basılır.
- **Dinamik Yazı**: Logo yoksa dükkan ismi "JetPOS Protected" ibaresiyle eklenir.

### 🛡️ Güvenlik Katmanı
- **Supabase RLS**: `protected-product-images` klasörüne sadece veri sahibi erişebilir.
- **Frontend Layer**: Resimlerin üzerine görünmez `div` katmanı eklenerek sağ tıkla kaydetme engellenir.
- **Metadata**: Resim dosyasına dükkan kimliği (UUID) dijital imza olarak eklenir.

## 3. Uygulama Aşamaları

### Aşama 1: Altyapı
- [ ] `AIClient` sınıfına görsel işleme metodunun eklenmesi.
- [ ] Resim işleme motorunun (Canvas tabanlı) yazılması.

### Aşama 2: UI/UX
- [ ] `ImageEditorModal` bileşeninin oluşturulması.
- [ ] Ürün kartlarına ve modalına AI butonlarının eklenmesi.

### Aşama 3: Güvenlik
- [ ] Supabase Storage politikalarının güncellenmesi.
- [ ] Görsel koruma katmanının entegrasyonu.

---

> [!NOTE]
> Bu plan onaylandığında ilk adım olarak AI altyapısı ve Resim İşleme Motoru (Canvas) geliştirilecektir.
