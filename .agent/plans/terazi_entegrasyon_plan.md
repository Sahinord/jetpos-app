# ⚖️ Terazi Entegrasyon Sistemi - Uygulama Planı

## 📋 Genel Bakış

JetPOS için geliştirilecek terazi entegrasyon sistemi, kasap, manav, şarküteri gibi tartılı ürün satan işletmelerin elektronik terazileri ile tam entegrasyon sağlayacak. Fiyat güncellemesi, ağırlık okuma ve etiket basım işlemlerini otomatikleştirecek.

---

## 🎯 Hedefler

1. Çoklu terazi markası desteği
2. İki yönlü iletişim (okuma + yazma)
3. Otomatik fiyat senkronizasyonu
4. Ağırlık tabanlı satış
5. Terazi üzerinden etiket basımı
6. Toplu PLU (fiyat kodu) yönetimi

---

## ⚖️ Desteklenecek Terazi Markaları

| Marka | Protokol | Bağlantı | Türkiye'de Yaygınlık |
|-------|----------|----------|---------------------|
| **Dibal** | Dibal Protocol | RS-232, Ethernet | ⭐⭐⭐⭐⭐ |
| **CAS** | CAS LP Protocol | RS-232, USB | ⭐⭐⭐⭐ |
| **DIGI** | DIGI Protocol | RS-232, Ethernet | ⭐⭐⭐⭐ |
| **Mettler Toledo** | SICS/MT-SICS | RS-232, Ethernet | ⭐⭐⭐ |
| **Bizerba** | Bizerba Protocol | Ethernet | ⭐⭐⭐ |
| **Toren** | Dibal Compatible | RS-232 | ⭐⭐⭐ |
| **Ohaus** | Ohaus Protocol | RS-232, USB | ⭐⭐ |
| **Aclas** | Aclas Protocol | RS-232, Ethernet | ⭐⭐ |

---

## 🔄 Çift Yönlü İletişim

### JetPOS → Terazi (Yazma)

```
┌─────────────────────────────────────────────┐
│               JetPOS                         │
│  ┌─────────────────────────────────────┐    │
│  │  Ürün: Dana Kıyma                   │    │
│  │  Fiyat: 289.90 ₺/KG                 │    │
│  │  PLU: 001                           │    │
│  │  Barkod: 2100010000000              │    │
│  └─────────────────────────────────────┘    │
│                    │                         │
│                    │ [Fiyat Gönder]          │
│                    ▼                         │
│  ════════════════════════════════════════   │
│          Serial/TCP Bağlantısı               │
│  ════════════════════════════════════════   │
│                    │                         │
│                    ▼                         │
│  ┌─────────────────────────────────────┐    │
│  │          TERAZİ                     │    │
│  │  PLU 001 güncellendi                │    │
│  │  Dana Kıyma - 289.90 ₺/KG          │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

### Terazi → JetPOS (Okuma)

```
┌─────────────────────────────────────────────┐
│          TERAZİ  [2.350 KG]                 │
│                    │                         │
│                    │ Ağırlık Verisi          │
│                    ▼                         │
│  ════════════════════════════════════════   │
│          Serial/TCP Bağlantısı               │
│  ════════════════════════════════════════   │
│                    │                         │
│                    ▼                         │
│               JetPOS POS                     │
│  ┌─────────────────────────────────────┐    │
│  │  Ürün: Dana Kıyma                   │    │
│  │  Ağırlık: 2.350 KG                  │    │
│  │  Birim Fiyat: 289.90 ₺             │    │
│  │  ─────────────────────              │    │
│  │  TOPLAM: 681.27 ₺                   │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

---

## 💻 Teknik Mimari

### 1. Modül Yapısı

```
src/lib/scale/
├── index.ts              # Ana export
├── ScaleManager.ts       # Terazi yöneticisi
├── protocols/
│   ├── BaseProtocol.ts   # Temel protokol sınıfı
│   ├── DibalProtocol.ts  # Dibal teraziler
│   ├── CASProtocol.ts    # CAS teraziler
│   ├── DIGIProtocol.ts   # DIGI teraziler
│   ├── MTProtocol.ts     # Mettler Toledo
│   └── GenericProtocol.ts # Genel RS-232
├── connectors/
│   ├── SerialConnector.ts  # RS-232/COM port
│   ├── TCPConnector.ts     # Ethernet
│   └── USBConnector.ts     # USB HID
└── types.ts              # TypeScript tipleri
```

### 2. Bileşenler

```
src/components/Scale/
├── ScalePanel.tsx        # Ana terazi paneli
├── ScaleSettings.tsx     # Ayarlar modalı
├── ScaleStatus.tsx       # Bağlantı durumu
├── PLUManager.tsx        # PLU yönetimi
├── ScaleWeightDisplay.tsx # Canlı ağırlık gösterimi
└── ScalePriceSync.tsx    # Fiyat senkronizasyonu
```

### 3. Electron Entegrasyonu

Electron uygulaması, Serial Port erişimi için Node.js `serialport` kütüphanesini kullanacak:

