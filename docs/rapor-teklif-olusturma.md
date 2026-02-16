# 📋 TEKLİF OLUŞTURMA — Uygulama Raporu

## 1. Genel Bakış

**Amaç:** İşletmelerin müşterilerine resmi fiyat teklifi oluşturması, PDF olarak paylaşması ve onaylanan teklifleri otomatik faturaya/siparişe dönüştürmesi.  
**Hedef Kullanıcı:** Toptancılar, B2B satış yapan işletmeler, hizmet sağlayıcılar.  
**Kullanım Senaryosu:** Müşteri arar "100 kg kıyma kaça olur?", işletme teklif hazırlar, WhatsApp'tan gönderir, müşteri onaylarsa faturaya çevrilir.

---

## 2. Kullanıcı Akışı

```
1. Teklif Oluştur
   ├── Müşteri seç (Cari'den) veya yeni müşteri gir
   ├── Ürünleri ekle (barkod/arama)
   ├── Fiyat/miktar/iskonto ayarla
   ├── Geçerlilik süresi belirle (ör: 7 gün)
   └── Notlar/koşullar ekle

2. Teklifi Gönder
   ├── PDF oluştur
   ├── WhatsApp ile gönder
   ├── E-posta ile gönder
   └── Link olarak paylaş

3. Teklif Takibi
   ├── Bekleyen teklifler listesi
   ├── Süresi dolan teklifler (otomatik uyarı)
   └── Onaylanan/Reddedilen teklifler

4. Teklif → Fatura Dönüşümü
   ├── Onaylanan teklifi 1 tıkla faturaya çevir
   ├── Stoktan otomatik düş
   └── Cari hesap kaydı oluştur
```

---

## 3. Veritabanı Tasarımı

### 3.1 Yeni Tablo: `quotes` (Teklifler)

```sql
CREATE TABLE quotes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Teklif Numarası
    quote_no VARCHAR(50) NOT NULL,               -- "TKL-2026-00001"
    revision_no INTEGER DEFAULT 1,               -- Revizyon: 1, 2, 3...
    
    -- Müşteri Bilgileri
    customer_id UUID REFERENCES cari_accounts(id),  -- Cari hesaptan (opsiyonel)
    customer_name VARCHAR(200) NOT NULL,
    customer_phone VARCHAR(20),
    customer_email VARCHAR(200),
    customer_address TEXT,
    customer_tax_number VARCHAR(20),
    customer_tax_office VARCHAR(100),
    
    -- Teklif Detayları
    quote_date TIMESTAMPTZ DEFAULT now(),
    valid_until TIMESTAMPTZ,                     -- Son geçerlilik tarihi
    status VARCHAR(20) DEFAULT 'draft',          -- Aşağıda açıklandı
    
    -- Tutarlar
    subtotal NUMERIC(12,2) DEFAULT 0,            -- Ara toplam (KDV hariç)
    discount_amount NUMERIC(12,2) DEFAULT 0,     -- Toplam iskonto
    tax_amount NUMERIC(12,2) DEFAULT 0,          -- KDV tutarı
    grand_total NUMERIC(12,2) DEFAULT 0,         -- Genel toplam
    currency VARCHAR(5) DEFAULT 'TRY',
    
    -- Koşullar & Notlar
    payment_terms TEXT,                          -- "30 gün vadeli", "peşin" 
    delivery_terms TEXT,                         -- "Depo teslim", "Kapıya teslim"
    notes TEXT,                                  -- Genel notlar
    internal_notes TEXT,                         -- Dahili notlar (müşteri görmez)
    
    -- Dönüşüm Bilgileri
    converted_to_invoice_id UUID,                -- Faturaya dönüştürüldüyse
    converted_at TIMESTAMPTZ,
    
    -- Meta
    created_by VARCHAR(100),
    approved_by VARCHAR(100),
    pdf_url TEXT,                                -- Oluşturulan PDF linki
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Status değerleri:
-- 'draft'       → Taslak (henüz gönderilmedi)
-- 'sent'        → Gönderildi (müşteri inceleniyor)
-- 'viewed'      → Müşteri açtı (link ile gönderildiyse)
-- 'approved'    → Müşteri onayladı
-- 'rejected'    → Müşteri reddetti
-- 'expired'     → Süresi doldu
-- 'converted'   → Faturaya/siparişe dönüştürüldü
-- 'cancelled'   → İptal edildi
```

### 3.2 Yeni Tablo: `quote_items` (Teklif Kalemleri)

