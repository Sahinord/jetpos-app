-- Add external_price column to products table for marketplace pricing
ALTER TABLE products ADD COLUMN IF NOT EXISTS external_price NUMERIC DEFAULT 0;

-- Refresh the product view search if necessary (optional depending on your DB setup)
COMMENT ON COLUMN products.external_price IS 'Marketplace (Trendyol, etc.) specific selling price';
