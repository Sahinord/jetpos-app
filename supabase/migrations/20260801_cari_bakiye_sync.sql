-- ═══════════════════════════════════════════════════════════════════
--  Cari bakiye/toplam senkronu — cari_hesaplar toplamları cari_hareketler'den
--  otomatik hesaplansın.
--
--  SORUN: Hızlı satış veresiyesi (ve bazı akışlar) yalnızca cari_hareketler'e
--  yazıyordu; cari_hesaplar.borc_toplami/alacak_toplami/bakiye GÜNCELLENMİYORDU
--  ve bunları tutan bir trigger yoktu. Sonuç: liste (kayıtlı bakiye) ile hareket
--  bakiyesi (canlı) uyuşmuyor; "Alacak cari ama Verecek bakiye" gibi ters işaret.
--
--  KONVANSİYON (uygulamanın her yerinde aynı):
--    borc_toplami   = Σ borç
--    alacak_toplami = Σ alacak
--    bakiye         = Σ borç − Σ alacak      (>0 = cari SİZE borçlu = "Alacak")
--
--  Manuel uygulanır: Supabase Dashboard > SQL Editor.
-- ═══════════════════════════════════════════════════════════════════

-- Tek bir cari için toplamları yeniden hesapla
CREATE OR REPLACE FUNCTION public.recalc_cari_totals(p_cari_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_borc   numeric(15,2);
    v_alacak numeric(15,2);
BEGIN
    IF p_cari_id IS NULL THEN RETURN; END IF;
    SELECT COALESCE(SUM(borc), 0), COALESCE(SUM(alacak), 0)
      INTO v_borc, v_alacak
      FROM public.cari_hareketler
     WHERE cari_id = p_cari_id;

    UPDATE public.cari_hesaplar
       SET borc_toplami   = v_borc,
           alacak_toplami = v_alacak,
           bakiye         = v_borc - v_alacak,
           updated_at     = NOW()
     WHERE id = p_cari_id;
END;
$$;

-- Trigger fonksiyonu: hareket ek/güncelle/sil → ilgili cari(ler)i tazele
CREATE OR REPLACE FUNCTION public.trg_cari_hareket_recalc()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        PERFORM public.recalc_cari_totals(NEW.cari_id);
    ELSIF (TG_OP = 'DELETE') THEN
        PERFORM public.recalc_cari_totals(OLD.cari_id);
    ELSIF (TG_OP = 'UPDATE') THEN
        PERFORM public.recalc_cari_totals(NEW.cari_id);
        IF NEW.cari_id IS DISTINCT FROM OLD.cari_id THEN
            PERFORM public.recalc_cari_totals(OLD.cari_id);
        END IF;
    END IF;
    RETURN NULL; -- AFTER trigger
END;
$$;

DROP TRIGGER IF EXISTS cari_hareket_recalc ON public.cari_hareketler;
CREATE TRIGGER cari_hareket_recalc
    AFTER INSERT OR UPDATE OR DELETE ON public.cari_hareketler
    FOR EACH ROW
    EXECUTE FUNCTION public.trg_cari_hareket_recalc();

-- ── BACKFILL: mevcut tüm cariler için toplamları hareketlerden yeniden yaz ──
-- (Ters işaret / bayat değer sorunlarını temizler.)
UPDATE public.cari_hesaplar h
   SET borc_toplami   = t.borc,
       alacak_toplami = t.alacak,
       bakiye         = t.borc - t.alacak,
       updated_at     = NOW()
  FROM (
        SELECT c.id AS cari_id,
               COALESCE(SUM(hr.borc), 0)   AS borc,
               COALESCE(SUM(hr.alacak), 0) AS alacak
          FROM public.cari_hesaplar c
          LEFT JOIN public.cari_hareketler hr ON hr.cari_id = c.id
         GROUP BY c.id
       ) t
 WHERE h.id = t.cari_id;

COMMENT ON FUNCTION public.recalc_cari_totals(uuid) IS 'cari_hesaplar toplam/bakiye = cari_hareketler Σborç/Σalacak/Σ(borç-alacak)';
