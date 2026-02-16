# 📋 DEPO YÖNETİMİ — Uygulama Raporu

## 1. Genel Bakış

**Amaç:** Ürün stoklarını birden fazla lokasyonda (depo, raf, soğuk hava deposu) takip etmek.  
**Hedef Kullanıcı:** Toptancılar, zincir mağazalar, üretim yapan işletmeler.  
**Mevcut Durum:** Şu an JetPOS'ta tek depo var — `products.stock_quantity` tek bir sayı tutuyor.

---

## 2. Kullanıcı Senaryoları

### Senaryo 1: Toptancı
```
Ahmet Bey'in merkez deposunda 500 kg dana kıyma var.
Mağaza rafına 30 kg koymak istiyor.
→ "Transfer Fişi" oluşturur: Merkez Depo → Mağaza Rafı (30 kg)
→ Merkez: 470 kg, Mağaza: 30 kg olur.
```

### Senaryo 2: Sayım
```
Ay sonu geldi, Ahmet Bey deposundaki stokları saymak istiyor.
→ "Sayım Fişi" açar
→ Sistemde 470 kg yazıyor ama saydığında 462 kg çıkıyor
→ Farkı (8 kg fire) kaydeder
→ Sistem otomatik güncellenir
```

### Senaryo 3: Tedarik
```
Tedarikçiden 200 kg et geldi.
→ Alış irsaliyesinde hedef depo seçilir: "Soğuk Hava Deposu"
→ Sadece o deponun stoku artar
```

---

## 3. Veritabanı Tasarımı

### 3.1 Yeni Tablo: `warehouses` (Depo Tanımları)

```sql
CREATE TABLE warehouses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    name VARCHAR(100) NOT NULL,                  -- "Ana Depo", "Mağaza Rafı", "Soğuk Hava"
    code VARCHAR(20),                            -- "D001", "RAF01"
    type VARCHAR(30) DEFAULT 'storage',          -- 'storage', 'shelf', 'cold_storage', 'production'
    address TEXT,
    description TEXT,
    
    is_default BOOLEAN DEFAULT false,            -- Varsayılan depo mu?
    is_active BOOLEAN DEFAULT true,
    
    -- Sorumlular
    manager_name VARCHAR(100),
    manager_phone VARCHAR(20),
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(tenant_id, code)
);

-- Her tenant'ın en az 1 varsayılan deposu olmalı
CREATE UNIQUE INDEX idx_default_warehouse 
    ON warehouses(tenant_id) 
    WHERE is_default = true;
```

### 3.2 Yeni Tablo: `warehouse_stock` (Depo Stokları)

```sql
CREATE TABLE warehouse_stock (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    quantity NUMERIC(12,3) DEFAULT 0,            -- Stok miktarı (ondalıklı: 2.5 kg gibi)
    min_quantity NUMERIC(12,3) DEFAULT 0,        -- Minimum stok seviyesi (alert için)
    max_quantity NUMERIC(12,3),                   -- Maksimum kapasite
    
    last_counted_at TIMESTAMPTZ,                 -- Son sayım tarihi
    last_counted_quantity NUMERIC(12,3),          -- Son sayımda bulunan miktar
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(warehouse_id, product_id)             -- Aynı ürün aynı depoda 1 kayıt
);
```

### 3.3 Yeni Tablo: `warehouse_transfers` (Transfer Fişleri)

```sql
CREATE TABLE warehouse_transfers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    transfer_no VARCHAR(50) NOT NULL,            -- "TRF-2026-00001"
    transfer_date TIMESTAMPTZ DEFAULT now(),
    
    from_warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    to_warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    
    status VARCHAR(20) DEFAULT 'pending',        -- 'pending', 'in_transit', 'completed', 'cancelled'
    notes TEXT,
    
    -- Kim oluşturdu / onayladı
    created_by VARCHAR(100),
    approved_by VARCHAR(100),
    approved_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    CHECK(from_warehouse_id != to_warehouse_id)  -- Aynı depodan aynı depoya transfer yasak
);
```

### 3.4 Yeni Tablo: `warehouse_transfer_items` (Transfer Kalemleri)

```sql
CREATE TABLE warehouse_transfer_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    transfer_id UUID NOT NULL REFERENCES warehouse_transfers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    
    quantity NUMERIC(12,3) NOT NULL,              -- Transfer edilen miktar
    unit VARCHAR(20) DEFAULT 'Adet',
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT now()
);
```

