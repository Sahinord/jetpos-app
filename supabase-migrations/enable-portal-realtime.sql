-- ENABLE REALTIME FOR ALL PORTAL TABLES
ALTER PUBLICATION supabase_realtime ADD TABLE tenant_devices;
ALTER PUBLICATION supabase_realtime ADD TABLE tenant_invoices;
ALTER PUBLICATION supabase_realtime ADD TABLE support_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE tenants;
ALTER PUBLICATION supabase_realtime ADD TABLE sales;
