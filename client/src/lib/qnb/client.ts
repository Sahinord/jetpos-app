
import { SOAP_TEMPLATES } from './soap-templates';
import { QNBLoginResponse, QNBDocumentStatus } from './types';
import { generateUBL } from './ubl-builder';
import crypto from 'crypto';

// Regex Helpers
const extractTagContent = (xml: string, tag: string): string | null => {
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

// Timeout Fetch Helper - 90 saniye (QNB bazen çok yavaş PDF üretir)
async function fetchWithTimeout(url: string, options: any = {}, timeout = 90000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    } catch (err) {
        clearTimeout(id);
        throw err;
    }
}

export class QNBClient {
    private baseUrl: string;
    private earsivBaseUrl: string;
    private connectorBaseUrl: string;
    private vkn: string;
    private earsivUsername: string;
    private erpCode: string;
    private password?: string;
    private branchCode: string;
    private counterCode: string;
    private isTest: boolean;

    private efaturaCookie?: string;
    private earsivCookie?: string;

    constructor(config?: { qnb?: any }) {
        const qnb = config?.qnb || {};
        this.isTest = qnb.isTest !== false;

        this.baseUrl = qnb.baseUrl || (this.isTest ? 'https://erpefaturatest1.qnbesolutions.com.tr' : 'https://efaturaconnector.qnbesolutions.com.tr');
        this.earsivBaseUrl = qnb.earsivBaseUrl || (this.isTest ? 'https://portaltest.qnbesolutions.com.tr' : 'https://earsivconnector.qnbesolutions.com.tr');
        this.connectorBaseUrl = qnb.connectorBaseUrl || (this.isTest ? 'https://connectortest.qnbesolutions.com.tr' : 'https://connector.qnbesolutions.com.tr');

        if (this.isTest) {
            this.vkn = qnb.testVkn || '';
            this.password = qnb.testPassword || '';
            this.earsivUsername = qnb.testEarsivUsername || qnb.earsivUsername || this.vkn;
        } else {
            // CANLI MOD: Test bilgilerine fallback yapmıyoruz ki hata net anlaşılsın
            this.vkn = qnb.vkn || '';
            this.password = qnb.password || '';
            this.earsivUsername = qnb.earsivUsername || this.vkn;
            
            if (!this.vkn || this.vkn === '7910101045') {
               console.error(`[QNB Client] KRİTİK HATA: Canlı moddasınız ama VKN eksik veya Test VKN (7910101045) girilmiş!`);
            }
        }

        this.erpCode = qnb.erpCode || '';
        this.branchCode = qnb.branchCode || '';
        this.counterCode = qnb.counterCode || '';
    }

    private async handleConnectorResponse(response: any, text: string, earsivSessionCookie: string, _serviceType: string): Promise<QNBLoginResponse> {
        const connectorCookie = response.headers.get('set-cookie');
        let connectorSessionCookie = '';
        if (connectorCookie) connectorSessionCookie = connectorCookie.split(';')[0];

        const returnVal = extractTagContent(text, 'return');
        let jsessionId = '';
        if (connectorSessionCookie) {
            const tokenVal = connectorSessionCookie.split('=').slice(1).join('=');
            if (tokenVal) jsessionId = `JSESSIONID=${tokenVal}`;
        }

        const allCookies = [earsivSessionCookie, connectorSessionCookie, jsessionId]
            .filter(Boolean).join('; ');

        if (returnVal === 'true' || connectorSessionCookie || earsivSessionCookie) {
            this.earsivCookie = allCookies || 'SESSION_ESTABLISHED';
            return { success: true, sessionId: this.earsivCookie };
        }

        if (returnVal && returnVal.length > 10) {
            this.earsivCookie = `JSESSIONID=${returnVal}`;
            return { success: true, sessionId: returnVal };
        }

        return { success: false, error: 'Oturum bilgisi alınamadı' };
    }

