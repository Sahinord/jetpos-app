# TRENDYOL GO (by Uber Eats) STOK SENKRONIZASYON SİSTEMİ
## Otomatik İki Yönlü Stok Güncelleme - Market & Kasap Ürünleri

---

## 📋 PROJE ÖZETİ

**Platform:** Trendyol GO by Uber Eats - Hızlı Market Entegrasyonu

**Amaç:** Trendyol GO ile kendi sistemimiz arasında otomatik stok senkronizasyonu

**Ürün Kategorileri:** 
- 🛒 Market ürünleri
- 🥩 Kasap ürünleri (gramajlı)

**Senaryo:**
- ✅ Trendyol GO'da sipariş geldiğinde → Bizim sistemden stok düşer
- ✅ Bizim sistemde stok güncellendiğinde → Trendyol GO'ya gönderilir
- ✅ İade olduğunda → Stok geri eklenir
- ✅ Her 5 dakikada bir otomatik kontrol

**Süre:** 3-4 gün (API erişimi alındıktan sonra)

**Maliyet:** Ücretsiz (Trendyol GO API ücretsiz)

---

## 🎯 SİSTEM AKIŞI

```
┌─────────────────────────────────────────────────────────────┐
│         TRENDYOL GO STOK SENKRONIZASYON AKIŞI               │
└─────────────────────────────────────────────────────────────┘

SENARYO 1: TRENDYOL GO'DA SİPARİŞ GELDİĞİNDE
=============================================

1. TRENDYOL GO'DA SİPARİŞ OLUŞUR
   ├─ Müşteri: Ahmet Yılmaz
   ├─ Ürün: Dana Kıyma 500g (Barkod: 123456789)
   ├─ Adet: 3 paket
   └─ Toplam: 127.50₺

2. SİSTEMİMİZ OTOMATİK KONTROL EDER
   └─ Her 5 dakikada bir yeni siparişleri çeker
      GET /packages?status=Created

3. BİZİM SİSTEMDE STOK GÜNCELLENİR
   ├─ Barkod: 123456789
   ├─ Eski Stok: 50
   ├─ Sipariş: -3
   └─ Yeni Stok: 47 ✅

4. LOG KAYDEDİLİR
   └─ "Trendyol GO siparişi #2048400330 - 3 adet satıldı"


SENARYO 2: BİZİM SİSTEMDE STOK GÜNCELLEME
==========================================

1. KULLANICI BİZİM SİSTEMDEN STOK GİRER
   ├─ Ürün: Dana Kıyma (Barkod: 123456789)
   ├─ Eski Stok: 47
   ├─ Yeni Alım: +20
   └─ Yeni Stok: 67

2. OTOMATİK TRENDYOL GO'YA GÖNDERİLİR
   POST /products/price-and-inventory
   {
     "items": [{
       "barcode": "123456789",
       "quantity": 67,
       "sellingPrice": 42.50
     }]
   }

3. TRENDYOL GO STOK GÜNCELLENİR
   └─ Stok: 67 (şube bazlı veya tüm şubeler)

4. BAŞARILI MESAJI
   └─ "✅ Stok güncellendi ve Trendyol GO'ya gönderildi!"


SENARYO 3: İADE OLDUĞUNDA
===========================

1. MÜŞTERİ İADE YAPTI
   ├─ Sipariş: #2048400330
   ├─ Ürün: Dana Kıyma
   └─ Adet: 1 paket

2. SİSTEMİMİZ İADE SİPARİŞLERİNİ ÇEKER
   GET /claims?claimItemStatus=Accepted

3. BİZİM SİSTEMDE STOK GERİ EKLENİR
   ├─ Eski Stok: 67
   ├─ İade: +1
   └─ Yeni Stok: 68 ✅
```

---

## 🔑 TRENDYOL GO API BİLGİLERİ

### Base URL'ler

```
PRODUCTION: https://api.tgoapis.com/integrator
STAGE (Test): https://stageapi.tgoapis.com/integrator
```

### Authentication (Gerekli Header'lar)

```
x-agentname: "FirmaAdi_Entegrator"
x-executor-user: "kullanici@email.com"
```

**Not:** Henüz Bearer token veya Basic Auth bilgisi yok. Trendyol GO entegrasyon ekibiyle iletişime geçip credentials almanız gerekecek.

