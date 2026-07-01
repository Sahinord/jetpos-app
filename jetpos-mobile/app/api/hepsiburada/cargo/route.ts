import { NextRequest, NextResponse } from 'next/server';
import { verifyTenantAccess } from '@/lib/server-tenant-auth';
import { getHepsiburadaCredentials, hbOrderRequest } from '@/lib/hepsiburada-server';

/**
 * HepsiJet dahil tüm kargo firması işlemleri (Hepsiburada'da ayrı bir
 * "HepsiJet API"si yok — paket bazında kargo firması seçimi/etiket/teslim
 * bildirimi aynı Order API'nin parçası, bkz. lib/hepsiburada-server.ts).
 */
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
        const { action, packageNumber, cargoCompanyShortCode, receivedBy } = body;

        if (!packageNumber) {
            return NextResponse.json({ error: 'packageNumber gerekli' }, { status: 400 });
        }

        const base = `/packages/merchantid/${creds.merchantId}/packagenumber/${packageNumber}`;

        switch (action) {
            case 'list-companies': {
                const data = await hbOrderRequest(creds, `${base}/changablecargocompanies`, { method: 'GET' });
                return NextResponse.json(data);
            }
            case 'change-company': {
                if (!cargoCompanyShortCode) {
                    return NextResponse.json({ error: 'cargoCompanyShortCode gerekli' }, { status: 400 });
                }
                const data = await hbOrderRequest(creds, `${base}/changecargocompany`, {
                    method: 'PUT',
                    body: JSON.stringify({ cargoCompanyShortCode })
                });
                return NextResponse.json(data);
            }
            case 'get-label': {
                const data = await hbOrderRequest(creds, `${base}/label`, { method: 'GET' });
                return NextResponse.json(data);
            }
            case 'mark-delivered': {
                const data = await hbOrderRequest(creds, `${base}/deliver`, {
                    method: 'POST',
                    body: JSON.stringify({
                        receivedDate: new Date().toISOString(),
                        receivedBy: receivedBy || creds.username,
                        digitalCodes: []
                    })
                });
                return NextResponse.json(data);
            }
            default:
                return NextResponse.json({ error: 'Geçersiz action' }, { status: 400 });
        }
    } catch (error: any) {
        console.error('Hepsiburada Cargo Exception:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
