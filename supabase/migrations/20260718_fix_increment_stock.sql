-- ═══════════════════════════════════════════════════════════════════
--  Alış faturasında STOK EKLENMİYOR düzeltmesi
--  Manuel uygulanır: Supabase Dashboard > SQL Editor
--
--  SORUN: increment_stock SECURITY DEFINER DEĞİLDİ → içindeki UPDATE anon
--  rolüyle çalışıp products RLS'ine/izne takılıyor, stok sessizce artmıyordu
--  (decrement_stock ile aynı bug sınıfı).
--  ÇÖZÜM: SECURITY DEFINER + default'suz yeniden kur + EXECUTE grant.
-- ═══════════════════════════════════════════════════════════════════

DROP FUNCTION IF EXISTS increment_stock(uuid, numeric);

CREATE FUNCTION increment_stock(p_product_id uuid, p_qty decimal)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE products
  SET stock_quantity = COALESCE(stock_quantity, 0) + p_qty,
      status = CASE WHEN (COALESCE(stock_quantity, 0) + p_qty) > 0 THEN 'active' ELSE status END
  WHERE id = p_product_id;
END;
$$;

GRANT EXECUTE ON FUNCTION increment_stock(uuid, decimal) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
