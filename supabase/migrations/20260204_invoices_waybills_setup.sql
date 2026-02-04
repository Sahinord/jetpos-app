-- =====================================================
-- İRSALİYE VE FATURA SİSTEMİ
-- Alış/Satış/İade/Hizmet işlemleri için tam entegrasyon
-- =====================================================

-- =====================================================
-- 1. İRSALİYELER (WAYBILLS)
-- =====================================================

-- İrsaliye Tipleri ENUM
DO $$ BEGIN
    CREATE TYPE waybill_type AS ENUM (
        'purchase',           -- Alış İrsaliyesi
        'sales',             -- Satış İrsaliyesi
        'sales_return',      -- Satış İade İrsaliyesi
        'purchase_return',   -- Alış İade İrsaliyesi
        'shipment'           -- Sipariş Sevk İrsaliyesi
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- İrsaliyeler Tablosu
CREATE TABLE IF NOT EXISTS waybills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- İrsaliye Bilgileri
    waybill_number VARCHAR(50) NOT NULL,
    waybill_type waybill_type NOT NULL,
    waybill_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Cari Bilgisi (Müşteri veya Tedarikçi)
    cari_id UUID REFERENCES cari_hesaplar(id) ON DELETE SET NULL,
    cari_name VARCHAR(255),
    cari_vkn VARCHAR(11),
    cari_address TEXT,
    
    -- Tutar Bilgileri
    subtotal DECIMAL(15,2) DEFAULT 0,
    total_vat DECIMAL(15,2) DEFAULT 0,
    grand_total DECIMAL(15,2) DEFAULT 0,
    
    -- Durumlar
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, invoiced, cancelled
    is_invoiced BOOLEAN DEFAULT FALSE,
    invoice_id UUID, -- Hangi faturaya dönüştürüldü
    
    -- Notlar
    notes TEXT,
    
    -- Audit
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, waybill_number)
);

