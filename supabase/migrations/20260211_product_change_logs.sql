-- Product Change Logs Table
-- Stores all product modifications for audit trail and undo capability

CREATE TABLE IF NOT EXISTS product_change_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    product_barcode TEXT,
    change_type TEXT NOT NULL, -- 'stock', 'name', 'barcode', 'price', 'status', 'multiple'
    field_name TEXT, -- specific field that changed
    old_value TEXT,
    new_value TEXT,
    change_source TEXT DEFAULT 'mobile', -- 'mobile', 'desktop', 'bulk'
    changed_by TEXT DEFAULT 'admin',
    is_reverted BOOLEAN DEFAULT FALSE,
    reverted_at TIMESTAMPTZ,
    tenant_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_change_logs_product_id ON product_change_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_product_change_logs_tenant_id ON product_change_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_product_change_logs_created_at ON product_change_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_change_logs_change_type ON product_change_logs(change_type);

-- Enable RLS
ALTER TABLE product_change_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Tenant can view own logs"
    ON product_change_logs FOR SELECT
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY "Tenant can insert own logs"
    ON product_change_logs FOR INSERT
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY "Tenant can update own logs"
    ON product_change_logs FOR UPDATE
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid);
