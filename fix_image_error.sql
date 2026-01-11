-- Run this SQL in your Supabase SQL Editor to fix the missing image_url column error

-- 1. Add the column if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='products' AND COLUMN_NAME='image_url') THEN
    ALTER TABLE products ADD COLUMN image_url TEXT;
  END IF;
END $$;

-- 2. Force a schema cache reload to ensure the API sees the new column
NOTIFY pgrst, 'reload schema';
