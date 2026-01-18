-- 🕵️ DATA DEDEKTİFİ 🕵️
-- Bu sorgu, ürünlerin kime ait olduğunu ortaya çıkarır.

SELECT 
    COALESCE(tenant_id::text, 'SAHİPSİZ (NULL)') as dukkan_sahibi, 
    COUNT(*) as urun_sayisi
FROM products
GROUP BY tenant_id;

-- Eğer SAHİPSİZ ürünler varsa, bunları Admin'e devretmek için:
-- UPDATE products SET tenant_id = 'ADMIN_UUID_BURAYA' WHERE tenant_id IS NULL;
-- Veya silmek için:
-- DELETE FROM products WHERE tenant_id IS NULL;
