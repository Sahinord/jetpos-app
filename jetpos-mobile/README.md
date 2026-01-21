# 📱 JetPos Mobile Scanner

Telefon kamerasıyla barkod okuyarak ürün yönetimi yapabileceğiniz mobil web uygulaması.

## 🚀 Özellikler

- ✅ Kamera ile barkod okuma
- ✅ Ürün bilgileri görüntüleme (fiyat, stok)
- ✅ Gerçek zamanlı ürün sorgulama
- ✅ Flaş kontrolü
- ✅ Titreşim feedback
- ✅ PWA desteği (Ana ekrana eklenebilir)
- ✅ Offline çalışma (yakında)

## 🛠️ Kurulum

```bash
# Bağımlılıkları kur
npm install

# Geliştirme sunucusunu başlat
npm run dev

# Production build
npm run build
npm start
```

## 📱 Kullanım

### Desktop Test (Chrome DevTools)
1. `http://localhost:3000` adresini aç
2. F12 → Device Toolbar (Ctrl+Shift+M)
3. iPhone/Android seç
4. Test et!

### Gerçek Telefon
1. Bilgisayar ve telefon aynı WiFi'de
2. Terminal'de gösterilen Network URL'i telefondan aç
3. Kamera izni ver
4. Test et!

### PWA Kurulum (iPhone)
1. Safari'den aç
2. Share butonu → "Add to Home Screen"
3. Artık app gibi kullan!

## 🔧 Teknolojiler

- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **ZXing** - Barkod okuma
- **Supabase** - Database
- **Framer Motion** - Animasyonlar

## 📁 Proje Yapısı

```
jetpos-mobile/
├── app/
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Ana sayfa
│   └── globals.css      # Global styles
├── components/
│   ├── BarcodeScanner.tsx   # Ana barkod okuyucu
│   └── ProductCard.tsx      # Ürün detay kartı
├── lib/
│   └── supabase.ts      # Supabase client
└── public/
    └── manifest.json    # PWA manifest
```

## 🌐 Environment Variables

`.env.local` dosyası oluştur:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

## 🚢 Deployment

### Vercel (Önerilen)
```bash
vercel
```

### Netlify
```bash
npm run build
netlify deploy --prod
```

## 📊 Desteklenen Barkod Formatları

- EAN-13 (En yaygın)
- EAN-8
- UPC-A
- UPC-E
- Code 128
- Code 39
- QR Code

## 🔐 Güvenlik

- RLS (Row Level Security) ile tenant izolasyonu
- HTTPS zorunlu
- Kamera erişimi sadece kullanıcı izniyle

## 📝 License

MIT

## 👨‍💻 Geliştirici

JetPos Team - 2026
