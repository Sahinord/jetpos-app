-- Tüm dükkanları ve ürün sayılarını gör
SELECT id, license_key, company_name, (SELECT count(*) FROM products p WHERE p.tenant_id = t.id) as product_count
FROM tenants t;
