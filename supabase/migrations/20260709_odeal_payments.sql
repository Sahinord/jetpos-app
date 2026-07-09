-- ═══════════════════════════════════════════════════════════════════
--  Ödeal A910S (Fiziki POS / Device2Device) ödeme entegrasyonu
--  Manuel uygulanır: Supabase Dashboard > SQL Editor
--
--  Mimari (D2D):
--   1. JetPos "Sepet Aktar" (POST /basket) ile sepeti Ödeal'e gönderir
--      (referenceCode + externalDeviceKey + tutar). Cihaz otomatik uyanır.
--   2. Müşteri kartla öder; Ödeal e-fatura keser.
--   3. Ödeal, JetPos'un callback URL'lerine webhook atar
--      (payment-succeeded / cancelled / failed / e-invoice).
--   4. Webhook geldiğinde bu tabloya işlenir.
--
--  Kimlik: her istek X-ODEAL-MERCHANT-KEY (publicKey) + X-ODEAL-SECRET-KEY.
--  Per-tenant kimlik bilgileri tenants.settings->'odeal' altında (SuperAdmin).
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.odeal_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    -- JetPos'un ürettiği benzersiz sepet referansı (idempotency + webhook eşleşmesi)
    reference_code text NOT NULL,
    status text NOT NULL DEFAULT 'pending',  -- pending | succeeded | failed | cancelled
    amount numeric(12,2),
    -- Ödeal ödeme sonucu alanları (payment-succeeded webhook'undan)
    payment_ref_code text,
    payment_method text,                     -- Kredi/Banka Kartı, Nakit, BKM, ...
    installment integer,
    bank_code text,
    auth_code text,
    terminal_serial text,
    -- E-fatura bilgisi (e-invoice-created webhook'undan)
    einvoice_no text,
    einvoice_url text,
    -- Ham veriler
    basket jsonb,          -- JetPos'un gönderdiği sepet
    result jsonb,          -- gelen webhook payload'ı
    sale_id uuid,          -- ilişkili JetPos satışı (varsa)
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT odeal_tx_unique UNIQUE (tenant_id, reference_code)
);
CREATE INDEX IF NOT EXISTS idx_odeal_tx_tenant ON public.odeal_transactions(tenant_id, created_at DESC);

ALTER TABLE public.odeal_transactions ENABLE ROW LEVEL SECURITY;

-- Tenant yalnızca kendi işlemlerini okur (app.current_tenant_id — projedeki standart)
DROP POLICY IF EXISTS odeal_tx_tenant_select ON public.odeal_transactions;
CREATE POLICY odeal_tx_tenant_select ON public.odeal_transactions
    FOR SELECT
    USING (tenant_id::text = current_setting('app.current_tenant_id', true));

COMMENT ON TABLE public.odeal_transactions IS 'Ödeal D2D ödeme işlemleri; (tenant_id, reference_code) tekil = idempotency';
