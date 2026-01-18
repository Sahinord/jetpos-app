-- Ürünlerin şu anki dükkan dağılımı
SELECT t.license_key, t.company_name, t.id as tenant_id, count(p.id) as urun_sayisi
FROM tenants t
LEFT JOIN products p ON p.tenant_id = t.id
GROUP BY t.id, t.license_key, t.company_name;
