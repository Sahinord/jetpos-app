-- =============================================
-- SALES TABLE CRM & LOYALTY UPDATES
-- =============================================

-- 1. Add CRM columns to sales table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'customer_id') THEN
        ALTER TABLE sales ADD COLUMN customer_id UUID REFERENCES cari_hesaplar(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'loyalty_points_earned') THEN
        ALTER TABLE sales ADD COLUMN loyalty_points_earned DECIMAL(15,2) DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'coupon_code') THEN
        ALTER TABLE sales ADD COLUMN coupon_code VARCHAR(50);
    END IF;
END $$;

-- 2. Function to grant points after sale
CREATE OR REPLACE FUNCTION grant_loyalty_points_on_sale()
RETURNS TRIGGER AS $$
DECLARE
    v_tenant_id UUID;
    v_points_ratio DECIMAL;
    v_points_to_add DECIMAL;
BEGIN
    -- Only proceed if there is a customer
    IF NEW.customer_id IS NOT NULL THEN
        -- Get tenant loyalty settings
        SELECT points_ratio INTO v_points_ratio 
        FROM loyalty_settings 
        WHERE tenant_id = NEW.tenant_id AND is_active = true 
        LIMIT 1;

        -- Default ratio is 0.01 (1%) if not set
        IF v_points_ratio IS NULL THEN
            v_points_ratio := 0.01;
        END IF;

        -- Calculate points (total_amount * ratio)
        v_points_to_add := NEW.total_amount * v_points_ratio;

        -- Insert into loyalty_points (history)
        INSERT INTO loyalty_points (tenant_id, customer_id, points, transaction_type, reference_type, reference_id, description)
        VALUES (NEW.tenant_id, NEW.customer_id, v_points_to_add, 'earned', 'sale', NEW.id, 'Satış üzerinden kazanılan puan');

        -- NEW.loyalty_points_earned will be used for display/receipt
        UPDATE sales SET loyalty_points_earned = v_points_to_add WHERE id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Trigger for sales
DROP TRIGGER IF EXISTS trg_grant_loyalty_points ON sales;
CREATE TRIGGER trg_grant_loyalty_points
AFTER INSERT ON sales
FOR EACH ROW
EXECUTE FUNCTION grant_loyalty_points_on_sale();

-- 4. Sync Index
CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_tenant_id ON sales(tenant_id);
