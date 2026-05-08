-- 🚀 JET HIZINDA VE GÜVENLİ TOPLU YÜKLEME - FINAL FIX 🚀
-- FIX: ON CONFLICT (barcode) → ON CONFLICT (tenant_id, barcode)
-- Çünkü veritabanındaki unique constraint: products_tenant_barcode_unique (tenant_id, barcode)
-- external_price kolonu eklendi (20260422 migration'ından sonra eklenmişti)

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

    -- Güvenlik: tenant_id boş gelirse işlem yapma
    IF final_tenant_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'processed', 0,
            'failed', 0,
            'errors', 'HATA: tenant_id boş gelemez!'
        );
    END IF;

    -- Gelen JSON dizisini tek tek dön
    FOR item IN SELECT * FROM jsonb_array_elements(products_json)
    LOOP
        BEGIN
            p_barcode := COALESCE(
                NULLIF(TRIM(item->>'barcode'), ''),
                'AUTO-' || extract(epoch from now())::bigint::text || '-' || floor(random()*10000000)::text
            );

            -- UPSERT: Varsa (aynı tenant + barkod) güncelle, yoksa ekle
            -- ✅ FIX: ON CONFLICT (tenant_id, barcode) - composite constraint
            INSERT INTO products (
                tenant_id,
                barcode,
                name,
                purchase_price,
                sale_price,
                external_price,
                stock_quantity,
                unit,
                vat_rate,
                status,
                is_campaign,
                image_url
            ) VALUES (
                final_tenant_id,
                p_barcode,
                COALESCE(NULLIF(TRIM(item->>'name'), ''), 'İsimsiz Ürün'),
                COALESCE((item->>'purchase_price')::numeric, 0),
                COALESCE((item->>'sale_price')::numeric, 0),
                COALESCE((item->>'external_price')::numeric, 0),
                COALESCE((item->>'stock_quantity')::numeric, 0),
                COALESCE(NULLIF(TRIM(item->>'unit'), ''), 'Adet'),
                COALESCE((item->>'vat_rate')::numeric, 1),
                COALESCE(NULLIF(TRIM(item->>'status'), ''), 'active'),
                COALESCE((item->>'is_campaign')::boolean, false),
                COALESCE(item->>'image_url', '')
            )
            ON CONFLICT (tenant_id, barcode) DO UPDATE SET
                name            = EXCLUDED.name,
                purchase_price  = EXCLUDED.purchase_price,
                sale_price      = EXCLUDED.sale_price,
                external_price  = EXCLUDED.external_price,
                stock_quantity  = EXCLUDED.stock_quantity,
                unit            = EXCLUDED.unit,
                vat_rate        = EXCLUDED.vat_rate,
                status          = EXCLUDED.status,
                image_url       = EXCLUDED.image_url,
                updated_at      = now();

            success_count := success_count + 1;

        EXCEPTION WHEN OTHERS THEN
            fail_count := fail_count + 1;
            -- İlk 10 hatayı raporla (çok uzamasın)
            IF fail_count <= 10 THEN
                errors := errors || 'Hata (' || COALESCE(p_barcode, '?') || '): ' || SQLERRM || ' [' || SQLSTATE || ']; ';
            END IF;
        END;
    END LOOP;

    RETURN json_build_object(
        'success', success_count > 0,
        'processed', success_count,
        'failed', fail_count,
        'errors', CASE WHEN errors = '' THEN 'No Error' ELSE errors END
    );
END;
$$;
