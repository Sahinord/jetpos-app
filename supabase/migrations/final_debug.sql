-- Ürünlerin dükkan kimliklerini ve lisans anahtarlarını KESİN olarak kontrol et
SELECT 
    t.license_key, 
    t.company_name, 
    t.id as tenant_id, 
    count(p.id) as product_count
FROM tenants t
LEFT JOIN products p ON p.tenant_id = t.id
GROUP BY t.id, t.license_key, t.company_name;

-- RLS durumunu kontrol et
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'products';

-- Aktif politikaları gör
SELECT * FROM pg_policies WHERE tablename = 'products';