```sql
CREATE TABLE quote_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),      -- Opsiyonel (serbest kalem de olabilir)
    
    -- Ürün Bilgileri
    item_name VARCHAR(200) NOT NULL,
    item_description TEXT,
    barcode VARCHAR(50),
    unit VARCHAR(20) DEFAULT 'Adet',
    
    -- Fiyatlandırma
    quantity NUMERIC(12,3) NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,            -- Birim fiyat
    discount_rate NUMERIC(5,2) DEFAULT 0,         -- İskonto oranı (%)
    discount_amount NUMERIC(12,2) DEFAULT 0,      -- İskonto tutarı
    tax_rate NUMERIC(5,2) DEFAULT 18,             -- KDV oranı (%)
    
    -- Hesaplanan Tutarlar
    line_subtotal NUMERIC(12,2),                  -- (qty × unit_price) - discount
    line_tax NUMERIC(12,2),                       -- subtotal × tax_rate
    line_total NUMERIC(12,2),                     -- subtotal + tax
    
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT now()
);
```

### 3.3 Yeni Tablo: `quote_templates` (Teklif Şablonları)

```sql
CREATE TABLE quote_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    name VARCHAR(100) NOT NULL,                   -- "Standart Teklif", "Toptan Teklif"
    
    -- Varsayılan değerler
    default_payment_terms TEXT,
    default_delivery_terms TEXT,
    default_notes TEXT,
    default_valid_days INTEGER DEFAULT 7,
    
    -- Görsel ayarlar
    header_text TEXT,
    footer_text TEXT,
    show_logo BOOLEAN DEFAULT true,
    show_barcode BOOLEAN DEFAULT false,
    
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

### 3.4 RLS Politikaları

```sql
-- Tenant kendi tekliflerini yönetir
CREATE POLICY "Tenants manage own quotes"
    ON quotes FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY "Tenants manage own quote items"
    ON quote_items FOR ALL
    USING (quote_id IN (
        SELECT id FROM quotes 
        WHERE tenant_id = current_setting('app.current_tenant')::uuid
    ));
```

---

## 4. Otomatik Numaralandırma

```sql
CREATE OR REPLACE FUNCTION generate_quote_number(p_tenant_id UUID)
RETURNS TEXT AS $$
DECLARE
    next_num INTEGER;
    year_str TEXT;
