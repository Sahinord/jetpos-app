# 📋 DİJİTAL KATALOG — Uygulama Raporu

## 1. Genel Bakış

**Amaç:** Her tenant'ın (müşterinin) ürünlerini halka açık bir web sayfasında sergilemesi.  
**Hedef Kullanıcı:** Kasap, market, toptancı gibi işletmeler.  
**Kullanım Senaryosu:** İşletme sahibi, katalog linkini Instagram bio'suna, WhatsApp durumuna veya kartvizitine koyar. Müşteriler linke tıklayarak ürünleri ve fiyatları görür.

---

## 2. Kullanıcı Akışı

```
İşletme Sahibi                          Son Müşteri
─────────────                            ───────────
1. JetPOS'a giriş yapar                 
2. Katalog Ayarları'na gider            
3. Katalog'u aktif eder                 
4. Logo, renk, iletişim bilgisi girer   
5. Katalog URL'sini kopyalar            
6. Sosyal medyada paylaşır ──────────► 7. Linke tıklar
                                        8. Ürünleri görür (fotoğraf + fiyat)
                                        9. Kategori filtreleme yapar
                                        10. WhatsApp ile sipariş verir
```

---

## 3. Veritabanı Tasarımı

### 3.1 Yeni Tablo: `catalog_settings`

```sql
CREATE TABLE catalog_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Katalog Durumu
    is_active BOOLEAN DEFAULT false,
    slug VARCHAR(100) UNIQUE NOT NULL,           -- URL'de kullanılacak: /katalog/kardesler-kasap
    
    -- Görsel Ayarlar
    logo_url TEXT,
    banner_url TEXT,
    primary_color VARCHAR(7) DEFAULT '#3B82F6',  -- HEX renk kodu
    secondary_color VARCHAR(7) DEFAULT '#1E293B',
    theme VARCHAR(20) DEFAULT 'modern',          -- 'modern', 'classic', 'minimal'
    
    -- İletişim Bilgileri
    phone VARCHAR(20),
    whatsapp VARCHAR(20),
    instagram VARCHAR(100),
    address TEXT,
    working_hours TEXT,                           -- "09:00 - 22:00" gibi
    
    -- Katalog Ayarları
    show_prices BOOLEAN DEFAULT true,
    show_stock BOOLEAN DEFAULT false,            -- Stok miktarını gösterme (default kapalı)
    show_categories BOOLEAN DEFAULT true,
    currency VARCHAR(5) DEFAULT '₺',
    welcome_message TEXT,                        -- "Kardeşler Kasap'a Hoş Geldiniz!"
    
    -- SEO
    meta_title VARCHAR(200),
    meta_description VARCHAR(500),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(tenant_id)
);
```

### 3.2 Ürün Tablosuna Eklenti

```sql
-- Mevcut products tablosuna yeni sütun
ALTER TABLE products ADD COLUMN show_in_catalog BOOLEAN DEFAULT true;
ALTER TABLE products ADD COLUMN catalog_order INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN catalog_description TEXT;
```

### 3.3 RLS Politikaları

```sql
-- Herkes aktif katalogları okuyabilir (public erişim)
CREATE POLICY "Public can view active catalogs"
    ON catalog_settings FOR SELECT
    USING (is_active = true);

-- Tenant kendi kataloğunu düzenleyebilir
CREATE POLICY "Tenants manage own catalog"
    ON catalog_settings FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::uuid);
```

---

## 4. API Tasarımı

### 4.1 Public API (Kimlik doğrulama gerektirmez)

```
GET /api/katalog/[slug]
```

**Yanıt:**
```json
{
    "company_name": "Kardeşler Kasap",
    "logo_url": "https://...",
    "phone": "0532 XXX XX XX",
    "whatsapp": "905321234567",
    "categories": [
        { "id": "cat-1", "name": "Et Ürünleri" },
        { "id": "cat-2", "name": "Şarküteri" }
    ],
    "products": [
        {
            "id": "prod-1",
            "name": "Dana Kıyma",
            "sale_price": 349.90,
            "image_url": "https://...",
            "category": "Et Ürünleri",
            "catalog_description": "Günlük taze çekilmiş dana kıyma"
        }
    ]
}
```

### 4.2 Yönetim API (Tenant yetkisi gerekir)

