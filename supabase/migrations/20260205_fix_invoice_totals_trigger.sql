-- Trigger fonksiyonundaki GROUP BY hatasını düzeltiyoruz
-- grand_total hesaplanirken discount_amount invoices tablosundan alınmalı
-- ancak subquery icinde invoice_items tablosu oldugu icin karisiklik oluyordu
-- hesaplamayi duzeltiyoruz

CREATE OR REPLACE FUNCTION update_invoice_totals()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE invoices
    SET 
        subtotal = (SELECT COALESCE(SUM(line_total), 0) FROM invoice_items WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)),
        total_vat = (SELECT COALESCE(SUM(vat_amount), 0) FROM invoice_items WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)),
        -- Subquery parantezini kapattiktan sonra discount_amount'u cikariyoruz
        grand_total = (SELECT COALESCE(SUM(line_total_with_vat), 0) FROM invoice_items WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)) - COALESCE(discount_amount, 0),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
