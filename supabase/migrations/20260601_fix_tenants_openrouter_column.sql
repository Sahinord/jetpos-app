-- Fix missing column in tenants table
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS openrouter_api_key TEXT;
