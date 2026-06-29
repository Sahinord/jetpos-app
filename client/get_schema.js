const { createClient } = require('@supabase/supabase-js');

const fs = require('fs');
const path = require('path');
const envContent = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const idx = line.indexOf('=');
  if (idx === -1) return;
  env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
});
const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseServiceKey = env['SUPABASE_SERVICE_ROLE_KEY'];

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
    console.log('Querying schema for products table...');
    const { data: cols, error } = await supabase.rpc('exec_sql', {
        sql_query: "SELECT column_name, data_type, character_maximum_length, numeric_precision, numeric_scale FROM information_schema.columns WHERE table_name = 'products';"
    }).catch(async (e) => {
        // Fallback: if exec_sql RPC doesn't exist, we can use a pg query if we had it,
        // or let's try direct query or another method.
        return { error: e };
    });

    if (error || !cols) {
        // If exec_sql RPC doesn't exist, let's try querying standard postgres views
        // Note: PostgREST doesn't expose information_schema directly unless configured, 
        // but let's see if we can find any RPC or just print columns from a sample product.
        console.log('exec_sql RPC failed or not found. Querying a sample product to inspect types:');
        const { data: sample, error: sampleErr } = await supabase.from('products').select('*').limit(1);
        if (sampleErr) {
            console.error('Error getting sample:', sampleErr);
        } else {
            console.log('Sample product:', sample[0]);
        }
        return;
    }

    console.log('Products columns:', cols);
}

run();
