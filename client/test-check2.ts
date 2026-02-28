import { QNBClient } from './src/lib/qnb/client';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '.env.local') });

async function run() {
    const client = new QNBClient();
    console.log('Checking status...');
    const result = await client.checkDocumentStatus('EP-2143663108', 'EARSIV');
    console.log(JSON.stringify(result, null, 2));
}

run().catch(console.error);
