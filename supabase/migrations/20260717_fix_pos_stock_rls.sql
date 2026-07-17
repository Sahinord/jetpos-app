-- ═══════════════════════════════════════════════════════════════════
--  POS HIZLI SATIŞ — stok düşürme + RLS düzeltmesi (v2)
--  Manuel uygulanır: Supabase Dashboard > SQL Editor
--
--  1) "Stok düşme hatası: {}":
--     decrement_stock SECURITY DEFINER DEĞİLDİ → UPDATE anon rolüyle RLS'e/izne
--     takılıyordu. Ayrıca default'lu 3-param + 2-param overload BELİRSİZLİĞİ vardı.
--     → İkisini düşürüp SECURITY DEFINER + default'suz yeniden kuruyoruz.
--
--  2) "new row violates row-level security policy for table sales":
--     sales, cari_* vb. RLS'i HEADER tabanlı çalışır (her istekte gelen
--     x-tenant-id / x-license-key) — session değişkeni (app.current_tenant_id)
--     PostgREST connection pooling'de taşınmadığı için GÜVENİLMEZ.
--     (bkz. fix_rls_permissions.sql). sales/sale_items'ı bu ÇALIŞAN header
--     desenine geri alıyoruz.
-- ═══════════════════════════════════════════════════════════════════

-- ── 0) Eski stok fonksiyonlarını temizle (default + overload belirsizliği) ──
DROP FUNCTION IF EXISTS decrement_stock(uuid, numeric);
DROP FUNCTION IF EXISTS decrement_stock(uuid, numeric, uuid);

-- ── 1) Ürün geneli stok düşürme — SECURITY DEFINER ──
CREATE FUNCTION decrement_stock(p_product_id uuid, p_qty decimal)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE products
  SET stock_quantity = COALESCE(stock_quantity, 0) - p_qty
  WHERE id = p_product_id;
END;
$$;

-- ── 2) Depo bazlı stok düşürme — SECURITY DEFINER (default YOK) ──
--    warehouse_stock (tenant_id, warehouse_id, product_id, quantity) güncellenir;
--    trg_sync_stock trigger'ı products.stock_quantity'yi senkronlar.
CREATE FUNCTION decrement_stock(p_product_id uuid, p_qty decimal, p_warehouse_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE warehouse_stock
  SET quantity = COALESCE(quantity, 0) - p_qty
  WHERE product_id = p_product_id AND warehouse_id = p_warehouse_id;

  IF NOT FOUND THEN
    UPDATE products
    SET stock_quantity = COALESCE(stock_quantity, 0) - p_qty
    WHERE id = p_product_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION decrement_stock(uuid, decimal) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION decrement_stock(uuid, decimal, uuid) TO anon, authenticated;

-- ── 3) is_super_admin kolonu (header politikası referans veriyor) ──
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false;
UPDATE tenants SET is_super_admin = true WHERE license_key = 'ADM257SA67';

-- ── 4) sales + sale_items → ÇALIŞAN header tabanlı "Tenant Isolation Policy" ──
--    (fix_rls_permissions.sql ile birebir; her istekte x-tenant-id/x-license-key)
DO $$
DECLARE t_name TEXT; p RECORD;
BEGIN
  FOREACH t_name IN ARRAY ARRAY['sales', 'sale_items'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = t_name) THEN
      CONTINUE;
    END IF;

    -- Mevcut TÜM politikaları temizle (bozuk session-var olanlar dahil)
    FOR p IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = t_name LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p.policyname, t_name);
    END LOOP;

    EXECUTE 'ALTER TABLE public.' || quote_ident(t_name) || ' ENABLE ROW LEVEL SECURITY;';

    EXECUTE 'CREATE POLICY "Tenant Isolation Policy" ON public.' || quote_ident(t_name) || '
      FOR ALL TO public
      USING (
        (
          tenant_id::text = COALESCE(current_setting(''request.headers'', true)::json->>''x-tenant-id'', '''')
          AND EXISTS (
            SELECT 1 FROM tenants
            WHERE id::text = COALESCE(current_setting(''request.headers'', true)::json->>''x-tenant-id'', '''')
              AND license_key = COALESCE(current_setting(''request.headers'', true)::json->>''x-license-key'', '''')
              AND status = ''active''
          )
        )
        OR EXISTS (
          SELECT 1 FROM tenants
          WHERE license_key = COALESCE(current_setting(''request.headers'', true)::json->>''x-license-key'', '''')
            AND is_super_admin = true AND status = ''active''
        )
      )
      WITH CHECK (
        (
          tenant_id::text = COALESCE(current_setting(''request.headers'', true)::json->>''x-tenant-id'', '''')
          AND EXISTS (
            SELECT 1 FROM tenants
            WHERE id::text = COALESCE(current_setting(''request.headers'', true)::json->>''x-tenant-id'', '''')
              AND license_key = COALESCE(current_setting(''request.headers'', true)::json->>''x-license-key'', '''')
              AND status = ''active''
          )
        )
        OR EXISTS (
          SELECT 1 FROM tenants
          WHERE license_key = COALESCE(current_setting(''request.headers'', true)::json->>''x-license-key'', '''')
            AND is_super_admin = true AND status = ''active''
        )
      );';
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