BEGIN
    year_str := TO_CHAR(NOW(), 'YYYY');
    
    SELECT COALESCE(MAX(
        CAST(SPLIT_PART(quote_no, '-', 3) AS INTEGER)
    ), 0) + 1 INTO next_num
    FROM quotes
    WHERE tenant_id = p_tenant_id 
      AND quote_no LIKE 'TKL-' || year_str || '-%';
    
    RETURN 'TKL-' || year_str || '-' || LPAD(next_num::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- Kullanım: SELECT generate_quote_number('tenant-uuid');
-- Sonuç:    TKL-2026-00001
```

---

## 5. PDF Oluşturma

### 5.1 PDF İçeriği

```
┌─────────────────────────────────────────────────────────────────┐
│  [LOGO]        KARDEŞLER KASAP                                  │
│                Vergi No: 1234567890                              │
│                Tel: 0532 XXX XX XX                               │
│                Adres: ...                                        │
├─────────────────────────────────────────────────────────────────┤
│  FİYAT TEKLİFİ                                                  │
│  Teklif No: TKL-2026-00042        Tarih: 11.02.2026             │
│  Geçerlilik: 18.02.2026           Revizyon: 1                   │
├─────────────────────────────────────────────────────────────────┤
│  ALICI:                                                          │
│  Ahmet Yılmaz - Yılmaz Market                                   │
│  Tel: 0533 XXX XX XX                                             │
│  Vergi No: 9876543210                                            │
├───────┬────────────┬───────┬──────────┬────────┬────────────────┤
│  No   │ Ürün       │ Miktar│ B.Fiyat  │ KDV    │ Toplam         │
├───────┼────────────┼───────┼──────────┼────────┼────────────────┤
│  1    │ Dana Kıyma │ 100kg │ ₺320.00  │ %10    │ ₺35,200.00    │
│  2    │ Kuzu But   │  50kg │ ₺480.00  │ %10    │ ₺26,400.00    │
│  3    │ Tavuk Göğüs│ 200ad │ ₺180.00  │ %10    │ ₺39,600.00    │
├───────┴────────────┴───────┴──────────┼────────┼────────────────┤
│                              Ara Toplam│        │ ₺92,000.00    │
│                                İskonto│  %5    │ -₺4,600.00    │
│                                    KDV│        │ ₺8,740.00     │
│                          GENEL TOPLAM │        │ ₺96,140.00    │
├─────────────────────────────────────────────────────────────────┤
│  ÖDEME KOŞULLARI: 30 gün vadeli                                 │
│  TESLİMAT: Depo teslim, nakliye alıcıya aittir                  │
│  NOT: Fiyatlar KDV hariçtir. 7 gün geçerlidir.                  │
├─────────────────────────────────────────────────────────────────┤
│  Bu teklifi onaylıyorum:                                         │
│                                                                  │
│  İmza: _______________    Tarih: ___/___/______                  │
│                                               Powered by JetPOS │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 PDF Teknolojisi

```
Seçenek 1: jsPDF + html2canvas (client-side)
  ✅ Sunucu gerektirmez
  ✅ Anında oluşturulur
  ❌ Kalite sınırlı

Seçenek 2: React-PDF (@react-pdf/renderer)
  ✅ Profesyonel kalite
  ✅ Pixel-perfect kontrol
  ✅ Türkçe karakter desteği
  ❌ Bundle boyutu büyük (~500KB)

ÖNERİ: @react-pdf/renderer (Seçenek 2)
```

---

## 6. Frontend Tasarımı

### 6.1 Menü Yapısı

```
Sidebar → Teklif Yönetimi
├── Teklif Oluştur          → Yeni teklif formu
├── Tekliflerim             → Liste + filtre + durum takibi
├── Teklif Şablonları       → Şablon CRUD
└── Teklif Raporu           → İstatistikler
```

### 6.2 Teklif Oluşturma Formu

```
┌─────────────────────────────────────────────────────────────────┐
│  YENİ TEKLİF OLUŞTUR                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Müşteri: [🔍 Cari hesaptan seç veya yeni gir...]              │
│  Şablon:  [Standart Teklif ▼]                                   │
│                                                                  │
│  Geçerlilik: [7 gün ▼]  Para Birimi: [₺ TRY ▼]                 │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 🔍 Ürün ekle (barkod okut veya ara)                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  No │ Ürün        │ Miktar │ B.Fiyat  │ İsk.│ KDV │ Toplam     │
│  ───┼─────────────┼────────┼──────────┼─────┼─────┼──────────  │
│  1  │ Dana Kıyma  │ [100] kg│ [320.00]│ [0]%│ %10 │ ₺32,000   │
│  2  │ Kuzu But    │ [ 50] kg│ [480.00]│ [0]%│ %10 │ ₺24,000   │
│     │ [+ Serbest Kalem Ekle]                                    │
│                                                                  │
│  ──────────────────────────────────                              │
│  Ara Toplam:    ₺56,000.00                                      │
│  Genel İskonto: [0] %  →  -₺0.00                               │
│  KDV:           ₺5,600.00                                       │
│  GENEL TOPLAM:  ₺61,600.00                                      │
│                                                                  │
│  Ödeme Koşulu: [30 gün vadeli________________]                  │
│  Teslimat:     [Depo teslim___________________]                  │
│  Notlar:       [____________________________]                    │
│                                                                  │
│  [Taslak Kaydet]  [PDF Önizle]  [WhatsApp Gönder]  [Kaydet ✓]  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 Teklif Listesi

```
┌─────────────────────────────────────────────────────────────────┐
│  TEKLİFLERİM                    [Yeni Teklif +]                 │
├─────────────────────────────────────────────────────────────────┤
│  [Tümü] [Bekleyen] [Onaylanan] [Reddedilen] [Süresi Dolan]     │
│                                                                  │
│  🟡 TKL-2026-00042 │ Yılmaz Market │ ₺96,140  │ 3 gün kaldı   │
│  🟢 TKL-2026-00041 │ Demir Restoran│ ₺45,200  │ Onaylandı ✓   │
│  🔴 TKL-2026-00040 │ Ak Bakkal     │ ₺12,800  │ Reddedildi ✗  │
│  ⚫ TKL-2026-00039 │ Özcan Market  │ ₺28,500  │ Süresi doldu  │
│  🔵 TKL-2026-00038 │ Yıldız Otel   │ ₺156,000 │ Faturaya çevr.│
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Dosya Yapısı

```
client/src/components/
└── Quotes/
    ├── QuotePage.tsx              → Ana sayfa (tab yönetimi)
    ├── QuoteForm.tsx              → Teklif oluşturma/düzenleme formu
    ├── QuoteList.tsx              → Teklif listesi + filtre
    ├── QuoteDetail.tsx            → Teklif detay görünümü
    ├── QuotePDF.tsx               → PDF şablonu (@react-pdf/renderer)
    ├── QuoteTemplates.tsx         → Şablon yönetimi
    ├── QuoteReport.tsx            → Teklif istatistikleri
    └── QuoteToInvoice.tsx         → Teklif→Fatura dönüşüm mantığı
```

---

## 8. Teklif → Fatura Dönüşümü

```typescript
async function convertQuoteToInvoice(quoteId: string) {
    // 1. Teklif bilgilerini çek
    const quote = await getQuote(quoteId);
    
    // 2. Stok kontrolü yap
    for (const item of quote.items) {
        if (item.product_id) {
            const stock = await getProductStock(item.product_id);
            if (stock < item.quantity) {
                throw new Error(`${item.item_name} için yeterli stok yok!`);
            }
        }
    }
    
    // 3. Fatura oluştur (mevcut Invoice sistemine)
    const invoice = await createInvoice({
        customer_id: quote.customer_id,
        items: quote.items.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount_rate: item.discount_rate,
            tax_rate: item.tax_rate
        })),
        payment_terms: quote.payment_terms
    });
    
    // 4. Stokları düş
    for (const item of quote.items) {
        if (item.product_id) {
            await decrementStock(item.product_id, item.quantity);
        }
    }
    
    // 5. Cari hesap kaydı oluştur
    if (quote.customer_id) {
        await createCariRecord({
            account_id: quote.customer_id,
            type: 'borç',
            amount: quote.grand_total,
            description: `Teklif ${quote.quote_no} → Fatura dönüşümü`
        });
    }
    
    // 6. Teklif durumunu güncelle
    await updateQuote(quoteId, {
        status: 'converted',
        converted_to_invoice_id: invoice.id,
        converted_at: new Date()
    });
    
    return invoice;
}
```

---

## 9. WhatsApp Entegrasyonu

```typescript
function shareQuoteViaWhatsApp(quote: Quote) {
    const message = encodeURIComponent(
        `*${quote.tenant_name}*\n` +
        `Fiyat Teklifi: ${quote.quote_no}\n` +
        `Tarih: ${formatDate(quote.quote_date)}\n` +
        `Geçerlilik: ${formatDate(quote.valid_until)}\n\n` +
        quote.items.map((item, i) => 
            `${i+1}. ${item.item_name} - ${item.quantity} ${item.unit} × ₺${item.unit_price}`
        ).join('\n') +
        `\n\n*Toplam: ₺${quote.grand_total}*\n\n` +
        `PDF: ${quote.pdf_url}\n\n` +
        `JetPOS ile hazırlanmıştır.`
    );
    
    window.open(`https://wa.me/${quote.customer_phone}?text=${message}`);
}
```

---

## 10. Maliyet & Süre Tahmini

| Görev | Süre |
|-------|------|
| Veritabanı tabloları + Migration | 3 saat |
| Teklif Formu (ürün ekleme, fiyatlandırma) | 8 saat |
| Teklif Listesi + Filtre + Durum Takibi | 4 saat |
| PDF Oluşturma (@react-pdf/renderer) | 6 saat |
| WhatsApp / E-posta Paylaşım | 2 saat |
| Teklif → Fatura Dönüşümü | 4 saat |
| Şablon Yönetimi | 3 saat |
| Teklif Raporu / İstatistik | 3 saat |
| Sidebar + Routing entegrasyonu | 1 saat |
| Test + Polish | 3 saat |
| **TOPLAM** | **~3-4 gün** |

---

## 11. Gelecek Geliştirmeler (v2)

- [ ] Online teklif onay linki (müşteri link'e tıklayıp "Onaylıyorum" der)
- [ ] Otomatik hatırlatma (süresi dolmadan 1 gün önce bildirim)
- [ ] Teklif karşılaştırma (aynı müşteriye verilen farklı teklifleri karşılaştır)
- [ ] Revizyon takibi (müşteri değişiklik isterse rev-2, rev-3...)
- [ ] Çoklu para birimi (USD, EUR desteği)
- [ ] E-imza entegrasyonu
- [ ] Teklif kabul oranı analizi (AI ile)