```typescript
// main.ts (Electron Main Process)
import { SerialPort } from 'serialport';

ipcMain.handle('scale:connect', async (event, config) => {
    const port = new SerialPort({
        path: config.port,      // 'COM3'
        baudRate: config.baud,  // 9600
        dataBits: 8,
        stopBits: 1,
        parity: 'none'
    });
    
    return { success: true };
});

ipcMain.handle('scale:read-weight', async (event) => {
    // Teraziden ağırlık oku
    return { weight: 2.350, unit: 'KG' };
});

ipcMain.handle('scale:send-plu', async (event, plu) => {
    // Teraziye PLU gönder
    return { success: true };
});
```

---

## 📦 PLU (Price Look-Up) Sistemi

### PLU Nedir?

PLU, terazide kayıtlı ürün kodları sistemidir. Her ürüne bir numara atanır ve kasap bu numaraya basarak ürünü seçer.

### PLU Yapısı

```typescript
interface PLU {
    pluNumber: number;      // 001-999 arası
    productName: string;    // "Dana Kıyma"
    price: number;          // 289.90
    unit: 'KG' | 'ADET';    // Birim
    barcode?: string;       // EAN-13 barkod prefix
    tare?: number;          // Dara (ambalaj ağırlığı)
    expiryDays?: number;    // Son kullanma gün sayısı
}
```

### PLU Barkod Formatı

Tartılı ürünlerde genellikle **EAN-13 Prefix 2** kullanılır:

```
2 [PLU(5)] [AĞIRLIK/FİYAT(5)] [CHECK]

Örnek: 2 10001 02350 X
       │ ────┬ ────┬ │
       │     │     │ └─ Check digit
       │     │     └─── Ağırlık: 2.350 KG
       │     └───────── PLU: 001
       └─────────────── Prefix 2 (tartılı ürün)
```

---

## 🔌 Bağlantı Türleri

### 1. RS-232 (Serial Port)

En yaygın bağlantı türü. USB-Serial dönüştürücü ile modern bilgisayarlara bağlanır.

```
Ayarlar:
├── Port: COM1, COM2, COM3...
├── Baud Rate: 9600, 19200, 38400
├── Data Bits: 8
├── Stop Bits: 1
└── Parity: None
```

### 2. TCP/IP (Ethernet)

Modern terazilerde LAN bağlantısı.

```
Ayarlar:
├── IP: 192.168.1.100
├── Port: 3000 (marka bazlı değişir)
└── Timeout: 5000ms
```

### 3. USB (HID)

Bazı teraziler USB ile bilgisayara direkt bağlanır.

```
Ayarlar:
├── Vendor ID: 0x0483
└── Product ID: 0x5740
```

---

## 🖥️ Kullanıcı Arayüzü

### Terazi Paneli

```
┌────────────────────────────────────────────────────────────────┐
│  ⚖️ TERAZİ YÖNETİMİ                              [Ayarlar ⚙️] │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Bağlantı Durumu: 🟢 Bağlı (Dibal M-525 - COM3)               │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐   │
│  │                                                        │   │
│  │                     2.350 KG                           │   │
│  │                                                        │   │
│  │              Dana Kıyma - PLU 001                      │   │
│  │                                                        │   │
│  │                    681.27 ₺                            │   │
│  │                                                        │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐   │
│  │ 📤 FİYATLARI   │  │ 📥 AĞIRLIK    │  │ 🏷️ ETİKET     │   │
│  │    GÖNDER      │  │    OKU        │  │    BAS        │   │
│  └────────────────┘  └────────────────┘  └────────────────┘   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### PLU Yönetim Ekranı

```
┌────────────────────────────────────────────────────────────────┐
│  📋 PLU YÖNETİMİ                    [Tümünü Gönder] [Yenile]  │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  🔍 [Ara...]                                                   │
│                                                                │
│  ┌──────┬────────────────────────┬───────────┬───────┬──────┐ │
│  │ PLU  │ Ürün Adı               │ Birim     │ Fiyat │ Sync │ │
│  ├──────┼────────────────────────┼───────────┼───────┼──────┤ │
│  │ 001  │ Dana Kıyma             │ KG        │289.90 │  ✅  │ │
│  │ 002  │ Kuzu Pirzola           │ KG        │449.90 │  ✅  │ │
│  │ 003  │ Tavuk Göğüs            │ KG        │149.90 │  ⚠️  │ │
│  │ 004  │ Dana Bonfile           │ KG        │549.90 │  ✅  │ │
│  │ 005  │ Kuşbaşı                │ KG        │329.90 │  ✅  │ │
│  │ 006  │ Sucuk                  │ KG        │199.90 │  ❌  │ │
│  └──────┴────────────────────────┴───────────┴───────┴──────┘ │
│                                                                │
│  Durum: 5/6 ürün senkronize                                   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Ayarlar Modalı

