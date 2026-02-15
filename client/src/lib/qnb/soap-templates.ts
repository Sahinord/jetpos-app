export const SOAP_TEMPLATES = {
   LOGIN: (username: string, pass: string) => `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://service.connector.elenx.com.tr">
   <soapenv:Header/>
   <soapenv:Body>
      <ser:wsLogin>
         <ser:kullaniciKodu>${username}</ser:kullaniciKodu>
         <ser:sifre>${pass}</ser:sifre>
         <ser:dil>tr</ser:dil>
      </ser:wsLogin>
   </soapenv:Body>
</soapenv:Envelope>`,

   SEND_DOCUMENT_EXT: (sessionId: string, vkn: string, docType: string, docNo: string, b64Data: string, docHash: string, erpCode: string) => `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://service.connector.elenx.com.tr">
   <soapenv:Header/>
   <soapenv:Body>
      <ser:belgeGonderExt>
         <ser:vergiTcKimlikNo>${vkn}</ser:vergiTcKimlikNo>
         <ser:belgeTuru>${docType}</ser:belgeTuru>
         <ser:belgeNo>${docNo}</ser:belgeNo>
         <ser:veri>${b64Data}</ser:veri>
         <ser:belgeHash>${docHash}</ser:belgeHash>
         <ser:mimeType>application/xml</ser:mimeType>
         <ser:belgeVersiyon>1.0</ser:belgeVersiyon>
         <ser:erpKodu>${erpCode}</ser:erpKodu>
      </ser:belgeGonderExt>
   </soapenv:Body>
</soapenv:Envelope>`,

   CHECK_STATUS_EXT: (vkn: string, docNo: string, docType: string) => `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://service.connector.elenx.com.tr">
   <soapenv:Header/>
   <soapenv:Body>
      <ser:gidenBelgeDurumSorgulaExt>
         <ser:vergiTcKimlikNo>${vkn}</ser:vergiTcKimlikNo>
         <ser:belgeNo>${docNo}</ser:belgeNo>
         <ser:belgeNoTip>YEREL</ser:belgeNoTip>
         <ser:belgeTuru>${docType}</ser:belgeTuru>
      </ser:gidenBelgeDurumSorgulaExt>
   </soapenv:Body>
</soapenv:Envelope>`,

   CREATE_EARSIV_INVOICE_EXT: (vkn: string, sube: string, kasa: string, faturaTarihi: string, veri: string, hash: string, erpCode: string) => `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://service.earsiv.elenx.com.tr">
   <soapenv:Header/>
   <soapenv:Body>
      <ser:faturaOlusturExt>
         <ser:vergiTcKimlikNo>${vkn}</ser:vergiTcKimlikNo>
         <ser:sube>${sube}</ser:sube>
         <ser:kasa>${kasa}</ser:kasa>
         <ser:faturaTarihi>${faturaTarihi}</ser:faturaTarihi>
         <ser:faturaVerisi>${veri}</ser:faturaVerisi>
         <ser:belgeHash>${hash}</ser:belgeHash>
         <ser:belgeFormati>UBL</ser:belgeFormati>
         <ser:erpKodu>${erpCode}</ser:erpKodu>
      </ser:faturaOlusturExt>
   </soapenv:Body>
</soapenv:Envelope>`
};
