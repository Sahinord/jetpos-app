-- KVKK: demo taleplerinde aydınlatma onayı ve ticari ileti izninin ispatı için
-- Manuel uygulanır: Supabase Dashboard > SQL Editor
-- (jetpos-web /api/demo-request bu kolonlara yazar; migration uygulanmadan
--  insert hata verir, istek e-posta bildirimiyle devam eder)

ALTER TABLE public.demo_requests
    ADD COLUMN IF NOT EXISTS kvkk_acknowledged boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS marketing_consent boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS consent_at timestamptz,
    ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'demo-form';

COMMENT ON COLUMN public.demo_requests.source IS 'Talebin geldiği kanal: demo-form | popup';

COMMENT ON COLUMN public.demo_requests.kvkk_acknowledged IS 'Gizlilik & KVKK Politikası (aydınlatma metni) okundu onayı';
COMMENT ON COLUMN public.demo_requests.marketing_consent IS 'Ticari elektronik ileti izni (6563 sayılı Kanun / İYS)';
COMMENT ON COLUMN public.demo_requests.consent_at IS 'Onayın alındığı zaman damgası';
