import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const tenantId = searchParams.get('tenantId');

        if (!tenantId) {
            return NextResponse.json({ success: false, error: 'tenantId gerekli' }, { status: 400 });
        }

        const { supabaseAdmin } = await import('@/lib/supabase-admin');
        const { data, error } = await supabaseAdmin
            .from('invoices')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false })
            .limit(200);

        if (error) {
            console.error('[Archive API Error]', error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: data || [] });
    } catch (err: any) {
        console.error('[Archive API Error]', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