    async login(serviceType: 'EFATURA' | 'EARSIV' = 'EFATURA'): Promise<QNBLoginResponse> {
        console.log(`[QNB Client] Logging in to ${serviceType} (Env: ${this.isTest ? 'TEST' : 'PRODUCTION'})...`);
        
        if (!this.vkn || this.vkn === '7910101045' && !this.isTest) {
            return { success: false, error: 'CANLI MOD aktif ancak gerçek VKN tanımlanmamış veya hatalı.' };
        }
        
        if (!this.password) {
            return { success: false, error: 'QNB Şifresi tanımlanmamış. Lütfen ayarları kontrol edin.' };
        }

        const pass = this.password;

        if (serviceType === 'EARSIV') {
            const username = this.earsivUsername;
            try {
                const earsivEndpoint = `${this.earsivBaseUrl}/earsiv/ws/EarsivWebService`;
                let earsivSessionCookie = '';
                try {
                    console.log(`[QNB Client] Step 1: GET Session Cookie from ${earsivEndpoint}`);
                    const initRes = await fetchWithTimeout(earsivEndpoint, { method: 'GET' }, 8000);
                    const initCookie = initRes.headers.get('set-cookie');
                    if (initCookie) {
                        earsivSessionCookie = initCookie.split(';')[0];
                        console.log(`[QNB Client] Session Cookie received: ${earsivSessionCookie}`);
                    }
                } catch (e) { 
                    console.log(`[QNB Client] Step 1 (Session) skipped or failed:`, e); 
                }

                const connectorUrl = `${this.connectorBaseUrl}/connector/ws/userService`;
                console.log(`[QNB Client] Step 2: Login via ${connectorUrl}`);
                const loginHeaders: Record<string, string> = {
                    'Content-Type': 'text/xml;charset=UTF-8',
                    'SOAPAction': '""'
                };
                if (earsivSessionCookie) loginHeaders['Cookie'] = earsivSessionCookie;

                const loginRes = await fetchWithTimeout(connectorUrl, {
                    method: 'POST',
                    headers: loginHeaders,
                    body: SOAP_TEMPLATES.LOGIN(username, pass).trim()
                });
                const loginText = await loginRes.text();
                const loginFault = extractFault(loginText);
                
                if (loginFault) {
                    console.log(`[QNB Client] Login Error: ${loginFault}`);
                    if (this.vkn !== username) {
                        console.log(`[QNB Client] Retrying with VKN instead of username...`);
                        const fallbackRes = await fetchWithTimeout(connectorUrl, {
                            method: 'POST',
                            headers: loginHeaders,
                            body: SOAP_TEMPLATES.LOGIN(this.vkn, pass).trim()
                        });
                        const fallbackText = await fallbackRes.text();
                        const fallbackFault = extractFault(fallbackText);
                        if (!fallbackFault) {
                            return this.handleConnectorResponse(fallbackRes, fallbackText, earsivSessionCookie, serviceType);
                        }
                    }
                    return { success: false, error: loginFault };
                }

                console.log(`[QNB Client] Login Success!`);
                return this.handleConnectorResponse(loginRes, loginText, earsivSessionCookie, serviceType);
            } catch (err: any) {
                console.error(`[QNB Client] Login Exception:`, err);
                return { success: false, error: `Bağlantı Hatası: ${err.message}` };
            }
        }

        const username = this.vkn;
        const servicePath = this.baseUrl.includes('efaturaconnector') ? '/connector/ws/connectorService' : '/efatura/ws/connectorService';
        const url = `${this.baseUrl}${servicePath}`;

        try {
            console.log(`[QNB Client] E-Fatura Login to ${url}`);
            const response = await fetchWithTimeout(url, {
                method: 'POST',
                headers: { 'Content-Type': 'text/xml;charset=UTF-8', 'SOAPAction': '""' },
                body: SOAP_TEMPLATES.LOGIN(username, pass).trim()
            });

            const text = await response.text();
            const fault = extractFault(text);

            if (!fault) {
                console.log(`[QNB Client] E-Fatura Login Success!`);
                return this.processLoginResponse(text, response.headers, serviceType);
            }

            console.log(`[QNB Client] E-Fatura Login Fault: ${fault}`);
            return { success: false, error: fault };
        } catch (err: any) {
            console.error(`[QNB Client] E-Fatura Login Exception:`, err);
            return { success: false, error: `Bağlantı Hatası: ${err.message}` };
        }
    }

    private processLoginResponse(text: string, headers: Headers, serviceType: string): QNBLoginResponse {
        const cookieHeader = headers.get('set-cookie');
        let sessionCookie = '';

        if (cookieHeader) {
            sessionCookie = cookieHeader.split(';')[0];
        }

        const returnVal = extractTagContent(text, 'return');

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
            soapBody = SOAP_TEMPLATES.EARSIV_STATUS(this.vkn, docNo, this.earsivUsername, this.password || '', this.branchCode, this.counterCode);
        } else {
            const servicePath = this.baseUrl.includes('efaturaconnector') ? '/connector/ws/connectorService' : '/efatura/ws/connectorService';
            endpoint = `${this.baseUrl}${servicePath}`;
            if (!this.efaturaCookie) {
                const loginRes = await this.login('EFATURA');
                if (!loginRes.success) throw new Error('EFATURA Login failed: ' + loginRes.error);
            }
            cookie = this.efaturaCookie || '';
            soapBody = SOAP_TEMPLATES.CHECK_STATUS_EXT(this.vkn, docNo, docType);
        }

