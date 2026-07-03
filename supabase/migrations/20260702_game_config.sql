-- "Sepete Yakala" oyun ayarları (jetpos-web admin panelinden yönetilir)
-- Manuel uygulanır: Supabase Dashboard > SQL Editor
-- Tek satırlık tablo: config jsonb, boş {} ise koddaki varsayılanlar geçerli.

CREATE TABLE IF NOT EXISTS public.game_config (
    id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    config jsonb NOT NULL DEFAULT '{}'::jsonb,
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Sadece service role erişir (public API + admin API server tarafında okur/yazar)
ALTER TABLE public.game_config ENABLE ROW LEVEL SECURITY;

INSERT INTO public.game_config (id, config)
VALUES (1, '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE public.game_config IS 'Sepete Yakala oyunu ayarları — jetpos-web/src/lib/game-config.ts ile birleştirilir';
