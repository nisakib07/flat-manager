-- Add columns to track auto-deposited amounts for shopping items (bajar_list)
-- This allows us to reverse the deposit when a shopping item is deleted

ALTER TABLE bajar_list 
ADD COLUMN IF NOT EXISTS auto_deposit_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS auto_deposit_slot TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS payment_preference TEXT CHECK (payment_preference IN ('deposit', 'payback')) DEFAULT 'deposit';

-- Add comments for clarity
COMMENT ON COLUMN bajar_list.auto_deposit_amount IS 'Amount auto-deposited to shopper meal deposits when expense exceeded their balance';
COMMENT ON COLUMN bajar_list.auto_deposit_slot IS 'The deposit slot (d1-d8) where the auto-deposit was added';
COMMENT ON COLUMN bajar_list.payment_preference IS 'Preference for handling excess amount: "deposit" to meal account or "payback" for direct repayment';
