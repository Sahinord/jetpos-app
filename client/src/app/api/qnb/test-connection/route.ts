import { NextRequest, NextResponse } from 'next/server';
import { QNBClient } from '@/lib/qnb/client';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const type = (searchParams.get('type') || 'EFATURA') as 'EFATURA' | 'EARSIV';

        const client = new QNBClient();
        const loginResult = await client.login(type);

        if (loginResult.success) {
            return NextResponse.json({
                success: true,
                message: `QNB ${type} Bağlantısı Başarılı!`,
                session: loginResult.sessionId
            });
        } else {
            return NextResponse.json({
                success: false,
                error: loginResult.error,
                hint: 'Lütfen .env.local dosyasındaki bilgileri kontrol edin.'
            }, { status: 401 });
        }

    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
