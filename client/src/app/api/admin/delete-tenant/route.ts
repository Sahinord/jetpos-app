import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyTenantAccess } from '@/lib/server-tenant-auth';

// SüperAdmin — lisans (tenant) SİLME. Service role ile RLS bypass.
// Client'tan doğrudan DELETE RLS'e takılıyordu (silinmiyordu). Yetki create-tenant ile aynı.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function admin() {
    return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

// tenant_id ile bağlı, silmeden önce temizlenecek alt tablolar (FK RESTRICT'e takılmasın).
// Tablo yoksa/kolon yoksa hata yutulur.
const CHILD_TABLES = [
    'sale_items', 'sales', 'invoice_items', 'invoices', 'waybill_items', 'waybills',
    'products', 'categories',
    'cari_hareketler', 'cari_hesaplar',
    'kasa_hareketleri', 'kasa_fisleri', 'kasalar',
    'banka_hareketleri', 'banka_fisleri', 'bankalar',
    'warehouse_stock', 'warehouses',
    'employees', 'adisyonlar', 'masalar',
    'integration_settings', 'odeal_transactions',
    'getir_carsi_product_map', 'getir_carsi_orders', 'getir_carsi_integrations', 'getir_carsi_store_types',
    'tgo_yemek_orders', 'tgo_yemek_stores', 'trendyol_orders',
    'ai_daily_usage', 'ai_settings',
    'product_change_logs', 'audit_logs', 'support_tickets', 'announcements',
    'crm_customers', 'qr_menu_settings',
];

export async function POST(req: NextRequest) {
    try {
        const auth = await verifyTenantAccess(req);
        if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

        const sb = admin();

        // Yetki: env ADMIN_SECRET_TOKEN VEYA DB'de is_super_admin (login ile aynı mantık).
        const licenseKey = req.headers.get('x-license-key') || '';
        const isEnvAdmin = !!process.env.ADMIN_SECRET_TOKEN && licenseKey === process.env.ADMIN_SECRET_TOKEN;
        let isDbAdmin = false;
        if (!isEnvAdmin && licenseKey) {
            const { data: sa } = await sb.from('tenants').select('id').eq('license_key', licenseKey).eq('is_super_admin', true).eq('status', 'active').maybeSingle();
            isDbAdmin = !!sa;
        }
        if (!isEnvAdmin && !isDbAdmin) {
            return NextResponse.json({ error: 'Yetkisiz erişim (süperadmin değil)' }, { status: 403 });
        }

        const { id } = await req.json();
        if (!id) return NextResponse.json({ error: 'tenant id gerekli' }, { status: 400 });

        // Süper admin lisansının kendisi silinemesin (kaza koruması).
        const { data: target } = await sb.from('tenants').select('id, is_super_admin').eq('id', id).maybeSingle();
        if (!target) return NextResponse.json({ error: 'Lisans bulunamadı.' }, { status: 404 });
        if (target.is_super_admin) return NextResponse.json({ error: 'Süper admin lisansı silinemez.' }, { status: 400 });

        // 1) Önce doğrudan dene (FK CASCADE varsa tek seferde biter).
        let del = await sb.from('tenants').delete().eq('id', id);
        if (del.error) {
            // 2) FK RESTRICT → alt tabloları temizle, sonra tekrar dene.
            for (const t of CHILD_TABLES) {
                try { await sb.from(t).delete().eq('tenant_id', id); } catch { /* tablo/kolon yoksa yut */ }
            }
            del = await sb.from('tenants').delete().eq('id', id);
            if (del.error) {
                return NextResponse.json({ error: `Silinemedi: ${del.error.message}. Bağlı bir kayıt engelliyor olabilir.` }, { status: 500 });
            }
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
