# 🚀 JetPOS — Akıllı İşletme Yönetim Platformu

> **"İşiniz Jet Hızında"**
> Yapay zeka destekli, bulut tabanlı, çok kiracılı (multi-tenant) SaaS POS ve işletme yönetim sistemi.

---

## 📋 Proje Özeti

| Bilgi | Detay |
|---|---|
| **Proje Adı** | JetPOS |
| **Versiyon** | v1.1.0 (Desktop) / v0.1.0 (Mobile & Web) |
| **Mimari** | Monorepo — Multi-Tenant SaaS |
| **Lisans Modeli** | BASIC / PRO / ENTERPRISE (Beyaz Etiket) |
| **Hedef Sektör** | Restoran, Kafe, Perakende, Market, Hızlı Servis |
| **Dağıtım** | Windows (Electron + NSIS Installer), Web (Vercel), Mobil (PWA) |
| **Canlı Web** | jetpos-web → Vercel üzerinden deploy |
| **Güncelleme** | GitHub Releases + electron-updater (OTA) |

---

## 🏗️ Proje Mimarisi

```
jetpos-app/                          # Monorepo Kök Dizin
│
├── client/                          # 🖥️ Ana Masaüstü Uygulaması (Electron + Next.js)
│   ├── main.js                      # Electron Ana İşlem (BrowserWindow, IPC, Auto-Updater)
│   ├── src/
│   │   ├── app/                     # Next.js App Router
│   │   │   ├── page.tsx             # Ana sayfa (61KB — tam uygulama tek sayfa SPA)
│   │   │   ├── api/                 # Backend API Routes
│   │   │   │   ├── analyze-invoice/ # AI Fatura Analiz Endpoint
│   │   │   │   ├── invoices/        # Fatura CRUD
│   │   │   │   ├── qnb/             # QNB e-Fatura Entegrasyonu
│   │   │   │   └── trendyol/        # Trendyol GO Entegrasyonu
│   │   │   └── m/                   # Mobil görünüm route
│   │   │
│   │   └── components/              # 28 Modül Klasörü
│   │       ├── AI/                  # Yapay Zeka Modülü
│   │       ├── Admin/               # Yönetim Paneli
│   │       ├── Adisyon/             # Masa/Adisyon Sistemi
│   │       ├── Auth/                # Lisans & Kimlik Doğrulama
│   │       ├── Banka/               # Banka Hesap Yönetimi
│   │       ├── Calendar/            # Finansal Takvim
│   │       ├── Cari/                # Cari Hesap Yönetimi (14 alt bileşen)
│   │       ├── Common/              # Ortak Bileşenler (Sidebar, TopBar, Toast)
│   │       ├── CRM/                 # Müşteri İlişkileri Yönetimi
│   │       ├── Dashboard/           # Kontrol Paneli & Grafikler
│   │       ├── Employee/            # Personel & Vardiya Yönetimi
│   │       ├── Expenses/            # Gider Takibi
│   │       ├── Home/                # Ana Sayfa Bileşeni
│   │       ├── Integrations/        # Dış Entegrasyonlar (Trendyol GO)
│   │       ├── Invoice/             # Fatura & İrsaliye Modülü (9 alt bileşen)
│   │       ├── Kasa/                # Kasa Yönetimi
│   │       ├── Notifications/       # Bildirim Merkezi
│   │       ├── POS/                 # Satış Noktası (POS Ekranı + Fiş)
│   │       ├── Products/            # Ürün Yönetimi
│   │       ├── QRMenu/              # QR Menü Sistemi
│   │       ├── Reports/             # Akıllı Raporlar
│   │       ├── Settings/            # Uygulama Ayarları
│   │       ├── Simulator/           # Fiyat Simülasyonu
│   │       ├── Support/             # Destek Talep Sistemi
│   │       ├── Tenant/              # Kiracı/İşletme Yönetimi
│   │       ├── Tools/               # Araçlar (Etiket, Kâr Hesap, Fiş Tasarım, Tarayıcı)
│   │       ├── Warehouse/           # Depo & Sayım Yönetimi
│   │       └── Waybill/             # İrsaliye Modülü (5 tip)
│   │
│   └── package.json                 # Electron + Next.js bağımlılıkları
│
├── jetpos-web/                      # 🌐 Pazarlama & Admin Web Sitesi
│   ├── src/app/
│   │   ├── page.tsx                 # Landing Page
│   │   ├── admin/                   # Web Super Admin Paneli
│   │   ├── blog/                    # Blog Sistemi
│   │   ├── demo/                    # Demo Talep Formu
│   │   ├── faq/                     # SSS Sayfası
│   │   ├── fiyatlandirma/           # Fiyatlandırma Sayfası
│   │   ├── hakkimizda/              # Hakkımızda
│   │   ├── iletisim/                # İletişim
│   │   ├── is-ortakligi/            # İş Ortaklığı
│   │   ├── kilavuzlar/              # Kullanım Kılavuzları
│   │   ├── portal/                  # Müşteri Portalı
│   │   ├── paket-olustur/           # Paket Oluşturma
│   │   ├── terms/                   # Kullanım Şartları
│   │   └── gizlilik/                # Gizlilik Politikası
│   └── package.json
│
├── jetpos-mobile/                   # 📱 Mobil Uygulama (PWA - Next.js)
│   ├── app/
│   │   ├── pos/                     # Mobil POS
│   │   ├── products/                # Ürün Yönetimi
│   │   ├── scanner/                 # Barkod Tarayıcı
│   │   ├── inventory-count/         # Sayım
│   │   ├── low-stock/               # Düşük Stok Uyarıları
│   │   ├── warehouse-transfer/      # Depo Transferi
│   │   ├── adisyon/                 # Mobil Adisyon
│   │   ├── cari/                    # Mobil Cari
│   │   ├── banka/                   # Mobil Banka
│   │   ├── kasa/                    # Mobil Kasa
│   │   └── dashboard/              # Mobil Dashboard
│   └── package.json
│
├── supabase/                        # 🗃️ Veritabanı Migrasyonları
│   └── migrations/                  # 70 SQL migrasyon dosyası
│
└── docs/                            # 📄 Dokümantasyon
```

