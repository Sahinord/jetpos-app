# E-FATURA OTOMASYON SİSTEMİ - TEKNİK RAPOR VE UYGULAMA PLANI

## 📋 GİRİŞ

**Hedef:** Trendyol siparişlerinden otomatik e-fatura kesimi
**Sonuç:** Sipariş → Fatura kesimi → PDF alma (tek tıkla)
**Kazanç:** %90+ zaman tasarrufu, manuel hata oranı sıfır

---

## 🏗️ SİSTEM MİMARİSİ

```
┌─────────────────┐
│  TRENDYOL API   │ ─────┐
└─────────────────┘      │
                         ▼
                   ┌──────────────┐
                   │  UYGULAMA    │
                   │  (Backend)   │
                   └──────────────┘
                         │
                         ▼
                   ┌──────────────┐
                   │  QNB e-Fatura│ 
                   │     API      │
                   └──────────────┘
                         │
                         ▼
                   ┌──────────────┐
                   │  PDF Fatura  │
                   └──────────────┘
```

---

## 1️⃣ TRENDYOL API ENTEGRASYONU

### 📌 Gerekli Bilgiler ve Erişimler:

#### A) Trendyol Seller Portal'dan Alınması Gerekenler:

1. **API Credentials:**
   - `API Key` (Supplier ID)
   - `API Secret`
   - `Seller ID`

2. **Nereden Alınır:**
   - Trendyol Seller Office → Entegrasyonlar → API Yönetimi
   - https://partner.trendyol.com/integration-settings

3. **API Endpoint'ler:**
```
Base URL: https://api.trendyol.com/sapigw/suppliers/{supplierId}

Kullanılacak Endpoint'ler:
- GET /orders                    (Siparişleri listele)
- GET /orders/{orderNumber}      (Sipariş detayı)
- GET /orders/shipment-packages  (Kargo paketleri)
```

#### B) Sipariş Verisi Örneği:
```json
{
  "orderNumber": "123456789",
  "orderDate": "2026-01-14T10:30:00",
  "customerFirstName": "Ahmet",
  "customerLastName": "Yılmaz",
  "customerId": "12345",
  "tcIdentityNumber": "12345678901",
  "taxNumber": null,
  "taxOffice": null,
  "companyTitle": null,
  "address": {
    "fullAddress": "Atatürk Mah. Cumhuriyet Cad. No:15 D:3",
    "city": "İstanbul",
    "district": "Kadıköy",
    "postalCode": "34700"
  },
  "invoiceAddress": {
    "firstName": "Ahmet",
    "lastName": "Yılmaz",
    "address": "...",
    "city": "İstanbul",
    "district": "Kadıköy"
  },
  "lines": [
    {
      "productName": "Ziyafet Felice Piliç Döner 200g",
      "barcode": "8690632034577",
      "quantity": 2,
      "price": 85.50,
      "vatRate": 8,
      "merchantSku": "ZYF-DON-200"
    }
  ],
  "totalPrice": 171.00,
  "totalDiscount": 10.00,
  "cargoPrice": 0.00,
  "invoiceRequired": true
}
```

---

## 2️⃣ QNB FİNANSBANK E-FATURA API ENTEGRASYONU

### 📌 Gerekli Bilgiler ve Erişimler:

#### A) QNB Finansbank'tan Alınması Gerekenler:

**ÖNEMLİ:** QNB Finansbank direkt olarak e-Fatura API'si sunmuyor. Türkiye'de e-Fatura entegrasyonu için **resmi e-Fatura sağlayıcılarından** birini kullanmanız gerekiyor.

#### B) YASAL ZORUNLULUK - E-FATURA ENTEGRATÖRÜ GEREKLİ

Türkiye'de e-Fatura kesebilmek için:
1. Gelir İdaresi Başkanlığı (GİB) onaylı **e-Fatura entegratörü** şart
2. QNB direkt API sunmuyor, aşağıdaki entegratörlerden biri gerekli:

### 🏦 ÖNERİLEN E-FATURA ENTEGRATÖRLERI:

#### **1. LOGO e-Fatura (En Popüler)**
- **Web:** https://www.logo.com.tr/e-fatura
- **API Dokümantasyonu:** Var (REST API)
- **Aylık Maliyet:** ~500-1000 TL (hacme göre)
- **Avantajları:** 
  - Türkiye'de en yaygın kullanılan
  - Detaylı API dokümantasyonu
  - 7/24 destek
  - QNB ile entegre çalışabilir

