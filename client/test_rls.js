
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnvVar = (name) => {
    const match = envContent.match(new RegExp(`${name}=(.*)`));
    return match ? match[1].trim() : null;
};

const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');

// USE ANON KEY TO TEST RLS
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
    console.log('--- RLS TEST (with Anon Key) ---');
    const tenantId = '755dfb53-fde1-4ab9-9070-572d20126c07';
    console.log('Testing for tenant:', tenantId);

    const { data, count, error } = await supabase
        .from('trendyol_go_orders')
        .select('*', { count: 'exact' })
        .eq('tenant_id', tenantId);

    if (error) {
        console.error('RLS Read Error:', error);
    } else {
        console.log('Visible Rows (RLS ON):', count);
        console.log('Data Sample:', data?.length ? data[0].order_number : 'NONE');
    }
}

check();
