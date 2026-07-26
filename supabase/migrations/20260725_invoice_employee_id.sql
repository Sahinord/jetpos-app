-- Patron performansı: satışı yapan personeli (garson/kasiyer) faturaya bağla.
-- Böylece "garson başına günlük ciro" hesaplanabilir.
-- Manuel uygulanır (Supabase SQL Editor). Additive + idempotent.

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS employee_id UUID;

CREATE INDEX IF NOT EXISTS idx_invoices_employee_date
    ON invoices (tenant_id, employee_id, created_at);

-- create_pos_invoice: mevcut tanımın aynısı + employee_id (p_invoice_data'dan).
CREATE OR REPLACE FUNCTION create_pos_invoice(
    p_tenant_id UUID,
    p_invoice_data JSONB,
    p_items_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_invoice_id UUID;
    v_item JSONB;
BEGIN
    PERFORM set_config('app.current_tenant_id', p_tenant_id::text, true);

    INSERT INTO invoices (
        tenant_id,
        invoice_number,
        invoice_type,
        invoice_date,
        cari_id,
        cari_name,
        grand_total,
        subtotal,
        total_vat,
        payment_status,
        status,
        notes,
        employee_id,
        created_by
    ) VALUES (
        p_tenant_id,
        p_invoice_data->>'invoice_number',
        (p_invoice_data->>'invoice_type')::invoice_type,
        (p_invoice_data->>'invoice_date')::date,
        (p_invoice_data->>'cari_id')::uuid,
        p_invoice_data->>'cari_name',
        (p_invoice_data->>'grand_total')::numeric,
        (p_invoice_data->>'subtotal')::numeric,
        (p_invoice_data->>'total_vat')::numeric,
        p_invoice_data->>'payment_status',
        p_invoice_data->>'status',
        p_invoice_data->>'notes',
        NULLIF(p_invoice_data->>'employee_id', '')::uuid,
        auth.uid()
    ) RETURNING id INTO v_invoice_id;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items_data)
    LOOP
        INSERT INTO invoice_items (
            tenant_id, invoice_id, product_id, item_name, item_code,
            quantity, unit_price, line_total, vat_rate
        ) VALUES (
            p_tenant_id,
            v_invoice_id,
            (v_item->>'product_id')::uuid,
            v_item->>'item_name',
            v_item->>'item_code',
            (v_item->>'quantity')::numeric,
            (v_item->>'unit_price')::numeric,
            (v_item->>'line_total')::numeric,
            (v_item->>'vat_rate')::numeric
        );

        UPDATE products
        SET stock_quantity = stock_quantity - (v_item->>'quantity')::numeric,
            updated_at = NOW()
        WHERE id = (v_item->>'product_id')::uuid
          AND tenant_id = p_tenant_id;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'invoice_id', v_invoice_id,
        'message', 'Satış ve stok güncellemeleri başarıyla tamamlandı.'
    );

EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'İşlem hatası: %', SQLERRM;
END;
$$;
