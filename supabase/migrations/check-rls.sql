-- Ürünlerin RLS politikasını kontrol et
SELECT 
    schemaname, tablename, policyname, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'products';
