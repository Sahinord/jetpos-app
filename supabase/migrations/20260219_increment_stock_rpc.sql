-- product_id bazlı stok artırma fonksiyonu
CREATE OR REPLACE FUNCTION increment_stock(p_product_id UUID, p_qty DECIMAL)
RETURNS void AS $$
BEGIN
  UPDATE products
  SET 
    stock_quantity = COALESCE(stock_quantity, 0) + CAST(p_qty AS DECIMAL),
    status = CASE 
               WHEN (COALESCE(stock_quantity, 0) + CAST(p_qty AS DECIMAL)) > 0 THEN 'active'
               ELSE status 
             END
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql;

-- Schema cache yenilemek için
NOTIFY pgrst, 'reload schema';
