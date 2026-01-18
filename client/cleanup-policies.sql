-- 🧨 JETSQU TEMİZLİK OPERASYONU 🧨
-- Bu script, products tablosundaki TÜM ESKİ POLİTİKALARI siler ve sadece yenisini bırakır.
-- Gördüğümüz hatalı kurallar: 'Users can manage their own products', 'Products - Own Tenant Select' vb.

do $$ 
declare 
  -- Silinecek tablolar
  tables text[] := array['products', 'categories', 'sales', 'sale_items', 'expenses', 'notifications'];
  t text;
begin 
  foreach t in array tables loop
    
    -- 1. Bildiğimiz/Gördüğümüz tüm politikaları tek tek, acımadan uçuruyoruz.
    -- Ekran görüntüsündeki suçlular:
    execute format('DROP POLICY IF EXISTS "Users can manage their own products" ON %I;', t);
    execute format('DROP POLICY IF EXISTS "Products - Own Tenant Select" ON %I;', t);
    execute format('DROP POLICY IF EXISTS "Products - Own Tenant Insert" ON %I;', t);
    execute format('DROP POLICY IF EXISTS "Products - Own Tenant Update" ON %I;', t);
    execute format('DROP POLICY IF EXISTS "Products - Own Tenant Delete" ON %I;', t);
    execute format('DROP POLICY IF EXISTS "product_isolation" ON %I;', t);
    execute format('DROP POLICY IF EXISTS "Tenant Isolation Policy" ON %I;', t); -- Yenisini eklemeden önce eskisini sil

    -- 2. YENİ VE TEK KURAL
    -- Sadece bu kalacak.
    execute format('
      CREATE POLICY "Tenant Isolation Policy" ON %I
      AS PERMISSIVE
      FOR ALL
      TO public
      USING (tenant_id = (current_setting(''app.current_tenant_id'', true))::uuid)
      WITH CHECK (tenant_id = (current_setting(''app.current_tenant_id'', true))::uuid);
    ', t);
    
    raise notice '% tablosu temizlendi ve kilitlendi.', t;
  end loop;
end $$;
