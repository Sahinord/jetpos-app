-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Products Table
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  barcode TEXT,
  purchase_price DECIMAL(15, 2) DEFAULT 0.00,
  sale_price DECIMAL(15, 2) DEFAULT 0.00,
  stock_quantity DECIMAL(15, 3) DEFAULT 0, -- Adet veya kg için küsurat desteği
  category_id UUID REFERENCES categories(id),
  user_id UUID REFERENCES auth.users(id),
  vat_rate INTEGER DEFAULT 1,
  unit TEXT DEFAULT 'Adet', -- kg, adet, paket vb.
  is_active BOOLEAN DEFAULT true,
  is_campaign BOOLEAN DEFAULT false,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Sales Table
CREATE TABLE IF NOT EXISTS sales (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  total_amount DECIMAL(15, 2) DEFAULT 0.00,
  total_profit DECIMAL(15, 2) DEFAULT 0.00,
  payment_method TEXT CHECK (payment_method IN ('NAKİT', 'KART', 'VERESİYE', 'HAVALE/EFT')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Sale Items
CREATE TABLE IF NOT EXISTS sale_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity DECIMAL(15, 3) NOT NULL,
  unit_price DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  category TEXT DEFAULT 'Genel',
  expense_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- 6.5 Fix potential existing NOT NULL constraints for demo mode
ALTER TABLE categories ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE products ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE sales ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE expenses ALTER COLUMN user_id DROP NOT NULL;

DROP POLICY IF EXISTS "Anyone can manage sale items" ON sale_items;
CREATE POLICY "Anyone can manage sale items" ON sale_items FOR ALL USING (true);

-- Policies (Using DO blocks to avoid errors if they already exist is complex, but standard CREATE POLICY will fail if exists)
-- Simplifying: If you get "policy already exists" errors, you can ignore them or use the SQL below to DROP and RECREATE.

DROP POLICY IF EXISTS "Users can manage their own categories" ON categories;
CREATE POLICY "Users can manage their own categories" ON categories FOR ALL USING (true);

DROP POLICY IF EXISTS "Users can manage their own products" ON products;
CREATE POLICY "Users can manage their own products" ON products FOR ALL USING (true);

DROP POLICY IF EXISTS "Users can manage their own sales" ON sales;
CREATE POLICY "Users can manage their own sales" ON sales FOR ALL USING (true);

DROP POLICY IF EXISTS "Users can manage their own expenses" ON expenses;
CREATE POLICY "Users can manage their own expenses" ON expenses FOR ALL USING (true);

-- 6.6 Ensure new columns exist for existing tables
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='products' AND COLUMN_NAME='status') THEN
    ALTER TABLE products ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'passive', 'pending'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='products' AND COLUMN_NAME='is_campaign') THEN
    ALTER TABLE products ADD COLUMN is_campaign BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='products' AND COLUMN_NAME='unit') THEN
    ALTER TABLE products ADD COLUMN unit TEXT DEFAULT 'Adet';
  END IF;

  -- Migrate is_active to status if is_active exists
  IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='products' AND COLUMN_NAME='is_active') THEN
    UPDATE products SET status = CASE WHEN is_active = false THEN 'passive' ELSE 'active' END;
    -- ALTER TABLE products DROP COLUMN is_active; -- Opsiyonel: Eski sütunu silmek için
  END IF;
END $$;

-- 7. RPC Functions
CREATE OR REPLACE FUNCTION decrement_stock(product_id UUID, qty DECIMAL)
RETURNS void AS $$
BEGIN
  -- Parametreleri explicit olarak cast ediyoruz
  UPDATE products
  SET 
    stock_quantity = stock_quantity - CAST(qty AS DECIMAL),
    status = CASE 
               WHEN (stock_quantity - CAST(qty AS DECIMAL)) <= 0 THEN 'passive' 
               ELSE status 
             END
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql;

-- Schema cache yenilemek için
NOTIFY pgrst, 'reload schema';

-- 8. Licensing System
CREATE TABLE IF NOT EXISTS licenses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  license_key TEXT UNIQUE NOT NULL,
  client_name TEXT NOT NULL,
  hwid TEXT, -- Hardware ID of the machine
  username TEXT, -- Set during first activation
  password TEXT, -- Brute password or hash (for demo we use text for simplicity, or simple hash)
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can check licenses" ON licenses;
CREATE POLICY "Public can check licenses" ON licenses FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public can update licenses for activation" ON licenses;
CREATE POLICY "Public can update licenses for activation" ON licenses FOR UPDATE USING (true);

-- Örnek Lisans Oluşturma Komutu (SQL Editor'da çalıştırabilirsin):
-- INSERT INTO licenses (license_key, client_name) VALUES ('KARDESLER-2026-PRO', 'Kardeşler Kasap');
