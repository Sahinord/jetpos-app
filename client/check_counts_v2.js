
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
    const { data, error } = await supabaseAdmin
        .from('trendyol_go_orders')
        .select('tenant_id');

    if (error) {
        process.exit(1);
    }

    const counts = {};
    data.forEach(row => {
        counts[row.tenant_id] = (counts[row.tenant_id] || 0) + 1;
    });

    for (const [tid, count] of Object.entries(counts)) {
        console.log(`TENANT_ID: ${tid} | COUNT: ${count}`);
    }
}

check();
