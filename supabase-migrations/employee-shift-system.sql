-- ============================================
-- JetPOS: ÇALIŞAN YÖNETİMİ VE VARDİYA SİSTEMİ
-- ============================================
-- Bu migration dosyası çalışan yönetimi, vardiya takibi ve performans raporlama için gerekli tabloları oluşturur

-- 1. Çalışanlar Tablosu
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Kişisel Bilgiler
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    tc_no VARCHAR(11) UNIQUE, -- TC Kimlik No (Opsiyonel, şirket tercihine göre)
    
    -- İş Bilgileri
    employee_code VARCHAR(50) UNIQUE, -- Çalışan kodu (ÇLŞ-001 gibi)
    position VARCHAR(100), -- Pozisyon (Kasiyer, Müdür, vb.)
    hourly_wage DECIMAL(10, 2) DEFAULT 0, -- Saat başı ücret
    monthly_salary DECIMAL(10, 2) DEFAULT 0, -- Aylık maaş
    start_date DATE, -- İşe başlama tarihi
    
    -- Sistem
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave')),
    pin_code VARCHAR(6), -- Giriş/çıkış için 4-6 haneli PIN
    avatar_url TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- RLS İçin Index
    CONSTRAINT unique_employee_code UNIQUE (tenant_id, employee_code)
);

-- 2. Vardiyalar Tablosu (Çalışan Giriş/Çıkış Kayıtları)
CREATE TABLE IF NOT EXISTS shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    
    -- Vardiya Bilgileri
    clock_in TIMESTAMPTZ NOT NULL, -- Giriş zamanı
    clock_out TIMESTAMPTZ, -- Çıkış zamanı (NULL = hala çalışıyor)
    break_duration INTEGER DEFAULT 0, -- Mola süresi (dakika)
    
    -- Performans Metrikleri
    total_sales DECIMAL(12, 2) DEFAULT 0, -- Vardiya boyunca yapılan toplam satış
    total_transactions INTEGER DEFAULT 0, -- İşlem sayısı
    
    -- Notlar
    notes TEXT, -- Vardiya notu (geç kaldı, erken çıktı vb.)
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Çalışan Satış Performansı (Her satış işlemini çalışana bağla)
CREATE TABLE IF NOT EXISTS employee_sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    shift_id UUID REFERENCES shifts(id) ON DELETE SET NULL,
    sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
    
    -- Satış Detayları
    sale_amount DECIMAL(10, 2) NOT NULL,
    sale_profit DECIMAL(10, 2),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES (Performance Optimization)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_employees_tenant ON employees(tenant_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_shifts_employee ON shifts(employee_id, clock_in DESC);
CREATE INDEX IF NOT EXISTS idx_shifts_tenant_date ON shifts(tenant_id, clock_in DESC);
CREATE INDEX IF NOT EXISTS idx_employee_sales_employee ON employee_sales(employee_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_employee_sales_shift ON employee_sales(shift_id);

-- ============================================
-- ROW-LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_sales ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Sadece kendi tenant'ının verilerini görebilir
CREATE POLICY tenant_isolation_employees ON employees
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_shifts ON shifts
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_employee_sales ON employee_sales
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- ============================================
-- FUNCTIONS: Otomatik Vardiya Hesaplamaları
-- ============================================

-- Vardiya süresini hesapla (dakika olarak)
CREATE OR REPLACE FUNCTION calculate_shift_duration(shift_id UUID)
RETURNS INTEGER AS $$
DECLARE
    duration INTEGER;
BEGIN
    SELECT EXTRACT(EPOCH FROM (clock_out - clock_in)) / 60 - COALESCE(break_duration, 0)
    INTO duration
    FROM shifts
    WHERE id = shift_id;
    
    RETURN COALESCE(duration, 0);
END;
$$ LANGUAGE plpgsql;

-- Çalışan performans özeti (bugün)
CREATE OR REPLACE FUNCTION get_employee_daily_stats(emp_id UUID)
RETURNS TABLE (
    employee_name TEXT,
    total_hours NUMERIC,
    total_sales NUMERIC,
    total_transactions INTEGER,
    avg_sale NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.first_name || ' ' || e.last_name,
        ROUND(SUM(EXTRACT(EPOCH FROM (COALESCE(s.clock_out, NOW()) - s.clock_in)) / 3600)::NUMERIC, 2),
        COALESCE(SUM(s.total_sales), 0),
        COALESCE(SUM(s.total_transactions), 0),
        CASE WHEN SUM(s.total_transactions) > 0 
            THEN ROUND(SUM(s.total_sales) / SUM(s.total_transactions), 2)
            ELSE 0 
        END
    FROM employees e
    LEFT JOIN shifts s ON s.employee_id = e.id 
        AND DATE(s.clock_in) = CURRENT_DATE
    WHERE e.id = emp_id
    GROUP BY e.id, e.first_name, e.last_name;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS: Otomatik Güncelleme
-- ============================================

-- Vardiya çıkışında toplam satış ve işlem sayısını güncelle
CREATE OR REPLACE FUNCTION update_shift_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Vardiya için toplam satış ve işlem sayısını güncelle
    UPDATE shifts
    SET 
        total_sales = (
            SELECT COALESCE(SUM(sale_amount), 0)
            FROM employee_sales
            WHERE shift_id = NEW.shift_id
        ),
        total_transactions = (
            SELECT COUNT(*)
            FROM employee_sales
            WHERE shift_id = NEW.shift_id
        )
    WHERE id = NEW.shift_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_shift_metrics
AFTER INSERT OR UPDATE ON employee_sales
FOR EACH ROW
EXECUTE FUNCTION update_shift_metrics();

-- Updated_at otomatik güncelleme
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER employees_updated_at BEFORE UPDATE ON employees
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER shifts_updated_at BEFORE UPDATE ON shifts
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- DEMO DATA (Opsiyonel - Test için)
-- ============================================
-- Uygulamadan çalışan eklenebilir, bu sadece referans amaçlıdır
