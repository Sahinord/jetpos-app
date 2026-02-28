import { QNBClient } from './src/lib/qnb/client';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '.env.local') });

async function run() {
    const client = new QNBClient();
    const loginRes = await client.login('EARSIV');
    const cookie = (client as any).earsivCookie;

    const vkn = process.env.NEXT_PUBLIC_QNB_TEST_VKN;
    const inputJson = JSON.stringify({
        vkn: vkn,
        faturaNo: 'EP-2142485479',
        donenBelgeFormati: '2'
    });

    const soapBody = `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://service.earsiv.uut.cs.com.tr/" xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
   <soapenv:Header>
      <wsse:Security>
         <wsse:UsernameToken>
            <wsse:Username>${vkn}.portaltest</wsse:Username>
            <wsse:Password>${process.env.QNB_TEST_PASSWORD}</wsse:Password>
         </wsse:UsernameToken>
      </wsse:Security>
   </soapenv:Header>
   <soapenv:Body>
      <ser:faturaSorgula>
         <input>${inputJson.replace(/"/g, '&quot;')}</input>
         <faturaNo>EP-2142485479</faturaNo>
      </ser:faturaSorgula>
   </soapenv:Body>
</soapenv:Envelope>`;

    const result = await fetch((client as any).earsivBaseUrl + '/earsiv/ws/EarsivWebService', {
        method: 'POST',
        headers: { 'Content-Type': 'text/xml', 'Cookie': cookie },
        body: soapBody
    });
    const text = await result.text();
    console.log(text.split('').reverse().join('').slice(0, 500).split('').reverse().join(''));
}

run().catch(console.error);
