/**
 * QNB e-Finans (e-Solutions) API Client
 * Advanced UBL-TR 2.1 Implementation
 */

export interface QNBConfig {
    vkn: string;
    username: string;
    password: string;
    isTest: boolean;
}

export class QNBClient {
    private config: QNBConfig;
    private baseUrl: string;

    constructor(config: QNBConfig) {
        this.config = config;
        this.baseUrl = config.isTest
            ? "https://earsivtest.efinans.com/v2/UnitArsivService"
            : "https://earsiv.efinans.com/v2/UnitArsivService";
    }

    private getHeaders() {
        const auth = btoa(unescape(encodeURIComponent(`${this.config.username}:${this.config.password}`)));
        return {
            "Authorization": `Basic ${auth}`,
            "Content-Type": "text/xml;charset=UTF-8",
            "SOAPAction": ""
        };
    }

    /**
     * Tam Detaylı UBL-TR 2.1 XML Oluşturucu
     */
    private createUBLXML(invoiceData: any) {
        const now = new Date().toISOString();
        const dateStr = now.split('T')[0];
        const timeStr = now.split('T')[1].split('.')[0];
        const uuid = crypto.randomUUID();

        // Toplam Vergi Hesaplama
        const totalVat = invoiceData.items.reduce((sum: number, item: any) => sum + (item.vatAmount || 0), 0);
        const totalLineAmount = invoiceData.items.reduce((sum: number, item: any) => sum + (item.lineTotal || 0), 0);
        const payableAmount = totalLineAmount + totalVat;

        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
    <cbc:CustomizationID>TR1.2</cbc:CustomizationID>
    <cbc:ProfileID>EARSIVFATURA</cbc:ProfileID>
    <cbc:ID>JET${Date.now()}</cbc:ID>
    <cbc:UUID>${uuid}</cbc:UUID>
    <cbc:IssueDate>${dateStr}</cbc:IssueDate>
    <cbc:IssueTime>${timeStr}</cbc:IssueTime>
    <cbc:InvoiceTypeCode>SATIS</cbc:InvoiceTypeCode>
    <cbc:DocumentCurrencyCode>TRY</cbc:DocumentCurrencyCode>
    
    <cac:AccountingSupplierParty>
        <cac:Party>
            <cac:PartyIdentification>
                <cbc:ID schemeID="VKN">${this.config.vkn}</cbc:ID>
            </cac:PartyIdentification>
            <cac:Contact>
                <cbc:ElectronicMail>info@jetpos.app</cbc:ElectronicMail>
            </cac:Contact>
        </cac:Party>
    </cac:AccountingSupplierParty>

    <cac:AccountingCustomerParty>
        <cac:Party>
            <cac:PartyIdentification>
                <cbc:ID schemeID="${invoiceData.customerVkn?.length === 11 ? 'TCKN' : 'VKN'}">${invoiceData.customerVkn || '11111111111'}</cbc:ID>
            </cac:PartyIdentification>
            <cac:PartyName>
                <cbc:Name>${invoiceData.customerName}</cbc:Name>
            </cac:PartyName>
            <cac:PostalAddress>
                <cbc:StreetName>${invoiceData.address || 'İSTANBUL'}</cbc:StreetName>
                <cbc:CitySubdivisionName>${invoiceData.district || 'ESENYURT'}</cbc:CitySubdivisionName>
                <cbc:CityName>${invoiceData.city || 'İSTANBUL'}</cbc:CityName>
                <cac:Country>
                    <cbc:Name>TÜRKİYE</cbc:Name>
                </cac:Country>
            </cac:PostalAddress>
        </cac:Party>
    </cac:AccountingCustomerParty>

    <cac:TaxTotal>
        <cbc:TaxAmount currencyID="TRY">${totalVat.toFixed(2)}</cbc:TaxAmount>
        <cac:TaxSubtotal>
            <cbc:TaxableAmount currencyID="TRY">${totalLineAmount.toFixed(2)}</cbc:TaxableAmount>
            <cbc:TaxAmount currencyID="TRY">${totalVat.toFixed(2)}</cbc:TaxAmount>
            <cac:TaxCategory>
                <cac:TaxScheme>
                    <cbc:Name>KDV</cbc:Name>
                    <cbc:TaxTypeCode>0015</cbc:TaxTypeCode>
                </cac:TaxScheme>
            </cac:TaxCategory>
        </cac:TaxSubtotal>
    </cac:TaxTotal>

    <cac:LegalMonetaryTotal>
        <cbc:LineExtensionAmount currencyID="TRY">${totalLineAmount.toFixed(2)}</cbc:LineExtensionAmount>
        <cbc:TaxExclusiveAmount currencyID="TRY">${totalLineAmount.toFixed(2)}</cbc:TaxExclusiveAmount>
        <cbc:TaxInclusiveAmount currencyID="TRY">${payableAmount.toFixed(2)}</cbc:TaxInclusiveAmount>
        <cbc:PayableAmount currencyID="TRY">${payableAmount.toFixed(2)}</cbc:PayableAmount>
    </cac:LegalMonetaryTotal>`;

        // Ürün Satırları
        invoiceData.items.forEach((item: any, index: number) => {
            xml += `
    <cac:InvoiceLine>
        <cbc:ID>${index + 1}</cbc:ID>
        <cbc:InvoicedQuantity unitCode="${item.unit || 'C62'}">${item.quantity}</cbc:InvoicedQuantity>
        <cbc:LineExtensionAmount currencyID="TRY">${(item.quantity * item.price).toFixed(2)}</cbc:LineExtensionAmount>
        <cac:TaxTotal>
            <cbc:TaxAmount currencyID="TRY">${(item.vatAmount || 0).toFixed(2)}</cbc:TaxAmount>
            <cac:TaxSubtotal>
                <cbc:TaxableAmount currencyID="TRY">${(item.quantity * item.price).toFixed(2)}</cbc:TaxableAmount>
                <cbc:TaxAmount currencyID="TRY">${(item.vatAmount || 0).toFixed(2)}</cbc:TaxAmount>
                <cbc:Percent>${item.vatRate || 20}</cbc:Percent>
                <cac:TaxCategory>
                    <cac:TaxScheme>
                        <cbc:Name>KDV</cbc:Name>
                        <cbc:TaxTypeCode>0015</cbc:TaxTypeCode>
                    </cac:TaxScheme>
                </cac:TaxCategory>
            </cac:TaxSubtotal>
        </cac:TaxTotal>
        <cac:Item>
            <cbc:Name>${item.name}</cbc:Name>
        </cac:Item>
        <cac:Price>
            <cbc:PriceAmount currencyID="TRY">${item.price.toFixed(2)}</cbc:PriceAmount>
        </cac:Price>
    </cac:InvoiceLine>`;
        });

        xml += `\n</Invoice>`;
        return xml;
    }

    async sendInvoice(invoiceData: any) {
        const ublContent = this.createUBLXML(invoiceData);
        const encodedContent = btoa(unescape(encodeURIComponent(ublContent)));

        const soapEnvelope = `
            <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://service.connector.efinans.com.tr/">
                <soapenv:Header/>
                <soapenv:Body>
                    <ser:saveDocument>
                        <documentContent>${encodedContent}</documentContent>
                        <documentType>INVOICE</documentType>
                    </ser:saveDocument>
                </soapenv:Body>
            </soapenv:Envelope>
        `;

        try {
            const response = await fetch("/api/qnb", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    url: this.baseUrl,
                    headers: this.getHeaders(),
                    soapEnvelope: soapEnvelope
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: "Banka sunucusu yanıt vermedi" }));
                throw new Error(errorData.message || "Banka Reddi");
            }

            return { success: true, message: "Fatura başarıyla taslak olarak iletildi." };
        } catch (error: any) {
            console.error("QNB API Error:", error);
            throw error;
        }
    }
}
