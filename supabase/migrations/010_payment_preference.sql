-- Add payment preference column for common expenses
-- 'deposit' = auto-add to meal deposits (default)
-- 'payback' = manager will pay back the shopper

ALTER TABLE common_expenses 
ADD COLUMN IF NOT EXISTS payment_preference TEXT DEFAULT 'deposit';

-- Add comment for clarity
COMMENT ON COLUMN common_expenses.payment_preference IS 'How to handle excess amount: deposit (to meal deposits) or payback (manager pays shopper)';
