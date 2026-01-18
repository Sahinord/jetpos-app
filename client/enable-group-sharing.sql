-- 🤝 GRUP PAYLAŞIM ÖZELLİĞİ EKLEME (Tenant Groups) 🤝
-- Bu script, katı izolasyon kuralını günceller ve "İzin verilenler de görebilsin" maddesini ekler.

do $$ 
declare 
  t text;
  tables text[] := array['products', 'categories', 'sales', 'sale_items', 'expenses', 'notifications'];
begin 
  foreach t in array tables loop
    
    -- Önce mevcut katı kuralı silelim
    execute format('DROP POLICY IF EXISTS "Tenant Isolation Policy" ON %I;', t);

    -- YENİ AKILLI KURAL (Smart Lock)
    -- 1. Kendi malını gör (tenant_id = current)
    -- 2. VEYA İzin verilen dükkanın malını gör (tenant_groups tablosunda yetki varsa)
    execute format('
      CREATE POLICY "Tenant Isolation Policy" ON %I
      AS PERMISSIVE
      FOR ALL
      TO public
      USING (
        tenant_id = (current_setting(''app.current_tenant_id'', true))::uuid
        OR 
        tenant_id IN (
            SELECT target_tenant_id 
            FROM tenant_groups 
            WHERE tenant_id = (current_setting(''app.current_tenant_id'', true))::uuid
        )
      )
      WITH CHECK (
        tenant_id = (current_setting(''app.current_tenant_id'', true))::uuid
        OR 
        tenant_id IN (
            SELECT target_tenant_id 
            FROM tenant_groups 
            WHERE tenant_id = (current_setting(''app.current_tenant_id'', true))::uuid
        )
      );
    ', t);
    
    raise notice '% tablosu için grup paylaşımı açıldı.', t;
  end loop;
end $$;
