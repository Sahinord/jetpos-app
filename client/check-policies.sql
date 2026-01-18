-- 🔍 MEVCUT POLİTİKALARI KONTROL ETME SCRİPTİ 🔍
-- products tablosundaki tüm aktif güvenlik politikalarını listeler.

SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM
    pg_policies
WHERE
    tablename = 'products';