        try {
            const response = await fetchWithTimeout(endpoint, {
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
            if (fault) return null;

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
        } catch {
            return null;
        }
    }

    async sendInvoice(invoiceData: any, docType: 'EFATURA' | 'EARSIV' = 'EFATURA'): Promise<{ success: boolean; listId?: string; error?: string; pdfUrl?: string; ettn?: string }> {
        let endpoint = '';
        let soapBody = '';
        let cookie = '';

        console.log(`[QNB Client] Sending ${docType} invoice (Supplier VKN: ${this.vkn}, ERP: ${this.erpCode})...`);

        const ublXml = generateUBL(invoiceData, this.erpCode, this.vkn);
        const b64Data = Buffer.from(ublXml, 'utf-8').toString('base64');
        const docHash = crypto.createHash('md5').update(ublXml).digest('hex').toUpperCase();

        if (docType === 'EARSIV') {
            endpoint = `${this.earsivBaseUrl}/earsiv/ws/EarsivWebService`;
            if (!this.earsivCookie) {
                const loginRes = await this.login('EARSIV');
                if (!loginRes.success) return { success: false, error: `QNB Oturum Hatası: ${loginRes.error}` };
            }
            cookie = this.earsivCookie || '';
            soapBody = SOAP_TEMPLATES.CREATE_EARSIV_INVOICE_EXT(b64Data, this.vkn, this.erpCode, this.earsivUsername, this.password || '', crypto.randomUUID(), this.branchCode, this.counterCode);
            console.log(`[QNB Client] FULL SOAP Body:`, soapBody);
        } else {
            if (!this.efaturaCookie) {
                const loginRes = await this.login('EFATURA');
                if (!loginRes.success) return { success: false, error: `QNB Oturum Hatası: ${loginRes.error}` };
            }
            cookie = this.efaturaCookie || '';
            const servicePath = this.baseUrl.includes('efaturaconnector') ? '/connector/ws/connectorService' : '/efatura/ws/connectorService';
            endpoint = `${this.baseUrl}${servicePath}`;
            soapBody = SOAP_TEMPLATES.SEND_DOCUMENT_EXT(cookie, this.vkn, 'FATURA_UBL', invoiceData.invoiceNumber || 'TASLAK-' + Date.now(), b64Data, docHash, this.erpCode);
        }

        try {
            console.log(`[QNB Client] SOAP Body Preview: ${soapBody.slice(0, 500)}...`);
            console.log(`[QNB Client] Posting invoice to ${endpoint} (Timeout: 90s)`);
            const response = await fetchWithTimeout(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/xml;charset=UTF-8',
                    'SOAPAction': '""',
                    'Cookie': cookie
                },
                body: soapBody.trim()
            }, 90000);

            const text = await response.text();
            console.log(`[QNB Client] Response received (${text.length} chars)`);
            const fault = extractFault(text);
            if (fault) {
                console.error(`[QNB Client] SOAP Fault: ${fault}`);
                return { success: false, error: fault };
            }

            if (docType === 'EARSIV') {
                const returnRaw = extractTagContent(text, 'return');
                let faturaNo = extractTagContent(text, 'faturaNo');
                let url = extractTagContent(text, 'url') || extractTagContent(text, 'faturaUrl');
                let ettn = extractTagContent(text, 'ettn') || extractTagContent(text, 'faturaUuid');
                const resultCode = extractTagContent(text, 'resultCode');
                const resultText = extractTagContent(text, 'resultText');

                if (returnRaw) {
                    try {
                        const parsed = JSON.parse(returnRaw);
                        faturaNo = faturaNo || parsed.faturaNo || parsed.belgeNo || parsed.invoiceNo;
                        url = url || parsed.url || parsed.faturaUrl || parsed.pdfUrl || parsed.htmlUrl;
                        ettn = ettn || parsed.ettn || parsed.uuid;
                    } catch {
                        const noMatch = returnRaw.match(/faturaNo["\s:]+([A-Z0-9]+)/);
                        const urlMatch = returnRaw.match(/https?:\/\/[^\s"<]+/);
                        if (noMatch) faturaNo = faturaNo || noMatch[1];
                        if (urlMatch) url = url || urlMatch[0];
                    }
                }

                if (url && typeof url === 'string' && !url.startsWith('http') && !url.startsWith('data:')) {
                    url = `data:application/pdf;base64,${url}`;
                }

                if (resultCode && resultCode !== 'AE00000' && resultCode !== '0') {
                    console.error(`[QNB Client] Business Error (${resultCode}): ${resultText}`);
                    return { success: false, error: `QNB İşlem Hatası (${resultCode}): ${resultText}` };
                }

                console.log(`[QNB Client] Invoice successfully sent! No: ${faturaNo}`);
                return { 
                    success: true, 
                    listId: (faturaNo || ettn || 'EP-' + Date.now()) as string, 
                    pdfUrl: url || undefined, 
                    ettn: ettn || undefined 
                };
            } else {
                const resultOid = extractTagContent(text, 'belgeOid');
                console.log(`[QNB Client] E-Fatura sent! OID: ${resultOid}`);
                if (resultOid) return { success: true, listId: resultOid };
            }

            return { success: false, error: 'Belge gönderildi ancak ID alınamadı.' };
        } catch (error: any) {
            console.error(`[QNB Client] Send Error:`, error);
            if (error.name === 'AbortError' || error.message?.includes('aborted')) {
                return { success: false, error: 'QNB Sunucusu cevap vermedi (Zaman Aşımı: 90sn). Fatura QNB portalına düşmüş olabilir, lütfen kontrol edin.' };
            }
            return { success: false, error: `Sunucu Hatası: ${error.message}` };
        }
    }
}
