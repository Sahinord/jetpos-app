
import { QNBClient } from './client';
import dotenv from 'dotenv';
import path from 'path';

// .env.local'ı yükle
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function test() {
    console.log('--- QNB e-Arşiv Login Testi ---');
    const client = new QNBClient();
    const result = await client.login('EARSIV');

    if (result.success) {
        console.log('✅ Giriş Başarılı!');
        console.log('--- SESSION INFO ---');
        console.log('ID:', result.sessionId);
        console.log('--------------------');
    } else {
        console.log('❌ Giriş Başarısız!');
        console.log('Hata:', result.error);
    }
}

test();