---

## ⚙️ Teknoloji Yığını (Tech Stack)

### Frontend — Masaüstü (client/)
| Teknoloji | Versiyon | Kullanım |
|---|---|---|
| **Next.js** | 15.1.9 | App Router, SSR/SSG, API Routes |
| **React** | 19.0.0 | UI Framework |
| **TypeScript** | 5.7.x | Tip güvenliği |
| **Electron** | 33.2.1 | Masaüstü sarmalayıcı (Windows .exe) |
| **Electron Builder** | 25.1.8 | NSIS installer oluşturma |
| **Electron Updater** | 6.7.3 | OTA otomatik güncelleme |
| **Framer Motion** | 11.18.2 | Animasyon ve geçiş efektleri |
| **Lucide React** | 0.474.0 | İkon kütüphanesi |
| **TailwindCSS** | 4.0.3 | Utility-first CSS |
| **Chart.js + react-chartjs-2** | 4.5.1 / 5.3.1 | Grafik ve veri görselleştirme |
| **Recharts** | 3.8.0 | İleri düzey veri grafikleri |
| **jsPDF + AutoTable** | 3.0.0 | PDF oluşturma (fiş, rapor, fatura) |
| **JsBarcode** | 3.12.3 | Barkod üretimi |
| **html5-qrcode** | 2.3.8 | QR/Barkod tarama (kamera) |
| **xlsx** | 0.18.5 | Excel import/export |
| **file-saver** | 2.0.5 | Dosya indirme |
| **react-to-print** | 3.2.0 | Termal yazıcı baskısı |
| **react-markdown** | 10.1.0 | Markdown render (AI chat) |
| **Geist Font** | 1.5.1 | Modern tipografi |

### Frontend — Web Sitesi (jetpos-web/)
| Teknoloji | Versiyon | Kullanım |
|---|---|---|
| **Next.js** | 16.1.4 | App Router, RSC |
| **React** | 19.2.3 | UI Framework |
| **Framer Motion** | 12.29.0 | Animasyonlar |
| **Lucide React** | 0.563.0 | İkonlar |
| **Resend** | 6.9.3 | E-posta gönderimi |
| **TailwindCSS** | 4.x | Stil sistemi |

### Frontend — Mobil (jetpos-mobile/)
| Teknoloji | Versiyon | Kullanım |
|---|---|---|
| **Next.js** | 15.1.9 | PWA temel |
| **React** | 19.0.0 | UI Framework |
| **@zxing/browser + library** | 0.1.5 / 0.21.3 | Barkod tarama (ZXing) |
| **Framer Motion** | 11.18.2 | Animasyonlar |
| **Sonner** | 1.7.4 | Toast bildirimleri |

