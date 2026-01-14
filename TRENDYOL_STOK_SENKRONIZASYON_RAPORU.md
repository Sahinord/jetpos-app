# TRENDYOL STOK SENKRONIZASYON SİSTEMİ
## Otomatik İki Yönlü Stok Güncelleme

---

## 📋 PROJE ÖZETİ

**Amaç:** Trendyol ile kendi sistemimiz arasında otomatik stok senkronizasyonu

**Senaryo:**
- ✅ Trendyol'da ürün satıldığında → Bizim sistemden stok düşer
- ✅ Bizim sistemde stok güncellendiğinde → Trendyol'a gönderilir
- ✅ Her 5 dakikada bir otomatik kontrol (Webhook + Polling)

**Süre:** 3-4 gün (Trendyol API erişimi alındıktan sonra)

**Maliyet:** Ücretsiz (Trendyol API ücretsiz)

---

## 🎯 SİSTEM AKIŞI

```
┌─────────────────────────────────────────────────────────────┐
│              TRENDYOL STOK SENKRONIZASYON AKIŞI             │
└─────────────────────────────────────────────────────────────┘

SENARYO 1: TRENDYOL'DA SATIŞ OLDUĞUNDA
=========================================

1. TRENDYOL'DA SİPARİŞ GELİR
   ├─ Ürün: Dana Kıyma (Barkod: 123456789)
   ├─ Adet: 5 paket
   └─ Trendyol Stok: 100 → 95

2. SİSTEMİMİZ OTOMATİK KONTROL EDER
   ├─ Webhook ile anında bildirim (Trendyol → Bizim API)
   └─ veya 5 dakikada bir polling

3. BİZİM SİSTEMDE STOK GÜNCELLENİR
   ├─ Barkod: 123456789
   ├─ Eski Stok: 120
   └─ Yeni Stok: 115 ✅ (5 düşürüldü)

4. STOK GEÇMİŞİ KAYDEDİLİR
   └─ "Trendyol siparişi #TY123456 - 5 adet satıldı"


SENARYO 2: BİZİM SİSTEMDE STOK EKLEME/ÇIKARMA
==============================================

1. KULLANICI BİZİM SİSTEMDEN STOK GİRER
   ├─ Ürün: Dana Kıyma (Barkod: 123456789)
   ├─ Eski Stok: 115
   └─ Yeni Stok: 150 (+35 yeni alım)

2. OTOMATİK TRENDYOL'A GÖNDERİLİR
   └─ API: PUT /suppliers/{supplierId}/products/price-and-inventory

3. TRENDYOL STOK GÜNCELLENİR
   ├─ Eski: 95
   └─ Yeni: 130 ✅ (+35)

4. BAŞARILI MESAJI GÖSTERİLİR
   └─ "✅ Stok güncellendi! Trendyol'a gönderildi."
```

---

## 🔑 TRENDYOL API ENDPOİNT'LER

### 1. Sipariş Listesi Alma (Stok Kontrolü İçin)

```http
GET https://api.trendyol.com/sapigw/suppliers/{supplierId}/orders

Headers:
  User-Id: {supplierId}
  Authorization: Basic {base64(apiKey:apiSecret)}

Query Parameters:
  startDate: 2026-01-14
  endDate: 2026-01-15
  status: Created,Picking,Invoiced

Response:
{
  "content": [
    {
      "orderNumber": "123456789",
      "orderDate": 1705225200000,
      "lines": [
        {
          "barcode": "123456789",
          "productName": "Dana Kıyma",
          "quantity": 5,
          "price": 85.00
        }
      ]
    }
  ]
}
```

### 2. Ürün Stok Güncelleme

```http
PUT https://api.trendyol.com/sapigw/suppliers/{supplierId}/products/price-and-inventory

Headers:
  User-Id: {supplierId}
  Authorization: Basic {base64(apiKey:apiSecret)}
  Content-Type: application/json

Body:
{
  "items": [
    {
      "barcode": "123456789",
      "quantity": 150,
      "salePrice": 85.00,
      "listPrice": 85.00
    }
  ]
}

Response:
{
  "batchRequestId": "abc-123-def",
  "items": [
    {
      "barcode": "123456789",
      "failureReasons": []
    }
  ]
}
```

