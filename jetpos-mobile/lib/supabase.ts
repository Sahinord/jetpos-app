import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tenant context helper
export const setCurrentTenant = async (tenantId: string) => {
    await supabase.rpc('set_current_tenant', { tenant_id: tenantId });
};