### Backend & Veritabanı
| Teknoloji | Kullanım |
|---|---|
| **Supabase** | BaaS (Backend as a Service) — Auth, DB, Realtime, Storage, RPC |
| **PostgreSQL** | İlişkisel veritabanı (Supabase üzerinde yönetilen) |
| **Row Level Security (RLS)** | Multi-tenant veri izolasyonu |
| **PostgreSQL Functions (RPC)** | Sunucu taraflı iş mantığı (stok, fatura, CRM analizi) |
| **Database Triggers** | Otomatik puan hesaplama, stok güncelleme |
| **Supabase Realtime** | Canlı veri senkronizasyonu (WebSocket) |
| **Supabase Storage** | Dosya/Logo/Görsel depolama |

### Yapay Zeka (AI)
| Teknoloji | Kullanım |
|---|---|
| **Google Gemini API** | AI Satış Asistanı, Fatura Analizi, Akıllı Öneriler |
| **@google/generative-ai** | Gemini SDK (v0.24.1) |
| **PostgreSQL RPC** | RFM Müşteri Segmentasyonu (VIP/Sadık/Riskli/Yeni) |

### DevOps & Dağıtım
| Teknoloji | Kullanım |
|---|---|
| **GitHub** | Kaynak kod yönetimi |
| **GitHub Releases** | Masaüstü uygulama dağıtımı |
| **Vercel** | Web sitesi hosting & deployment |
| **electron-updater** | OTA (Over-The-Air) otomatik güncelleme |
| **NSIS** | Windows installer oluşturma |

---

## 🧩 Modüller ve Özellikler

### 1. 💳 POS (Satış Noktası)
- Tam dokunmatik optimize satış ekranı (91KB bileşen)
- Kategoriye göre ürün filtreleme ve arama
- Sepet yönetimi (miktar, indirim, not ekleme)
- Çoklu ödeme yöntemleri (Nakit, Kredi Kartı, Havale, Çoklu)
- Termal fiş yazdırma (sessiz yazdırma — Electron IPC)
- Kasa çekmecesi açma (ESC/POS ham veri — RAW bytes)
- Müşteri seçimi ve sadakat puanı entegrasyonu
- Son fiş geri çağırma

### 2. 🍽️ Adisyon Sistemi
- Masa/Oda bazlı sipariş takibi (73KB bileşen)
- Masa durumu görselleştirme (Boş/Dolu/Hesap İstendi)
- Sipariş bölme ve birleştirme
- Mutfak notu ve özel istekler
- Garson bazlı sipariş atama

### 3. 📦 Ürün Yönetimi
- Ürün ekleme/düzenleme/silme (66KB tablo bileşeni)
- Kategori yönetimi
- Barkod desteği (JsBarcode ile üretim)
- Fiyat değişiklik geçmişi
- Ürün değişiklik logları
- Toplu içe aktarma (Excel/CSV)
- Ürün görselleri (Supabase Storage)
- KDV oranı yönetimi (%1, %10, %20)

### 4. 🏪 Depo & Stok Yönetimi
- Çoklu depo tanımlama
- Depo bazlı stok takibi
- Depolar arası transfer
- Sayım modülü (barkod ile hızlı sayım)
- Kritik stok uyarıları
- Stok hareketi raporları

### 5. 📊 Cari Hesap Yönetimi
- 14 alt bileşenli kapsamlı cari modül
- Cari tanıtım kartları
- Borç/Alacak dekontu
- Virman dekontu
- Devir fişi
- Bakiye raporu
- Hareket raporu
- Mutabakat raporu
- Günlük hareket takibi
- Cari analizi
- Grup ve özel kod tanımlama

### 6. 🏦 Banka Yönetimi
- Banka hesabı tanımlama
- Banka fişleri (Tahsilat/Tediye)
- Banka raporu
- Hesap bazlı bakiye takibi

### 7. 💰 Kasa Yönetimi
- Kasa tanımlama
- Kasa fişleri
- Kasa raporu
- Oda/şube tanımlama

### 8. 🧾 Fatura & İrsaliye Sistemi
- **Fatura Tipleri:**
  - Perakende Satış Faturası
  - Alış Faturası
  - Hizmet Faturası
  - İade Faturası
  - İade Fiyat Farkı Fişi
  - Emtia/Emsaliyet Fişleri
- **İrsaliye Tipleri:**
  - Satış İrsaliyesi
  - Alış İrsaliyesi
  - Satış İade İrsaliyesi
  - Alış İade İrsaliyesi
  - Sevk İrsaliyesi
