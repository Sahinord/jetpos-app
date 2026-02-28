
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
const supabaseServiceRoleKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY');

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

async function check() {
    const { data, count, error } = await supabaseAdmin
        .from('trendyol_go_orders')
        .select('tenant_id', { count: 'exact' });

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('--- DATABASE CHECK ---');
    console.log('Total Rows in trendyol_go_orders:', count);

    if (data && data.length > 0) {
        const stats = data.reduce((acc, curr) => {
            acc[curr.tenant_id] = (acc[curr.tenant_id] || 0) + 1;
            return acc;
        }, {});
        console.log('Orders per Tenant:', stats);
    }
}

check();
