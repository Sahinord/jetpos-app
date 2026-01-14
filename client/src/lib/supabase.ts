import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Tenant ID'yi RLS için set et
 * Her veri işleminden ÖNCE çağrılmalı!
 */
export async function setCurrentTenant(tenantId: string) {
    try {
        const { error } = await supabase.rpc('set_current_tenant', {
            tenant_id: tenantId
        });

        if (error) {
            console.error('Failed to set tenant context:', error);
            throw error;
        }
    } catch (err) {
        console.error('Error setting tenant:', err);
        throw err;
    }
}