-- İrsaliye Kalemleri
CREATE TABLE IF NOT EXISTS waybill_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    waybill_id UUID NOT NULL REFERENCES waybills(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Ürün Bilgisi
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    product_code VARCHAR(100),
    
    -- Miktar ve Birim
    quantity DECIMAL(15,3) NOT NULL,
    unit VARCHAR(20) DEFAULT 'ADET', -- ADET, KG, LT, M, M2, M3, vb.
    
    -- Fiyat Bilgileri
    unit_price DECIMAL(15,2) NOT NULL,
    vat_rate DECIMAL(5,2) DEFAULT 20, -- %1, %10, %20
    vat_amount DECIMAL(15,2),
    line_total DECIMAL(15,2),
    line_total_with_vat DECIMAL(15,2),
    
    -- Notlar
    description TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. FATURALAR (INVOICES)
-- =====================================================

-- Fatura Tipleri ENUM
DO $$ BEGIN
    CREATE TYPE invoice_type AS ENUM (
        'purchase',              -- Alış Faturası
        'sales',                -- Satış Faturası
        'sales_return',         -- Satış İade Faturası
        'purchase_return',      -- Alış İade Faturası
        'retail',               -- Perakende Satış Faturası
        'service_received',     -- Alınan Hizmet Faturası
        'service_provided',     -- Yapılan Hizmet Faturası
        'service_received_return' -- Alınan Hizmet Faturası İadesi
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Faturalar Tablosu
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Fatura Bilgileri
    invoice_number VARCHAR(50) NOT NULL,
    invoice_type invoice_type NOT NULL,
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    
    -- İrsaliye İlişkisi (Opsiyonel)
    waybill_id UUID REFERENCES waybills(id) ON DELETE SET NULL,
    
    -- Cari Bilgisi (Müşteri veya Tedarikçi)
    cari_id UUID REFERENCES cari_hesaplar(id) ON DELETE SET NULL,
    cari_name VARCHAR(255),
    cari_vkn VARCHAR(11),
    cari_tax_office VARCHAR(100),
    cari_address TEXT,
    cari_city VARCHAR(50),
    cari_district VARCHAR(50),
    cari_phone VARCHAR(20),
    cari_email VARCHAR(100),
    
    -- Tutar Bilgileri
    subtotal DECIMAL(15,2) DEFAULT 0,
    total_vat DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    grand_total DECIMAL(15,2) DEFAULT 0,
    
    -- KDV Detayları (JSON array: [{rate: 1, base: 1000, vat: 10}, ...])
    vat_breakdown JSONB,
    
    -- Ödeme Bilgileri
    payment_status VARCHAR(50) DEFAULT 'unpaid', -- unpaid, partial, paid
    paid_amount DECIMAL(15,2) DEFAULT 0,
    remaining_amount DECIMAL(15,2),
    
    -- E-Fatura Bilgileri
    is_e_invoice BOOLEAN DEFAULT FALSE,
    e_invoice_uuid VARCHAR(100),
    e_invoice_status VARCHAR(50), -- sent, received, rejected, cancelled
    e_invoice_response TEXT,
    
    -- Durumlar
    status VARCHAR(50) DEFAULT 'draft', -- draft, approved, sent, cancelled
    is_cancelled BOOLEAN DEFAULT FALSE,
    cancel_reason TEXT,
    
    -- Notlar
    notes TEXT,
    
    -- Audit
    created_by UUID REFERENCES auth.users(id),
    approved_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    
    UNIQUE(tenant_id, invoice_number)
);

-- Fatura Kalemleri
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Ürün/Hizmet Bilgisi
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    item_name VARCHAR(255) NOT NULL,
    item_code VARCHAR(100),
    item_type VARCHAR(50) DEFAULT 'product', -- product, service
    
    -- Miktar ve Birim
    quantity DECIMAL(15,3) NOT NULL,
    unit VARCHAR(20) DEFAULT 'ADET',
    
    -- Fiyat Bilgileri
    unit_price DECIMAL(15,2) NOT NULL,
    discount_rate DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    vat_rate DECIMAL(5,2) DEFAULT 20,
    vat_amount DECIMAL(15,2),
    line_total DECIMAL(15,2),
    line_total_with_vat DECIMAL(15,2),
    
    -- Notlar
    description TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. FATURA ÖDEMELERİ
-- =====================================================

CREATE TABLE IF NOT EXISTS invoice_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    
    -- Ödeme Bilgileri
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_amount DECIMAL(15,2) NOT NULL,
    payment_method VARCHAR(50), -- cash, credit_card, bank_transfer, check
    
    -- Kasa/Banka Bilgisi
    cash_register_id UUID, -- Kasa ID'si (ileride eklenebilir)
    bank_account_id UUID,  -- Banka hesabı ID'si
    
    -- Dekont/Referans
    receipt_number VARCHAR(50),
    reference_code VARCHAR(100),
    
    -- Notlar
    notes TEXT,
    
    -- Audit
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. İNDEXLER
-- =====================================================

-- Waybills
CREATE INDEX IF NOT EXISTS idx_waybills_tenant ON waybills(tenant_id);
CREATE INDEX IF NOT EXISTS idx_waybills_cari ON waybills(cari_id);
CREATE INDEX IF NOT EXISTS idx_waybills_type ON waybills(waybill_type);
CREATE INDEX IF NOT EXISTS idx_waybills_date ON waybills(waybill_date);
CREATE INDEX IF NOT EXISTS idx_waybills_status ON waybills(status);

-- Waybill Items
CREATE INDEX IF NOT EXISTS idx_waybill_items_waybill ON waybill_items(waybill_id);
CREATE INDEX IF NOT EXISTS idx_waybill_items_product ON waybill_items(product_id);

-- Invoices
CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_cari ON invoices(cari_id);
CREATE INDEX IF NOT EXISTS idx_invoices_type ON invoices(invoice_type);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_status ON invoices(payment_status);
CREATE INDEX IF NOT EXISTS idx_invoices_waybill ON invoices(waybill_id);

-- Invoice Items
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_product ON invoice_items(product_id);

-- Invoice Payments
CREATE INDEX IF NOT EXISTS idx_invoice_payments_invoice ON invoice_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_tenant ON invoice_payments(tenant_id);

-- =====================================================
-- 5. TRIGGERS (Otomatik Hesaplamalar)
-- =====================================================

-- İrsaliye kalemi güncellendiğinde toplam hesapla
CREATE OR REPLACE FUNCTION calculate_waybill_item_totals()
RETURNS TRIGGER AS $$
BEGIN
    NEW.vat_amount := ROUND((NEW.quantity * NEW.unit_price * NEW.vat_rate / 100)::numeric, 2);
    NEW.line_total := ROUND((NEW.quantity * NEW.unit_price)::numeric, 2);
    NEW.line_total_with_vat := NEW.line_total + NEW.vat_amount;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_waybill_item_calculate
    BEFORE INSERT OR UPDATE ON waybill_items
    FOR EACH ROW
    EXECUTE FUNCTION calculate_waybill_item_totals();

-- Fatura kalemi güncellendiğinde toplam hesapla
CREATE OR REPLACE FUNCTION calculate_invoice_item_totals()
RETURNS TRIGGER AS $$
BEGIN
    NEW.discount_amount := ROUND((NEW.quantity * NEW.unit_price * NEW.discount_rate / 100)::numeric, 2);
    NEW.line_total := ROUND((NEW.quantity * NEW.unit_price - NEW.discount_amount)::numeric, 2);
    NEW.vat_amount := ROUND((NEW.line_total * NEW.vat_rate / 100)::numeric, 2);
    NEW.line_total_with_vat := NEW.line_total + NEW.vat_amount;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_invoice_item_calculate
    BEFORE INSERT OR UPDATE ON invoice_items
    FOR EACH ROW
    EXECUTE FUNCTION calculate_invoice_item_totals();

-- İrsaliye toplam güncelleme
CREATE OR REPLACE FUNCTION update_waybill_totals()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE waybills
    SET 
        subtotal = (SELECT COALESCE(SUM(line_total), 0) FROM waybill_items WHERE waybill_id = COALESCE(NEW.waybill_id, OLD.waybill_id)),
        total_vat = (SELECT COALESCE(SUM(vat_amount), 0) FROM waybill_items WHERE waybill_id = COALESCE(NEW.waybill_id, OLD.waybill_id)),
        grand_total = (SELECT COALESCE(SUM(line_total_with_vat), 0) FROM waybill_items WHERE waybill_id = COALESCE(NEW.waybill_id, OLD.waybill_id)),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.waybill_id, OLD.waybill_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_waybill_item_update_totals
    AFTER INSERT OR UPDATE OR DELETE ON waybill_items
    FOR EACH ROW
    EXECUTE FUNCTION update_waybill_totals();

-- Fatura toplam güncelleme
CREATE OR REPLACE FUNCTION update_invoice_totals()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE invoices
    SET 
        subtotal = (SELECT COALESCE(SUM(line_total), 0) FROM invoice_items WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)),
        total_vat = (SELECT COALESCE(SUM(vat_amount), 0) FROM invoice_items WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)),
        grand_total = (SELECT COALESCE(SUM(line_total_with_vat), 0) - COALESCE(discount_amount, 0) FROM invoice_items WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_invoice_item_update_totals
    AFTER INSERT OR UPDATE OR DELETE ON invoice_items
    FOR EACH ROW
    EXECUTE FUNCTION update_invoice_totals();

-- Fatura ödeme sonrası kalan tutar güncelleme
CREATE OR REPLACE FUNCTION update_invoice_payment_status()
RETURNS TRIGGER AS $$
DECLARE
    v_total_paid DECIMAL(15,2);
    v_invoice_total DECIMAL(15,2);
BEGIN
    SELECT COALESCE(SUM(payment_amount), 0) INTO v_total_paid
    FROM invoice_payments
    WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id);
    
    SELECT grand_total INTO v_invoice_total
    FROM invoices
    WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
    
    UPDATE invoices
    SET 
        paid_amount = v_total_paid,
        remaining_amount = v_invoice_total - v_total_paid,
        payment_status = CASE
            WHEN v_total_paid = 0 THEN 'unpaid'
            WHEN v_total_paid >= v_invoice_total THEN 'paid'
            ELSE 'partial'
        END,
        updated_at = NOW()
    WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_invoice_payment_update_status
    AFTER INSERT OR UPDATE OR DELETE ON invoice_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_invoice_payment_status();

