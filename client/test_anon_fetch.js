const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://grlwmcuxobbgubphovhd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdybHdtY3V4b2JiZ3VicGhvdmhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNzM1MzAsImV4cCI6MjA4MzY0OTUzMH0.REYSFxWZe4ky5rX14nB7uILiuJZf_e7wwPMK34H0Aeo';
const tenantId = 'b06f5324-9d31-450e-8f12-94e94fbf982e';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
    console.log('Setting RLS context...');
    const { error: rpcError } = await supabase.rpc('set_current_tenant', {
        tenant_id: tenantId
    });

    if (rpcError) {
        console.error('RPC Error:', rpcError);
        return;
    }
    console.log('RLS context set successfully.');

    console.log('Fetching products...');
    const { data: products, error: queryError } = await supabase
        .from('products')
        .select('*, categories(name), warehouse_stock(*)')
        .eq('tenant_id', tenantId)
        .is('deleted_at', null)
        .is('archived_at', null)
        .order('id', { ascending: true })
        .range(0, 10);

    if (queryError) {
        console.error('Query Error:', queryError);
        return;
    }

    console.log(`Successfully fetched ${products.length} products:`);
    if (products.length > 0) {
        console.log('Sample product:', products[0]);
    }
}

run();
