
import { SOAP_TEMPLATES } from './soap-templates';
import { QNBLoginResponse, QNBDocumentStatus } from './types';
import { generateUBL } from './ubl-builder';
import crypto from 'crypto';

// Regex Helpers
const extractTagContent = (xml: string, tag: string): string | null => {
    // Handle both <tagName> and <ns:tagName>
    const regex = new RegExp(`<([a-z0-9]+:)?${tag}[^>]*>([^<]+)</([a-z0-9]+:)?${tag}>`, 'i');
    const match = xml.match(regex);
    return match ? match[2] : null;
};

const extractFault = (xml: string): string | null => {
    const faultString = extractTagContent(xml, 'faultstring');
    const detail = extractTagContent(xml, 'detail') || extractTagContent(xml, 'message');
    if (faultString) {
        return detail ? `${faultString} (${detail})` : faultString;
    }
    return null;
};

export class QNBClient {
    private baseUrl: string;
    private earsivBaseUrl: string;
    private connectorTestUrl: string;
    private vkn: string;
    private earsivUsername: string;
    private erpCode: string;
    private password?: string;

    // Separate sessions because we have different users/endpoints
    private efaturaCookie?: string;
    private earsivCookie?: string;

    constructor(config?: { qnb?: any }) {
        const qnb = config?.qnb || {};

        const isTest = qnb.isTest !== false;

        this.baseUrl = qnb.baseUrl || (isTest ? 'https://erpefaturatest1.qnbesolutions.com.tr' : 'https://erpefatura.qnbesolutions.com.tr');
        this.earsivBaseUrl = qnb.earsivBaseUrl || (isTest ? 'https://portaltest.qnbesolutions.com.tr' : 'https://portal.qnbesolutions.com.tr');
        this.connectorTestUrl = qnb.connectorTestUrl || (isTest ? 'https://connectortest.qnbesolutions.com.tr' : 'https://connector.qnbesolutions.com.tr');

        this.vkn = qnb.testVkn || '';
        this.earsivUsername = qnb.earsivUsername || '';
        this.erpCode = qnb.erpCode || '';
        this.password = qnb.testPassword;
    }