### 3. Ürün Bilgisi Alma

```http
GET https://api.trendyol.com/sapigw/suppliers/{supplierId}/products

Query Parameters:
  barcode: 123456789

Response:
{
  "content": [
    {
      "barcode": "123456789",
      "title": "Dana Kıyma",
      "quantity": 130,
      "salePrice": 85.00,
      "approved": true
    }
  ]
}
```

### 4. Webhook (Gerçek Zamanlı Bildirim)

Trendyol, sipariş oluşturulduğunda bizim API'mize POST gönderir:

```http
POST https://yourdomain.com/api/webhooks/trendyol

Body:
{
  "eventType": "ORDER_CREATED",
  "eventTime": 1705225200000,
  "orderNumber": "123456789",
  "supplierId": "123456"
}
```

---

## 💻 BACKEND İMPLEMENTATION

### 1. Trendyol Client (TypeScript)

```typescript
// src/api/trendyol/client.ts

import fetch from 'node-fetch';

interface TrendyolConfig {
  apiKey: string;
  apiSecret: string;
  supplierId: string;
  baseUrl: string;
}

export class TrendyolClient {
  private config: TrendyolConfig;

  constructor(config: TrendyolConfig) {
    this.config = config;
  }

  // Basic Auth header
  private getAuthHeader(): string {
    const credentials = `${this.config.apiKey}:${this.config.apiSecret}`;
    return `Basic ${Buffer.from(credentials).toString('base64')}`;
  }

  // 1. Siparişleri Çek (Son 24 saat)
  async getOrders(startDate: Date, endDate: Date): Promise<any[]> {
    const url = `${this.config.baseUrl}/suppliers/${this.config.supplierId}/orders`;
    
    const params = new URLSearchParams({
      startDate: startDate.getTime().toString(),
      endDate: endDate.getTime().toString(),
      status: 'Created,Picking,Invoiced'
    });

    const response = await fetch(`${url}?${params}`, {
      headers: {
        'User-Id': this.config.supplierId,
        'Authorization': this.getAuthHeader()
      }
    });

    const data = await response.json();
    return data.content || [];
  }

  // 2. Stok Güncelle
  async updateStock(barcode: string, quantity: number, price: number): Promise<boolean> {
    const url = `${this.config.baseUrl}/suppliers/${this.config.supplierId}/products/price-and-inventory`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'User-Id': this.config.supplierId,
        'Authorization': this.getAuthHeader(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        items: [{
          barcode,
          quantity,
          salePrice: price,
          listPrice: price
        }]
      })
    });

    const result = await response.json();
    
    // Başarısızlık kontrolü
    const item = result.items?.[0];
    if (item?.failureReasons?.length > 0) {
      throw new Error(`Stok güncellenemedi: ${item.failureReasons.join(', ')}`);
    }

    return true;
  }

  // 3. Ürün Bilgisi Al
  async getProduct(barcode: string): Promise<any> {
    const url = `${this.config.baseUrl}/suppliers/${this.config.supplierId}/products`;
    
    const params = new URLSearchParams({ barcode });

    const response = await fetch(`${url}?${params}`, {
      headers: {
        'User-Id': this.config.supplierId,
        'Authorization': this.getAuthHeader()
      }
    });

    const data = await response.json();
    return data.content?.[0] || null;
  }

  // 4. Toplu Stok Güncelleme
  async updateBulkStock(items: Array<{ barcode: string; quantity: number; price: number }>): Promise<any> {
    const url = `${this.config.baseUrl}/suppliers/${this.config.supplierId}/products/price-and-inventory`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'User-Id': this.config.supplierId,
        'Authorization': this.getAuthHeader(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        items: items.map(item => ({
          barcode: item.barcode,
          quantity: item.quantity,
          salePrice: item.price,
          listPrice: item.price
        }))
      })
    });

    return await response.json();
  }
}
```

