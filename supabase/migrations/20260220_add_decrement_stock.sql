
-- Eski fonksiyonu temizle (parametre isim değişikliği için gerekli)
DROP FUNCTION IF EXISTS decrement_stock(uuid, numeric);

-- product_id bazlı stok düşürme fonksiyonu
CREATE OR REPLACE FUNCTION decrement_stock(p_product_id UUID, p_qty DECIMAL)
RETURNS void AS $$
BEGIN
  UPDATE products
  SET 
    stock_quantity = COALESCE(stock_quantity, 0) - CAST(p_qty AS DECIMAL)
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql;

-- Schema cache yenilemek için
NOTIFY pgrst, 'reload schema';
