const escapeXml = (unsafe: string) => {
    if (typeof unsafe !== 'string') return unsafe;
    return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
};

const mapUnitCode = (unit: string) => {
    if (!unit) return 'C62'; // Varsayılan Adet
    const u = unit.toUpperCase().trim();
    switch (u) {
        case 'ADET':
        case 'AD':
        case 'PI':
        case 'PCS':
            return 'C62';
        case 'KG':
        case 'KİLOGRAM':
        case 'KILOGRAM':
            return 'KGM';
        case 'GR':
        case 'GRAM':
            return 'GRM';
        case 'LT':
        case 'LİTRE':
        case 'LITRE':
            return 'LTR';
        case 'METRE':
        case 'M':
            return 'MTR';
        case 'PAKET':
        case 'PK':
            return 'PA';
        case 'KUTU':
            return 'BX';
        default:
            return 'C62';
    }
};

export const generateUBL = (invoice: any, erpCode: string, supplierVkn?: string) => {
    const uuid = crypto.randomUUID();
    const issueDate = new Date().toISOString().split('T')[0];
    const issueTime = new Date().toLocaleTimeString('tr-TR', { hour12: false });

    const profileId = invoice.profileId || (invoice.docType === 'EARSIV' ? 'EARSIVFATURA' : 'TICARIFATURA');

    // Basit UBL 2.1 Şablonu
    return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
 xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
 xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
 xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2"
 xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
 xsi:schemaLocation="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2 UBL-Invoice-2.1.xsd">
    <ext:UBLExtensions>
        <ext:UBLExtension>
            <ext:ExtensionContent/>
        </ext:UBLExtension>
    </ext:UBLExtensions>
    <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
    <cbc:CustomizationID>TR1.2</cbc:CustomizationID>
    <cbc:ProfileID>${profileId}</cbc:ProfileID>
    <cbc:ID>${invoice.invoiceNumber || 'TASLAK-' + uuid.substring(0, 8)}</cbc:ID>
    <cbc:CopyIndicator>false</cbc:CopyIndicator>
    <cbc:UUID>${uuid}</cbc:UUID>
    <cbc:IssueDate>${issueDate}</cbc:IssueDate>
    <cbc:IssueTime>${issueTime}</cbc:IssueTime>
    <cbc:InvoiceTypeCode>SATIS</cbc:InvoiceTypeCode>
    <cbc:Note>Gönderim Şekli: ELEKTRONIK</cbc:Note>
    <cbc:DocumentCurrencyCode>TRY</cbc:DocumentCurrencyCode>
    <cbc:LineCountNumeric>${invoice.lines.length}</cbc:LineCountNumeric>



    <cac:AccountingSupplierParty>
        <cac:Party>
            <cac:PartyIdentification>
                <cbc:ID schemeID="VKN">${supplierVkn || invoice.supplier.vkn}</cbc:ID>
            </cac:PartyIdentification>
            <cac:PartyName>
                <cbc:Name>${escapeXml(invoice.supplier.name)}</cbc:Name>
            </cac:PartyName>
            <cac:PostalAddress>
                <cbc:CitySubdivisionName>${escapeXml(invoice.supplier.district || '')}</cbc:CitySubdivisionName>
                <cbc:CityName>${escapeXml(invoice.supplier.city || '')}</cbc:CityName>
                <cac:AddressLine>
                    <cbc:Line>${escapeXml(invoice.supplier.address || 'ADRES BILGISI YOK')}</cbc:Line>
                </cac:AddressLine>
                <cac:Country>
                    <cbc:Name>Türkiye</cbc:Name>
                </cac:Country>
            </cac:PostalAddress>
            <cac:PartyTaxScheme>
                <cac:TaxScheme>
                    <cbc:Name>${escapeXml(invoice.supplier.taxOffice || 'BILINMIYOR')}</cbc:Name>
                </cac:TaxScheme>
            </cac:PartyTaxScheme>
        </cac:Party>
    </cac:AccountingSupplierParty>
    
    <cac:AccountingCustomerParty>
        <cac:Party>
            <cac:PartyIdentification>
                <cbc:ID schemeID="${invoice.customer.vkn.length === 11 ? 'TCKN' : 'VKN'}">${invoice.customer.vkn}</cbc:ID>
            </cac:PartyIdentification>
            ${invoice.customer.vkn.length === 11 ? `
            <cac:Person>
                <cbc:FirstName>${escapeXml(invoice.customer.name.split(' ')[0] || 'BILINMIYOR')}</cbc:FirstName>
                <cbc:FamilyName>${escapeXml(invoice.customer.name.split(' ').slice(1).join(' ') || invoice.customer.name.split(' ')[0] || 'BILINMIYOR')}</cbc:FamilyName>
            </cac:Person>` : `
            <cac:PartyName>
                <cbc:Name>${escapeXml(invoice.customer.name)}</cbc:Name>
            </cac:PartyName>`}
            <cac:PostalAddress>
                <cbc:CitySubdivisionName>${escapeXml(invoice.customer.district || '')}</cbc:CitySubdivisionName>
                <cbc:CityName>${escapeXml(invoice.customer.city || 'İstanbul')}</cbc:CityName>
                <cbc:PostalZone>${escapeXml(invoice.customer.postalCode || '34000')}</cbc:PostalZone>
                <cac:AddressLine>
                    <cbc:Line>${escapeXml(invoice.customer.address || 'ADRES BILGISI YOK')}</cbc:Line>
                </cac:AddressLine>
                <cac:Country>
                    <cbc:Name>Türkiye</cbc:Name>
                </cac:Country>
            </cac:PostalAddress>
        </cac:Party>
    </cac:AccountingCustomerParty>

    <cac:PaymentMeans>
        <cbc:PaymentMeansCode>1</cbc:PaymentMeansCode>
        <cbc:Note>${escapeXml(invoice.paymentNote || 'Nakit')}</cbc:Note>
        <cbc:PaymentDueDate>${issueDate}</cbc:PaymentDueDate>
        <cbc:InstructionNote>${escapeXml(invoice.paymentNote || 'Nakit')}</cbc:InstructionNote>
    </cac:PaymentMeans>

    <cac:PaymentTerms>
        <cbc:Note>${escapeXml(invoice.paymentNote || 'Nakit')}</cbc:Note>
    </cac:PaymentTerms>

    <cac:TaxTotal>
        <cbc:TaxAmount currencyID="TRY">${Number(invoice.totalVat).toFixed(2)}</cbc:TaxAmount>
        <cac:TaxSubtotal>
            <cbc:TaxableAmount currencyID="TRY">${Number(invoice.subtotal).toFixed(2)}</cbc:TaxableAmount>
            <cbc:TaxAmount currencyID="TRY">${Number(invoice.totalVat).toFixed(2)}</cbc:TaxAmount>
            <cac:TaxCategory>
                <cac:TaxScheme>
                    <cbc:ID>0015</cbc:ID>
                    <cbc:Name>KDV</cbc:Name>
                    <cbc:TaxTypeCode>0015</cbc:TaxTypeCode>
                </cac:TaxScheme>
            </cac:TaxCategory>
        </cac:TaxSubtotal>
    </cac:TaxTotal>

    <cac:LegalMonetaryTotal>
        <cbc:LineExtensionAmount currencyID="TRY">${Number(invoice.subtotal).toFixed(2)}</cbc:LineExtensionAmount>
        <cbc:TaxExclusiveAmount currencyID="TRY">${Number(invoice.subtotal).toFixed(2)}</cbc:TaxExclusiveAmount>
        <cbc:TaxInclusiveAmount currencyID="TRY">${Number(invoice.grandTotal).toFixed(2)}</cbc:TaxInclusiveAmount>
        <cbc:AllowanceTotalAmount currencyID="TRY">0.00</cbc:AllowanceTotalAmount>
        <cbc:PayableAmount currencyID="TRY">${Number(invoice.grandTotal).toFixed(2)}</cbc:PayableAmount>
    </cac:LegalMonetaryTotal>


    ${invoice.lines.map((line: any, index: number) => `
    <cac:InvoiceLine>
        <cbc:ID>${index + 1}</cbc:ID>
        <cbc:InvoicedQuantity unitCode="${mapUnitCode(line.unit)}">${line.quantity}</cbc:InvoicedQuantity>
        <cbc:LineExtensionAmount currencyID="TRY">${(line.quantity * line.price).toFixed(2)}</cbc:LineExtensionAmount>
        <cac:TaxTotal>
            <cbc:TaxAmount currencyID="TRY">${(line.quantity * line.price * (line.vatRate / 100)).toFixed(2)}</cbc:TaxAmount>
            <cac:TaxSubtotal>
                <cbc:TaxableAmount currencyID="TRY">${(line.quantity * line.price).toFixed(2)}</cbc:TaxableAmount>
                <cbc:TaxAmount currencyID="TRY">${(line.quantity * line.price * (line.vatRate / 100)).toFixed(2)}</cbc:TaxAmount>
                <cac:TaxCategory>
                    <cbc:Percent>${line.vatRate}</cbc:Percent>
                    <cac:TaxScheme>
                        <cbc:ID>0015</cbc:ID>
                        <cbc:Name>KDV</cbc:Name>
                        <cbc:TaxTypeCode>0015</cbc:TaxTypeCode>
                    </cac:TaxScheme>
                </cac:TaxCategory>
            </cac:TaxSubtotal>
        </cac:TaxTotal>
        <cac:Item>
            <cbc:Name>${escapeXml(line.name)}</cbc:Name>
        </cac:Item>
        <cac:Price>
            <cbc:PriceAmount currencyID="TRY">${Number(line.price).toFixed(2)}</cbc:PriceAmount>
        </cac:Price>
    </cac:InvoiceLine>`).join('')}
</Invoice>`;
};
