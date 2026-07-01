-- Hepsiburada Sipariş Webhook Modeli: Hepsiburada'nın bizim hostladığımız
-- /api/hepsiburada/webhook/* uçlarına push ettiği ham olayların kaydı.
-- Idempotency dokümanın kendisi tarafından istenmiş (aynı event tekrar
-- gelirse aynı sonucu üretmeli) — bu yüzden (tenant_id, event_type,
-- external_id) üzerinde unique constraint + upsert kullanılıyor.

CREATE TABLE IF NOT EXISTS hepsiburada_webhook_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL,
    event_type text NOT NULL CHECK (event_type IN (
        'order', 'package', 'cancel', 'unpack', 'deliver', 'intransit', 'shipping_address'
    )),
    merchant_id text,
    external_id text NOT NULL, -- orderNumber / packageNumber / lineitemid (event tipine göre)
    payload jsonb NOT NULL,
    processed boolean NOT NULL DEFAULT false,
    received_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, event_type, external_id)
);

CREATE INDEX IF NOT EXISTS idx_hb_webhook_events_tenant ON hepsiburada_webhook_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_hb_webhook_events_unprocessed ON hepsiburada_webhook_events(processed) WHERE processed = false;

ALTER TABLE hepsiburada_webhook_events ENABLE ROW LEVEL SECURITY;

-- Sadece service-role yazar (webhook route'u service-role client kullanıyor,
-- RLS'i zaten bypass eder). Tenant kendi olaylarını görebilsin diye SELECT
-- politikası ekleniyor (ileride bir "gelen siparişler" ekranı için).
CREATE POLICY hb_webhook_events_tenant_select ON hepsiburada_webhook_events
    FOR SELECT
    USING (tenant_id::text = current_setting('app.current_tenant_id', true));