### 3.5 Yeni Tablo: `inventory_counts` (Sayım Fişleri)

```sql
CREATE TABLE inventory_counts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    
    count_no VARCHAR(50) NOT NULL,               -- "SAY-2026-00001"
    count_date TIMESTAMPTZ DEFAULT now(),
    status VARCHAR(20) DEFAULT 'draft',          -- 'draft', 'in_progress', 'completed'
    
    notes TEXT,
    counted_by VARCHAR(100),
    approved_by VARCHAR(100),
    
    total_items INTEGER DEFAULT 0,
    total_difference NUMERIC(12,3) DEFAULT 0,    -- Toplam fark (+ fazla, - eksik)
    
    created_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ
);
```

### 3.6 Yeni Tablo: `inventory_count_items` (Sayım Kalemleri)

```sql
CREATE TABLE inventory_count_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    count_id UUID NOT NULL REFERENCES inventory_counts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    
    system_quantity NUMERIC(12,3),                -- Sistemdeki miktar
    counted_quantity NUMERIC(12,3),               -- Sayılan miktar
    difference NUMERIC(12,3),                     -- Fark (counted - system)
    
    notes TEXT,                                   -- "fire", "bozuk", "kayıp" gibi
    
    created_at TIMESTAMPTZ DEFAULT now()
);
```

### 3.7 Migration: Mevcut Sisteme Entegrasyon

```sql
-- Mevcut ürünleri varsayılan depoya taşımak için migration
DO $$
DECLARE
    t RECORD;
    default_wh_id UUID;
BEGIN
    -- Her tenant için varsayılan depo oluştur
    FOR t IN SELECT id FROM tenants LOOP
        INSERT INTO warehouses (tenant_id, name, code, is_default, type)
        VALUES (t.id, 'Ana Depo', 'ANA', true, 'storage')
        RETURNING id INTO default_wh_id;
        
        -- Mevcut ürün stoklarını ana depoya aktar
        INSERT INTO warehouse_stock (tenant_id, warehouse_id, product_id, quantity)
        SELECT t.id, default_wh_id, p.id, p.stock_quantity
        FROM products p
        WHERE p.tenant_id = t.id AND p.stock_quantity > 0;
    END LOOP;
END $$;
```

---

## 4. İş Mantığı

### 4.1 Stok Hesaplama

```
Toplam Stok = SUM(warehouse_stock.quantity WHERE product_id = X)
```

Mevcut `products.stock_quantity` sütunu bir **VIEW** veya **trigger** ile otomatik güncellenir:

```sql
-- Trigger: warehouse_stock değiştiğinde products.stock_quantity güncelle
CREATE OR REPLACE FUNCTION sync_product_total_stock()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE products 
    SET stock_quantity = (
        SELECT COALESCE(SUM(quantity), 0) 
        FROM warehouse_stock 
        WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
    )
    WHERE id = COALESCE(NEW.product_id, OLD.product_id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_stock
AFTER INSERT OR UPDATE OR DELETE ON warehouse_stock
FOR EACH ROW EXECUTE FUNCTION sync_product_total_stock();
```

### 4.2 Transfer Akışı

```
1. Kullanıcı transfer fişi oluşturur (status: 'pending')
2. Ürünleri ve miktarları seçer
3. "Onayla" butonuna basar
4. Sistem kontrol eder:
   - Kaynak depoda yeterli stok var mı?
   - Hedef depoda kapasite uygun mu?
5. Her şey OK ise:
   - Kaynak depodan stok düşülür (warehouse_stock -= qty)
   - Hedef depoya stok eklenir (warehouse_stock += qty)
   - Transfer status = 'completed'
   - products.stock_quantity trigger ile güncellenir
```

### 4.3 Sayım Akışı

```
1. Kullanıcı sayım fişi açar + depo seçer
2. O deponun tüm ürünleri listelenir (sistem miktarıyla)
3. Her ürünün yanına gerçek sayılan miktarı yazar
4. Fark otomatik hesaplanır
5. "Sayımı Tamamla" dediğinde:
   - warehouse_stock güncellenir (counted_quantity ile)
   - Farklar log'a kaydedilir
   - products.stock_quantity trigger ile güncellenir
```

---

## 5. Frontend Tasarımı

### 5.1 Menü Yapısı

