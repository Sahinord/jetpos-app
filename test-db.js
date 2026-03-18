const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './client/.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from('products').select('*').limit(5);
  console.log(error);
  console.log(JSON.stringify(data, null, 2));
}
run();