    /**
     * Updated Login Logic based on latest documentation
     */
    async login(serviceType: 'EFATURA' | 'EARSIV' = 'EFATURA'): Promise<QNBLoginResponse> {
        if (!this.password || this.password === 'CHANGE_ME_FROM_MAIL') {
            return { success: false, error: 'Şifre tanımlanmamış (.env.local kontrol edin)' };
        }

        const pass = this.password;

        if (serviceType === 'EARSIV') {
            const username = this.earsivUsername;
            try {
                // Step 1: Hit earsivtest first to get its own session cookie
                const earsivEndpoint = `${this.earsivBaseUrl}/earsiv/ws/EarsivWebService`;
                console.log(`[QNB Login] Step 1: Getting earsivtest session from ${earsivEndpoint}`);
                let earsivSessionCookie = '';
                try {
                    const initRes = await fetch(earsivEndpoint, { method: 'GET' });
                    const initCookie = initRes.headers.get('set-cookie');
                    if (initCookie) {
                        earsivSessionCookie = initCookie.split(';')[0];
                        console.log(`[QNB Login] earsivtest session: ${earsivSessionCookie}`);
                    }
                } catch (e) { /* ignore, GET might fail */ }

                // Step 2: Login at connectortest, passing earsivtest session cookie
                const connectorUrl = `${this.connectorTestUrl}/connector/ws/userService`;
                console.log(`[QNB Login] Step 2: Login at connectortest @ ${connectorUrl}`);
                const loginHeaders: Record<string, string> = {
                    'Content-Type': 'text/xml;charset=UTF-8',
                    'SOAPAction': '""'
                };
                if (earsivSessionCookie) loginHeaders['Cookie'] = earsivSessionCookie;

                const response = await fetch(connectorUrl, {
                    method: 'POST',
                    headers: loginHeaders,
                    body: SOAP_TEMPLATES.LOGIN(username, pass).trim()
                });
                const text = await response.text();
                console.log(`[QNB Login] Connector response:`, text.substring(0, 200));
                const fault = extractFault(text);
                if (fault) return { success: false, error: fault };

                // Get connector session cookie
                const connectorCookie = response.headers.get('set-cookie');
                let connectorSessionCookie = '';
                if (connectorCookie) connectorSessionCookie = connectorCookie.split(';')[0];
                console.log(`[QNB Login] Connector session: ${connectorSessionCookie}`);

                const returnVal = extractTagContent(text, 'return');
                console.log(`[QNB Login] Return val: ${returnVal}`);

                // Step 3: Combine cookies — send both earsiv + connector sessions
                // Extract raw session token from connector cookie
                // connectortest sets TEST_CSAPSESSIONID, but earsivtest (JAX-WS) needs JSESSIONID
                let jsessionId = '';
                if (connectorSessionCookie) {
                    // e.g. "TEST_CSAPSESSIONID=ABC123" → extract "ABC123"
                    const tokenVal = connectorSessionCookie.split('=').slice(1).join('=');
                    if (tokenVal) jsessionId = `JSESSIONID=${tokenVal}`;
                }
                console.log(`[QNB Login] JSESSIONID alias: ${jsessionId}`);

                // Combine: original connector cookie + JSESSIONID alias + earsivtest session
                const allCookies = [earsivSessionCookie, connectorSessionCookie, jsessionId]
                    .filter(Boolean).join('; ');

                if (returnVal === 'true' || connectorSessionCookie || earsivSessionCookie) {
                    this.earsivCookie = allCookies || 'SESSION_ESTABLISHED';
                    console.log(`[QNB Login] Final earsiv cookie: ${this.earsivCookie}`);
                    return { success: true, sessionId: this.earsivCookie };
                }

                if (returnVal && returnVal.length > 10) {
                    this.earsivCookie = `JSESSIONID=${returnVal}`;
                    return { success: true, sessionId: returnVal };
                }

                return { success: false, error: 'Oturum açılamadı' };
            } catch (err: any) {
                return { success: false, error: err.message };
            }
        }


        const username = this.vkn;
        const url = `${this.baseUrl}/efatura/ws/connectorService`;

        try {
            console.log(`[QNB Login] Attempting EFATURA @ ${url}`);
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'text/xml;charset=UTF-8', 'SOAPAction': '""' },
                body: SOAP_TEMPLATES.LOGIN(username, pass).trim()
            });

            const text = await response.text();
            const fault = extractFault(text);

            if (!fault) {
                return this.processLoginResponse(text, response.headers, serviceType);
            }

            return { success: false, error: fault };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }

    private processLoginResponse(text: string, headers: Headers, serviceType: string): QNBLoginResponse {
        const cookieHeader = headers.get('set-cookie');
        let sessionCookie = '';

        if (cookieHeader) {
            sessionCookie = cookieHeader.split(';')[0];
        }

        console.log(`[QNB Login] Set-Cookie raw: ${cookieHeader}`);
        console.log(`[QNB Login] Session cookie: ${sessionCookie}`);

        const returnVal = extractTagContent(text, 'return');
        console.log(`[QNB Login] Return val: ${returnVal}`);

        if (returnVal === 'true' || sessionCookie) {
            if (serviceType === 'EFATURA') {
                this.efaturaCookie = sessionCookie || 'SESSION_ESTABLISHED';
            } else {
                this.earsivCookie = sessionCookie || 'SESSION_ESTABLISHED';
            }
            return { success: true, sessionId: sessionCookie || 'SESSION_ESTABLISHED' };
        }

        if (returnVal && returnVal.length > 10) {
            const cookieVal = `JSESSIONID=${returnVal}`;
            if (serviceType === 'EFATURA') {
                this.efaturaCookie = cookieVal;
            } else {
                this.earsivCookie = cookieVal;
            }
            return { success: true, sessionId: returnVal };
        }

        return { success: false, error: 'Oturum açılamadı' };
    }

    async checkDocumentStatus(docNo: string, docType: string = 'EFATURA'): Promise<QNBDocumentStatus | null> {
        let endpoint = '';
        let cookie = '';
        let soapBody = '';

        if (docType === 'EARSIV') {
            endpoint = `${this.earsivBaseUrl}/earsiv/ws/EarsivWebService`;
            if (!this.earsivCookie) {
                const loginRes = await this.login('EARSIV');
                if (!loginRes.success) throw new Error('EARSIV Login failed: ' + loginRes.error);
            }
            cookie = this.earsivCookie || '';

            // Eğer gecici ID ile gelmişse ve ETTN varsa (bir şekilde iletilmeli), UUID üzerinden sorgulanabilir.
            // Şimdilik faturaNo üzerinden deniyoruz.
            soapBody = SOAP_TEMPLATES.EARSIV_STATUS(this.vkn, docNo, this.earsivUsername, this.password || '');
        } else {
            endpoint = `${this.baseUrl}/efatura/ws/connectorService`;
            if (!this.efaturaCookie) {
                const loginRes = await this.login('EFATURA');
                if (!loginRes.success) throw new Error('EFATURA Login failed: ' + loginRes.error);
            }
            cookie = this.efaturaCookie || '';
            soapBody = SOAP_TEMPLATES.CHECK_STATUS_EXT(this.vkn, docNo, docType);
        }

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/xml;charset=UTF-8',
                    'SOAPAction': '',
                    'Cookie': cookie
                },
                body: soapBody.trim()
            });

            const text = await response.text();
            const fault = extractFault(text);
            if (fault) {
                console.warn(`QNB Status Check Fault (${docType}):`, fault);
                return null;
            }

            const durum = extractTagContent(text, 'durum') || extractTagContent(text, 'durumAciklamasi') || extractTagContent(text, 'resultText');
            const ettn = extractTagContent(text, 'ettn') || extractTagContent(text, 'faturaUuid');
            const pdfUrl = extractTagContent(text, 'url') || extractTagContent(text, 'faturaUrl') || extractTagContent(text, 'pdfUrl');
            const realFaturaNo = extractTagContent(text, 'faturaNo');

            if (!durum && !pdfUrl && !realFaturaNo) return null;

            return {
                belgeNo: realFaturaNo || docNo,
                durum: durum || 'BILINMIYOR',
                ettn: ettn || '',
                gonderimDurumu: text,
                pdfUrl: pdfUrl || undefined
            };

        } catch (error) {
            console.error("Status Check Error:", error);
            return null;
        }
    }

    async sendInvoice(invoiceData: any, docType: 'EFATURA' | 'EARSIV' = 'EFATURA'): Promise<{ success: boolean; listId?: string; error?: string; pdfUrl?: string; ettn?: string }> {
        let endpoint = '';
        let soapBody = '';
        let cookie = '';

        const ublXml = generateUBL(invoiceData, this.erpCode, this.vkn);
        const b64Data = Buffer.from(ublXml, 'utf-8').toString('base64');
        const docHash = crypto.createHash('md5').update(ublXml).digest('hex').toUpperCase();

        if (docType === 'EARSIV') {
            // WS-Security: credentials embedded in SOAP header — no separate login needed
            const islemId = crypto.randomUUID();
            endpoint = `${this.earsivBaseUrl}/earsiv/ws/EarsivWebService`;
            soapBody = SOAP_TEMPLATES.CREATE_EARSIV_INVOICE_EXT(b64Data, this.vkn, this.erpCode, this.earsivUsername, this.password || '', islemId);
            console.log(`[QNB Send] Endpoint: ${endpoint}, islemId: ${islemId}`);
            // Write UBL to file for debugging / QNB support
            const fs = await import('fs');
            const path = await import('path');
            const debugPath = path.join(process.cwd(), 'debug_ubl.xml');
            fs.writeFileSync(debugPath, ublXml, 'utf-8');
            console.log(`[QNB Debug] UBL written to ${debugPath}`);


        } else {
            if (!this.efaturaCookie) {
                const loginRes = await this.login('EFATURA');
                if (!loginRes.success) throw new Error('e-Fatura Login failed: ' + loginRes.error);
            }
            cookie = this.efaturaCookie || '';
            endpoint = `${this.baseUrl}/efatura/ws/connectorService`;
            soapBody = SOAP_TEMPLATES.SEND_DOCUMENT_EXT(cookie, this.vkn, 'FATURA_UBL', invoiceData.invoiceNumber || 'TASLAK-' + Date.now(), b64Data, docHash, this.erpCode);
        }

        try {
            console.log(`[QNB Send] DocType: ${docType}, Endpoint: ${endpoint}`);
            console.log(`[QNB Send] SOAP Body Length: ${soapBody.length}, First 200 chars: ${soapBody.slice(0, 200)}...`);

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/xml;charset=UTF-8',
                    'SOAPAction': '""',
                    'Cookie': cookie,
                    // earsivtest uses its own session separate from connectortest
                    // Add Basic Auth as a fallback authentication mechanism
                    ...(docType === 'EARSIV' && this.password ? {
                        'Authorization': 'Basic ' + Buffer.from(`${this.earsivUsername}:${this.password}`).toString('base64')
                    } : {})
                },
                body: soapBody.trim()
            });

            const text = await response.text();
            console.log(`[QNB Response] Status: ${response.status}`);
            console.log(`[QNB Response Full] ${text.substring(0, 1500)}`);

            const fault = extractFault(text);
            if (fault) return { success: false, error: fault };

            if (docType === 'EARSIV') {
                // QNB E-Arşiv returns result inside <return> as a JSON string
                const returnRaw = extractTagContent(text, 'return');
                console.log(`[QNB E-Arşiv] Raw return: ${returnRaw?.substring(0, 500)}`);

                let faturaNo = extractTagContent(text, 'faturaNo');
                let url = extractTagContent(text, 'url') || extractTagContent(text, 'faturaUrl');
                let ettn = extractTagContent(text, 'ettn') || extractTagContent(text, 'faturaUuid');
                const resultCode = extractTagContent(text, 'resultCode');
                const resultText = extractTagContent(text, 'resultText');

                // QNB returns PDF as base64 inside <belgeIcerigi> tag for EARSIV_STATUS check
                let belgeIcerigi = extractTagContent(text, 'belgeIcerigi');
                if (belgeIcerigi) {
                    url = `data:application/pdf;base64,${belgeIcerigi}`;
                    console.log(`[QNB E-Arşiv] Found Base64 PDF Content, length: ${belgeIcerigi.length}`);
                }

                // Try to parse return tag as JSON (QNB wraps results in JSON)
                if (returnRaw) {
                    try {
                        const parsed = JSON.parse(returnRaw);
                        faturaNo = faturaNo || parsed.faturaNo || parsed.belgeNo || parsed.invoiceNo;
                        url = url || parsed.url || parsed.faturaUrl || parsed.pdfUrl || parsed.htmlUrl;
                        ettn = ettn || parsed.ettn || parsed.uuid;

                        // Parse JSON result nested inside resultExtra if exists
                        if (parsed.resultExtra && typeof parsed.resultExtra === 'string') {
                            try {
                                const extraParsed = JSON.parse(parsed.resultExtra);
                                if (extraParsed.faturaOid) {
                                    ettn = ettn || extraParsed.faturaOid;
                                    faturaNo = faturaNo || extraParsed.faturaNo;
                                }
                            } catch (e) { /* ignore */ }
                        }
                    } catch {
                        // Not JSON, try extracting from text directly
                        const noMatch = returnRaw.match(/faturaNo["\s:]+([A-Z0-9]+)/);
                        const urlMatch = returnRaw.match(/https?:\/\/[^\s"<]+/);
                        if (noMatch) faturaNo = faturaNo || noMatch[1];
                        if (urlMatch) url = url || urlMatch[0];
                    }
                }

                console.log(`QNB E-Arşiv Response - No: ${faturaNo}, Code: ${resultCode}, Text: ${resultText ? resultText.substring(0, 50) : ''}... URL: ${url ? 'YES' : 'NO'}`);

                if (resultCode && resultCode !== 'AE00000' && resultCode !== '0') {
                    return { success: false, error: `QNB Error (${resultCode}): ${resultText}` };
                }

                if (faturaNo || ettn) {
                    return { success: true, listId: (faturaNo || ettn) as string, pdfUrl: url || undefined, ettn: ettn || undefined };
                }

                const tempId = 'EP-' + Date.now().toString().slice(-10);
                return { success: true, listId: tempId, pdfUrl: url || undefined, ettn: ettn || undefined };

            } else {
                const resultOid = extractTagContent(text, 'belgeOid');
                if (resultOid) return { success: true, listId: resultOid };
            }

            return { success: false, error: 'Belge gönderildi ancak ID alınamadı.' };
        } catch (error: any) {
            console.error('Send Invoice Error:', error);
            return { success: false, error: error.message };
        }
    }
}
