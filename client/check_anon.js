import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@jetpos.com', // Let's try to find an admin email, or better yet, I don't know the password...
  });
  console.log("Without Auth Data count:");
  const { data, error } = await supabase.from('cari_hareketler').select('*');
  console.log("Error:", error);
  console.log("Data count:", data?.length);
}
check();
