
import { NextRequest, NextResponse } from 'next/server';
import { verifyTenantAccess } from '@/lib/server-tenant-auth';

export async function GET(req: NextRequest) {
    const auth = await verifyTenantAccess(req);
    if (!auth.ok) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const isSystemConfigured = !!(
        process.env.TRENDYOL_GO_SELLER_ID &&
        process.env.TRENDYOL_GO_API_KEY &&
        process.env.TRENDYOL_GO_API_SECRET
    );

    return NextResponse.json({
        isSystemConfigured,
        sellerId: process.env.TRENDYOL_GO_SELLER_ID,
        storeId: process.env.TRENDYOL_GO_STORE_ID,
        apiKey: process.env.TRENDYOL_GO_API_KEY,
        apiSecret: process.env.TRENDYOL_GO_API_SECRET,
        agentName: process.env.TRENDYOL_GO_AGENT_NAME || 'Self Integration',
        token: process.env.TRENDYOL_GO_TOKEN,
        isStage: process.env.TRENDYOL_GO_STAGE === 'true'
    });
}
