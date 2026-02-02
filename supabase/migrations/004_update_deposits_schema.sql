-- Update meal_deposits table to support 8 deposit slots
ALTER TABLE public.meal_deposits 
ADD COLUMN IF NOT EXISTS d1 NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS d2 NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS d3 NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS d4 NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS d5 NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS d6 NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS d7 NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS d8 NUMERIC NOT NULL DEFAULT 0;

-- We will keep the 'deposit' column for legacy data for a moment if needed, 
-- but given this is likely a fresh app or simple migration, let's migrate data if exists or just drop it.
-- Let's migrate any existing 'deposit' value to 'd1'
UPDATE public.meal_deposits SET d1 = deposit WHERE deposit > 0;

-- Now drop the old deposit column
ALTER TABLE public.meal_deposits DROP COLUMN IF EXISTS deposit;
