import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Service role key ile RLS bypass
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { tenantId, updateData, adminPassword } = body;

        // Admin şifre doğrulama
        if (adminPassword !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 });
        }

        if (!tenantId || !updateData) {
            return NextResponse.json({ error: 'tenantId ve updateData gerekli' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('tenants')
            .update(updateData)
            .eq('id', tenantId)
            .select();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
