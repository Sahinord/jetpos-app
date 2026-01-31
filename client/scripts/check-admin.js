
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://grlwmcuxobbgubphovhd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdybHdtY3V4b2JiZ3VicGhvdmhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNzM1MzAsImV4cCI6MjA4MzY0OTUzMH0.REYSFxWZe4ky5rX14nB7uILiuJZf_e7wwPMK34H0Aeo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAdminTenant() {
    console.log('--- DB Check Starting ---');
    try {
        const { data, error } = await supabase
            .from('tenants')
            .select('*')
            .eq('license_key', 'ADM257SA67');

        if (error) {
            console.error('Error fetching admin tenant:', error.message);
        } else {
            console.log('Tenants found:', data.length);
            if (data.length > 0) {
                console.log('Admin tenant details:', data[0]);
            } else {
                console.log('ADM257SA67 license key not found in tenants table.');
            }
        }

        // Check if table exists at all by trying a simple count
        const { count, error: countError } = await supabase
            .from('tenants')
            .select('*', { count: 'exact', head: true });

        if (countError) {
            console.error('Error checking tenants table existence:', countError.message);
        } else {
            console.log('Total tenants in table:', count);
        }

    } catch (err) {
        console.error('Unexpected error:', err.message);
    }
    console.log('--- DB Check Finished ---');
}

checkAdminTenant();
