
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
    const tenantId = '755dfb53-fde1-4ab9-9070-572d20126c07';
    console.log('--- TENANT CHECK ---');

    // Check tenants table entry
    const { data: tenant, error } = await supabaseAdmin
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
        .single();

    if (error) {
        console.error('Error fetching tenant:', error);
        return;
    }

    console.log('Tenant ID:', tenant.id);
    console.log('Company Name:', tenant.company_name);
    console.log('Features:', JSON.stringify(tenant.features, null, 2));
}

check();