```
GET    /api/catalog/settings          → Katalog ayarlarını getir
PUT    /api/catalog/settings          → Katalog ayarlarını güncelle
POST   /api/catalog/settings          → Yeni katalog oluştur
PATCH  /api/catalog/products/[id]     → Ürünün katalog görünürlüğünü değiştir
```

---

## 5. Frontend Tasarımı

### 5.1 Yönetim Paneli (JetPOS İçinde)

**Konum:** Sidebar → "Dijital Katalog" menüsü

**Sayfalar:**
1. **Katalog Ayarları** — Logo yükleme, renk seçimi, iletişim bilgileri
2. **Ürün Seçimi** — Hangi ürünler katalogda görünsün (toggle)
3. **Önizleme** — Katalog nasıl görünecek canlı önizleme
4. **Paylaşım** — URL, QR kod, sosyal medya paylaşım butonları

### 5.2 Herkese Açık Katalog Sayfası

**URL Yapısı:** `jetpos.com/katalog/[slug]` veya `[slug].jetpos.com`

**Sayfa Bileşenleri:**
```
┌─────────────────────────────────────┐
│  [Logo]  Kardeşler Kasap            │
│  ☎ 0532 XXX  │ 📍 Adres  │ ⏰ 09-22│
├─────────────────────────────────────┤
│  🔍 Ürün Ara...                     │
├─────────────────────────────────────┤
│ [Tümü] [Et] [Şarküteri] [İçecek]   │
├─────────────────────────────────────┤
│ ┌───────┐ ┌───────┐ ┌───────┐      │
│ │ 📸    │ │ 📸    │ │ 📸    │      │
│ │Dana   │ │Kuzu   │ │Tavuk  │      │
│ │Kıyma  │ │Pirzola│ │Göğüs  │      │
│ │₺349.90│ │₺549.90│ │₺189.90│      │
│ │[Sepet]│ │[Sepet]│ │[Sepet]│      │
│ └───────┘ └───────┘ └───────┘      │
│                                     │
│ ┌───────┐ ┌───────┐ ┌───────┐      │
│ │ 📸    │ │ 📸    │ │ 📸    │      │
│ │...    │ │...    │ │...    │      │
│ └───────┘ └───────┘ └───────┘      │
├─────────────────────────────────────┤
│  💬 WhatsApp ile Sipariş Ver        │
│  Powered by JetPOS                  │
└─────────────────────────────────────┘
```

**Responsive Tasarım:**
- Mobil: 2 sütun grid
- Tablet: 3 sütun grid
- Desktop: 4 sütun grid

---

## 6. Teknik Mimari

### 6.1 Dosya Yapısı

```
client/src/components/
└── Catalog/
    ├── CatalogSettings.tsx        → Yönetim paneli ayarlar
    ├── CatalogProductSelector.tsx → Ürün seçimi (toggle listesi)
    ├── CatalogPreview.tsx         → Canlı önizleme
    └── CatalogShare.tsx           → QR kod + paylaşım linkleri

client/src/app/
└── katalog/
    └── [slug]/
        └── page.tsx               → Public katalog sayfası (SSR)
```

### 6.2 Performans

- **SSR (Server-Side Rendering)** — Katalog sayfası SEO için SSR ile render edilecek
- **ISR (Incremental Static Regeneration)** — 5 dakikada bir cache yenilenecek
- **Resim optimizasyonu** — Next.js Image component + WebP format
- **Lazy loading** — Ürün resimleri viewport'a girdiğinde yüklenecek

---

## 7. Maliyet & Süre Tahmini

| Görev | Süre |
|-------|------|
| Veritabanı + Migration | 2 saat |
| Yönetim Paneli (Ayarlar + Ürün Seçimi) | 6 saat |
| Public Katalog Sayfası | 4 saat |
| QR Kod + Paylaşım | 2 saat |
| Responsive tasarım + Polish | 3 saat |
| Test | 2 saat |
| **TOPLAM** | **~2-3 gün** |

---

## 8. Gelecek Geliştirmeler (v2)

- [ ] WhatsApp sepet entegrasyonu (seçilen ürünleri tek mesajda gönder)
- [ ] Google Maps entegrasyonu (mağaza lokasyonu)
- [ ] Özel alan adı desteği (katalog.kardesler-kasap.com)
- [ ] Google Analytics entegrasyonu
- [ ] Kampanya/indirim banner'ı
- [ ] Müşteri yorumları/puanlama
