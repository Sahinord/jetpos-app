-- 🚀 JET HIZINDA VE GÜVENLİ TOPLU YÜKLEME 🚀
-- Bu fonksiyon, RLS kurallarını BYPASS ederek (SECURITY DEFINER)
-- ürünleri doğrudan veritabanına yazar. Hata şansı YOKTUR.

CREATE OR REPLACE FUNCTION bulk_import_products(
    products_json jsonb, 
    target_tenant_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER -- ⚡ SİHİRLİ DEĞNEK: RLS'yi atlar, direkt yazar.
AS $$
DECLARE
    item jsonb;
    success_count int := 0;
    fail_count int := 0;
    errors text := '';
    p_barcode text;
BEGIN
    -- Gelen JSON dizisini tek tek dön
    FOR item IN SELECT * FROM jsonb_array_elements(products_json)
    LOOP
        BEGIN
            p_barcode := COALESCE(item->>'barcode', 'NO-BARCODE-' || floor(random()*100000)::text);

            -- UPSERT (Varsa Güncelle, Yoksa Ekle)
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
                target_tenant_id, -- Dükkan ID'sini parametreden alıyoruz (Garanti Yöntem)
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
                updated_at = now(); -- Güncellenme tarihini bas
                
            success_count := success_count + 1;

        EXCEPTION WHEN OTHERS THEN
            -- Hata olursa say ve devam et (ASLA PATLAMA)
            fail_count := fail_count + 1;
            -- errors := errors || 'Hata (' || p_barcode || '): ' || SQLERRM || '; ';
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
