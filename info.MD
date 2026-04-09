# 🚀 JetPOS — Akıllı İşletme Yönetim Platformu

> **"İşiniz Jet Hızında"**
> Yapay zeka destekli, bulut tabanlı, çok kiracılı (multi-tenant) SaaS POS ve işletme yönetim sistemi.

---

## 📋 Proje Özeti

| Bilgi | Detay |
|---|---|
| **Proje Adı** | JetPOS |
| **Versiyon** | v1.2.0 (Desktop) / v0.2.0 (Mobile & Web) |
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
│   │   │   ├── page.tsx             # Ana sayfa (Modüler SPA Aracı)
│   │   │   ├── display/             # 🖥️ Müşteri Ekranı (CFD) Sayfası
│   │   │   ├── api/                 # Backend API Routes
│   │   │   │   ├── analyze-invoice/ # AI Fatura Analiz Endpoint
│   │   │   │   ├── invoices/        # Fatura CRUD
│   │   │   │   ├── qnb/             # QNB e-Fatura Entegrasyonu
│   │   │   │   └── trendyol/        # Trendyol GO Entegrasyonu
│   │   │   └── m/                   # Mobil görünüm route
│   │   │
│   │   └── components/              # 30+ Modül Klasörü
│   │       ├── AI/                  # Yapay Zeka Modülü
│   │       ├── Admin/               # Yönetim Paneli (SuperAdmin, FeatureManager)
│   │       ├── Adisyon/             # Masa/Adisyon Sistemi
│   │       ├── Auth/                # Lisans & Kimlik Doğrulama
│   │       ├── Banka/               # Banka Hesap Yönetimi
│   │       ├── Common/              # Sidebar (Kategorik), TopBar (Dinamik Başlık)
│   │       ├── CRM/                 # Müşteri İlişkileri Yönetimi
│   │       ├── Dashboard/           # Kontrol Paneli & Grafikler
│   │       ├── Products/            # Ürün Yönetimi
│   │       ├── QRMenu/              # QR Menü Sistemi
│   │       ├── Tools/               # Araçlar (Etiket, Kâr Hesap, Fiş Tasarım)
│   │       └── ...                  # (Cari, Kasa, Fatura, Personel vb.)
│   │
│   └── package.json                 # Electron + Next.js bağımlılıkları
│
├── jetpos-web/                      # 🌐 Pazarlama & Admin Web Sitesi
├── jetpos-mobile/                   # 📱 Mobil Uygulama (PWA - Next.js)
├── supabase/                        # 🗃️ Veritabanı Migrasyonları
└── docs/                            # 📄 Dokümantasyon
```

---

## 🧩 Modüller ve Özellikler

### 1. 💳 POS (Satış Noktası)
- Tam dokunmatik optimize satış ekranı
- Kategoriye göre ürün filtreleme ve arama
- Sepet yönetimi ve çoklu ödeme yöntemleri
- Termal fiş yazdırma ve Kasa çekmecesi açma (RAW bytes)
- Son fiş geri çağırma (Recall Last Receipt)

### 2. 🖥️ Müşteri Ekranı (CFD)
- Müşteri tarafında duran gerçek zamanlı işlem takip ekranı
- **BroadcastChannel API** ile POS ekranıyla anlık senkronizasyon
- **Canva stili** özelleştirilebilir arka plan ve vurgu renkleri
- Ürün görsellerini göster/gizle seçeneği

### 3. 🖼️ Vitrin Tasarımı (Showcase)
- İşletmeye özel çok sayfalı premium web sitesi (Vitrin)
- Dinamik içerik yönetimi (Hero, Ürünler, Hakkımızda)
- SEO dostu URL yapısı (`/v/slug`)

### 4. 📱 QR Menü Sistemi
- Dinamik QR menü oluşturma ve yönetim
- Çalışma saatleri ve manuel kapalı modu
- Mobil uyumlu tasarım (Web Sitesi & Dijital kategorisinde)

### 5. 🤖 Yapay Zeka Modülü
- **AI Satış Asistanı:** Gemini ile sohbet tabanlı danışmanlık
- **AI Fatura Analiz:** PDF fatura OCR ve otomatik kayıt
- **AI CRM Segmentasyonu:** RFM analizi ile müşteri sınıflandırma

### 6. 📊 Finansal Yönetim
- **Cari Hesap Takibi:** 14 alt bileşenli kapsamlı modül
- **Banka & Kasa:** Hesap bazlı bakiye ve fiş takibi
- **Gider Yönetimi:** İşletme giderleri ve raporlama

### 7. 🧾 Fatura & İrsaliye Sistemi
- 6 tip Fatura ve 5 tip İrsaliye desteği
- KDV raporları ve elektronik fatura (QNB Entegrasyonu)

### 8. 📦 Stok & Depo Yönetimi
- Çoklu depo tanımlama ve depolar arası transfer
- Sayım modülü (Barkod ile hızlı sayım)
- Kritik stok uyarıları

### 9. 🛡️ Yönetim Panelleri
- **AdminPortal:** İşletme bazlı ayarlar ve dashboard
- **SuperAdmin:** Tüm kiracılar üzerinde tam kontrol
  - **Kategorik Özellik Yönetimi:** Modüllerin (SATIŞ, ÜRÜN, DİJİTAL, FİNANS, AI) gruplandırılmış yönetimi
  - Lisanslama, Destek Talepleri ve Bildirim Merkezi

### 10. 🧰 Yardımcı Araçlar
- **Ürün Etiket Tasarımcısı:** Barkodlu etiket basımı
- **Fiş Tasarımcısı:** Termal fiş özelleştirme
- **Kâr Hesaplayıcı:** KG/Desi bazlı kârlılık analizi

---

## ⚙️ Teknoloji Yığını (Tech Stack)

| Katman | Teknoloji |
|---|---|
| **Frontend** | React 19 (Desktop/Web/Mobil), Next.js 15 (App Router) |
| **Desktop** | Electron 33, Electron Builder (NSIS), Electron Updater (OTA) |
| **Backend** | Supabase (PostgreSQL, Auth, Realtime, Storage, RPC) |
| **AI** | Google Gemini API (@google/generative-ai) |
| **Styling** | TailwindCSS 4, Framer Motion (Animasyon) |
| **İletişim** | BroadcastChannel API (Ekranlar arası sync) |

---

## 🔐 Güvenlik & Multi-Tenancy

- **Veri İzolasyonu:** PostgreSQL Row Level Security (RLS) ile tenant bazlı koruma.
- **Lisans Kapısı:** `LicenseGate.tsx` üzerinden plan ve özellik kontrolü.
- **Beyaz Etiket:** ENTERPRISE planlar için tam marka özelleştirme desteği.

---

> 📅 Son Güncelleme: 6 Nisan 2026
