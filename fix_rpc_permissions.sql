-- ====================================================================
-- JetPOS RPC Permissions Fix Script
-- ====================================================================
-- Bu SQL betiğini Supabase Panelinizdeki SQL Editor kısmına yapıştırıp çalıştırın.
-- Link: https://supabase.com/dashboard/project/grlwmcuxobbgubphovhd/sql
-- ====================================================================

-- 1. validate_license fonksiyonu için yetkiler
GRANT EXECUTE ON FUNCTION validate_license(uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION validate_license(uuid, text) TO authenticated;

-- 2. set_current_tenant fonksiyonu için yetkiler
GRANT EXECUTE ON FUNCTION set_current_tenant(uuid) TO anon;
GRANT EXECUTE ON FUNCTION set_current_tenant(uuid) TO authenticated;

-- 3. verify_employee_pin fonksiyonu için yetkiler
GRANT EXECUTE ON FUNCTION verify_employee_pin(uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION verify_employee_pin(uuid, text) TO authenticated;

-- 4. verify_tenant_password fonksiyonu için yetkiler
GRANT EXECUTE ON FUNCTION verify_tenant_password(uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION verify_tenant_password(uuid, text) TO authenticated;

-- 5. find_tenant_by_license fonksiyonu için yetkiler
GRANT EXECUTE ON FUNCTION find_tenant_by_license(text) TO anon;
GRANT EXECUTE ON FUNCTION find_tenant_by_license(text) TO authenticated;

-- 6. get_next_waybill_number fonksiyonu için yetkiler
GRANT EXECUTE ON FUNCTION get_next_waybill_number(uuid, waybill_type, integer) TO anon;
GRANT EXECUTE ON FUNCTION get_next_waybill_number(uuid, waybill_type, integer) TO authenticated;

-- 7. get_next_invoice_number fonksiyonu için yetkiler
GRANT EXECUTE ON FUNCTION get_next_invoice_number(uuid, invoice_type, integer) TO anon;
GRANT EXECUTE ON FUNCTION get_next_invoice_number(uuid, invoice_type, integer) TO authenticated;

-- 8. decrement_stock fonksiyonu için yetkiler
GRANT EXECUTE ON FUNCTION decrement_stock(uuid, decimal) TO anon;
GRANT EXECUTE ON FUNCTION decrement_stock(uuid, decimal) TO authenticated;

-- 9. increment_stock fonksiyonu için yetkiler
GRANT EXECUTE ON FUNCTION increment_stock(uuid, decimal) TO anon;
GRANT EXECUTE ON FUNCTION increment_stock(uuid, decimal) TO authenticated;

-- 10. complete_tenant_initial_setup fonksiyonu için yetkiler
GRANT EXECUTE ON FUNCTION complete_tenant_initial_setup(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION complete_tenant_initial_setup(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- 11. set_tenant_module_setup fonksiyonu için yetkiler
GRANT EXECUTE ON FUNCTION set_tenant_module_setup(UUID, UUID, TEXT, BOOLEAN) TO anon;
GRANT EXECUTE ON FUNCTION set_tenant_module_setup(UUID, UUID, TEXT, BOOLEAN) TO authenticated;

-- 12. complete_setup_wizard fonksiyonu için yetkiler
GRANT EXECUTE ON FUNCTION complete_setup_wizard(UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION complete_setup_wizard(UUID, UUID) TO authenticated;

-- 13. reset_tenant_password fonksiyonu için yetkiler
GRANT EXECUTE ON FUNCTION reset_tenant_password(uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION reset_tenant_password(uuid, text) TO authenticated;

-- 14. admin_upsert_employee fonksiyonu için yetkiler
GRANT EXECUTE ON FUNCTION admin_upsert_employee(jsonb) TO anon;
GRANT EXECUTE ON FUNCTION admin_upsert_employee(jsonb) TO authenticated;

-- 15. admin_delete_employee fonksiyonu için yetkiler
GRANT EXECUTE ON FUNCTION admin_delete_employee(uuid) TO anon;
GRANT EXECUTE ON FUNCTION admin_delete_employee(uuid) TO authenticated;

-- 16. bulk_import_products fonksiyonu için yetkiler
GRANT EXECUTE ON FUNCTION bulk_import_products(jsonb, uuid) TO anon;
GRANT EXECUTE ON FUNCTION bulk_import_products(jsonb, uuid) TO authenticated;
