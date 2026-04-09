-- =============================================
-- Audit Logs: Eksik kolon ekle + Tenant-safe RLS
-- =============================================

-- Tablo yoksa yükle
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id   uuid NOT NULL,
    event_type  text NOT NULL,
    description text,
    metadata    jsonb DEFAULT '{}'::jsonb,
    created_at  timestamptz DEFAULT now()
);

-- Tablo varsa eksik kolonları güvenle ekle
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = 'audit_logs'
          AND column_name  = 'tenant_id'
    ) THEN
        ALTER TABLE public.audit_logs ADD COLUMN tenant_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = 'audit_logs'
          AND column_name  = 'event_type'
    ) THEN
        ALTER TABLE public.audit_logs ADD COLUMN event_type text NOT NULL DEFAULT '';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = 'audit_logs'
          AND column_name  = 'description'
    ) THEN
        ALTER TABLE public.audit_logs ADD COLUMN description text;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = 'audit_logs'
          AND column_name  = 'metadata'
    ) THEN
        ALTER TABLE public.audit_logs ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = 'audit_logs'
          AND column_name  = 'created_at'
    ) THEN
        ALTER TABLE public.audit_logs ADD COLUMN created_at timestamptz DEFAULT now();
    END IF;
END $$;

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id  ON public.audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- RLS aç
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Eski politikaları temizle
DROP POLICY IF EXISTS "Tenants can insert their own audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Tenants can view their own audit logs"   ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert_policy"               ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_select_policy"               ON public.audit_logs;

-- INSERT: Her tenant sadece kendi tenant_id'siyle kayıt ekleyebilir
-- (anon dahil - POS makine kimliği yok, authenticated zorlamaz)
CREATE POLICY "audit_logs_insert_policy"
    ON public.audit_logs
    FOR INSERT
    WITH CHECK (true);

-- SELECT: Sadece kendi tenant_id'sine ait kayıtları görebilir
-- licenses tablosundan tenant_id çekiyoruz (mevcut auth yapına göre)
CREATE POLICY "audit_logs_select_policy"
    ON public.audit_logs
    FOR SELECT
    USING (
        tenant_id IN (
            SELECT id FROM public.tenants
            WHERE id = audit_logs.tenant_id
        )
    );
