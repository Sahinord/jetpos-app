-- ═══════════════════════════════════════════════════════════════════
--  SÜPER YÖNETİCİ LİSANS ANAHTARINI DEĞİŞTİR (ZORUNLU)
--  Manuel uygulanır: Supabase Dashboard > SQL Editor
--
--  NEDEN ZORUNLU:
--  Eski anahtar 'ADM257SA67' uzun süre istemci JavaScript paketinin içinde
--  açık metin olarak yayınlandı (page.tsx / TopBar.tsx / SuperAdmin.tsx).
--  Uygulamayı açan herkes tarayıcı geliştirici araçlarından bu anahtarı
--  okuyabilir, lisans ekranına yazıp TÜM işletmelerin verisine süper
--  yönetici olarak erişebilirdi.
--
--  Anahtar koddan kaldırıldı, ancak DAHA ÖNCE YAYINLANDIĞI İÇİN
--  ELE GEÇMİŞ SAYILMALI. Mutlaka değiştirilmeli.
--
--  KULLANIM:
--   1. Aşağıdaki 'YENI_ANAHTARI_BURAYA_YAZ' yerine uzun, rastgele bir değer
--      yaz. Öneri: en az 24 karakter, harf+rakam karışık.
--      Örnek üretme yolu (terminalde):  openssl rand -hex 16
--   2. Bu dosyayı SQL Editor'de çalıştır.
--   3. Yeni anahtarı bir parola yöneticisine kaydet. Koda YAZMA.
--   4. admin.jetpos.shop adresinden yeni anahtarla giriş yap.
-- ═══════════════════════════════════════════════════════════════════

-- Güvenlik ağı: is_super_admin kolonu yoksa oluştur
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false;

-- Süper yönetici kaydının anahtarını değiştir
UPDATE tenants
SET license_key = 'YENI_ANAHTARI_BURAYA_YAZ'
WHERE is_super_admin = true;

-- Doğrula: tek satır dönmeli ve is_super_admin = true olmalı
SELECT id, company_name, license_key, is_super_admin, status
FROM tenants
WHERE is_super_admin = true;

-- ── NOT ──
-- Sunucu tarafındaki kısa devre kontrolü (client/src/lib/server-tenant-auth.ts)
-- hâlâ eski anahtarı sabit tutuyor. O dosya tarayıcıya GİTMEZ (yalnızca API
-- route'larından import edilir), bu yüzden sızıntı riski yoktur; ancak anahtar
-- değişince orayı da güncellemek ya da ADMIN_SECRET_TOKEN ortam değişkenine
-- taşımak gerekir. Aksi halde süper yönetici API kısa devresi çalışmaz.