#### **2. İnvoice Maker (Luca)**
- **Web:** https://www.invoicemaker.com.tr
- **API:** REST API
- **Aylık Maliyet:** ~300-600 TL
- **Avantajları:**
  - Modern ve kolay API
  - Startup'lar için uygun fiyat
  - İyi dokümantasyon

#### **3. Foriba (Oracle)**
- **Web:** https://www.foriba.com.tr
- **API:** SOAP + REST
- **Aylık Maliyet:** ~800-1500 TL
- **Avantajları:**
  - Kurumsal çözüm
  - Çok güvenilir
  - Bankalarla entegrasyonu kolay

#### **4. Netsis e-Fatura**
- **Web:** https://www.netsis.com.tr
- **Aylık Maliyet:** ~400-800 TL
- **Avantajları:**
  - Muhasebe yazılımı entegrasyonu kolay
  - KOBİ'ler için ideal

---

## 3️⃣ API ENTEGRASYON DETAYLARI

### A) LOGO e-Fatura API Örneği (ÖNERİLEN)

#### Gerekli Credentials:
```javascript
{
  "username": "firma_kullanici_adi",
  "password": "firma_sifre",
  "CompanyCode": "FIRMA_KODU",
  "environment": "production" // veya "test"
}
```

#### API Endpoint'ler:
```
Base URL: https://efaturaapi.logo.com.tr/api/v1

- POST /auth/login              (Token alma)
- POST /invoices                (Fatura kesme)
- GET  /invoices/{id}/pdf       (PDF indirme)
- GET  /invoices/{id}/status    (Fatura durumu)
- POST /customers               (Müşteri ekleme)
```

#### Fatura Kesme Request Örneği:
```json
POST /invoices
{
  "invoiceType": "SATIS",
  "invoiceProfile": "TICARIFATURA",
  "customer": {
    "name": "Ahmet Yılmaz",
    "taxOrIdentityNumber": "12345678901",
    "taxOffice": null,
    "address": {
      "street": "Atatürk Mah. Cumhuriyet Cad. No:15",
      "city": "İstanbul",
      "district": "Kadıköy",
      "postalCode": "34700",
      "country": "Türkiye"
    },
    "email": "ahmet@example.com",
    "phoneNumber": "+905551234567"
  },
  "documentDate": "2026-01-14",
  "dueDate": "2026-01-14",
  "currency": "TRY",
  "lines": [
    {
      "name": "Ziyafet Felice Piliç Döner 200g",
      "quantity": 2,
      "unitPrice": 85.50,
      "vatRate": 8,
      "vatAmount": 13.68,
      "totalAmount": 184.68
    }
  ],
  "paymentType": "KREDIKARTI",
  "note": "Trendyol Sipariş No: 123456789"
}
```

#### Response Örneği:
```json
{
  "success": true,
  "invoiceId": "LOA2026000001234",
  "uuid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "APPROVED",
  "pdfUrl": "https://efaturaapi.logo.com.tr/downloads/pdf/a1b2c3d4...",
  "createdAt": "2026-01-14T10:35:00Z"
}
```

---

## 4️⃣ UYGULAMA AKIŞI

### Adım Adım Flow:

```
1. Kullanıcı Trendyol siparişlerini listeler
   └─> GET /api/trendyol/orders
   
2. Sipariş seçer, "Fatura Kes" butonuna basar
   └─> Frontend → Backend'e sipariş ID gönderir
   
3. Backend adımları:
   a) Trendyol API'den sipariş detayını çek
   b) Müşteri bilgilerini normalize et
   c) Ürünleri veritabanı ile eşleştir
   d) e-Fatura API'ye fatura kesme isteği gönder
   e) UUID ve PDF linkini al
   f) Veritabanına kaydet
   g) PDF'i indir ve kullanıcıya sun
   
4. Kullanıcı PDF'i görür ve indirebilir
```

---

## 5️⃣ VERİTABANI TABLOLERı

