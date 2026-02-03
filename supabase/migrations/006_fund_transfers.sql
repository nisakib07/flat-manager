create table if not exists fund_transfers (
  id uuid default gen_random_uuid() primary key,
  amount numeric not null check (amount > 0),
  shopper_id uuid references users(id) not null,
  transfer_date date default current_date not null,
  created_at timestamptz default now() not null
);

-- Add index for performance
create index if not exists idx_fund_transfers_shopper_date on fund_transfers(shopper_id, transfer_date);
