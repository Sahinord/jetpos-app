-- ===========================================
-- ÖNCE TABLOLARI KONTROL ET
-- ===========================================

-- Bu sorguyu çalıştır ve sonucu gör:
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE table_name LIKE 'cari_%' 
ORDER BY table_name, ordinal_position;

-- Eğer boş dönerse, tablolar oluşmamış demektir
