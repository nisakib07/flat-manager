-- Add columns to track auto-deposited amounts for common expenses
-- This allows us to reverse the deposit when a common expense is deleted

ALTER TABLE common_expenses 
ADD COLUMN IF NOT EXISTS auto_deposit_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS auto_deposit_slot TEXT;

-- Add comment for clarity
COMMENT ON COLUMN common_expenses.auto_deposit_amount IS 'Amount auto-deposited to shopper meal deposits when expense exceeded their balance';
COMMENT ON COLUMN common_expenses.auto_deposit_slot IS 'The deposit slot (d1-d8) where the auto-deposit was added';