- KDV raporları
- AI destekli PDF fatura analizi

### 9. 🤖 Yapay Zeka Modülü
- **AI Satış Asistanı:** Gemini ile sohbet tabanlı satış danışmanlığı
- **AI Satış Öngörüleri:** Trend analizi ve tahminleme
- **AI PDF Fatura Analizi:** Fatura OCR ve otomatik veri çıkarımı
- **AI CRM Segmentasyonu:** RFM analizi ile müşteri sınıflandırma

### 10. ❤️ CRM & Sadakat Programı
- Müşteri veritabanı
- Sadakat puanı sistemi (otomatik puan kazandırma — DB trigger)
- RFM müşteri segmentasyonu (VIP / Sadık / Riskli / Yeni)
- Segment bazlı görselleştirme
- Global CRM takibi (SuperAdmin)

### 11. 📱 QR Menü Sistemi
- Dinamik QR menü oluşturma (111KB yönetim bileşeni)
- Halka açık QR menü görünümü (40KB)
- Çalışma saatleri yönetimi
- Manuel kapalı modu
- Ürün görselleri ve kategorileme
- Mobil uyumlu tasarım

### 12. 👤 Personel & Vardiya Yönetimi
- Personel tanımlama ve yetkilendirme
- Vardiya başlatma/sonlandırma
- Vardiya bazlı satış takibi

### 13. 🔗 Dış Entegrasyonlar
- **Trendyol GO:** Sipariş alma, stok senkronizasyonu, ürün eşleştirme (36KB widget)
- **QNB e-Fatura:** Elektronik fatura gönderimi (WSDL/SOAP)
- **Verifone POS:** Donanım terminali entegrasyonu (planlanmış)

### 14. 🛡️ Admin & SuperAdmin Paneli
- **İşletme Admin (AdminPortal):** İşletme seviyesi yönetim (30KB)
- **SuperAdmin (106KB):** Tüm kiracılar üzerinde tam kontrol
  - Dashboard istatistikleri
  - Demo talep yönetimi
  - Lisans oluşturma, düzenleme, silme
  - Destek talepleri yönetimi
  - Sistem duyuruları
  - Blog yönetimi
  - Rehber yönetimi
  - CRM analizi (global)
  - Hakkımızda içerik yönetimi
- **Özellik Yönetimi (FeatureManager):** Modül bazlı özellik açma/kapama

### 15. 🧰 Araçlar
- **Ürün Etiket Tasarımcısı** (58KB) — Barkodlu etiket tasarla ve yazdır
- **Fiş Tasarımcısı** (36KB) — Termal fiş şablonu özelleştirme
- **Kâr Hesaplayıcı** (33KB) — Ürün bazlı kârlılık analizi
- **Akıllı Tarayıcı** (24KB) — Barkod/QR tarama aracı
- **Fiyat Simülatörü** (14KB) — KDV dahil/hariç fiyat hesaplama

### 16. 📈 Raporlama
- Akıllı raporlar (AI destekli)
- Satış grafikleri (günlük/haftalık/aylık)
- Satış geçmişi detayı
- Özet kartlar (ciro, kâr, adet)
- Düşük stok uyarıları

### 17. 📅 Finansal Takvim
- Ödeme/tahsilat takvimine dayalı hatırlatmalar
- Görsel takvim arayüzü

### 18. 💸 Gider Takibi
- Gider kategorileri
- Gider kayıtları ve raporlama

