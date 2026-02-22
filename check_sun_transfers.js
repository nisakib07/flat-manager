
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTransfers() {
  const userId = 'af0f575c-c1f6-4756-a8e6-15ddc157defd';
  const monthStart = '2026-02-01';
  const monthEnd = '2026-03-01';
  
  console.log(`Checking transfers for user: ${userId} between ${monthStart} and ${monthEnd}`);
  
  const { data, error } = await supabase
    .from('fund_transfers')
    .select('*')
    .eq('shopper_id', userId)
    .gte('transfer_date', monthStart)
    .lt('transfer_date', monthEnd);

  if (error) {
    console.error('Error fetching transfers:', error);
    return;
  }

  console.log('Transfers found:', data);
  
  // Also check ALL transfers for this user without date filter
  const { data: allTransfers, error: IndexError } = await supabase
    .from('fund_transfers')
    .select('*')
    .eq('shopper_id', userId);
    
  console.log('Total transfers for user (all time):', allTransfers?.length);
  if (allTransfers?.length > 0) {
      console.log('Sample transfer:', allTransfers[0]);
  }
}

checkTransfers();