### A) e-Fatura Tablosu:
```sql
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Trendyol Bilgileri
    trendyol_order_number VARCHAR(50) UNIQUE,
    trendyol_order_id VARCHAR(100),
    
    -- e-Fatura Bilgileri
    invoice_number VARCHAR(50) UNIQUE,
    invoice_uuid VARCHAR(100) UNIQUE,
    invoice_date DATE,
    due_date DATE,
    
    -- Müşteri Bilgileri
    customer_name VARCHAR(255),
    customer_tax_number VARCHAR(11),
    customer_tax_office VARCHAR(100),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(20),
    customer_address TEXT,
    
    -- Fatura Tutarları
    subtotal DECIMAL(10,2),
    vat_total DECIMAL(10,2),
    total_amount DECIMAL(10,2),
    
    -- Durum ve Linkler
    status VARCHAR(20), -- DRAFT, APPROVED, SENT, CANCELLED
    pdf_url TEXT,
    xml_url TEXT,
    
    -- JSON Data
    invoice_data JSONB,
    trendyol_data JSONB,
    
    -- Meta
    notes TEXT,
    created_by VARCHAR(50)
);

CREATE INDEX idx_invoices_order_number ON invoices(trendyol_order_number);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_date ON invoices(invoice_date);
```

### B) e-Fatura Satırları:
```sql
CREATE TABLE invoice_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    
    product_name VARCHAR(255),
    product_code VARCHAR(100),
    barcode VARCHAR(50),
    quantity DECIMAL(10,3),
    unit VARCHAR(20),
    unit_price DECIMAL(10,2),
    vat_rate DECIMAL(5,2),
    vat_amount DECIMAL(10,2),
    line_total DECIMAL(10,2),
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_invoice_lines_invoice ON invoice_lines(invoice_id);
```

---

## 6️⃣ BACKEND IMPLEMENTATION (Node.js/TypeScript)

### A) Klasör Yapısı:
```
src/
├── api/
│   ├── trendyol/
│   │   ├── client.ts          # Trendyol API client
│   │   ├── types.ts           # Type definitions
│   │   └── mapper.ts          # Data mapping
│   ├── efatura/
│   │   ├── client.ts          # e-Fatura API client (LOGO)
│   │   ├── types.ts           # Type definitions
│   │   └── formatter.ts       # Fatura formatlama
│   └── routes/
│       ├── trendyol.routes.ts
│       └── invoice.routes.ts
├── services/
│   ├── invoice.service.ts     # Ana fatura servisi
│   └── pdf.service.ts         # PDF işlemleri
└── utils/
    ├── validation.ts          # TC/VKN validasyonu
    └── helpers.ts
```

### B) Ana Servis Kodu (invoice.service.ts):
```typescript
import { TrendyolClient } from '../api/trendyol/client';
import { EFaturaClient } from '../api/efatura/client';
import { supabase } from '../lib/supabase';

export class InvoiceService {
  private trendyolClient: TrendyolClient;
  private eFaturaClient: EFaturaClient;

  constructor() {
    this.trendyolClient = new TrendyolClient({
      apiKey: process.env.TRENDYOL_API_KEY!,
      apiSecret: process.env.TRENDYOL_API_SECRET!,
      supplierId: process.env.TRENDYOL_SUPPLIER_ID!
    });

    this.eFaturaClient = new EFaturaClient({
      username: process.env.EFATURA_USERNAME!,
      password: process.env.EFATURA_PASSWORD!,
      companyCode: process.env.EFATURA_COMPANY_CODE!
    });
  }

  async createInvoiceFromTrendyolOrder(orderNumber: string) {
    try {
      // 1. Trendyol'dan sipariş bilgisini çek
      const order = await this.trendyolClient.getOrder(orderNumber);
      
      // 2. Fatura verisini hazırla
      const invoiceData = this.mapOrderToInvoice(order);
      
      // 3. e-Fatura sistemine gönder
      const invoice = await this.eFaturaClient.createInvoice(invoiceData);
      
      // 4. PDF'i indir
      const pdfBuffer = await this.eFaturaClient.downloadPDF(invoice.uuid);
      
      // 5. Veritabanına kaydet
      const { data, error } = await supabase
        .from('invoices')
        .insert({
          trendyol_order_number: orderNumber,
          invoice_number: invoice.invoiceNumber,
          invoice_uuid: invoice.uuid,
          customer_name: order.customerFirstName + ' ' + order.customerLastName,
          total_amount: order.totalPrice,
          status: invoice.status,
          pdf_url: invoice.pdfUrl,
          invoice_data: invoice,
          trendyol_data: order
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        invoice: data,
        pdfBuffer
      };
      
    } catch (error) {
      console.error('Invoice creation error:', error);
      throw error;
    }
  }

  private mapOrderToInvoice(order: any) {
    return {
      customer: {
        name: `${order.customerFirstName} ${order.customerLastName}`,
        taxOrIdentityNumber: order.tcIdentityNumber || order.taxNumber,
        taxOffice: order.taxOffice,
        address: {
          street: order.invoiceAddress.fullAddress,
          city: order.invoiceAddress.city,
          district: order.invoiceAddress.district
        }
      },
      lines: order.lines.map((line: any) => ({
        name: line.productName,
        quantity: line.quantity,
        unitPrice: line.price,
        vatRate: line.vatRate,
        vatAmount: (line.price * line.quantity * line.vatRate) / 100,
        totalAmount: line.price * line.quantity * (1 + line.vatRate / 100)
      })),
      documentDate: new Date().toISOString().split('T')[0],
      note: `Trendyol Sipariş: ${order.orderNumber}`
    };
  }
}
```

