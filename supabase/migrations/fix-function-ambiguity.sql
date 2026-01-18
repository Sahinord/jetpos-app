-- 🔧 TEK VE NET FONKSİYON 🔧
-- Bu script, karışıklık yaratan tüm set_current_tenant varyasyonlarını siler ve tek bir tane (UUID kabul eden) tanımlar.

DROP FUNCTION IF EXISTS set_current_tenant(text);
DROP FUNCTION IF EXISTS set_current_tenant(uuid);

CREATE OR REPLACE FUNCTION set_current_tenant(tenant_id uuid)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_tenant_id', tenant_id::text, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
