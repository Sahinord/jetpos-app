-- =============================================
-- DEVICE MANAGEMENT, INVOICING & WHITE-LABELING
-- =============================================

-- 1. Tenant Devices Table
CREATE TABLE IF NOT EXISTS tenant_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  device_name TEXT NOT NULL,
  device_type TEXT DEFAULT 'pos', -- pos, mobile, tablet, web
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_online BOOLEAN DEFAULT true,
  device_id TEXT UNIQUE -- Unique hardware ID or browser fingerprint
);

-- 2. Tenant Invoices Table
CREATE TABLE IF NOT EXISTS tenant_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  invoice_no TEXT UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'paid', -- paid, pending, failed
  invoice_date DATE DEFAULT CURRENT_DATE,
  pdf_url TEXT -- Link to the generated invoice PDF
);

-- 3. Update Tenants for White-Labeling
-- Checking if column exists first (via a DO block)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tenants' AND COLUMN_NAME='custom_logo_url') THEN
        ALTER TABLE tenants ADD COLUMN custom_logo_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tenants' AND COLUMN_NAME='branding_config') THEN
        ALTER TABLE tenants ADD COLUMN branding_config JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- 4. Enable RLS
ALTER TABLE tenant_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_invoices ENABLE ROW LEVEL SECURITY;

-- 5. Policies
CREATE POLICY "Tenants can see their own devices" ON tenant_devices
FOR SELECT TO public
USING (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY "Tenants can see their own invoices" ON tenant_invoices
FOR SELECT TO public
USING (tenant_id::text = current_setting('app.current_tenant_id', true));

-- =============================================
-- TEST DATA
-- =============================================
-- Will be added manually via code if needed
SELECT '✅ Extended Portal features ready!' AS status;
