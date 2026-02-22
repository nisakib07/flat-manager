
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

async function checkUser() {
  const userId = 'af0f575c-c1f6-4756-a8e6-15ddc157defd';
  console.log(`Checking user: ${userId}`);
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user:', error);
    return;
  }

  console.log('User details:', data);
  
  // Also check if this user exists in the list that the page query would return
  const { data: allUsers, error: listError } = await supabase
       .from('users')
       .select('id, name')
       .order('name');
       
   if (listError) {
       console.error('Error listing users:', listError);
   } else {
       const found = allUsers.find(u => u.id === userId);
       console.log('User found in general list:', !!found, found);
   }
}

checkUser();
