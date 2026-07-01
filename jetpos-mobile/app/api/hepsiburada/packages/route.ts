import { NextRequest, NextResponse } from 'next/server';
import { verifyTenantAccess } from '@/lib/server-tenant-auth';
import { getHepsiburadaCredentials, hbOrderRequest, qs } from '@/lib/hepsiburada-server';

export async function POST(req: NextRequest) {
    try {
        const auth = await verifyTenantAccess(req);
        if (!auth.ok) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }

        const creds = await getHepsiburadaCredentials(auth.tenantId);
        if (!creds) {
            return NextResponse.json({ error: 'Hepsiburada entegrasyonu yapılandırılmamış' }, { status: 400 });
        }

        const body = await req.json().catch(() => ({}));
        const { beginDate, endDate, page = 0, size = 50, onlyUnpacked = false } = body;

        const path = onlyUnpacked
            ? `/packages/merchantid/${creds.merchantId}/status/unpacked${qs({ page, size })}`
            : `/packages/merchantid/${creds.merchantId}${qs({ beginDate, endDate, page, size })}`;

        const data = await hbOrderRequest(creds, path, { method: 'GET' });

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Hepsiburada Packages Exception:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
