"use client";

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

/**
 * LicenseGate sadece ilk girişte tenants tablosuna karşı doğrulama yapıyordu;
 * sonrasında her sayfa localStorage'daki tenantId/licenseKey'in SADECE var
 * olup olmadığına bakıyordu — biri devtools'tan bu değerleri başka bir
 * tenant'ınkiyle değiştirse bile client hiçbir şey fark etmiyordu (gerçek
 * koruma RLS'e kalıyordu). Bu component her sayfa açılışında localStorage'daki
 * kimliği validate_license RPC'siyle (SECURITY DEFINER) sunucuya karşı
 * tekrar doğrular; geçersizse oturumu temizleyip lisans ekranına atar.
 */
export default function SessionGuard() {
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (pathname === '/') return; // LicenseGate zaten orada

        const tenantId = localStorage.getItem('tenantId');
        const licenseKey = localStorage.getItem('licenseKey');
        if (!tenantId || !licenseKey) return;

        let cancelled = false;

        supabase
            .rpc('validate_license', { p_tenant_id: tenantId, p_license_key: licenseKey })
            .then(({ data, error }) => {
                if (cancelled) return;
                if (error || !data) {
                    localStorage.clear();
                    router.replace('/');
                }
            });

        return () => { cancelled = true; };
    }, [pathname]);

    return null;
}