---

## 📡 API ENDPOINT'LER

### 1. Yeni Siparişleri Çekme

```http
GET https://api.tgoapis.com/integrator/order/grocery/suppliers/{supplierId}/packages

Query Parameters:
  storeId: 123                    // Şube ID (opsiyonel)
  status: Created                 // Yeni siparişler için "Created"
  startDate: 1678257496000        // Timestamp (milliseconds)
  endDate: 1678344696000          // Timestamp (milliseconds)
  page: 0                         // Sayfa numarası
  size: 200                       // Max 200
  sortDirection: DESC             // Yeniden eskiye

Response:
{
  "content": [
    {
      "id": "1000000216178",                    // Paket ID
      "orderNumber": "2048400330",              // Sipariş No
      "sellerId": 107386,
      "storeId": 116,
      "packageStatus": "Created",
      "lines": [
        {
          "barcode": "123456789",
          "amount": 42.50,
          "price": 42.50,
          "product": {
            "name": "Dana Kıyma 500g",
            "weight": {
              "typeName": "Gr",
              "defaultSaleUnitValue": "500"
            }
          },
          "items": [
            {
              "id": "1000000495105",
              "isCancelled": false,
              "price": 42.50,
              "discount": 0,
              "isCollected": false
            }
          ]
        }
      ],
      "orderDate": 1678257496405,
      "totalPrice": 127.50
    }
  ]
}
```

### 2. Stok ve Fiyat Güncelleme

```http
POST https://api.tgoapis.com/integrator/product/grocery/suppliers/{supplierId}/products/price-and-inventory

Headers:
  Content-Type: application/json
  x-agentname: "FirmaAdi"
  x-executor-user: "user@email.com"

Body:
{
  "items": [
    {
      "barcode": "123456789",
      "quantity": 67,                  // Yeni stok
      "sellingPrice": 42.50,           // Satış fiyatı
      "originalPrice": 50.00,          // İndirimli ise orijinal fiyat
      "storeId": 123                   // Opsiyonel (belirtilmezse tüm şubeler)
    }
  ]
}

Response:
{
  "batchRequestId": "fa75dfd5-6ce6-4730-a09e-97563500000"
}

ÖNEMLİ NOTLAR:
- Maksimum 1000 ürün bir requestte
- Stok = 0 gönderilirse ürün satışa kapanır
- 15 dakika içinde aynı request tekrar atılamaz
- storeId gönderilmezse TÜM ŞUBELER güncellenir
```

### 3. Ürün Sorgulama (Barcode ile)

```http
GET https://api.tgoapis.com/integrator/product/grocery/suppliers/{supplierId}/stores/{storeId}/products

Query Parameters:
  barcode: 123456789              // Tek bir ürün sorgulamak için
  listType: ON_SALE               // ON_SALE, OUT_OF_STOCK, ALL_PRODUCT
  page: 0
  size: 50

Response:
{
  "content": [
    {
      "id": "b174adc65fb139e841c6671ce75f6ec6",
      "barcode": "123456789",
      "title": "Dana Kıyma 500g",
      "quantity": 67,
      "sellingPrice": 42.50,
      "originalPrice": 50.00,
      "onSale": true
    }
  ]
}
```

### 4. İade Siparişlerini Çekme

```http
GET https://api.tgoapis.com/integrator/claim/grocery/suppliers/{supplierId}/claims

Query Parameters:
  claimItemStatus: Accepted       // Created, Accepted, Cancelled, Rejected
  startDate: 1678257496000
  endDate: 1678344696000
  page: 0
  size: 50

Response:
{
  "content": [
    {
      "id": "4f6ff075-3c84-48e9-bca8-836d7b1c7c0c",
      "orderNumber": "2048400330",
      "claimItems": [
        {
          "orderLineItemId": 1000000438183,
          "claimItemStatus": { "name": "Accepted" },
          "customerClaimItemReason": {
            "name": "SKT - Geçmiş Ürün Teslimatı",
            "code": "EXPIRATION_DATE"
          }
        }
      ],
      "claimDate": 1763727792442
    }
  ]
}
```

### 5. Toplu İşlem Kontrolü

