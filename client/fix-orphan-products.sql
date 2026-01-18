-- 🧹 SAHİPSİZ ÜRÜNLERİ TEMİZLEME (GİZLEME) 🧹
-- Bu komut, tenant_id'si NULL olan tüm ürünleri '0000...' ID'sine atar.
-- Böylece bu ürünler normal listelerde görünmez (Arşivlenmiş gibi olur).
-- Veri KESİNLİKLE SİLİNMEZ.

UPDATE products 
SET tenant_id = '00000000-0000-0000-0000-000000000000' 
WHERE tenant_id IS NULL;

-- İşlem bittikten sonra kaç tane ürünün güncellendiğini görmek için:
-- SELECT COUNT(*) FROM products WHERE tenant_id = '00000000-0000-0000-0000-000000000000';
