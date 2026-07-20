-- ═══════════════════════════════════════════════════════════════════
--  LİSANS GİRİŞİ KABA KUVVET KORUMASI — deneme kayıt tablosu
--  Manuel uygulanır: Supabase Dashboard > SQL Editor
--
--  SORUN: find_tenant_by_license RPC'si tarayıcıdan sınırsız çağrılabiliyordu;
--  saniyede yüzlerce lisans anahtarı denenebilirdi (bkz. YONETICI_GUVENLIK_PLANI.md K2).
--  ÇÖZÜM: Giriş artık /api/auth/license route'undan geçiyor; bu tablo IP başına
--  başarısız denemeleri sayar. Sunucusuz (serverless) ortamda bellek içi sayaç
--  instance'lar arasında paylaşılmadığı için kalıcı sayaç DB'de tutulur.
--
--  Politika (route içinde uygulanır):
--   • 60 saniyede 5+ başarısız deneme  → 1 dk bekletme
--   • 24 saatte 20+ başarısız deneme   → 24 saat blok
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.login_attempts (
    id bigserial PRIMARY KEY,
    ip text NOT NULL,
    -- Denenen anahtarın SADECE ilk 4 karakteri (teşhis için). Tamamı ASLA yazılmaz.
    key_hint text,
    success boolean NOT NULL DEFAULT false,
    attempted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_time
    ON public.login_attempts (ip, attempted_at DESC);

-- RLS: aç ama HİÇ politika tanımlama → yalnızca service-role erişebilir.
-- (Tarayıcıdan/anon'dan bu tablo ne okunabilir ne yazılabilir.)
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.login_attempts IS
    'Lisans girişi deneme kaydı (IP bazlı hız sınırı). Yalnızca service-role erişir. 30 günden eski satırlar rotasyonla silinebilir.';

-- İsteğe bağlı temizlik (ara sıra elle çalıştırılabilir):
-- DELETE FROM public.login_attempts WHERE attempted_at < now() - interval '30 days';
