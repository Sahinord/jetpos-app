-- 🔥 NUCLEAR FIX V2 (Column Safe) 🔥
-- 'name' sütunu hatası alındığı için sadece ID ve License Key kullanıyoruz.

-- 1. CLEANUP
DROP FUNCTION IF EXISTS bulk_import_products(jsonb, uuid);

-- 2. CREATE BACKUP TENANT
-- Sadece en temel sütunları kullanıyoruz.
INSERT INTO tenants (id, license_key)
VALUES ('00000000-0000-0000-0000-000000000000', 'BACKUP-STORE')
ON CONFLICT (id) DO NOTHING;

-- 3. CREATE SUPER FUNCTION
CREATE OR REPLACE FUNCTION bulk_import_products(
    products_json jsonb, 
    target_tenant_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    item jsonb;
    success_count int := 0;
    fail_count int := 0;
    errors text := '';
    p_barcode text;
    final_tenant_id uuid;
BEGIN
    final_tenant_id := target_tenant_id;
    
    IF final_tenant_id IS NULL THEN
        final_tenant_id := '00000000-0000-0000-0000-000000000000';
    END IF;

    FOR item IN SELECT * FROM jsonb_array_elements(products_json)
    LOOP
        BEGIN
            p_barcode := COALESCE(item->>'barcode', 'NO-BARCODE-' || floor(random()*100000)::text);

            INSERT INTO products (
                tenant_id, barcode, name, purchase_price, sale_price, 
                stock_quantity, unit, vat_rate, status, is_campaign, image_url
            ) VALUES (
                final_tenant_id,
                p_barcode,
                item->>'name',
                COALESCE((item->>'purchase_price')::numeric, 0),
                COALESCE((item->>'sale_price')::numeric, 0),
                COALESCE((item->>'stock_quantity')::numeric, 0),
                COALESCE(item->>'unit', 'Adet'),
                COALESCE((item->>'vat_rate')::numeric, 18),
                COALESCE(item->>'status', 'active'),
                COALESCE((item->>'is_campaign')::boolean, false),
                COALESCE(item->>'image_url', '')
            )
            ON CONFLICT (barcode) DO UPDATE SET
                name = EXCLUDED.name,
                purchase_price = EXCLUDED.purchase_price,
                sale_price = EXCLUDED.sale_price,
                stock_quantity = EXCLUDED.stock_quantity,
                status = EXCLUDED.status,
                updated_at = now();
                
            success_count := success_count + 1;
        EXCEPTION WHEN OTHERS THEN
            fail_count := fail_count + 1;
            IF fail_count <= 1 THEN errors := SQLERRM; END IF;
        END;
    END LOOP;

    RETURN json_build_object(
        'success', true,
        'processed', success_count,
        'failed', fail_count,
        'errors', errors
    );
END;
$$;