### 2. Stok Senkronizasyon Servisi

```typescript
// src/services/stock-sync.service.ts

import { TrendyolClient } from '../api/trendyol/client';
import { supabase } from '../lib/supabase';

export class StockSyncService {
  private trendyolClient: TrendyolClient;

  constructor() {
    this.trendyolClient = new TrendyolClient({
      apiKey: process.env.TRENDYOL_API_KEY!,
      apiSecret: process.env.TRENDYOL_API_SECRET!,
      supplierId: process.env.TRENDYOL_SUPPLIER_ID!,
      baseUrl: 'https://api.trendyol.com/sapigw'
    });
  }

  // SENARYO 1: Trendyol'dan Bizim Sisteme Stok Güncelle
  async syncFromTrendyol(): Promise<void> {
    try {
      console.log('🔄 Trendyol siparişleri kontrol ediliyor...');

      // Son 24 saatteki siparişleri çek
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);

      const orders = await this.trendyolClient.getOrders(startDate, endDate);

      for (const order of orders) {
        // Her bir sipariş satırını işle
        for (const line of order.lines) {
          await this.processOrderLine(order.orderNumber, line);
        }
      }

      console.log(`✅ ${orders.length} sipariş işlendi`);
    } catch (error: any) {
      console.error('❌ Trendyol senkronizasyon hatası:', error.message);
      throw error;
    }
  }

  // Sipariş satırını işle ve stok düş
  private async processOrderLine(orderNumber: string, line: any): Promise<void> {
    try {
      // Barkod ile ürünü bul
      const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('barcode', line.barcode)
        .single();

      if (error || !product) {
        console.warn(`⚠️ Ürün bulunamadı: ${line.barcode}`);
        return;
      }

      // Daha önce işlenmiş mi kontrol et
      const { data: existingLog } = await supabase
        .from('trendyol_order_logs')
        .select('*')
        .eq('order_number', orderNumber)
        .eq('barcode', line.barcode)
        .single();

      if (existingLog) {
        console.log(`⏭️ Zaten işlenmiş: ${orderNumber} - ${line.barcode}`);
        return;
      }

      // Stok düş
      const newStock = Math.max(0, product.stock - line.quantity);

      await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', product.id);

      // Log kaydet
      await supabase
        .from('trendyol_order_logs')
        .insert({
          order_number: orderNumber,
          barcode: line.barcode,
          product_id: product.id,
          quantity: line.quantity,
          old_stock: product.stock,
          new_stock: newStock,
          note: `Trendyol siparişi: ${orderNumber}`
        });

      console.log(`✅ Stok güncellendi: ${line.barcode} (${product.stock} → ${newStock})`);

    } catch (error: any) {
      console.error(`❌ İşlem hatası (${line.barcode}):`, error.message);
    }
  }

  // SENARYO 2: Bizim Sistemden Trendyol'a Stok Güncelle
  async syncToTrendyol(productId: string, newStock: number): Promise<void> {
    try {
      // Ürün bilgisini al
      const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error || !product) {
        throw new Error('Ürün bulunamadı');
      }

      if (!product.barcode) {
        throw new Error('Ürünün barkodu yok');
      }

      // Trendyol'a gönder
      await this.trendyolClient.updateStock(
        product.barcode,
        newStock,
        product.price
      );

      // Log kaydet
      await supabase
        .from('stock_sync_logs')
        .insert({
          product_id: productId,
          barcode: product.barcode,
          old_stock: product.stock,
          new_stock: newStock,
          sync_direction: 'TO_TRENDYOL',
          status: 'SUCCESS',
          note: 'Sistem stok güncellemesi'
        });

      console.log(`✅ Trendyol'a gönderildi: ${product.barcode} (${newStock})`);

    } catch (error: any) {
      console.error('❌ Trendyol güncelleme hatası:', error.message);
      
      // Hata log'u
      await supabase
        .from('stock_sync_logs')
        .insert({
          product_id: productId,
          sync_direction: 'TO_TRENDYOL',
          status: 'FAILED',
          error_message: error.message
        });

      throw error;
    }
  }

  // Toplu senkronizasyon (İlk kurulum için)
  async bulkSyncToTrendyol(): Promise<void> {
    try {
      console.log('🔄 Toplu stok senkronizasyonu başlatılıyor...');

      // Tüm ürünleri al (barkodu olanlar)
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .not('barcode', 'is', null);

      if (error || !products) {
        throw new Error('Ürünler alınamadı');
      }

      // Batch'ler halinde gönder (100'er)
      const batchSize = 100;
      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize);
        
        const items = batch.map(p => ({
          barcode: p.barcode,
          quantity: p.stock,
          price: p.price
        }));

        await this.trendyolClient.updateBulkStock(items);
        
        console.log(`✅ ${i + batch.length}/${products.length} ürün güncellendi`);
      }

      console.log('✅ Toplu senkronizasyon tamamlandı');

    } catch (error: any) {
      console.error('❌ Toplu senkronizasyon hatası:', error.message);
      throw error;
    }
  }
}
```

### 3. API Routes

```typescript
// src/app/api/sync/from-trendyol/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { StockSyncService } from '@/services/stock-sync.service';

