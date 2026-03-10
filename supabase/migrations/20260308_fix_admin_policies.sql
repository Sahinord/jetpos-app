-- Admin Panel Fixes: Schema and Policies
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS user_email TEXT;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'PRO';
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS total_days INTEGER DEFAULT 365;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS download_link TEXT DEFAULT 'https://github.com/Sahinord/jetpos-app/releases/latest/download/JetPOS-Setup.exe';

-- Enable RLS (already enabled but just in case)
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_guides ENABLE ROW LEVEL SECURITY;

-- Drop existing to avoid conflicts
DROP POLICY IF EXISTS "Public can manage licenses" ON licenses;
DROP POLICY IF EXISTS "Public can check licenses" ON licenses;
DROP POLICY IF EXISTS "Public can update licenses for activation" ON licenses;
DROP POLICY IF EXISTS "Admin can manage all licenses" ON licenses;

-- Policies for licenses (Public access for now as frontend uses anon key)
CREATE POLICY "Public can manage licenses" ON licenses FOR ALL USING (true) WITH CHECK (true);

-- Policies for customer_guides
DROP POLICY IF EXISTS "Public can view active guides" ON customer_guides;
DROP POLICY IF EXISTS "Public can manage guides" ON customer_guides;
CREATE POLICY "Public can view active guides" ON customer_guides FOR SELECT USING (true);
CREATE POLICY "Public can manage guides" ON customer_guides FOR ALL USING (true) WITH CHECK (true);

-- Policies for demo_requests
ALTER TABLE demo_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can manage demo requests" ON demo_requests;
CREATE POLICY "Public can manage demo requests" ON demo_requests FOR ALL USING (true) WITH CHECK (true);