-- =====================================================
-- 6. RLS POLİCİES (Tenant İzolasyonu)
-- =====================================================

ALTER TABLE waybills ENABLE ROW LEVEL SECURITY;
ALTER TABLE waybill_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;

-- Waybills - Her irsaliye lisansa özel
DROP POLICY IF EXISTS waybills_tenant_isolation ON waybills;
CREATE POLICY waybills_tenant_isolation ON waybills
    FOR ALL
    USING (tenant_id::text = current_setting('app.current_tenant_id', true))
    WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

-- Waybill Items
DROP POLICY IF EXISTS waybill_items_tenant_isolation ON waybill_items;
CREATE POLICY waybill_items_tenant_isolation ON waybill_items
    FOR ALL
    USING (tenant_id::text = current_setting('app.current_tenant_id', true))
    WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

-- Invoices - Her fatura lisansa özel
DROP POLICY IF EXISTS invoices_tenant_isolation ON invoices;
CREATE POLICY invoices_tenant_isolation ON invoices
    FOR ALL
    USING (tenant_id::text = current_setting('app.current_tenant_id', true))
    WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

-- Invoice Items
DROP POLICY IF EXISTS invoice_items_tenant_isolation ON invoice_items;
CREATE POLICY invoice_items_tenant_isolation ON invoice_items
    FOR ALL
    USING (tenant_id::text = current_setting('app.current_tenant_id', true))
    WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

