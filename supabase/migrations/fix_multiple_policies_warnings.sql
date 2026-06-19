-- ==============================================================================
-- JETPOS GÜVENLİK VE PERFORMANS YAMASI (Çift Kural Temizleyici)
-- ==============================================================================
-- Uyarı: "multiple permissive policies for role..." 
-- Supabase, tabloda birden fazla kural olduğunu (eski kuralların silinmediğini) söylüyor.
-- Yeni "Tenant Isolation Policy" kuralımız (FOR ALL) olduğu için eski 
-- (select, insert, update, delete) kurallarına gerek yok. Onları siliyoruz:

-- 1. BANKA FISLERI
DROP POLICY IF EXISTS "banka_fisleri_select" ON public.banka_fisleri;
DROP POLICY IF EXISTS "banka_fisleri_insert" ON public.banka_fisleri;
DROP POLICY IF EXISTS "banka_fisleri_update" ON public.banka_fisleri;
DROP POLICY IF EXISTS "banka_fisleri_delete" ON public.banka_fisleri;

-- 2. BANKA FIS SATIRLARI
DROP POLICY IF EXISTS "banka_fis_satirlari_select" ON public.banka_fis_satirlari;
DROP POLICY IF EXISTS "banka_fis_satirlari_insert" ON public.banka_fis_satirlari;
DROP POLICY IF EXISTS "banka_fis_satirlari_update" ON public.banka_fis_satirlari;
DROP POLICY IF EXISTS "banka_fis_satirlari_delete" ON public.banka_fis_satirlari;

-- 3. KASA FISLERI
DROP POLICY IF EXISTS "kasa_fisleri_select" ON public.kasa_fisleri;
DROP POLICY IF EXISTS "kasa_fisleri_insert" ON public.kasa_fisleri;
DROP POLICY IF EXISTS "kasa_fisleri_update" ON public.kasa_fisleri;
DROP POLICY IF EXISTS "kasa_fisleri_delete" ON public.kasa_fisleri;

-- 4. KASA FIS SATIRLARI
DROP POLICY IF EXISTS "kasa_fis_satirlari_select" ON public.kasa_fis_satirlari;
DROP POLICY IF EXISTS "kasa_fis_satirlari_insert" ON public.kasa_fis_satirlari;
DROP POLICY IF EXISTS "kasa_fis_satirlari_update" ON public.kasa_fis_satirlari;
DROP POLICY IF EXISTS "kasa_fis_satirlari_delete" ON public.kasa_fis_satirlari;

-- 5. KASA TANIMLARI
DROP POLICY IF EXISTS "kasa_tanimlari_select" ON public.kasa_tanimlari;
DROP POLICY IF EXISTS "kasa_tanimlari_insert" ON public.kasa_tanimlari;
DROP POLICY IF EXISTS "kasa_tanimlari_update" ON public.kasa_tanimlari;
DROP POLICY IF EXISTS "kasa_tanimlari_delete" ON public.kasa_tanimlari;

-- 6. ODALAR
DROP POLICY IF EXISTS "odalar_select" ON public.odalar;
DROP POLICY IF EXISTS "odalar_insert" ON public.odalar;
DROP POLICY IF EXISTS "odalar_update" ON public.odalar;
DROP POLICY IF EXISTS "odalar_delete" ON public.odalar;

-- İşlem tamamlandı mesajı
SELECT 'Tüm çakışan (fazlalık) kurallar başarıyla temizlendi!' as sonuc;
