-- Add numeric license ID to tenants table
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS license_id SERIAL;

-- If you want it to be unique and indexed
CREATE UNIQUE INDEX IF NOT EXISTS tenants_license_id_idx ON tenants (license_id);

-- Commentary: This adds a sequential numeric ID to every license. 
-- Useful for shorter references and numeric-only identification.
