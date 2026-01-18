-- Tüm tenantları ve ürün sayılarını gör
SELECT t.id, t.license_key, t.company_name, (SELECT count(*) FROM products p WHERE p.tenant_id = t.id) as product_count
FROM tenants t;
