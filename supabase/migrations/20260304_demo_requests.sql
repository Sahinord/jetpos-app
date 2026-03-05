-- ============================================
-- JetPOS Web - Tablo Kurulumu
-- Supabase Dashboard > SQL Editor'da çalıştır
-- https://supabase.com/dashboard/project/grlwmcuxobbgubphovhd/sql/new
-- ============================================

-- 1. DEMO TALEPLERİ TABLOSU
CREATE TABLE IF NOT EXISTS demo_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(200) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    company VARCHAR(200) NOT NULL,
    sector VARCHAR(100),
    employee_count VARCHAR(20),
    current_system VARCHAR(200),
    package_interest VARCHAR(100),
    message TEXT,
    status VARCHAR(30) DEFAULT 'new',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE demo_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "demo_insert" ON demo_requests;
DROP POLICY IF EXISTS "demo_select" ON demo_requests;
DROP POLICY IF EXISTS "demo_update" ON demo_requests;

CREATE POLICY "demo_insert" ON demo_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "demo_select" ON demo_requests FOR SELECT USING (true);
CREATE POLICY "demo_update" ON demo_requests FOR UPDATE USING (true);

-- 2. İLETİŞİM MESAJLARI TABLOSU
CREATE TABLE IF NOT EXISTS contact_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contact_insert" ON contact_messages;
DROP POLICY IF EXISTS "contact_select" ON contact_messages;

CREATE POLICY "contact_insert" ON contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "contact_select" ON contact_messages FOR SELECT USING (true);

-- İndexler
CREATE INDEX IF NOT EXISTS idx_demo_status ON demo_requests(status);
CREATE INDEX IF NOT EXISTS idx_demo_created ON demo_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_created ON contact_messages(created_at DESC);
