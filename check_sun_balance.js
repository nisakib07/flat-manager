
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBalance() {
  const userId = 'af0f575c-c1f6-4756-a8e6-15ddc157defd'; // Sun
  const monthStart = '2026-02-01';
  const monthEnd = '2026-03-01';

  // 1. Get Transfers
  const { data: transfers } = await supabase
    .from('fund_transfers')
    .select('amount')
    .eq('shopper_id', userId)
    .gte('transfer_date', monthStart)
    .lt('transfer_date', monthEnd);

  const totalTransfers = transfers.reduce((sum, t) => sum + t.amount, 0);
  console.log('Total Transfers to Sun:', totalTransfers);

  // 2. Get Shopping
  const { data: shopping } = await supabase
    .from('bajar_list')
    .select('cost')
    .gte('purchase_date', monthStart)
    .lt('purchase_date', monthEnd)
    .eq('user_id', userId);

  const totalShopping = shopping.reduce((sum, s) => sum + s.cost, 0);
  console.log('Total Shopping by Sun:', totalShopping);
  
  // 3. Get Common Expenses
  const { data: common } = await supabase
    .from('common_expenses')
    .select('total_cost')
    .eq('shopper_id', userId)
    .eq('month', monthStart.substring(0, 7)); // YYYY-MM
    
  const totalCommon = common ? common.reduce((sum, c) => sum + c.total_cost, 0) : 0;
  console.log('Total Common Expenses paid by Sun:', totalCommon);

  const balance = totalTransfers - totalShopping - totalCommon;
  console.log('Calculated Balance for Sun:', balance);
}

checkBalance();
