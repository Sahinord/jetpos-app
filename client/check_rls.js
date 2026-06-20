import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase.rpc('get_policies_for_table', { table_name: 'cari_hareketler' });
  if (error) {
    const { data: qData, error: qError } = await supabase.from('pg_policies').select('*').eq('tablename', 'cari_hareketler');
    console.log("Policies:", qData);
  } else {
    console.log("Policies:", data);
  }
}
check();