Stok güncelleme sonrası işlemin başarılı olup olmadığını kontrol edin:

```http
GET https://api.tgoapis.com/integrator/product/grocery/suppliers/{supplierId}/batch-requests/{batchRequestId}

Response:
{
  "batchRequestId": "fa75dfd5-6ce6-4730-a09e-97563500000",
  "status": "SUCCESS",
  "items": [
    {
      "barcode": "123456789",
      "status": "SUCCESS",
      "failureReasons": []
    }
  ]
}
```

---

## 💻 BACKEND İMPLEMENTATION

### 1. Trendyol GO Client

```typescript
// src/lib/trendyol-go-client.ts

interface TrendyolGoConfig {
  supplierId: string;
  storeId?: string;
  agentName: string;
  executorUser: string;
  baseUrl?: string;
}

interface TrendyolGoOrder {
  id: string;
  orderNumber: string;
  orderDate: number;
  packageStatus: string;
  lines: Array<{
    barcode: string;
    amount: number;
    price: number;
    product: {
      name: string;
      weight?: {
        typeName: string;
        defaultSaleUnitValue: string;
      };
    };
    items: Array<{
      id: string;
      isCancelled: boolean;
      price: number;
    }>;
  }>;
}

export class TrendyolGoClient {
  private config: TrendyolGoConfig;

  constructor(config: TrendyolGoConfig) {
    this.config = {
      ...config,
      baseUrl: config.baseUrl || 'https://api.tgoapis.com/integrator'
    };
  }

  // Gerekli header'ları oluştur
  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'x-agentname': this.config.agentName,
      'x-executor-user': this.config.executorUser
    };
  }

  /**
   * Yeni siparişleri çek
   */
  async getNewOrders(
    startDate: Date,
    endDate: Date,
    status: string = 'Created'
  ): Promise<TrendyolGoOrder[]> {
    const url = `${this.config.baseUrl}/order/grocery/suppliers/${this.config.supplierId}/packages`;
    
    const params = new URLSearchParams({
      status,
      startDate: startDate.getTime().toString(),
      endDate: endDate.getTime().toString(),
      page: '0',
      size: '200',
      sortDirection: 'DESC'
    });

    if (this.config.storeId) {
      params.append('storeId', this.config.storeId);
    }

    try {
      const response = await fetch(`${url}?${params}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Trendyol GO API Error (${response.status}): ${error}`);
      }

      const data = await response.json();
      return data.content || [];

    } catch (error: any) {
      console.error('❌ Trendyol GO siparişleri alınamadı:', error.message);
      throw error;
    }
  }

  /**
   * Tek ürün stok ve fiyat güncelle
   */
  async updateStock(
    barcode: string,
    quantity: number,
    sellingPrice: number,
    originalPrice?: number,
    storeId?: string
  ): Promise<string> {
    return this.updateBulkStock([{
      barcode,
      quantity,
      sellingPrice,
      originalPrice,
      storeId
    }]);
  }

  /**
   * Toplu stok ve fiyat güncelleme (Max 1000 item)
   */
  async updateBulkStock(
    items: Array<{
      barcode: string;
      quantity: number;
      sellingPrice: number;
      originalPrice?: number;
      storeId?: string;
    }>
  ): Promise<string> {
    if (items.length > 1000) {
      throw new Error('Maksimum 1000 ürün bir requestte güncellenebilir');
    }

    const url = `${this.config.baseUrl}/product/grocery/suppliers/${this.config.supplierId}/products/price-and-inventory`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          items: items.map(item => ({
            barcode: item.barcode,
            quantity: item.quantity,
            sellingPrice: item.sellingPrice,
            originalPrice: item.originalPrice || item.sellingPrice,
            storeId: item.storeId || undefined
          }))
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Stok güncellenemedi (${response.status}): ${error}`);
      }

      const result = await response.json();
      console.log(`✅ ${items.length} ürün Trendyol GO'ya gönderildi`);
      
      return result.batchRequestId;

    } catch (error: any) {
      console.error('❌ Trendyol GO stok güncellenemedi:', error.message);
      throw error;
    }
  }

  /**
   * Batch işlem durumunu kontrol et
   */
  async checkBatchStatus(batchRequestId: string): Promise<any> {
    const url = `${this.config.baseUrl}/product/grocery/suppliers/${this.config.supplierId}/batch-requests/${batchRequestId}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Batch status alınamadı: ${response.status}`);
      }

      return await response.json();

    } catch (error: any) {
      console.error('❌ Batch status hatası:', error.message);
      throw error;
    }
  }

  /**
   * Barcode ile ürün sorgula
   */
  async getProductByBarcode(barcode: string, storeId?: string): Promise<any> {
    const store = storeId || this.config.storeId;
    if (!store) {
      throw new Error('storeId gerekli');
    }

    const url = `${this.config.baseUrl}/product/grocery/suppliers/${this.config.supplierId}/stores/${store}/products`;
    
    const params = new URLSearchParams({ barcode });

    try {
      const response = await fetch(`${url}?${params}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Ürün bulunamadı: ${response.status}`);
      }

      const data = await response.json();
      return data.content?.[0] || null;

    } catch (error: any) {
      console.error('❌ Ürün sorgulanamadı:', error.message);
      throw error;
    }
  }

  /**
   * İade siparişlerini çek
   */
  async getReturns(
    startDate: Date,
    endDate: Date,
    status: string = 'Accepted'
  ): Promise<any[]> {
    const url = `${this.config.baseUrl}/claim/grocery/suppliers/${this.config.supplierId}/claims`;
    
    const params = new URLSearchParams({
      claimItemStatus: status,
      startDate: startDate.getTime().toString(),
      endDate: endDate.getTime().toString(),
      page: '0',
      size: '50'
    });

    try {
      const response = await fetch(`${url}?${params}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`İadeler alınamadı: ${response.status}`);
      }

      const data = await response.json();
      return data.content || [];

    } catch (error: any) {
      console.error('❌ İadeler alınamadı:', error.message);
      throw error;
    }
  }

  /**
   * API bağlantısını test et
   */
  async testConnection(): Promise<boolean> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
      
      await this.getNewOrders(startDate, endDate);
      console.log('✅ Trendyol GO API bağlantısı başarılı');
      return true;

    } catch (error: any) {
      console.error('❌ Trendyol GO API bağlantısı başarısız:', error.message);
      return false;
    }
  }
}

// Helper: Environment variables'dan client oluştur
export function createTrendyolGoClient(): TrendyolGoClient {
  const supplierId = process.env.TRENDYOL_GO_SUPPLIER_ID;
  const storeId = process.env.TRENDYOL_GO_STORE_ID;
  const agentName = process.env.TRENDYOL_GO_AGENT_NAME;
  const executorUser = process.env.TRENDYOL_GO_EXECUTOR_USER;

  if (!supplierId || !agentName || !executorUser) {
    throw new Error(
      'Trendyol GO credentials eksik! .env.local:\n' +
      'TRENDYOL_GO_SUPPLIER_ID, TRENDYOL_GO_AGENT_NAME, TRENDYOL_GO_EXECUTOR_USER'
    );
  }

  return new TrendyolGoClient({
    supplierId,
    storeId,
    agentName,
    executorUser
  });
}
```

---

## 🗄️ SUPABASE TABLOLARI

```sql
-- Trendyol GO Sipariş Logları
CREATE TABLE trendyol_go_order_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(50) NOT NULL,
  package_id VARCHAR(50) NOT NULL,
  barcode VARCHAR(50) NOT NULL,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  old_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  order_date TIMESTAMPTZ NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(package_id, barcode)
);

-- Stok Senkronizasyon Logları
CREATE TABLE trendyol_go_sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id),
  barcode VARCHAR(50),
  old_stock INTEGER,
  new_stock INTEGER,
  sync_direction VARCHAR(20) NOT NULL, -- 'FROM_TRENDYOL' | 'TO_TRENDYOL'
  batch_request_id VARCHAR(100),
  status VARCHAR(20) NOT NULL, -- 'SUCCESS' | 'FAILED' | 'PENDING'
  error_message TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- İade Logları
CREATE TABLE trendyol_go_return_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  claim_id VARCHAR(100) NOT NULL,
  order_number VARCHAR(50) NOT NULL,
  barcode VARCHAR(50),
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  old_stock INTEGER,
  new_stock INTEGER,
  claim_date TIMESTAMPTZ,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(claim_id)
);

-- İndeksler
CREATE INDEX idx_tgo_order_logs_order_number ON trendyol_go_order_logs(order_number);
CREATE INDEX idx_tgo_order_logs_created_at ON trendyol_go_order_logs(created_at);
CREATE INDEX idx_tgo_sync_logs_product_id ON trendyol_go_sync_logs(product_id);
CREATE INDEX idx_tgo_sync_logs_created_at ON trendyol_go_sync_logs(created_at);
CREATE INDEX idx_tgo_return_logs_claim_id ON trendyol_go_return_logs(claim_id);

-- products tablosuna barcode ekle (yoksa)
ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode VARCHAR(50) UNIQUE;
```

---

## ⚙️ ENVIRONMENT VARIABLES

```env
# .env.local

# Trendyol GO API
TRENDYOL_GO_SUPPLIER_ID=107386
TRENDYOL_GO_STORE_ID=116
TRENDYOL_GO_AGENT_NAME=FirmaAdi_Entegrator
TRENDYOL_GO_EXECUTOR_USER=admin@firmaadiniz.com

# Cron Job Secret (Vercel)
CRON_SECRET=your_random_secret_here

# Supabase (zaten mevcut)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

---

## 📋 KURULUM ADIMLARI

### 1. Trendyol GO Entegrasyon Başvurusu

```
✅ Trendyol GO Satıcı Paneli'ne giriş yap
   https://partner.trendyol.com

✅ Entegrasyon ekibiyle iletişime geç
   - Email: partner@trendyol.com
   - Konu: "Trendyol GO Hızlı Market API Entegrasyonu"

✅ Gerekli Bilgiler:
   - Supplier ID (Satıcı ID)
   - Store ID (Şube ID'leri)
   - Agent Name (Entegratör adı)
   - Executor User (Email)

✅ Test ortamına erişim iste (STAGE)
```

### 2. Database Schema Oluştur

```sql
-- Yukarıdaki SQL scriptleri Supabase'de çalıştır
```

### 3. Kodları Uygula

```
client/src/lib/trendyol-go-client.ts
client/src/services/stock-sync-trendyol-go.service.ts
client/src/app/api/sync/trendyol-go/...
```

### 4. Test Et

```bash
# Test ortamında dene (STAGE)
# Gerçek siparişlerle test et
# İade senaryosunu test et
```

---

## ✅ CHECKLIST

```
□ Trendyol GO entegrasyon ekibiyle iletişime geç
□ Supplier ID ve Store ID al
□ Test ortamı (STAGE) erişimi al
□ Database tablolarını oluştur
□ TrendyolGoClient class'ını yaz
□ StockSyncService oluştur
□ API route'ları ekle
□ Cron job ayarla
□ .env.local dosyasını doldur
□ STAGE'de test et
□ Production'a geç
```

---

## 🎯 ÖNEMLİ NOTLAR

1. **15 Dakika Kuralı:** Aynı stok bilgisini 15 dakika içinde tekrar gönderemezsiniz
2. **1000 Ürün Limiti:** Bir requestte max 1000 ürün güncellenebilir
3. **Stok = 0:** Ürünü satışa kapatmak için quantity: 0 gönderin
4. **Şube Bazlı:** StoreId göndermezsek TÜM ŞUBELER güncellenir
5. **Batch Control:** Her güncelleme sonrası batchRequestId ile kontrol edin
6. **Gramajlı Ürünler:** Kasap ürünlerinde weight objesi var, dikkat edin
7. **Tarih Format:** GMT+3 kullanıyor (orderDate), GMT (createdDate) karışık

---

## 🚀 SONUÇ

Bu entegrasyon ile:

✅ **Trendyol GO'da satış** → Otomatik stok düşer  
✅ **Sistemde stok değişimi** → Otomatik Trendyol GO'ya gider  
✅ **İade olduğunda** → Stok geri eklenir  
✅ **Her 5 dakika** → Otomatik kontrol  
✅ **Tüm işlemler loglanır** → Takip edilebilir  
✅ **Kasap ürünleri** → Gramaj desteği  

**Tahmini Süre:** 3-4 gün  
**Maliyet:** Ücretsiz
