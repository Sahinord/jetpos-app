-- File: supabase-migrations/warehouse-system.sql

-- 1. Warehouses Table
CREATE TABLE IF NOT EXISTS warehouses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20),
    type VARCHAR(30) DEFAULT 'storage', -- 'storage', 'shelf', 'virtual' (Trendyol, etc)
    address TEXT,
    description TEXT,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    manager_name VARCHAR(100),
    manager_phone VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tenant_id, code)
);

-- 2. Warehouse Stock & Prices
CREATE TABLE IF NOT EXISTS warehouse_stock (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity NUMERIC(12,3) DEFAULT 0,
    min_quantity NUMERIC(12,3) DEFAULT 0,
    max_quantity NUMERIC(12,3),
    
    -- Multi-Store Pricing: Different stores can have different prices
    sale_price NUMERIC(12,2), -- If null, use products.sale_price
    purchase_price NUMERIC(12,2), -- If null, use products.purchase_price
    
    last_counted_at TIMESTAMPTZ,
    last_counted_quantity NUMERIC(12,3),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(warehouse_id, product_id)
);

-- 3. Warehouse Transfers
CREATE TABLE IF NOT EXISTS warehouse_transfers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    transfer_no VARCHAR(50) NOT NULL,
    transfer_date TIMESTAMPTZ DEFAULT now(),
    from_warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    to_warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    status VARCHAR(20) DEFAULT 'pending',
    notes TEXT,
    created_by VARCHAR(100),
    approved_by VARCHAR(100),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CHECK(from_warehouse_id != to_warehouse_id)
);

-- 4. Transfer Items
CREATE TABLE IF NOT EXISTS warehouse_transfer_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    transfer_id UUID NOT NULL REFERENCES warehouse_transfers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity NUMERIC(12,3) NOT NULL,
    unit VARCHAR(20) DEFAULT 'Adet',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Inventory Counts
CREATE TABLE IF NOT EXISTS inventory_counts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    count_no VARCHAR(50) NOT NULL,
    count_date TIMESTAMPTZ DEFAULT now(),
    status VARCHAR(20) DEFAULT 'draft',
    notes TEXT,
    counted_by VARCHAR(100),
    approved_by VARCHAR(100),
    total_items INTEGER DEFAULT 0,
    total_difference NUMERIC(12,3) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ
);

-- 6. Count Items
CREATE TABLE IF NOT EXISTS inventory_count_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    count_id UUID NOT NULL REFERENCES inventory_counts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    system_quantity NUMERIC(12,3),
    counted_quantity NUMERIC(12,3),
    difference NUMERIC(12,3),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(count_id, product_id)
);

-- 7. RLS Policies
-- 7. Disable RLS for easy data management (consistent with other tables in project)
ALTER TABLE warehouses DISABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_stock DISABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_transfers DISABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_transfer_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_counts DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_count_items DISABLE ROW LEVEL SECURITY;

-- 8. Trigger to Sync Total Stock in Products Table
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

DROP TRIGGER IF EXISTS trg_sync_stock ON warehouse_stock;
CREATE TRIGGER trg_sync_stock
AFTER INSERT OR UPDATE OR DELETE ON warehouse_stock
FOR EACH ROW EXECUTE FUNCTION sync_product_total_stock();

-- 9. Function to Process Transfer (Move stock between warehouses)
CREATE OR REPLACE FUNCTION process_warehouse_transfer()
RETURNS TRIGGER AS $$
DECLARE
    v_item RECORD;
BEGIN
    -- Only process when status changes to 'completed'
    IF (NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed')) THEN
        -- Loop through transfer items and update stock
        FOR v_item IN SELECT * FROM warehouse_transfer_items WHERE transfer_id = NEW.id LOOP
            -- 1. Decrease from source
            INSERT INTO warehouse_stock (tenant_id, warehouse_id, product_id, quantity)
            VALUES (NEW.tenant_id, NEW.from_warehouse_id, v_item.product_id, -v_item.quantity)
            ON CONFLICT (warehouse_id, product_id) DO UPDATE 
            SET quantity = warehouse_stock.quantity - v_item.quantity;

            -- 2. Increase in destination
            INSERT INTO warehouse_stock (tenant_id, warehouse_id, product_id, quantity)
            VALUES (NEW.tenant_id, NEW.to_warehouse_id, v_item.product_id, v_item.quantity)
            ON CONFLICT (warehouse_id, product_id) DO UPDATE 
            SET quantity = warehouse_stock.quantity + v_item.quantity;
        END LOOP;
        
        NEW.approved_at = now();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_process_transfer ON warehouse_transfers;
CREATE TRIGGER trg_process_transfer
BEFORE UPDATE ON warehouse_transfers
FOR EACH ROW EXECUTE FUNCTION process_warehouse_transfer();
