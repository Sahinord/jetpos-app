-- 20260308_fix_integration_settings_schema.sql
-- Bu migration, mevcut 'integration_settings' tablosuna eksik kolonları güvenli bir şekilde ekler.
-- Hem eski 'type' yapısını hem de yeni 'platform' yapısını uyumlu hale getirir.

DO $$ 
BEGIN
    -- 1. platform kolonu ekle (eğer yoksa)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'integration_settings' AND column_name = 'platform') THEN
        ALTER TABLE integration_settings ADD COLUMN platform TEXT;
    END IF;

    -- 2. mode kolonu ekle (eğer yoksa)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'integration_settings' AND column_name = 'mode') THEN
        ALTER TABLE integration_settings ADD COLUMN mode TEXT DEFAULT 'test' CHECK (mode IN ('test', 'live'));
    END IF;

    -- 3. api_config kolonu ekle (eğer yoksa)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'integration_settings' AND column_name = 'api_config') THEN
        ALTER TABLE integration_settings ADD COLUMN api_config JSONB DEFAULT '{}'::jsonb;
    END IF;

    -- 4. Eski verileri taşı (Migrate)
    -- Eğer type 'trendyol_go' ise platform 'trendyol' olsun.
    -- Eğer type 'qnb_invoice' ise platform 'qnb' olsun.
    UPDATE integration_settings SET platform = 'trendyol' WHERE type = 'trendyol_go' AND platform IS NULL;
    UPDATE integration_settings SET platform = 'qnb' WHERE type = 'qnb_invoice' AND platform IS NULL;
    UPDATE integration_settings SET platform = type WHERE platform IS NULL; -- Fallback

    -- 5. API Config senkr (Eğer Trendyol için settings dolu ama api_config boşsa)
    UPDATE integration_settings 
    SET api_config = settings 
    WHERE platform = 'trendyol' AND (api_config = '{}'::jsonb OR api_config IS NULL) AND settings IS NOT NULL AND settings != '{}'::jsonb;

END $$;

-- RLS politikalarını güncelle (daha genel bir yetki için)
DROP POLICY IF EXISTS "Tenants can manage their own integration settings" ON integration_settings;
CREATE POLICY "Tenants can manage their own integration settings"
    ON integration_settings
    FOR ALL
    USING (tenant_id::text = auth.jwt() ->> 'tenant_id' OR tenant_id = get_current_tenant_id());
