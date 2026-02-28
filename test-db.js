const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './client/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data, error } = await supabase.from('invoices').select('*').limit(5);
    console.log('Error:', error);
    console.log('Invoices count:', data ? data.length : 0);
    if (data && data.length > 0) {
        console.log(data.map(i => ({ id: i.id, tenant_id: i.tenant_id, invoice_number: i.invoice_number })));
    }
}
check();
