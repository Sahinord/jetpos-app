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

        console.log('✅ Tenant context set:', tenantId);
    } catch (err) {
        console.error('Error setting tenant:', err);
        throw err;
    }
}

/**
 * Şifre değiştir
 */
export async function changePassword(tenantId: string, oldPassword: string, newPassword: string) {
    try {
        // Önce mevcut şifreyi kontrol et
        const { data: tenant, error: fetchError } = await supabase
            .from('tenants')
            .select('password')
            .eq('id', tenantId)
            .single();

        if (fetchError) throw fetchError;
        if (!tenant) throw new Error('Tenant bulunamadı');
        if (tenant.password !== oldPassword) throw new Error('Mevcut şifre yanlış!');

        // Yeni şifreyi güncelle
        const { error: updateError } = await supabase
            .from('tenants')
            .update({ password: newPassword })
            .eq('id', tenantId);

        if (updateError) throw updateError;

        return { success: true };
    } catch (err: any) {
        console.error('Password change error:', err);
        throw err;
    }
}
