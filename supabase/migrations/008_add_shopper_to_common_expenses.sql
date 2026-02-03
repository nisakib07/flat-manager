-- Add shopper_id to common_expenses to track who made the purchase
ALTER TABLE common_expenses 
ADD COLUMN shopper_id UUID REFERENCES users(id);

-- Create an index for performance
CREATE INDEX idx_common_expenses_shopper_id ON common_expenses(shopper_id);