```
┌────────────────────────────────────────────────────────────────┐
│  ⚙️ TERAZİ AYARLARI                                      [X]  │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Terazi Markası:    [Dibal          ▼]                        │
│  Model:             [M-525          ▼]                        │
│                                                                │
│  ── Bağlantı ──────────────────────────────────────────────   │
│                                                                │
│  Bağlantı Tipi:     [Serial (COM)   ▼]                        │
│                                                                │
│  Port:              [COM3           ▼]                        │
│  Baud Rate:         [9600           ▼]                        │
│                                                                │
│  ── Gelişmiş ──────────────────────────────────────────────   │
│                                                                │
│  PLU Prefix:        [2_____]                                  │
│  Dara (gr):         [0_____]                                  │
│                                                                │
│              [Bağlantıyı Test Et]    [Kaydet]                 │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 📊 Özellik Listesi

### Faz 1 - Temel (MVP)
- [ ] Dibal protokol desteği
- [ ] RS-232 seri port bağlantısı
- [ ] Ağırlık okuma
- [ ] Tek PLU gönderme
- [ ] Bağlantı durumu göstergesi
- [ ] Ayarlar paneli

### Faz 2 - Gelişmiş
- [ ] CAS protokol desteği
- [ ] Toplu PLU gönderme
- [ ] PLU yönetim ekranı
- [ ] Ürün ↔ PLU eşleştirme
- [ ] Otomatik fiyat senkronizasyonu
- [ ] TCP/IP bağlantı desteği

### Faz 3 - Pro
- [ ] DIGI, Mettler Toledo desteği
- [ ] Canlı ağırlık gösterimi (POS'ta)
- [ ] Tartı → Sepete ekle
- [ ] Terazi etiket basımı
- [ ] Çoklu terazi desteği
- [ ] Senkronizasyon zamanlayıcı

---

## 🔧 Protokol Örnekleri

### Dibal Protokol

```
Fiyat Gönderme Komutu:
STX + "P" + PLU(4) + FIYAT(8) + AD(24) + ETX + BCC

Örnek:
\x02P0001028990000Dana Kiyma             \x03\xNN

Ağırlık Okuma Cevabı:
STX + "W" + AGIRLIK(6) + BIRIM(2) + ETX + BCC

Örnek:
\x02W002350KG\x03\xNN → 2.350 KG
```

### CAS Protocol

```
PLU Download:
DC1 + PLU# + "," + Fiyat + "," + Birim + "," + Ürün Adı + CR

Örnek:
\x11001,28990,KG,Dana Kiyma\r
```

---

## 🗄️ Veritabanı

```sql
-- Terazi konfigürasyonları
CREATE TABLE scale_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    name VARCHAR(50) NOT NULL,          -- "Kasap Terazisi"
    brand VARCHAR(50) NOT NULL,         -- "Dibal"
    model VARCHAR(50),                  -- "M-525"
    connection_type VARCHAR(20),        -- "serial" | "tcp" | "usb"
    connection_settings JSONB,          -- {"port": "COM3", "baud": 9600}
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- PLU eşleştirmeleri
CREATE TABLE scale_plu_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    scale_id UUID REFERENCES scale_configs(id),
    product_id UUID REFERENCES products(id),
    plu_number INT NOT NULL,            -- 1-999
    last_synced_at TIMESTAMP,
    sync_status VARCHAR(20) DEFAULT 'pending', -- pending, synced, error
    UNIQUE(scale_id, plu_number)
);

-- Senkronizasyon logları
CREATE TABLE scale_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    scale_id UUID REFERENCES scale_configs(id),
    action VARCHAR(50),                 -- "send_plu", "read_weight"
    status VARCHAR(20),                 -- "success", "error"
    details JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 📱 Sidebar Entegrasyonu

```typescript
{
    id: "scale",
    label: "Terazi",
    icon: Scale,
    feature: "scale_integration",
    items: [
        { id: "scale_panel", label: "Terazi Paneli", icon: Scale },
        { id: "plu_manager", label: "PLU Yönetimi", icon: ListOrdered },
        { id: "scale_settings", label: "Terazi Ayarları", icon: Settings },
        { id: "scale_logs", label: "Senkronizasyon Logları", icon: History },
    ]
}
```

---

## ⏱️ Tahmini Süre

| Faz | Süre | Öncelik |
|-----|------|---------|
| Faz 1 (MVP) | 4-5 saat | Yüksek |
| Faz 2 (Gelişmiş) | 5-6 saat | Orta |
| Faz 3 (Pro) | 6-8 saat | Düşük |

---

## 🛠️ Gerekli Kütüphaneler

| Kütüphane | Amaç |
|-----------|------|
| `serialport` | RS-232 seri port iletişimi |
| `usb` | USB HID cihaz iletişimi |
| `net` (Node.js) | TCP/IP soket bağlantısı |

---

## 🚀 Sonraki Adımlar

1. **Onay**: Bu plan uygun mu?
2. **Terazi Bilgisi**: Hangi marka/model terazi kullanılıyor?
3. **Başlat**: Faz 1 ile başla
4. **Test**: Gerçek terazi ile test et

---

*Bu belge JetPOS Terazi Entegrasyon Sistemi için hazırlanmıştır.*
*Tarih: 2026-01-16*
