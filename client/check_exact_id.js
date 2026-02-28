
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
        .select('tenant_id')
        .limit(1)
        .single();

    if (error) {
        console.error('ERROR:', error);
        return;
    }

    const tid = data.tenant_id;
    console.log('--- EXACT ID CHECK ---');
    console.log('ID_STRING:', `|${tid}|`);
    console.log('ID_LENGTH:', tid.length);
    console.log('ID_TYPE:', typeof tid);
}

check();
