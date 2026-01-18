-- Ürünlerin hangi tenant_id ile kaydedildiğini kontrol et
SELECT tenant_id, count(*) FROM products GROUP BY tenant_id;
