-- Add fixed_warehouses to tenants and platform to warehouses
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS fixed_warehouses JSONB DEFAULT '[]'::jsonb;
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS platform TEXT; -- 'trendyol', 'getir', etc.

COMMENT ON COLUMN tenants.fixed_warehouses IS 'Superadmin tarafından tanımlanan, silinemez/sabit mağaza şablonları';
COMMENT ON COLUMN warehouses.platform IS 'Mağazanın bağlı olduğu platform (örn: trendyol)';
