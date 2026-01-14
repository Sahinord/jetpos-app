-- =============================================
-- SUPPORT TICKETS & NOTIFICATIONS SETUP
-- =============================================

-- 1. Support Tickets Table
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'open', -- open, in_progress, closed
  priority TEXT DEFAULT 'normal', -- low, normal, high_priority, critical
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE, -- NULL means GLOBAL notification
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info', -- info, success, warning, error
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_tenant ON support_tickets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_tenant ON notifications(tenant_id);

-- 3. RLS Policies
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Tickets: Tenants can only see/insert their own tickets. Admin can see all.
CREATE POLICY "Tenants can manage their own tickets" ON support_tickets
FOR ALL TO public
USING (tenant_id::text = current_setting('app.current_tenant_id', true))
WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY "Admin can see all tickets" ON support_tickets
FOR SELECT TO public
USING (EXISTS (SELECT 1 FROM tenants WHERE id::text = current_setting('app.current_tenant_id', true) AND license_key = 'ADM257SA67'));

-- Notifications: Tenants can see their own + global ones.
CREATE POLICY "Tenants can see relevant notifications" ON notifications
FOR SELECT TO public
USING (
  tenant_id::text = current_setting('app.current_tenant_id', true) 
  OR tenant_id IS NULL
);

-- =============================================
-- TEST DATA (Optional)
-- =============================================
INSERT INTO notifications (title, message, type) 
VALUES ('JetPos v1.0 Yayında!', 'Yeni nesil muhasebe deneyimine hoş geldiniz.', 'success');

SELECT '✅ Support & Notifications system ready!' AS status;
