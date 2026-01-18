-- 1. Tüm dükkanları ve ürün sayılarını kontrol et
SELECT id, license_key, company_name, (SELECT count(*) FROM products p WHERE p.tenant_id = t.id) as product_count
FROM tenants t;

-- 2. Mevcut RLS durumunu kontrol et
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'products';

-- 3. Ürünler üzerindeki politikaları kontrol et
SELECT * FROM pg_policies WHERE tablename = 'products';

-- 4. app.current_tenant_id ayarını kontrol etmek için deneme yap (Bu SQL editörde tam çalışmayabilir ama tablo verisi verir)
SELECT count(*) FROM products WHERE tenant_id = '713913e6-0dad-4bce-9d62-39330a82368e';
