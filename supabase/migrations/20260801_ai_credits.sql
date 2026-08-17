-- ═══════════════════════════════════════════════════════════════════
--  JetPos AI KREDİ SİSTEMİ
--  Amaç: OpenRouter anahtarı JetPos'ta (server-only) gizli kalsın; her
--  işletmeye GÜNLÜK AI limiti + satın alınabilen EKSTRA kredi tanımlansın.
--  SüperAdmin panelinden yönetilir; route'lar her analizden önce kredi tüketir.
--  Manuel uygulanır: Supabase Dashboard > SQL Editor.
-- ═══════════════════════════════════════════════════════════════════

-- 1) İşletme başına AI ayarları
CREATE TABLE IF NOT EXISTS public.ai_settings (
    tenant_id uuid PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
    enabled boolean NOT NULL DEFAULT true,
    daily_limit integer NOT NULL DEFAULT 20,     -- her gün sıfırlanan hak
    extra_credits integer NOT NULL DEFAULT 0,    -- satın alınan, süresiz ek hak
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2) Günlük kullanım sayacı (gün TR saatiyle)
CREATE TABLE IF NOT EXISTS public.ai_daily_usage (
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    usage_date date NOT NULL,
    used integer NOT NULL DEFAULT 0,
    PRIMARY KEY (tenant_id, usage_date)
);
CREATE INDEX IF NOT EXISTS idx_ai_daily_usage_tenant ON public.ai_daily_usage(tenant_id, usage_date DESC);

ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_daily_usage ENABLE ROW LEVEL SECURITY;

-- Tenant yalnızca kendi kredisini OKUR; yazma yalnızca service role (route/superadmin).
DROP POLICY IF EXISTS ai_settings_tenant_read ON public.ai_settings;
CREATE POLICY ai_settings_tenant_read ON public.ai_settings
    FOR SELECT USING (tenant_id::text = current_setting('app.current_tenant_id', true));
DROP POLICY IF EXISTS ai_daily_usage_tenant_read ON public.ai_daily_usage;
CREATE POLICY ai_daily_usage_tenant_read ON public.ai_daily_usage
    FOR SELECT USING (tenant_id::text = current_setting('app.current_tenant_id', true));

-- ── Bugünü TR saatine göre ver ──
CREATE OR REPLACE FUNCTION public._ai_today() RETURNS date
LANGUAGE sql STABLE AS $$ SELECT (now() AT TIME ZONE 'Europe/Istanbul')::date $$;

-- ── Kredi TÜKET (atomik). Sıra: önce günlük, biterse ekstra. ──
CREATE OR REPLACE FUNCTION public.consume_ai_credit(p_tenant uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE s public.ai_settings; d integer; t date := public._ai_today();
BEGIN
    SELECT * INTO s FROM public.ai_settings WHERE tenant_id = p_tenant;
    IF NOT FOUND THEN
        INSERT INTO public.ai_settings(tenant_id) VALUES (p_tenant)
        ON CONFLICT (tenant_id) DO NOTHING;
        SELECT * INTO s FROM public.ai_settings WHERE tenant_id = p_tenant;
    END IF;

    IF NOT s.enabled THEN
        RETURN jsonb_build_object('allowed', false, 'reason', 'disabled');
    END IF;

    INSERT INTO public.ai_daily_usage(tenant_id, usage_date, used) VALUES (p_tenant, t, 0)
    ON CONFLICT (tenant_id, usage_date) DO NOTHING;

    SELECT used INTO d FROM public.ai_daily_usage WHERE tenant_id = p_tenant AND usage_date = t FOR UPDATE;

    IF d < s.daily_limit THEN
        UPDATE public.ai_daily_usage SET used = used + 1 WHERE tenant_id = p_tenant AND usage_date = t;
        RETURN jsonb_build_object('allowed', true, 'source', 'daily',
            'remaining_daily', s.daily_limit - (d + 1), 'extra_credits', s.extra_credits);
    ELSIF s.extra_credits > 0 THEN
        UPDATE public.ai_settings SET extra_credits = extra_credits - 1, updated_at = now() WHERE tenant_id = p_tenant;
        RETURN jsonb_build_object('allowed', true, 'source', 'extra',
            'remaining_daily', 0, 'extra_credits', s.extra_credits - 1);
    ELSE
        RETURN jsonb_build_object('allowed', false, 'reason', 'limit',
            'daily_limit', s.daily_limit, 'extra_credits', 0);
    END IF;
END;
$$;

-- ── Kredi İADE (AI altyapı hatasında: kredi tenant'ın suçu değil). ──
CREATE OR REPLACE FUNCTION public.refund_ai_credit(p_tenant uuid, p_source text DEFAULT 'daily')
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE t date := public._ai_today();
BEGIN
    IF p_source = 'extra' THEN
        UPDATE public.ai_settings SET extra_credits = extra_credits + 1, updated_at = now() WHERE tenant_id = p_tenant;
    ELSE
        UPDATE public.ai_daily_usage SET used = GREATEST(used - 1, 0) WHERE tenant_id = p_tenant AND usage_date = t;
    END IF;
END;
$$;

-- ── Durum (UI'da kalan hakkı göstermek için) ──
CREATE OR REPLACE FUNCTION public.ai_credit_status(p_tenant uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE s public.ai_settings; d integer := 0; t date := public._ai_today();
BEGIN
    SELECT * INTO s FROM public.ai_settings WHERE tenant_id = p_tenant;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('enabled', true, 'daily_limit', 20, 'used_today', 0, 'remaining_daily', 20, 'extra_credits', 0);
    END IF;
    SELECT used INTO d FROM public.ai_daily_usage WHERE tenant_id = p_tenant AND usage_date = t;
    d := COALESCE(d, 0);
    RETURN jsonb_build_object(
        'enabled', s.enabled, 'daily_limit', s.daily_limit, 'used_today', d,
        'remaining_daily', GREATEST(s.daily_limit - d, 0), 'extra_credits', s.extra_credits
    );
END;
$$;

COMMENT ON TABLE public.ai_settings IS 'İşletme başına AI: günlük limit + satın alınan ekstra kredi (OpenRouter anahtarı serverda gizli)';
