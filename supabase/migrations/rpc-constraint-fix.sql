-- 🔥 UNIQUE CONSTRAINT FIX 🔥
-- 'barcode' sütunu üzerinde benzersizlik (unique) kısıtlaması olmadığı için ON CONFLICT çalışmıyordu.
-- Bu kod önce constraint ekler, sonra import fonksiyonunu günceller.
-- Lütfen bunu Supabase SQL Editor'de çalıştırın.

-- 1. BARKOD UNIQUE CONSTRAINT EKLEME (Eğer yoksa)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'products_barcode_key'
    ) THEN
        -- Önce aynı barkoda sahip mükerrer kayıtları temizle (Son ekleneni tut)
        DELETE FROM products a USING products b
        WHERE a.id < b.id AND a.barcode = b.barcode;
        
        -- Constraint ekle
        ALTER TABLE products ADD CONSTRAINT products_barcode_key UNIQUE (barcode);
    END IF;
END $$;

-- 2. IMPORT FONKSİYONU (Aynı, sadece temiz kurulum için tekrar)
DROP FUNCTION IF EXISTS bulk_import_products(jsonb, uuid);

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
    first_error text := NULL;
    debug_info text := '';
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
            p_barcode := COALESCE(item->>'barcode', 'NO-BARCODE-' || floor(random()*10000000)::text);

            INSERT INTO products (
                tenant_id, 
                barcode, 
                name, 
                purchase_price, 
                sale_price, 
                stock_quantity, 
                unit, 
                vat_rate, 
                status, 
                is_campaign, 
                image_url
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
            IF first_error IS NULL THEN
                first_error := SQLERRM || ' [Code: ' || SQLSTATE || ']';
            END IF;
        END;
    END LOOP;

    RETURN json_build_object(
        'success', success_count > 0,
        'processed', success_count,
        'failed', fail_count,
        'errors', COALESCE(first_error, 'No Error')
    );
END;
$$;
