export const SOAP_TEMPLATES = {
   LOGIN: (username: string, pass: string) => `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://service.csap.cs.com.tr/">
   <soapenv:Header/>
   <soapenv:Body>
      <ser:wsLogin>
         <userId>${username}</userId>
         <password>${pass}</password>
         <lang>tr</lang>
      </ser:wsLogin>
   </soapenv:Body>
</soapenv:Envelope>`,

   LOGIN_EARSIV: (username: string, pass: string) => `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://service.earsiv.uut.cs.com.tr/">
   <soapenv:Header/>
   <soapenv:Body>
      <ser:wsLogin>
         <userId>${username}</userId>
         <password>${pass}</password>
         <lang>tr</lang>
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

   CREATE_EARSIV_INVOICE_EXT: (veri: string, vkn: string, erpCode: string, username: string, password: string, islemId: string) => {
      // Raw JSON in XML — no &quot; escaping needed for element content per XML spec
      const inputJson = JSON.stringify({
         islemId: islemId,
         vkn: vkn,
         sube: "DFLT",
         kasa: "DFLT",
         donenBelgeFormati: "3", // 3: PDF formatı iste
         erpKodu: erpCode,
         numaraVerilsinMi: 1
      });

      return `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://service.earsiv.uut.cs.com.tr/" xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
   <soapenv:Header>
      <wsse:Security>
         <wsse:UsernameToken>
            <wsse:Username>${username}</wsse:Username>
            <wsse:Password>${password}</wsse:Password>
         </wsse:UsernameToken>
      </wsse:Security>
   </soapenv:Header>
   <soapenv:Body>
      <ser:faturaOlusturExt>
         <input>${inputJson}</input>
         <fatura>
            <belgeFormati>UBL</belgeFormati>
            <belgeIcerigi>${veri}</belgeIcerigi>
         </fatura>
      </ser:faturaOlusturExt>
   </soapenv:Body>
</soapenv:Envelope>`;
   },

   EARSIV_STATUS: (vkn: string, faturaNo: string, username: string, password: string) => {
      const inputJson = JSON.stringify({
         vkn: vkn,
         sube: "DFLT",
         kasa: "DFLT",
         donenBelgeFormati: "3",
         faturaNo: faturaNo
      });

      return `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://service.earsiv.uut.cs.com.tr/" xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
   <soapenv:Header>
      <wsse:Security>
         <wsse:UsernameToken>
            <wsse:Username>${username}</wsse:Username>
            <wsse:Password>${password}</wsse:Password>
         </wsse:UsernameToken>
      </wsse:Security>
   </soapenv:Header>
   <soapenv:Body>
      <ser:faturaSorgulaExt>
         <input>${inputJson}</input>
      </ser:faturaSorgulaExt>
   </soapenv:Body>
</soapenv:Envelope>`;
   },

   EARSIV_STATUS_BY_UUID: (vkn: string, uuid: string, username: string, password: string) => {
      const inputJson = JSON.stringify({
         vkn: vkn,
         sube: "DFLT",
         kasa: "DFLT",
         donenBelgeFormati: "3",
         faturaUuid: uuid
      });

      return `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://service.earsiv.uut.cs.com.tr/" xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
   <soapenv:Header>
      <wsse:Security>
         <wsse:UsernameToken>
            <wsse:Username>${username}</wsse:Username>
            <wsse:Password>${password}</wsse:Password>
         </wsse:UsernameToken>
      </wsse:Security>
   </soapenv:Header>
   <soapenv:Body>
      <ser:faturaSorgulaExt>
         <input>${inputJson}</input>
      </ser:faturaSorgulaExt>
   </soapenv:Body>
</soapenv:Envelope>`;
   }
};
