-- Adisyon (Restaurant/Cafe) Sistemi Altyapısı
-- Multi-tenant uyumlu masa ve geçici sipariş yönetimi

-- 1. Masalar Tablosu
CREATE TABLE IF NOT EXISTS restaurant_tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- Masa 1, Bahçe 4 vb.
    section TEXT DEFAULT 'Genel', -- Bahçe, Teras, Salon vb.
    status TEXT DEFAULT 'empty', -- empty, occupied, dirty, reserved
    capacity INTEGER DEFAULT 4,
    x_pos INTEGER DEFAULT 0, -- Sürükle bırak düzeni için
    y_pos INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Masa Siparişleri (Adisyon Kalemleri)
-- Bu tablo geçici siparişleri tutar. Satış tamamlandığında buradan silinir.
CREATE TABLE IF NOT EXISTS table_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    table_id UUID NOT NULL REFERENCES restaurant_tables(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity DECIMAL(12,3) NOT NULL DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL,
    notes TEXT,
    order_status TEXT DEFAULT 'pending', -- pending, preparing, served, cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS (Row Level Security) Politikaları - BU PROJEDE RLS GENELDE KAPALI
ALTER TABLE restaurant_tables DISABLE ROW LEVEL SECURITY;
ALTER TABLE table_orders DISABLE ROW LEVEL SECURITY;

-- Trigger: updated_at güncelleme
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_restaurant_tables_updated_at ON restaurant_tables;
CREATE TRIGGER update_restaurant_tables_updated_at
    BEFORE UPDATE ON restaurant_tables
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_restaurant_tables_tenant ON restaurant_tables(tenant_id);
CREATE INDEX IF NOT EXISTS idx_table_orders_table ON table_orders(table_id);
CREATE INDEX IF NOT EXISTS idx_table_orders_tenant ON table_orders(tenant_id);