-- Invoice Payments
DROP POLICY IF EXISTS invoice_payments_tenant_isolation ON invoice_payments;
CREATE POLICY invoice_payments_tenant_isolation ON invoice_payments
    FOR ALL
    USING (tenant_id::text = current_setting('app.current_tenant_id', true))
    WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

-- =====================================================
-- 7. YARDIMCI FONKSİYONLAR
-- =====================================================

-- Sonraki İrsaliye Numarası
CREATE OR REPLACE FUNCTION get_next_waybill_number(
    p_tenant_id UUID,
    p_waybill_type waybill_type,
    p_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
)
RETURNS VARCHAR AS $$
DECLARE
    v_prefix VARCHAR(10);
    v_last_number INTEGER;
    v_next_number VARCHAR(50);
BEGIN
    -- Tip prefixleri
    v_prefix := CASE p_waybill_type
        WHEN 'purchase' THEN 'AI'
        WHEN 'sales' THEN 'SI'
        WHEN 'sales_return' THEN 'SII'
        WHEN 'purchase_return' THEN 'AII'
        WHEN 'shipment' THEN 'SEV'
    END;
    
    -- Son numarayı bul
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(waybill_number FROM '\\d+$') AS INTEGER)
    ), 0) INTO v_last_number
    FROM waybills
    WHERE tenant_id = p_tenant_id
        AND waybill_type = p_waybill_type
        AND waybill_number LIKE v_prefix || p_year::TEXT || '%';
    
    -- Yeni numara
    v_next_number := v_prefix || p_year::TEXT || LPAD((v_last_number + 1)::TEXT, 6, '0');
    
    RETURN v_next_number;
END;
$$ LANGUAGE plpgsql;

-- Sonraki Fatura Numarası
CREATE OR REPLACE FUNCTION get_next_invoice_number(
    p_tenant_id UUID,
    p_invoice_type invoice_type,
    p_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
)
RETURNS VARCHAR AS $$
DECLARE
    v_prefix VARCHAR(10);
    v_last_number INTEGER;
    v_next_number VARCHAR(50);
BEGIN
    -- Tip prefixleri
    v_prefix := CASE p_invoice_type
        WHEN 'purchase' THEN 'AF'
        WHEN 'sales' THEN 'SF'
        WHEN 'sales_return' THEN 'SIF'
        WHEN 'purchase_return' THEN 'AIF'
        WHEN 'retail' THEN 'PSF'
        WHEN 'service_received' THEN 'AHF'
        WHEN 'service_provided' THEN 'YHF'
        WHEN 'service_received_return' THEN 'AHIF'
    END;
    
    -- Son numarayı bul
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(invoice_number FROM '\\d+$') AS INTEGER)
    ), 0) INTO v_last_number
    FROM invoices
    WHERE tenant_id = p_tenant_id
        AND invoice_type = p_invoice_type
        AND invoice_number LIKE v_prefix || p_year::TEXT || '%';
    
    -- Yeni numara
    v_next_number := v_prefix || p_year::TEXT || LPAD((v_last_number + 1)::TEXT, 6, '0');
    
    RETURN v_next_number;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. COMMENT'LER
-- =====================================================

COMMENT ON TABLE waybills IS 'İrsaliye kayıtları - Alış, Satış, İade, Sevk';
COMMENT ON TABLE waybill_items IS 'İrsaliye kalem detayları';
COMMENT ON TABLE invoices IS 'Fatura kayıtları - Alış, Satış, İade, Hizmet';
COMMENT ON TABLE invoice_items IS 'Fatura kalem detayları';
COMMENT ON TABLE invoice_payments IS 'Fatura ödeme kayıtları';

COMMENT ON COLUMN invoices.vat_breakdown IS 'KDV dağılımı JSON: [{rate: 1, base: 1000, vat: 10}, ...]';
COMMENT ON COLUMN invoices.payment_status IS 'Ödeme durumu: unpaid, partial, paid';
COMMENT ON COLUMN invoices.status IS 'Fatura durumu: draft, approved, sent, cancelled';
