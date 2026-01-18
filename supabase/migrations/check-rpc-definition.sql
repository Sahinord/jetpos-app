-- set_current_tenant fonksiyonunun varlığını ve içeriğini kontrol et
SELECT 
    n.nspname as schema,
    p.proname as name,
    pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'set_current_tenant';
