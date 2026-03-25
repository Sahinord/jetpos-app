-- Enable Realtime for tenants table
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime_tenants;
  CREATE PUBLICATION supabase_realtime_tenants FOR TABLE tenants;
COMMIT;

-- Ensure necessary columns exist in tenants table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tenants' AND COLUMN_NAME='download_link') THEN
        ALTER TABLE tenants ADD COLUMN download_link TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tenants' AND COLUMN_NAME='features') THEN
        ALTER TABLE tenants ADD COLUMN features JSONB DEFAULT '{}';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tenants' AND COLUMN_NAME='expires_at') THEN
        ALTER TABLE tenants ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;
