import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://grlwmcuxobbgubphovhd.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdybHdtY3V4b2JiZ3VicGhvdmhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNzM1MzAsImV4cCI6MjA4MzY0OTUzMH0.REYSFxWZe4ky5rX14nB7uILiuJZf_e7wwPMK34H0Aeo';

// RLS politikaları tenant kimliğini x-tenant-id / x-license-key header'larından okur.
// set_current_tenant RPC'si tek başına yetmez: bağlantı havuzunda oturum değişkeni
// sonraki REST isteklerine taşınmaz. Bu yüzden header'lar her istekte gitmek zorunda.
// (client/src/lib/supabase.ts ile aynı desen; mobile localStorage anahtarı 'tenantId'.)
const getInitialHeaders = (): Record<string, string> => {
    if (typeof window === 'undefined') return {};
    return {
        'x-tenant-id': localStorage.getItem('tenantId') || '',
        'x-license-key': localStorage.getItem('licenseKey') || ''
    };
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
        headers: getInitialHeaders()
    }
});

const updateRLSHeaders = (tenantId: string, licenseKey: string) => {
    const rest = (supabase as any).rest;
    if (rest?.headers) {
        rest.headers['x-tenant-id'] = tenantId;
        rest.headers['x-license-key'] = licenseKey;
    }
};

// Tenant context helper — tenant-scoped sorgulardan önce çağrılmalı
export const setCurrentTenant = async (tenantId: string) => {
    if (typeof window !== 'undefined') {
        const licenseKey = localStorage.getItem('licenseKey') || '';
        updateRLSHeaders(tenantId, licenseKey);
    }
    await supabase.rpc('set_current_tenant', { tenant_id: tenantId });
};
