const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://grlwmcuxobbgubphovhd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdybHdtY3V4b2JiZ3VicGhvdmhkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODA3MzUzMCwiZXhwIjoyMDgzNjQ5NTMwfQ.V2ZjiEm8S0d84hBeQIlb14gNTusduDHcn2MkOiK9NsA';

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
