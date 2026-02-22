
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupData() {
  const cutoffDate = '2026-02-03';
  console.log(`Deleting entries after ${cutoffDate}...`);

  // 1. Delete from fund_transfers
  const { error: transferError, count: transferCount } = await supabase
    .from('fund_transfers')
    .delete({ count: 'exact' })
    .gt('transfer_date', cutoffDate);
  
  if (transferError) console.error('Error deleting transfers:', transferError);
  else console.log(`Deleted transfers:`, transferCount);

  // 2. Delete from bajar_list
  const { error: shoppingError, count: shoppingCount } = await supabase
    .from('bajar_list')
    .delete({ count: 'exact' })
    .gt('purchase_date', cutoffDate);

  if (shoppingError) console.error('Error deleting shopping items:', shoppingError);
  else console.log(`Deleted shopping items:`, shoppingCount);

  // 3. Delete from meal_costs
  const { error: mealError, count: mealCount } = await supabase
    .from('meal_costs')
    .delete({ count: 'exact' })
    .gt('meal_date', cutoffDate);

  if (mealError) console.error('Error deleting meals:', mealError);
  else console.log(`Deleted meals:`, mealCount);
}

cleanupData();
