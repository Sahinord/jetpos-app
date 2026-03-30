-- QR Menü Logo ve Görsel Depolama Alanı Kurulumu

-- 1. Bucket oluştur (Eğer daha önce manuel oluşturmadıysan)
-- Not: Bu işlem SQL panelinde yetki hatası verebilir, 
-- Eğer hata verirse Supabase Dashboard -> Storage üzerinden "qr-content" isminde PUBLIC bir bucket açman yeterli.
INSERT INTO storage.buckets (id, name, public) 
VALUES ('qr-content', 'qr-content', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Herkesin dosyaları okuyabilmesi için politika (SELECT)
CREATE POLICY "Herkes Logoları Görebilir"
ON storage.objects FOR SELECT
USING (bucket_id = 'qr-content');

-- 3. Sadece giriş yapmış kullanıcıların dosya yükleyebilmesi için politika (INSERT)
CREATE POLICY "Giriş Yapanlar Logo Yükleyebilir"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'qr-content' AND auth.role() = 'authenticated');

-- 4. Dosyaları güncelleme ve silme yetkisi (UPDATE/DELETE)
CREATE POLICY "Giriş Yapanlar Logoları Düzenleyebilir"
ON storage.objects FOR UPDATE
USING (bucket_id = 'qr-content' AND auth.role() = 'authenticated');

CREATE POLICY "Giriş Yapanlar Logoları Silebilir"
ON storage.objects FOR DELETE
USING (bucket_id = 'qr-content' AND auth.role() = 'authenticated');
