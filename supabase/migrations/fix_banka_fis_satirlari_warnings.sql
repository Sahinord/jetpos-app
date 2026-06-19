-- ==============================================================================
-- JETPOS GÜVENLİK VE PERFORMANS YAMASI (Eksik Kalan Eski Kurallar İçin)
-- ==============================================================================

-- BANKA FIS SATIRLARI (Eski ve yavaş kuralların silinmesi)
DROP POLICY IF EXISTS "banka_fis_satirlari_select" ON public.banka_fis_satirlari;
DROP POLICY IF EXISTS "banka_fis_satirlari_insert" ON public.banka_fis_satirlari;
DROP POLICY IF EXISTS "banka_fis_satirlari_update" ON public.banka_fis_satirlari;
DROP POLICY IF EXISTS "banka_fis_satirlari_delete" ON public.banka_fis_satirlari;

-- İşlem tamamlandı mesajı
SELECT 'Eski yavaş kurallar başarıyla temizlendi!' as sonuc;
