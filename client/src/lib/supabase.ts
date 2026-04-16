import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'no_key_for_build';

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

/**
 * Audit Log Kaydı Oluştur
 * Fire-and-forget: Network hatası POS akışını etkilemez
 */
export function auditLog(tenantId: string, eventType: string, description: string, metadata: any = {}): void {
    if (!tenantId) return;

    const timeout = setTimeout(() => { /* fire & forget — no-op on timeout */ }, 3000);

    void (async () => {
        try {
            const { error } = await supabase
                .from('audit_logs')
                .insert([{ tenant_id: tenantId, event_type: eventType, description, metadata }]);

            if (error && process.env.NODE_ENV === 'development') {
                console.warn('[AuditLog]', error.message || error.code);
            }
        } catch {
            // Sessizce geç — audit log kritik değil
        } finally {
            clearTimeout(timeout);
        }
    })();
}