---

## 7️⃣ FRONTEND IMPLEMENTATION

### A) Yeni Component: InvoiceManager.tsx
```tsx
import { useState } from 'react';
import { FileText, Download, Search } from 'lucide-react';

export default function InvoiceManager() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleCreateInvoice = async (orderNumber: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/invoices/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber })
      });

      const data = await response.json();
      
      if (data.success) {
        // PDF'i indir
        window.open(data.pdfUrl, '_blank');
        alert('Fatura başarıyla kesildi!');
      }
    } catch (error) {
      alert('Fatura kesme hatası!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Sipariş listesi ve fatura kesme UI */}
    </div>
  );
}
```

---

## 8️⃣ GEREKLİ ADIMLAR VE ZAMANL

AMA

### Faz 1: Hazırlık (1 hafta)
- [ ] e-Fatura entegratörü seç ve sözleşme imzala (LOGO önerilir)
- [ ] Trendyol API erişimi al
- [ ] Test ortamı kurulumu

### Faz 2: Backend Geliştirme (2 hafta)
- [ ] Trendyol API client oluştur
- [ ] e-Fatura API client oluştur
- [ ] Veritabanı tablolarını oluştur
- [ ] Ana servis kodunu yaz
- [ ] Test et

### Faz 3: Frontend Geliştirme (1 hafta)
- [ ] Sipariş listesi UI
- [ ] Fatura kesme butonu
- [ ] PDF görüntüleyici
- [ ] Fatura geçmişi sayfası

### Faz 4: Test ve Yayın (1 hafta)
- [ ] E2E testler
- [ ] Production deployment
- [ ] İlk gerçek fatura testi

**Toplam Süre:** 5 hafta

---

## 9️⃣ MALİYET TAHMİNİ

| Kalem | Aylık Maliyet |
|-------|---------------|
| e-Fatura Entegratörü (LOGO) | ~800 TL |
| Trendyol API | ÜCRETSİZ |
| Sunucu/Hosting | ~200 TL |
| **TOPLAM** | **~1000 TL/ay** |

**ROI Hesabı:**
- Manuel fatura kesimi: 5 dk/fatura
- Aylık sipariş: 1000 (örnek)
- Manuel zaman: 5000 dk = 83 saat
- Maaş tasarrufu: ~15,000 TL/ay
- **Net Kazanç: ~14,000 TL/ay**

---

## 🔟 GÜVENLİK ÖNERİLERİ

1. **API Key'leri Environment Variable'da sakla**
2. **HTTPS zorunlu**
3. **Rate limiting ekle**
4. **Webhook'lar için HMAC imzası kontrol et**
5. **Logları düzenli sil (KVKK uyumu)**

---

## 📞 İLETİŞİM LİSTESİ

### Kimden Ne İstenmeli:

1. **Trendyol:**
   - İletişim: partner@trendyol.com
   - İstek: API erişimi (Seller Office üzerinden)
   
2. **LOGO e-Fatura:**
   - İletişim: 0850 222 5646
   - Web: https://www.logo.com.tr
   - İstek: e-Fatura API paketi, test hesabı

3. **Alternatif: Luca/Foriba:**
   - İletişim bilgileri yukarıda
   - Demo talep et

---

## ✅ SONUÇ VE ÖNERİ

**EVET, BU SİSTEM TAMAMEN GERÇEKLEŞTİRİLEBİLİR!**

### En İyi Yaklaşım:
1. **LOGO e-Fatura** kullanın (en yaygın, güvenilir)
2. **Trendyol API** entegrasyonu yapın
3. **Backend servis** geliştirin (Node.js)
4. **5 haftada** tamamlayın

### Hemen Başlamak İçin:
1. LOGO ile görüşün → Test hesabı alın
2. Trendyol Seller Office → API Key alın
3. Veritabanı tablolarını oluşturun
4. Backend kodlamaya başlayın

**İsterseniz bu sistemi birlikte kodlayabiliriz!** 🚀
