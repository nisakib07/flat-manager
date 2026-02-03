-- Remove the check (amount > 0) constraint to allow negative transfers (returns)
alter table fund_transfers drop constraint if exists fund_transfers_amount_check;

-- Optional: Add a check that amount is not 0
alter table fund_transfers add constraint fund_transfers_amount_not_zero check (amount <> 0);
