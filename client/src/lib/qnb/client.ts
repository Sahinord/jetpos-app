
import { SOAP_TEMPLATES } from './soap-templates';
import { QNBLoginResponse, QNBDocumentStatus } from './types';
import { generateUBL } from './ubl-builder';
import crypto from 'crypto';

// Regex Helpers
const extractTagContent = (xml: string, tagName: string): string | null => {
    const regex = new RegExp(`<([a-zA-Z0-9]+:)?${tagName}>(.*?)<\/([a-zA-Z0-9]+:)?${tagName}>`, 's');
    const match = xml.match(regex);
    return match ? match[2] : null;
};

const extractFault = (xml: string): string | null => {
    const faultString = extractTagContent(xml, 'faultstring');
    if (faultString) return faultString;

    if (xml.includes('<soapenv:Fault>') || xml.includes('<soap:Fault>')) return 'Bilinmeyen SOAP Hatası';
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

    constructor() {
        this.baseUrl = process.env.QNB_BASE_URL || 'https://erpefaturatest1.qnbesolutions.com.tr';
        this.earsivBaseUrl = process.env.QNB_EARSIV_BASE_URL || 'https://earsivtest.qnbesolutions.com.tr';
        this.connectorTestUrl = process.env.QNB_CONNECTOR_TEST_URL || 'https://connectortest.qnbesolutions.com.tr';

        this.vkn = process.env.QNB_TEST_VKN || '';
        this.earsivUsername = process.env.QNB_EARSIV_USERNAME || (this.vkn + '.portaltest');
        this.erpCode = process.env.QNB_ERP_CODE || 'JET31270';
        this.password = process.env.QNB_TEST_PASSWORD;
    }

    /**
     * Updated Login Logic based on latest documentation
     */
    async login(serviceType: 'EFATURA' | 'EARSIV' = 'EFATURA'): Promise<QNBLoginResponse> {
        if (!this.password || this.password === 'CHANGE_ME_FROM_MAIL') {
            return { success: false, error: 'Şifre tanımlanmamış (.env.local kontrol edin)' };
        }

        let endpoint = '';
        let username = '';

        if (serviceType === 'EFATURA') {
            // e-Fatura Login
            endpoint = `${this.baseUrl}/efatura/ws/connectorService`;
            username = this.vkn;
        } else {
            // e-Arşiv Login
            // Tahmin: wsLogin metodu userService değil connectorService üzerindedir.
            endpoint = `${this.connectorTestUrl}/connector/ws/connectorService`;
            // Mailde userService yazsa da session required hatası, wsLogin'in orada olmadığını veya o servisin session beklediğini gösteriyor.
            username = this.earsivUsername;
        }

        const soapBody = SOAP_TEMPLATES.LOGIN(username, this.password);

        try {
            console.log(`QNB Login Attempt (${serviceType}) -> ${endpoint} User: ${username}`);

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/xml;charset=UTF-8',
                    'SOAPAction': ''
                },
                body: soapBody.trim()
            });

            const text = await response.text();

            // Check for Fault
            const fault = extractFault(text);
            if (fault) {
                console.error(`QNB Login Fault (${serviceType}):`, fault);
                return { success: false, error: fault };
            }

            const cookieHeader = response.headers.get('set-cookie');
            let sessionCookie = '';

            if (cookieHeader) {
                // Parsing JSESSIONID
                sessionCookie = cookieHeader.split(';')[0];
            }

            const returnVal = extractTagContent(text, 'return');

            // Eğer return true döndüyse ve cookie varsa işlem tamamdır.
            if (returnVal === 'true' || sessionCookie) {
                if (serviceType === 'EFATURA') {
                    this.efaturaCookie = sessionCookie || 'SESSION_ESTABLISHED';
                } else {
                    this.earsivCookie = sessionCookie || 'SESSION_ESTABLISHED';
                }
                return { success: true, sessionId: sessionCookie || 'SESSION_ESTABLISHED' };
            }

            // Return değeri doğrudan sessionID olabilir
            if (returnVal && returnVal.length > 10) {
                const cookieVal = `JSESSIONID=${returnVal}`;
                if (serviceType === 'EFATURA') {
                    this.efaturaCookie = cookieVal;
                } else {
                    this.earsivCookie = cookieVal;
                }
                return { success: true, sessionId: returnVal };
            }

            return { success: false, error: 'Oturum açılamadı (Cookie veya return true yok)' };

        } catch (error: any) {
            console.error('QNB Login Network Error:', error);
            return { success: false, error: error.message };
        }
    }

    async checkDocumentStatus(docNo: string, docType: string = 'FATURA'): Promise<QNBDocumentStatus | null> {
        const endpoint = `${this.baseUrl}/efatura/ws/connectorService`;

        if (!this.efaturaCookie) {
            const loginRes = await this.login('EFATURA');
            if (!loginRes.success) throw new Error('Login failed: ' + loginRes.error);
        }

        const soapBody = SOAP_TEMPLATES.CHECK_STATUS_EXT(this.vkn, docNo, docType);

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/xml;charset=UTF-8',
                    'SOAPAction': '',
                    'Cookie': this.efaturaCookie || ''
                },
                body: soapBody.trim()
            });

            const text = await response.text();
            const fault = extractFault(text);
            if (fault) throw new Error(fault);

            const durum = extractTagContent(text, 'durum');
            const ettn = extractTagContent(text, 'ettn');

            if (!durum) return null;

            return {
                belgeNo: docNo,
                durum,
                ettn: ettn || '',
                gonderimDurumu: ''
            };

        } catch (error) {
            console.error("Status Check Error:", error);
            return null;
        }
    }

    async sendInvoice(invoiceData: any, docType: 'EFATURA' | 'EARSIV' = 'EFATURA'): Promise<{ success: boolean; listId?: string; error?: string; pdfUrl?: string }> {

        let endpoint = '';
        let soapBody = '';
        let cookie = '';

        // 1. Generate UBL XML
        const ublXml = generateUBL(invoiceData, this.erpCode);
        const b64Data = Buffer.from(ublXml, 'utf-8').toString('base64');
        const docHash = crypto.createHash('md5').update(ublXml).digest('hex').toUpperCase();
        const docNo = invoiceData.invoiceNumber || 'TASLAK-' + Date.now();

        if (docType === 'EARSIV') {
            // e-Arşiv Login
            if (!this.earsivCookie) {
                const loginRes = await this.login('EARSIV');
                if (!loginRes.success) throw new Error('e-Arşiv Login failed: ' + loginRes.error);
            }
            cookie = this.earsivCookie || '';
            endpoint = `${this.earsivBaseUrl}/earsiv/ws/EarsivWebService`; // QNB Mail: earsivtest/earsiv/ws/EarsivWebService

            soapBody = SOAP_TEMPLATES.CREATE_EARSIV_INVOICE_EXT(
                this.vkn,
                'MERKEZ',
                'KASA1',
                new Date().toISOString().split('T')[0], // YYYY-MM-DD
                b64Data,
                docHash,
                this.erpCode
            );

        } else {
            // e-Fatura Login
            if (!this.efaturaCookie) {
                const loginRes = await this.login('EFATURA');
                if (!loginRes.success) throw new Error('e-Fatura Login failed: ' + loginRes.error);
            }
            cookie = this.efaturaCookie || '';
            endpoint = `${this.baseUrl}/efatura/ws/connectorService`;

            soapBody = SOAP_TEMPLATES.SEND_DOCUMENT_EXT(
                cookie,
                this.vkn,
                'FATURA_UBL',
                docNo,
                b64Data,
                docHash,
                this.erpCode
            );
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
                console.error(`QNB Send Invoice Fault (${docType}):`, fault);
                return { success: false, error: fault };
            }

            if (docType === 'EARSIV') {
                const faturaNo = extractTagContent(text, 'faturaNo');
                const url = extractTagContent(text, 'url');

                if (faturaNo) {
                    return { success: true, listId: faturaNo, pdfUrl: url || undefined };
                }
                console.log('e-Arşiv Response:', text.substring(0, 500));
                return { success: true, listId: 'EARSIV_PENDING' };

            } else {
                const resultOid = extractTagContent(text, 'belgeOid');
                if (resultOid) {
                    return { success: true, listId: resultOid };
                }
            }

            return { success: false, error: 'Belge gönderildi ancak ID alınamadı.' };

        } catch (error: any) {
            console.error('Send Invoice Error:', error);
            return { success: false, error: error.message };
        }
    }
}
