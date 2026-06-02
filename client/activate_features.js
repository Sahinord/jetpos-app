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

async function run() {
    console.log('--- ACTIVATING RESTAURANT ECOSYSTEM FEATURES ---');
    
    // Select all tenants
    const { data: tenants, error: fetchErr } = await supabaseAdmin.from('tenants').select('*');
    if (fetchErr) {
        console.error('Error fetching tenants:', fetchErr.message);
        return;
    }

    for (const tenant of tenants) {
        // Skip dummy B
        if (tenant.id === '00000000-0000-0000-0000-00000000000b') continue;

        const currentFeatures = tenant.features || {};
        const updatedFeatures = {
            ...currentFeatures,
            adisyon: true,
            kds: true,
            qrmenu: true,
            waiter_panel: true,
            tips: true,
            ratings: true,
            employee_login: true,
            employee_permissions: true
        };

        console.log(`Updating features for tenant "${tenant.company_name}" (${tenant.id})...`);
        const { error: updateErr } = await supabaseAdmin
            .from('tenants')
            .update({ features: updatedFeatures })
            .eq('id', tenant.id);

        if (updateErr) {
            console.error(`❌ Error updating tenant ${tenant.company_name}:`, updateErr.message);
        } else {
            console.log(`✅ Successfully updated features for: ${tenant.company_name}`);
        }
    }
}

run();
