-- 🚨 JETSQU SUPOSE GÜVENLİK YAMASI (V3 - Final) 🚨
-- Bu script tabloları kilitler ve sadece doğru lisans sahibinin görmesini sağlar.

-- 1. Güvenli Tenant Ayarlama Fonksiyonu
CREATE OR REPLACE FUNCTION set_current_tenant(tenant_id uuid)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_tenant_id', tenant_id::text, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Ana Tabloları Kilitle
do $$ 
declare 
  t text;
  -- Sadece kesin var olan tablolar:
  tables text[] := array['products', 'categories', 'sales', 'sale_items', 'expenses', 'notifications'];
begin 
  foreach t in array tables loop
    -- RLS'i Aktif Et
    execute format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
    
    -- Eski Politikaları Temizle
    execute format('DROP POLICY IF EXISTS "Tenant Isolation Policy" ON %I;', t);
    execute format('DROP POLICY IF EXISTS "Enable read access for all users" ON %I;', t);
    execute format('DROP POLICY IF EXISTS "Enable insert for all users" ON %I;', t);
    execute format('DROP POLICY IF EXISTS "Enable update for all users" ON %I;', t);
    execute format('DROP POLICY IF EXISTS "Enable delete for all users" ON %I;', t);
    execute format('DROP POLICY IF EXISTS "Public Access" ON %I;', t);

    -- YENİ SIKI POLİTİKA (Açık kapı bırakmaz)
    -- "app.current_tenant_id" ayarlı değilse NULL döner ve hiçbir şey göstermez.
    execute format('
      CREATE POLICY "Tenant Isolation Policy" ON %I
      AS PERMISSIVE
      FOR ALL
      TO public
      USING (tenant_id = (current_setting(''app.current_tenant_id'', true))::uuid)
      WITH CHECK (tenant_id = (current_setting(''app.current_tenant_id'', true))::uuid);
    ', t);
    
    raise notice 'Tablo kilitlendi: %', t;
  end loop;
end $$;

-- 3. Tenants Tablosu (Giriş için sadece okuma izni)
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow reading own tenant" ON tenants;
DROP POLICY IF EXISTS "Public read" ON tenants;

CREATE POLICY "Allow reading own tenant" ON tenants
FOR SELECT
USING (true); -- Login sırasında filtreleme client tarafında yapılır, ancak yazma kapalıdır.

-- Yazma (Update/Delete) Sadece Service Role yapabilir (veya Admin)
-- Public update kapatılır.
