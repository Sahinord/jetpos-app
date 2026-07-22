-- ═══════════════════════════════════════════════════════════════════
--  POS SATIŞ İADESİ — stok geri ekleme + fatura iptal
--  Manuel uygulanır: Supabase Dashboard > SQL Editor
--
--  create_pos_invoice'in tersi: iade edilen satışın kalemlerini alır,
--  stoğu geri ekler, faturayı 'cancelled' işaretler. Mükerrer iade engelli
--  (zaten cancelled ise tekrar stok eklemez).
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION refund_pos_invoice(
    p_tenant_id UUID,
    p_invoice_id UUID,
    p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_status TEXT;
    v_item RECORD;
BEGIN
    PERFORM set_config('app.current_tenant_id', p_tenant_id::text, true);

    -- Fatura bu tenant'a mı ait + mevcut statü?
    SELECT status INTO v_status
    FROM invoices
    WHERE id = p_invoice_id AND tenant_id = p_tenant_id;

    IF v_status IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Satış bulunamadı.');
    END IF;

    -- Zaten iptal/iade edilmişse tekrar stok ekleme (idempotent)
    IF v_status = 'cancelled' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Bu satış zaten iade edilmiş.');
    END IF;

    -- Kalemleri gez, stoğu geri ekle
    FOR v_item IN
        SELECT product_id, quantity FROM invoice_items
        WHERE invoice_id = p_invoice_id AND tenant_id = p_tenant_id AND product_id IS NOT NULL
    LOOP
        UPDATE products
        SET stock_quantity = COALESCE(stock_quantity, 0) + v_item.quantity,
            updated_at = NOW()
        WHERE id = v_item.product_id AND tenant_id = p_tenant_id;
    END LOOP;

    -- Faturayı iptal işaretle
    UPDATE invoices
    SET status = 'cancelled',
        payment_status = 'refunded',
        notes = COALESCE(notes, '') || ' | İADE: ' || COALESCE(p_reason, 'sebep belirtilmedi') || ' (' || to_char(NOW(), 'YYYY-MM-DD HH24:MI') || ')'
    WHERE id = p_invoice_id AND tenant_id = p_tenant_id;

    RETURN jsonb_build_object('success', true, 'message', 'Satış iade edildi, stok geri eklendi.');

EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'İade hatası: %', SQLERRM;
END;
$$;

GRANT EXECUTE ON FUNCTION refund_pos_invoice(UUID, UUID, TEXT) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
