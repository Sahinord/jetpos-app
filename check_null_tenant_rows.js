const fs = require('fs');
const { createClient } = require('./client/node_modules/@supabase/supabase-js');

const envContent = fs.readFileSync('./client/.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val.length > 0) env[key.trim()] = val.join('=').trim();
});

const supabase = createClient(
    env['NEXT_PUBLIC_SUPABASE_URL'],
    env['SUPABASE_SERVICE_ROLE_KEY']
);

async function main() {
    for (const table of ['products', 'invoice_items', 'waybills', 'waybill_items']) {
        const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true })
            .is('tenant_id', null);
        if (error) {
            console.log(table, '-> ERROR', error.message);
        } else {
            console.log(table, '-> NULL tenant_id rows:', count);
        }
    }
}

main();
