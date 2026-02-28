
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: './client/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

async function check() {
    const { data, count, error } = await supabaseAdmin
        .from('trendyol_go_orders')
        .select('tenant_id, order_number, status', { count: 'exact' });

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Total Orders:', count);
    if (data && data.length > 0) {
        const tenants = [...new Set(data.map(o => o.tenant_id))];
        console.log('Tenants with orders:', tenants);
        console.log('Sample orders:', data.slice(0, 5));
    } else {
        console.log('No orders found in table.');
    }
}

check();
