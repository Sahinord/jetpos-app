-- ==========================================
-- JETPOS ADMIN & CUSTOMER PORTAL SETUP
-- ==========================================

-- 1. Ensure extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Update Licenses Table Schema
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS user_email TEXT;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'PRO';
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS total_days INTEGER DEFAULT 365;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS download_link TEXT DEFAULT 'https://github.com/Sahinord/jetpos-app/releases/latest/download/JetPOS-Setup.exe';

-- 3. Create Customer Guides Table
CREATE TABLE IF NOT EXISTS customer_guides (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_requests ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public can manage licenses" ON licenses;
DROP POLICY IF EXISTS "Public can check licenses" ON licenses;
DROP POLICY IF EXISTS "Public can update licenses for activation" ON licenses;
DROP POLICY IF EXISTS "Anyone can manage demo requests" ON demo_requests;
DROP POLICY IF EXISTS "Public can view active guides" ON customer_guides;
DROP POLICY IF EXISTS "Admin can manage guides" ON customer_guides;

-- 6. Create universal policies for Admin Panel (Using site's Anon Key)
-- IMPORTANT: In a real production app, these should be restricted to authenticated admin users.
-- For this setup, we enable full access via the anon key for the admin panel's CRUD operations.

CREATE POLICY "Manage licenses policy" ON licenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Manage guides policy" ON customer_guides FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Manage demo requests policy" ON demo_requests FOR ALL USING (true) WITH CHECK (true);

-- 7. Add baseline guide content if empty
INSERT INTO customer_guides (title, content, order_index) 
SELECT 'Kurulum Rehberi', 'JetPOS setup dosyasını indirdikten sonra yönetici olarak çalıştırın ve adımları takip edin.', 1
WHERE NOT EXISTS (SELECT 1 FROM customer_guides WHERE title = 'Kurulum Rehberi');

INSERT INTO customer_guides (title, content, order_index) 
SELECT 'Lisans Aktivasyonu', 'Uygulamayı ilk açtığınızda size verilen lisans anahtarını girerek aktivasyon işlemini tamamlayabilirsiniz.', 2
WHERE NOT EXISTS (SELECT 1 FROM customer_guides WHERE title = 'Lisans Aktivasyonu');