export async function POST(req: NextRequest) {
  try {
    const syncService = new StockSyncService();
    await syncService.syncFromTrendyol();

    return NextResponse.json({
      success: true,
      message: 'Trendyol siparişleri işlendi'
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

```typescript
// src/app/api/sync/to-trendyol/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { StockSyncService } from '@/services/stock-sync.service';

export async function POST(req: NextRequest) {
  try {
    const { productId, newStock } = await req.json();

    const syncService = new StockSyncService();
    await syncService.syncToTrendyol(productId, newStock);

    return NextResponse.json({
      success: true,
      message: 'Stok Trendyol\'a gönderildi'
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

```typescript
// src/app/api/webhooks/trendyol/route.ts
// Trendyol webhook endpoint'i (gerçek zamanlı bildirim)

import { NextRequest, NextResponse } from 'next/server';
import { StockSyncService } from '@/services/stock-sync.service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log('📨 Trendyol webhook alındı:', body);

    // Sipariş oluşturulduğunda
    if (body.eventType === 'ORDER_CREATED') {
      const syncService = new StockSyncService();
      await syncService.syncFromTrendyol();
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Webhook hatası:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

---

## 🗄️ SUPABASE TABLOLARI

```sql
-- Trendyol Sipariş Logları (Tekrar işlenmemesi için)
CREATE TABLE trendyol_order_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(50) NOT NULL,
  barcode VARCHAR(50) NOT NULL,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  old_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(order_number, barcode)
);

-- Stok Senkronizasyon Logları (Her iki yön için)
CREATE TABLE stock_sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id),
  barcode VARCHAR(50),
  old_stock INTEGER,
  new_stock INTEGER,
  sync_direction VARCHAR(20) NOT NULL, -- 'FROM_TRENDYOL' | 'TO_TRENDYOL'
  status VARCHAR(20) NOT NULL, -- 'SUCCESS' | 'FAILED'
  error_message TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- İndeksler
CREATE INDEX idx_trendyol_logs_order_number ON trendyol_order_logs(order_number);
CREATE INDEX idx_trendyol_logs_created_at ON trendyol_order_logs(created_at);
CREATE INDEX idx_stock_sync_logs_product_id ON stock_sync_logs(product_id);
CREATE INDEX idx_stock_sync_logs_created_at ON stock_sync_logs(created_at);

-- products tablosuna barcode kolonu eklenmişse:
-- ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode VARCHAR(50) UNIQUE;
```

---

## ⏰ CRON JOB (Otomatik Senkronizasyon - Her 5 Dakika)

### Vercel Cron Job

```typescript
// src/app/api/cron/sync-trendyol/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { StockSyncService } from '@/services/stock-sync.service';

export async function GET(req: NextRequest) {
  // Güvenlik kontrolü (Vercel Cron Secret)
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const syncService = new StockSyncService();
    await syncService.syncFromTrendyol();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

**vercel.json**
```json
{
  "crons": [
    {
      "path": "/api/cron/sync-trendyol",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

---

## 🎨 FRONTEND COMPONENTS

### 1. Stok Güncelleme Bileşeni (Trendyol'a Otomatik Gönderim)

```tsx
// src/components/Stock/StockUpdateModal.tsx

'use client';

import { useState } from 'react';
import { Package, Upload, CheckCircle } from 'lucide-react';

interface StockUpdateModalProps {
  product: any;
  onClose: () => void;
  onUpdate: () => void;
}

export default function StockUpdateModal({ product, onClose, onUpdate }: StockUpdateModalProps) {
  const [newStock, setNewStock] = useState(product.stock);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleUpdate = async () => {
    setLoading(true);

    try {
      // Önce kendi veritabanımızı güncelle
      const updateResponse = await fetch('/api/products/update-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          newStock
        })
      });

      if (!updateResponse.ok) throw new Error('Stok güncellenemedi');

      // Trendyol'a gönder (eğer barkod varsa)
      if (product.barcode) {
        const syncResponse = await fetch('/api/sync/to-trendyol', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: product.id,
            newStock
          })
        });

        if (!syncResponse.ok) {
          console.warn('⚠️ Trendyol güncellenemedi');
        } else {
          setSuccess(true);
        }
      }

      onUpdate();
      setTimeout(() => onClose(), 2000);

    } catch (error) {
      alert('❌ Hata oluştu!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="glass-card w-full max-w-md p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
            <Package className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">STOK GÜNCELLE</h2>
            <p className="text-sm text-secondary">{product.name}</p>
          </div>
        </div>

        {/* Mevcut Stok */}
        <div className="p-4 bg-white/5 rounded-xl">
          <p className="text-xs text-secondary font-bold uppercase mb-2">Mevcut Stok</p>
          <p className="text-3xl font-black text-white">{product.stock} Adet</p>
        </div>

        {/* Yeni Stok */}
        <div className="space-y-2">
          <label className="block text-sm font-black text-white uppercase">
            Yeni Stok
          </label>
          <input
            type="number"
            value={newStock}
            onChange={(e) => setNewStock(Number(e.target.value))}
            className="w-full bg-white/10 border-2 border-primary/50 rounded-xl py-4 px-6 text-3xl font-black text-center text-white focus:border-primary outline-none"
            autoFocus
          />
          <div className="flex items-center justify-center gap-2 text-sm">
            {newStock > product.stock ? (
              <span className="text-emerald-400 font-bold">+{newStock - product.stock} Eklendi</span>
            ) : newStock < product.stock ? (
              <span className="text-amber-400 font-bold">{newStock - product.stock} Çıkarıldı</span>
            ) : (
              <span className="text-secondary">Değişiklik yok</span>
            )}
          </div>
        </div>

        {/* Trendyol Bilgisi */}
        {product.barcode && (
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center gap-3">
            <Upload className="w-5 h-5 text-blue-400" />
            <div className="flex-1">
              <p className="text-sm font-bold text-blue-400">Trendyol'a Otomatik Gönderilecek</p>
              <p className="text-xs text-secondary">Barkod: {product.barcode}</p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <p className="text-sm font-bold text-emerald-400">✅ Trendyol'a gönderildi!</p>
          </div>
        )}

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="py-4 rounded-2xl bg-white/5 hover:bg-white/10 font-bold transition-all disabled:opacity-50"
          >
            İPTAL
          </button>
          <button
            onClick={handleUpdate}
            disabled={loading || newStock === product.stock}
            className="py-4 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black shadow-xl shadow-primary/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Güncelleniyor...
              </>
            ) : (
              <>
                <Package className="w-5 h-5" />
                GÜNCELLE
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 2. Senkronizasyon Durumu Widget'ı

```tsx
// src/components/Dashboard/TrendyolSyncStatus.tsx

'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

export default function TrendyolSyncStatus() {
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [stats, setStats] = useState({
    totalOrders: 0,
    stockUpdates: 0,
    errors: 0
  });

  useEffect(() => {
    fetchSyncStatus();
    // Her 30 saniyede bir güncelle
    const interval = setInterval(fetchSyncStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchSyncStatus = async () => {
    // API'den son senkronizasyon bilgilerini al
    const response = await fetch('/api/sync/status');
    const data = await response.json();
    
    setLastSync(new Date(data.lastSync));
    setStats(data.stats);
  };

  const handleManualSync = async () => {
    setSyncing(true);
    
    try {
      await fetch('/api/sync/from-trendyol', { method: 'POST' });
      await fetchSyncStatus();
    } catch (error) {
      alert('❌ Senkronizasyon hatası!');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
            <RefreshCw className={`w-5 h-5 text-blue-400 ${syncing ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">TRENDYOL SENKRONIZASYON</h3>
            <p className="text-xs text-secondary">
              {lastSync ? `Son: ${lastSync.toLocaleTimeString('tr-TR')}` : 'Henüz senkronize edilmedi'}
            </p>
          </div>
        </div>
        
        <button
          onClick={handleManualSync}
          disabled={syncing}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-xl text-white text-sm font-bold transition-all disabled:opacity-50 flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          Sync
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-white/5 rounded-lg">
          <p className="text-xs text-secondary font-bold mb-1">Siparişler</p>
          <p className="text-2xl font-black text-white">{stats.totalOrders}</p>
        </div>
        <div className="p-3 bg-white/5 rounded-lg">
          <p className="text-xs text-secondary font-bold mb-1">Güncellenen</p>
          <p className="text-2xl font-black text-emerald-400">{stats.stockUpdates}</p>
        </div>
        <div className="p-3 bg-white/5 rounded-lg">
          <p className="text-xs text-secondary font-bold mb-1">Hatalar</p>
          <p className="text-2xl font-black text-red-400">{stats.errors}</p>
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center gap-2 text-sm">
        {stats.errors === 0 ? (
          <>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400 font-bold">Tüm sistemler normal</span>
          </>
        ) : (
          <>
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 font-bold">Bazı hatalar var</span>
          </>
        )}
      </div>
    </div>
  );
}
```

---

## ⚙️ ENVIRONMENT VARIABLES

```env
# .env.local

# Trendyol API
TRENDYOL_API_KEY=your_api_key_here
TRENDYOL_API_SECRET=your_api_secret_here
TRENDYOL_SUPPLIER_ID=123456

# Cron Job Secret (Vercel)
CRON_SECRET=generate_random_secret_here

# Supabase (zaten mevcut)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

---

## 📋 KURULUM ADIMLARI

### 1. Trendyol API Erişimi Al

```
✅ Adım 1: Trendyol Seller Office'e giriş yap
   https://partner.trendyol.com

✅ Adım 2: Entegrasyonlar → API Yönetimi

✅ Adım 3: API Key ve Secret oluştur
   - API Key: xxxxx-xxxxx-xxxxx
   - API Secret: yyyyy-yyyyy-yyyyy
   - Supplier ID: 123456

✅ Adım 4: Webhook URL ayarla (opsiyonel ama önerilen)
   https://yourdomain.com/api/webhooks/trendyol
```

### 2. Database Schema Oluştur

```bash
# Supabase SQL Editor'de çalıştır:
# TRENDYOL_STOK_SENKRONIZASYON_RAPORU.md içindeki SQL scriptlerini
```

### 3. Kodları Uygula

```bash
# API Client
src/api/trendyol/client.ts

# Services
src/services/stock-sync.service.ts

# API Routes
src/app/api/sync/from-trendyol/route.ts
src/app/api/sync/to-trendyol/route.ts
src/app/api/webhooks/trendyol/route.ts
src/app/api/cron/sync-trendyol/route.ts

# Components
src/components/Stock/StockUpdateModal.tsx
src/components/Dashboard/TrendyolSync Status.tsx
```

### 4. Environment Variables

```bash
# .env.local dosyasına ekle
TRENDYOL_API_KEY=...
TRENDYOL_API_SECRET=...
TRENDYOL_SUPPLIER_ID=...
CRON_SECRET=...
```

### 5. İlk Senkronizasyon

```bash
# Manuel olarak ilk kez tüm ürünleri Trendyol'a gönder
POST /api/sync/bulk-to-trendyol
```

### 6. Cron Job Aktif Et (Vercel)

```bash
# vercel.json dosyası oluştur (proje root'unda)
# Her 5 dakikada bir otomatik senkronizasyon
```

---

## 🚀 KULLANIM SENARYOLARI

### Senaryo 1: Manuel Stok Güncelleme

1. Kullanıcı ürün tablosundan bir ürün seçer
2. "Stok Güncelle" butonuna tıklar
3. Yeni stok miktarını girer
4. Sistem otomatik olarak:
   - Kendi veritabanını günceller
   - Trendyol'a gönderir
   - Log kaydı tutar

### Senaryo 2: Otomatik Senkronizasyon (Her 5 Dakika)

1. Vercel Cron Job tetiklenir
2. Son 24 saatteki Trendyol siparişlerini kontrol eder
3. Yeni siparişler için stok düşer
4. Log kaydı tutar

### Senaryo 3: Webhook (Gerçek Zamanlı)

1. Trendyol'da sipariş oluşur
2. Trendyol bizim API'mize webhook gönderir
3. Anında sipariş işlenir
4. Stok güncellenir

---

## 🐛 HATA KONTROLÜ

```typescript
// Örnek Hata Senaryoları:

1. Trendyol API hatası
   → Log'a kaydet
   → Kullanıcıya bildir
   → 5 dakika sonra tekrar dene

2. Barkod eşleşmemesi
   → Uyarı göster
   → Manuel müdahale gerektir
   → Eşleşmeyen ürünleri listele

3. Stok yetersizliği
   → Negatif stok olmasın
   → Minimum 0
   → Uyarı mesajı göster

4. Ağ hatası
   → Retry mekanizması (3 deneme)
   → Exponential backoff
   → Log kaydet
```

---

## 📊 İZLEME VE RAPORLAMA

```typescript
// Dashboard'da gösterilmesi gerekenler:

1. Son senkronizasyon zamanı
2. Bugün işlenen sipariş sayısı
3. Bugün güncellenen stok sayısı
4. Hata sayısı
5. Son 10 stok hareketi
6. Trendyol bağlantı durumu (Connected/Disconnected)
```

---

## ✅ CHECKLIST

```
□ Trendyol API key al
□ Database tablolarını oluştur
□ TrendyolClient class'ını yaz
□ StockSyncService oluştur
□ API route'ları ekle
□ Webhook endpoint'i hazırla
□ Cron job ayarla
□ Frontend component'leri ekle
□ .env.local dosyasını doldur
□ İlk senkronizasyonu yap
□ Test et (sipariş + stok güncelleme)
□ Production'a deploy et
□ Trendyol'a webhook URL'ini ver
```

---

## 🎯 SONUÇ

Bu sistem ile:

✅ **Trendyol'da satış olduğunda** → Otomatik stok düşer  
✅ **Sistemde stok eklendiğinde** → Otomatik Trendyol'a gider  
✅ **Her 5 dakikada** → Otomatik kontrol  
✅ **Webhook ile** → Gerçek zamanlı güncelleme  
✅ **Tüm işlemler loglanır** → Takip edilebilir  

**Tahmini Süre:** 3-4 gün (API erişimi alındıktan sonra)  
**Maliyet:** Ücretsiz (Trendyol API ücretsiz)