### 19. 🔔 Bildirim Sistemi
- Uygulama içi bildirimler
- Sistem duyuruları (SuperAdmin'den tüm kiracılara)
- Düşük stok uyarıları
- Destek talebi bildirimleri

### 20. 🎫 Destek Talep Sistemi
- Kiracıdan SuperAdmin'e destek talebi
- Talep durumu takibi (Açık/Kapalı)
- Gerçek zamanlı güncelleme

---

## 🌐 Web Sitesi (jetpos-web) Özellikleri

| Sayfa | Açıklama |
|---|---|
| **Landing Page** | Modern, animasyonlu pazarlama sayfası |
| **Demo Talep** | İşletmeler için demo başvuru formu |
| **Fiyatlandırma** | Paket karşılaştırma tablosu |
| **Blog** | SEO uyumlu blog sistemi |
| **FAQ** | Sıkça sorulan sorular |
| **Kılavuzlar** | Adım adım kullanım rehberleri |
| **Hakkımızda** | Şirket bilgileri |
| **İletişim** | İletişim formu |
| **Müşteri Portalı** | Lisans bilgisi ve indirme bağlantısı |
| **Admin Panel** | Web üzerinden tam yönetim |
| **Gizlilik/Şartlar** | Hukuki sayfalar |

---

## 📱 Mobil Uygulama Özellikleri

| Modül | Açıklama |
|---|---|
| **Mobil POS** | Tablet/telefon üzerinden satış |
| **Barkod Tarayıcı** | ZXing ile kamera tabanlı barkod okuma |
| **Sayım** | Mobil stok sayımı |
| **Düşük Stok** | Kritik stok uyarıları |
| **Depo Transferi** | Depolar arası transfer işlemi |
| **Ürün Yönetimi** | Mobil ürün düzenleme |
| **Adisyon** | Mobil masa takibi |
| **Dashboard** | Anlık satış özeti |
| **Cari / Banka / Kasa** | Finansal modüllerin mobil versiyonları |

---

## 🗃️ Veritabanı Şeması (Temel Tablolar)

| Tablo | Açıklama |
|---|---|
| `tenants` | Kiracı/İşletme bilgileri (lisans, plan, branding) |
| `products` | Ürünler (barkod, stok, fiyat, KDV, kategori, görsel) |
| `categories` | Ürün kategorileri |
| `sales` | Satış kayıtları (customer_id, loyalty_points_earned, coupon_code) |
| `sales_items` | Satış kalemi detayları |
| `cari_hesaplar` | Cari hesap kartları |
| `cari_hareketler` | Cari hesap hareketleri |
| `banka_hesaplari` | Banka hesapları |
| `banka_fisleri` | Banka fişleri |
| `kasa_tanimlari` | Kasa tanımları |
| `kasa_fisleri` | Kasa fişleri |
| `invoices` | Faturalar |
| `invoice_items` | Fatura kalemleri |
| `waybills` | İrsaliyeler |
| `waybill_items` | İrsaliye kalemleri |
| `warehouses` | Depo tanımları |
| `warehouse_stock` | Depo bazlı stok miktarları |
| `warehouse_transfers` | Depo transfer kayıtları |
| `inventory_counts` | Sayım kayıtları |
| `employees` | Personel bilgileri |
| `shifts` | Vardiya kayıtları |
| `expenses` | Giderler |
| `loyalty_points` | Sadakat puanı hareketleri |
| `customer_segments` | Müşteri segmentleri (RFM) |
| `qr_menu_settings` | QR menü ayarları (çalışma saatleri, kapalı modu) |
| `integration_settings` | Dış entegrasyon ayarları (Trendyol, QNB) |
| `support_tickets` | Destek talepleri |
| `notifications` | Sistem bildirimleri/duyuruları |
| `demo_requests` | Demo talepleri |
| `blog_posts` | Blog yazıları |
| `guides` | Kullanım kılavuzları |
| `about_content` | Hakkımızda içeriği |
| `product_change_logs` | Ürün değişiklik geçmişi |
| `price_change_logs` | Fiyat değişiklik geçmişi |
| `financial_calendar` | Finansal takvim kayıtları |
| `vat_rates` | KDV oranları |

### Veritabanı Fonksiyonları (RPC)
| Fonksiyon | Açıklama |
|---|---|
| `get_customer_rfm_analysis` | RFM müşteri segmentasyonu (Recency-Frequency-Monetary) |
| `increment_stock` | Stok artırma |
| `decrement_stock` | Stok azaltma |
| `create_pos_invoice` | POS'tan fatura oluşturma |
| `bulk_import_products` | Toplu ürün içe aktarma |
| `check_gemini_quota` | AI kullanım kotası kontrolü |

### Veritabanı Tetikleyiciler (Triggers)
| Tetikleyici | Açıklama |
|---|---|
| `trg_grant_loyalty_points` | Satış tamamlandığında otomatik sadakat puanı hesaplama |
| `trg_update_invoice_totals` | Fatura kalemleri değiştiğinde toplam güncelleme |

---

## 🔐 Güvenlik & Multi-Tenancy

### Lisans Sistemi
```
LicenseGate.tsx → Lisans doğrulama katmanı
├── Lisans anahtarı ile giriş
├── Plan kontrolü (BASIC/PRO/ENTERPRISE)
├── Özellik bazlı erişim (FeatureManager)
├── Süre kontrolü (kalan gün)
└── Beyaz etiket desteği (özel logo, renk, badge gizleme)
```

### Multi-Tenant Veri İzolasyonu
- Her işlemde `tenant_id` zorunlu
- PostgreSQL RLS (Row Level Security) ile veri izolasyonu
- Kiracılar arası çapraz erişim engeli
- SuperAdmin için çapraz kiracı görünürlüğü

### Admin Yetkilendirme
- Web Admin: Şifre tabanlı + session token
- SuperAdmin: Özel lisans anahtarı (`ADM257SA67`)
- API Koruma: `x-admin-token` header doğrulaması

---

## 🖨️ Donanım Entegrasyonları

| Donanım | Durum | Yöntem |
|---|---|---|
| **Termal Fiş Yazıcı** | ✅ Aktif | Electron `silent-print` (IPC) |
| **Kasa Çekmecesi** | ✅ Aktif | ESC/POS RAW bytes (PowerShell + Out-Printer) |
| **Barkod Tarayıcı** | ✅ Aktif | Klavye simülasyonu + Kamera (ZXing) |
| **Barkod Yazıcı** | ✅ Aktif | JsBarcode + jsPDF etiket tasarımcısı |
| **Verifone POS Terminali** | 🔜 Planlanmış | Seri port / API |
| **Terazi Entegrasyonu** | 🔜 Planlanmış | Seri port |

---

## 🚀 Çalıştırma

### Geliştirme Ortamı
```bash
# Masaüstü (Electron + Next.js)
cd client
npm install
npm run electron-dev          # Port: 3005

# Web Sitesi
cd jetpos-web
npm install
npm run dev                   # Port: 3002

# Mobil
cd jetpos-mobile
npm install
npm run dev                   # Port: 3001
```

### Production Build
```bash
# Masaüstü Installer (.exe)
cd client
npm run electron-build

# Web Deploy (Vercel)
cd jetpos-web
npm run build

# GitHub'a Yayınla (Auto-update)
cd client
npm run electron-publish
```

---

## 📊 Proje İstatistikleri

| Metrik | Değer |
|---|---|
| **Toplam Modül** | 28 bileşen klasörü |
| **Toplam Bileşen** | ~80+ React bileşeni |
| **En Büyük Bileşen** | QRMenuManager.tsx (111KB) |
| **SQL Migrasyon** | 70 dosya |
| **Desteklenen Fatura Tipi** | 6 fatura + 5 irsaliye |
| **API Route** | 4 ana endpoint grubu |
| **Web Sayfası** | 14 sayfa |
| **Mobil Modül** | 11 sayfa |

---

## 🗺️ Yol Haritası (Roadmap)

| Modül | Durum | Açıklama |
|---|---|---|
| ✅ POS Sistemi | Tamamlandı | Tam özellikli satış noktası |
| ✅ Multi-Tenant | Tamamlandı | RLS ile veri izolasyonu |
| ✅ Cari / Banka / Kasa | Tamamlandı | Finansal yönetim üçlüsü |
| ✅ Fatura & İrsaliye | Tamamlandı | 11 belge tipi |
| ✅ AI Asistan | Tamamlandı | Gemini entegrasyonu |
| ✅ CRM & Sadakat | Tamamlandı | RFM segmentasyonu |
| ✅ QR Menü | Tamamlandı | Dinamik dijital menü |
| ✅ Depo & Sayım | Tamamlandı | Çoklu depo yönetimi |
| ✅ Trendyol GO | Tamamlandı | Sipariş & stok senkronizasyonu |
| ✅ OTA Güncelleme | Tamamlandı | GitHub Releases üzerinden |
| ✅ Mobil Uygulama | Tamamlandı | PWA bazlı |
| 🔜 Inventory Intelligence | Sırada | AI stok tahminleme |
| 🔜 Muhasebeci Portalı | Planlanmış | Otomatik veri aktarımı |
| 🔜 Soft-POS | Planlanmış | Telefon ile kart okuma |
| 🔜 Terazi Entegrasyonu | Planlanmış | Tartılı ürün desteği |

---

## 👥 Ekip & İletişim

| Bilgi | Detay |
|---|---|
| **Geliştirici** | JetPOS Ekibi |
| **GitHub** | [github.com/Sahinord/jetpos-app](https://github.com/Sahinord/jetpos-app) |
| **App ID** | `com.jetpos.app` |

---

> 📅 Son Güncelleme: 3 Nisan 2026
