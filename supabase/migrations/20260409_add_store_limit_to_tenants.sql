-- Add store limit to tenants and licenses
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS max_stores INTEGER DEFAULT 1;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS max_stores INTEGER DEFAULT 1;
