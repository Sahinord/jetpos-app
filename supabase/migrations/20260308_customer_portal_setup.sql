-- Create Customer Portal Support
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS user_email TEXT;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'PRO'; -- BASIC, PRO, ENTERPRISE
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS total_days INTEGER DEFAULT 365;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS download_link TEXT DEFAULT 'https://github.com/Sahinord/jetpos-app/releases/latest/download/JetPOS-Setup.exe';

-- Create table for customer guide if not exists
CREATE TABLE IF NOT EXISTS customer_guides (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for guides
ALTER TABLE customer_guides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active guides" ON customer_guides FOR SELECT USING (is_active = true);

-- Add some initial guide content
INSERT INTO customer_guides (title, content, order_index) VALUES 
('Kurulum Rehberi', 'JetPOS setup dosyasını indirdikten sonra yönetici olarak çalıştırın ve adımları takip edin.', 1),
('Lisans Aktivasyonu', 'Uygulamayı ilk açtığınızda size verilen lisans anahtarını girerek aktivasyon işlemini tamamlayabilirsiniz.', 2);
