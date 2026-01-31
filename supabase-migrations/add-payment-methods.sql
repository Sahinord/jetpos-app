-- Add HAVALE/EFT payment method to sales table
-- This migration updates the payment_method constraint to include the new payment option

-- Drop the existing constraint
ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_payment_method_check;

-- Add the updated constraint with all 4 payment methods
ALTER TABLE sales ADD CONSTRAINT sales_payment_method_check 
    CHECK (payment_method IN ('NAKİT', 'KART', 'VERESİYE', 'HAVALE/EFT'));

-- Notify schema reload
NOTIFY pgrst, 'reload schema';