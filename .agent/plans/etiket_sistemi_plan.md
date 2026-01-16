# 🏷️ Etiket Çıkarma Sistemi - Uygulama Planı

## 📋 Genel Bakış

JetPOS için geliştirilecek etiket çıkarma sistemi, kullanıcıların ürünler için profesyonel fiyat etiketleri oluşturmasını, düzenlemesini ve yazdırmasını sağlayacak.

---

## 🎯 Hedefler

1. Kolay kullanılabilir etiket editörü
2. Hazır şablon galerisi
3. Canlı önizleme
4. Barkod oluşturma desteği
5. Toplu etiket yazdırma
6. PDF export ve termal yazıcı desteği

---

## 📐 Etiket İçeriği

| Alan | Zorunlu | Açıklama |
|------|---------|----------|
| **Ürün Adı** | ✅ | Ürün ismi (max 2 satır) |
| **Fiyat** | ✅ | Satış fiyatı (büyük font) |
| **İndirimli Fiyat** | ❌ | Üstü çizili eski fiyat + yeni fiyat |
| **Barkod** | ✅ | EAN-13, Code128 veya QR Code |
| **Birim** | ✅ | KG / ADET / LT / M² |
| **Dükkan Adı** | ❌ | Firma/mağaza ismi |
| **Logo** | ❌ | Firma logosu (opsiyonel) |
| **Tarih** | ❌ | Etiket basım tarihi |

---

## 🎨 Hazır Şablonlar

### Şablon 1: Klasik (30x20mm)
```
┌─────────────────────────┐
│ [LOGO]  MAĞAZA ADI      │
│─────────────────────────│
│ Ürün Adı                │
│                         │
│ ████████ 12.90 ₺  /KG   │
│ BARKOD                  │
└─────────────────────────┘
```

### Şablon 2: İndirimli (50x30mm)
```
┌───────────────────────────────┐
│ MAĞAZA ADI           [LOGO]  │
│───────────────────────────────│
│ Ürün Adı Buraya Yazılır      │
│                               │
│  ̶1̶5̶.̶9̶0̶ ̶₺̶   →   9.90 ₺     │
│         %38 İNDİRİM          │
│ ████████████████████████████ │
│ 8690000000000                │
└───────────────────────────────┘
```

### Şablon 3: Minimal (40x25mm)
```
┌───────────────────────┐
│ Ürün Adı              │
│                       │
│     19.90 ₺    /ADET  │
│                       │
│ ████████████████████  │
└───────────────────────┘
```

### Şablon 4: Premium (58x40mm)
```
┌─────────────────────────────────────┐
│                                     │
│   [LOGO]  ★ MAĞAZA ADI ★           │
│─────────────────────────────────────│
│                                     │
│         ÜRÜN ADI                    │
│         Alt Açıklama                │
│                                     │
│   ┌─────────────────────────────┐   │
│   │         29.90 ₺             │   │
│   │         /KG                 │   │
│   └─────────────────────────────┘   │
│                                     │
│   ██████████████████████████████   │
│         8690000000000              │
└─────────────────────────────────────┘
```

### Şablon 5: Kampanya Afişi (A6)
```
┌─────────────────────────────────────────┐
│  ★★★ SÜPER FİYAT ★★★                   │
│─────────────────────────────────────────│
│                                         │
│           ÜRÜN ADI                      │
│                                         │
│    ████████████████████████████████    │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │                                 │   │
│  │          19.90                  │   │
│  │            ₺                    │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│         [LOGO] MAĞAZA ADI              │
└─────────────────────────────────────────┘
```

---

## 💻 Teknik Uygulama

### 1. Bileşenler

```
src/components/Labels/
├── LabelEditor.tsx         # Ana editör bileşeni
├── LabelPreview.tsx        # Canlı önizleme
├── LabelTemplates.tsx      # Şablon galerisi
├── BarcodeGenerator.tsx    # Barkod oluşturma
├── LabelPrintModal.tsx     # Yazdırma modal
└── LabelSettings.tsx       # Etiket ayarları
```

### 2. Kullanılacak Kütüphaneler

| Kütüphane | Amaç |
|-----------|------|
| `jsbarcode` | Barkod oluşturma (EAN-13, Code128) |
| `qrcode.react` | QR Code oluşturma |
| `react-to-print` | Yazdırma işlevi |
| `html2canvas` | Görüntü export |
| `jspdf` | PDF oluşturma |
| `@dnd-kit` | Sürükle-bırak düzenleme |

### 3. Veritabanı

