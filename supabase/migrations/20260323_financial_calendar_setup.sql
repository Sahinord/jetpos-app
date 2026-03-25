-- Mali Takvim Etkinlikleri Tablosu (Real-time & Tenant-based)
CREATE TABLE IF NOT EXISTS financial_calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    title TEXT NOT NULL,
    event_date DATE NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('payment', 'collection', 'tax', 'payroll')),
    amount DECIMAL(15,2) DEFAULT 0,
    color TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security)
ALTER TABLE financial_calendar_events ENABLE ROW LEVEL SECURITY;

-- Politika: Sadece kendi tenant_id'sine sahip olan verileri görsün/yönetsin
DROP POLICY IF EXISTS "Tenants can manage their own calendar events" ON financial_calendar_events;
CREATE POLICY "Tenants can manage their own calendar events"
    ON financial_calendar_events
    FOR ALL
    USING (tenant_id::text = auth.jwt() ->> 'tenant_id');

-- Performans Indexleri
CREATE INDEX IF NOT EXISTS idx_calendar_tenant_date ON financial_calendar_events(tenant_id, event_date);

-- Otomatik Updated At Güncelleme
DROP TRIGGER IF EXISTS update_financial_calendar_events_updated_at ON financial_calendar_events;
CREATE TRIGGER update_financial_calendar_events_updated_at
    BEFORE UPDATE ON financial_calendar_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
