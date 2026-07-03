-- jetpos-web admin paneli: ekip üyeleri + oturumlar
-- Manuel uygulanır: Supabase Dashboard > SQL Editor
-- Süper admin (ADMIN_SECRET_TOKEN) bu tablolardan bağımsız çalışmaya devam eder.

CREATE TABLE IF NOT EXISTS public.admin_users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    username text NOT NULL UNIQUE,
    name text NOT NULL DEFAULT '',
    password_hash text NOT NULL,             -- scrypt "salt:hash"
    role text NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
    permissions jsonb NOT NULL DEFAULT '{}'::jsonb, -- staff için bölüm izinleri (örn. {"requests": true})
    allowed_ips text[] NOT NULL DEFAULT '{}',        -- boş = her yerden; dolu = sadece bu IP'lerden ("85.100.1.20" veya "85.100.*")
    active boolean NOT NULL DEFAULT true,
    last_login_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Tablo daha önce oluşturulduysa IP kolonunu sonradan ekle (idempotent)
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS allowed_ips text[] NOT NULL DEFAULT '{}';

CREATE TABLE IF NOT EXISTS public.admin_sessions (
    token text PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.admin_users(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_user ON public.admin_sessions(user_id);

-- Yalnızca service role erişir (tüm okuma/yazma server-side API üzerinden)
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.admin_users IS 'jetpos-web admin paneli ekip üyeleri (owner = ADMIN_SECRET_TOKEN, bu tabloda tutulmaz)';
COMMENT ON COLUMN public.admin_users.permissions IS 'staff rolü için bölüm izinleri: orders, requests, early_access, licenses, crm, tickets, announcements, blog, guides, about, game';
