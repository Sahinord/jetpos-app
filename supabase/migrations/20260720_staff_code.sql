-- ═══════════════════════════════════════════════════════════════════
--  İŞLETME KODU (Staff Code) — lisanssız personel girişi
--  Manuel uygulanır: Supabase Dashboard > SQL Editor
--
--  SORUN: Personel (garson/mutfak) gizli lisans anahtarını girmemeli, ama
--  cihaz hangi işletme olduğunu bilmeli. ÇÖZÜM: lisanstan AYRI, kısa,
--  paylaşılabilir, iptal edilebilir bir "İşletme Kodu".
--
--  Personel cihazı bu kodla işletmeye BİR KEZ bağlanır (device provisioning);
--  sonra sadece PIN girer. Kod sızarsa patron yeniler (regenerate).
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS staff_code TEXT;

-- Benzersizlik (boş olmayanlar için)
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_staff_code
    ON tenants (staff_code) WHERE staff_code IS NOT NULL;

-- Kısa okunabilir kod üret (karışabilen harfler hariç: I,O,0,1)
CREATE OR REPLACE FUNCTION gen_staff_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    code TEXT;
    i INT;
    exists_count INT;
BEGIN
    LOOP
        code := '';
        FOR i IN 1..6 LOOP
            code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
        END LOOP;
        SELECT count(*) INTO exists_count FROM tenants WHERE staff_code = code;
        EXIT WHEN exists_count = 0;
    END LOOP;
    RETURN code;
END;
$$;

-- Mevcut tüm işletmelere kod ata (boş olanlara)
UPDATE tenants SET staff_code = gen_staff_code() WHERE staff_code IS NULL;

-- Patron panelinden kodu yenilemek için (SECURITY DEFINER; çağıran tenant doğrulanır route'ta)
CREATE OR REPLACE FUNCTION regenerate_staff_code(p_tenant_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_code TEXT;
BEGIN
    new_code := gen_staff_code();
    UPDATE tenants SET staff_code = new_code WHERE id = p_tenant_id;
    RETURN new_code;
END;
$$;

-- İşletme kodundan tenant çöz (personel girişinde; lisans DÖNMEZ).
-- Yalnızca minimal, ELE VERMESİ ZARARSIZ alanlar döner.
CREATE OR REPLACE FUNCTION get_tenant_by_staff_code(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v RECORD;
BEGIN
    SELECT id, company_name, features INTO v
    FROM tenants
    WHERE staff_code = upper(trim(p_code)) AND status = 'active'
    LIMIT 1;

    IF v.id IS NULL THEN
        RETURN jsonb_build_object('success', false);
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'tenant_id', v.id,
        'company_name', v.company_name,
        'features', v.features
    );
END;
$$;

-- Personel girişi sunucu ucundan (service-role) çağrılır; yine de anon'a
-- vermiyoruz — böylece kod tarama saldırısı da sunucu hız sınırına takılır.
REVOKE EXECUTE ON FUNCTION get_tenant_by_staff_code(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION get_tenant_by_staff_code(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION regenerate_staff_code(UUID) TO service_role;

NOTIFY pgrst, 'reload schema';
