
import { NextResponse } from 'next/server';
import { QNBClient } from '@/lib/qnb/client';

export async function GET() {
    try {
        const client = new QNBClient();
        const loginResult = await client.login();

        if (loginResult.success) {
            return NextResponse.json({
                success: true,
                message: 'QNB Bağlantısı Başarılı!',
                session: loginResult.sessionId
            });
        } else {
            return NextResponse.json({
                success: false,
                error: loginResult.error,
                hint: 'Lütfen .env.local dosyasındaki şifreyi kontrol edin.'
            }, { status: 401 });
        }

    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