```sql
-- Özel şablonlar için
CREATE TABLE label_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    name VARCHAR(100) NOT NULL,
    template_data JSONB NOT NULL, -- Şablon yapısı
    size_width INT DEFAULT 50,    -- mm
    size_height INT DEFAULT 30,   -- mm
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Yazdırma geçmişi
CREATE TABLE label_print_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    product_id UUID REFERENCES products(id),
    template_id UUID REFERENCES label_templates(id),
    quantity INT DEFAULT 1,
    printed_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🖥️ Kullanıcı Arayüzü

### Akış

```
┌──────────────────────────────────────────────────────────────┐
│                    ETİKET OLUŞTUR                            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  1️⃣ ÜRÜN SEÇ          2️⃣ ŞABLON SEÇ        3️⃣ DÜZENLE      │
│  ┌────────────┐       ┌────────────┐       ┌────────────┐   │
│  │ [Ürün Ara] │  →    │ [Şablon 1] │  →    │ [Editör]   │   │
│  │            │       │ [Şablon 2] │       │            │   │
│  │ Elma       │       │ [Şablon 3] │       │ Önizleme   │   │
│  │ Muz        │       │ [Şablon 4] │       │            │   │
│  │ Portakal   │       │ [Şablon 5] │       │ [YAZDIR]   │   │
│  └────────────┘       └────────────┘       └────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Editör Özellikleri

- **Sürükle-Bırak**: Öğeleri taşı ve yeniden konumlandır
- **Boyutlandırma**: Öğelerin boyutunu değiştir
- **Font Ayarları**: Yazı tipi, boyut, renk
- **Hizalama**: Sol, orta, sağ
- **Arka Plan**: Renk veya gradient
- **Çerçeve**: Kenarlık stili

---

## 📦 Özellik Listesi (MVP)

### Faz 1 - Temel (İlk Sürüm)
- [ ] Ürün seçme (arama + listeden)
- [ ] 3 hazır şablon
- [ ] Barkod oluşturma (EAN-13)
- [ ] PDF export
- [ ] Tek etiket yazdırma

### Faz 2 - Gelişmiş
- [ ] Sürükle-bırak editör
- [ ] Logo ekleme
- [ ] İndirimli fiyat gösterimi
- [ ] 5+ şablon
- [ ] Toplu yazdırma (birden fazla ürün)
- [ ] Etiket boyutu seçimi

### Faz 3 - Pro
- [ ] Özel şablon kaydetme
- [ ] Termal yazıcı desteği
- [ ] QR Code
- [ ] Şablon paylaşımı
- [ ] Yazdırma geçmişi

---

## 🎯 Sidebar Entegrasyonu

```typescript
{
    id: "labels",
    label: "Etiket Yönetimi",
    icon: Tags,
    items: [
        { id: "label_create", label: "Etiket Oluştur", icon: Plus },
        { id: "label_templates", label: "Şablonlar", icon: Layout },
        { id: "label_history", label: "Yazdırma Geçmişi", icon: History },
    ]
}
```

---

## 📊 Etiket Boyutları

| Boyut | En x Boy | Kullanım Alanı |
|-------|----------|----------------|
| Küçük | 30x20mm | Raf etiketi (küçük ürünler) |
| Orta | 50x30mm | Standart fiyat etiketi |
| Büyük | 58x40mm | Detaylı etiket (barkodlu) |
| Geniş | 80x50mm | Kampanya etiketi |
| A6 | 105x148mm | Afiş tipi etiket |

---

## 🖨️ Yazıcı Desteği

### Desteklenecek Yazıcılar

1. **Normal Yazıcı (A4)**: 
   - A4 kağıt üzerine birden fazla etiket
   - Grid layout (örn: 3x7 = 21 etiket)

2. **Termal Etiket Yazıcısı**:
   - Zebra GK420d/GC420d
   - TSC serisi
   - Brother QL serisi
   - Xprinter serisi

### Yazdırma Ayarları

```typescript
interface PrintSettings {
    paperSize: 'A4' | 'THERMAL_50x30' | 'THERMAL_58x40';
    copies: number;
    margin: number; // mm
    grid: { rows: number; cols: number }; // A4 için
    cutAfterPrint: boolean; // termal için
}
```

---

## ⏱️ Tahmini Süre

| Faz | Süre | Öncelik |
|-----|------|---------|
| Faz 1 (MVP) | 2-3 saat | Yüksek |
| Faz 2 (Gelişmiş) | 3-4 saat | Orta |
| Faz 3 (Pro) | 4-5 saat | Düşük |

---

## 🚀 Sonraki Adımlar

1. **Onay**: Bu plan uygun mu?
2. **Başlat**: Faz 1 ile başla
3. **Test**: İlk şablonları test et
4. **İyileştir**: Geri bildirime göre geliştir

---

*Bu belge JetPOS Etiket Çıkarma Sistemi için hazırlanmıştır.*
*Tarih: 2026-01-16*