```
Sidebar → Depo Yönetimi
├── Depo Tanımları          → CRUD: depolar
├── Depo Stokları           → Ürün × Depo stok tablosu
├── Transfer Fişleri        → Transfer oluştur + geçmiş
├── Sayım Fişleri           → Sayım oluştur + geçmiş
└── Depo Raporu             → Depo bazlı stok özeti
```

### 5.2 Depo Stok Görünümü

```
┌──────────────────────────────────────────────────────────────┐
│  DEPO STOKLARI                           [Ana Depo ▼] [Yeni]│
├──────────────────────────────────────────────────────────────┤
│  Ürün         │ Ana Depo │ Raf  │ Soğuk Hava │ TOPLAM       │
│  ─────────────┼──────────┼──────┼────────────┼──────────    │
│  Dana Kıyma   │   470 kg │ 30kg │    200 kg  │  700 kg      │
│  Kuzu Pirzola │    50 kg │ 10kg │     80 kg  │  140 kg      │
│  Tavuk Göğüs  │   200 ad │ 50ad │    500 ad  │  750 ad      │
│  ⚠ Sucuk      │     5 kg │  2kg │      0 kg  │    7 kg  ⚠   │
└──────────────────────────────────────────────────────────────┘
```

### 5.3 Transfer Fişi Formu

```
┌─────────────────────────────────────────────────────────────┐
│  YENİ TRANSFER FİŞİ                         TRF-2026-00042 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Kaynak Depo: [Ana Depo ▼]     Hedef Depo: [Mağaza Rafı ▼] │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Ürün Ekle: [🔍 Ürün ara veya barkod okut...]         │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  Ürün            Mevcut   Transfer    Kalan                 │
│  ──────────────  ──────   ────────    ─────                 │
│  Dana Kıyma      470 kg   [30   ] kg  440 kg               │
│  Tavuk Göğüs     200 ad   [50   ] ad  150 ad               │
│                                                             │
│  [İptal]                          [Transferi Onayla ✓]      │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Dosya Yapısı

```
client/src/components/
└── Warehouse/
    ├── WarehousePage.tsx              → Ana sayfa (tab yönetimi)
    ├── WarehouseDefinitions.tsx       → Depo CRUD
    ├── WarehouseStock.tsx             → Depo × Ürün stok tablosu
    ├── TransferForm.tsx               → Transfer fişi oluşturma
    ├── TransferList.tsx               → Transfer geçmişi
    ├── InventoryCountForm.tsx         → Sayım fişi oluşturma
    ├── InventoryCountList.tsx         → Sayım geçmişi
    └── WarehouseReport.tsx            → Depo raporu
```

---

## 7. Geriye Uyumluluk

**Önemli:** Depo modülü opsiyonel olacak.

- Eğer tenant depo modülünü **aktif etmezse** → mevcut `products.stock_quantity` sistemi aynen çalışır
- Eğer **aktif ederse** → varsayılan "Ana Depo" otomatik oluşturulur, mevcut stoklar oraya aktarılır
- POS satışında depo seçimi yapılmak **zorunda değil** → varsayılan depodan otomatik düşülür
- Tenant ayarlarına `warehouse_enabled: boolean` eklenir

---

## 8. Maliyet & Süre Tahmini

| Görev | Süre |
|-------|------|
| Veritabanı tabloları + Migration | 4 saat |
| Depo Tanımları (CRUD) | 4 saat |
| Depo Stok Tablosu | 6 saat |
| Transfer Fişi (Form + Liste) | 8 saat |
| Sayım Fişi (Form + Liste) | 8 saat |
| Depo Raporu | 4 saat |
| POS entegrasyonu (depo seçimi) | 4 saat |
| Trigger/RPC fonksiyonlar | 4 saat |
| Test + Polish | 4 saat |
| **TOPLAM** | **~5-7 gün** |

---

## 9. Riskler & Dikkat Edilecekler

1. **Veri tutarlılığı:** `products.stock_quantity` ile `SUM(warehouse_stock.quantity)` her zaman eşit olmalı → trigger zorunlu
2. **Race condition:** İki kullanıcı aynı anda aynı depodan transfer yaparsa stok negatife düşebilir → `FOR UPDATE` lock kullanılmalı
3. **Performans:** Çok ürünlü tenant'larda depo stok tablosu büyük olabilir → index'ler önemli
4. **Mevcut müşteri etkisi:** Depo modülünü açmamış tenant'lar hiçbir değişiklik hissetmemeli
