"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SOAP_TEMPLATES = void 0;
exports.SOAP_TEMPLATES = {
    LOGIN: function (username, pass) { return "\n<soapenv:Envelope xmlns:soapenv=\"http://schemas.xmlsoap.org/soap/envelope/\" xmlns:ser=\"http://service.csap.cs.com.tr/\">\n   <soapenv:Header/>\n   <soapenv:Body>\n      <ser:wsLogin>\n         <userId>".concat(username, "</userId>\n         <password>").concat(pass, "</password>\n         <lang>tr</lang>\n      </ser:wsLogin>\n   </soapenv:Body>\n</soapenv:Envelope>"); },
    LOGIN_EARSIV: function (username, pass) { return "\n<soapenv:Envelope xmlns:soapenv=\"http://schemas.xmlsoap.org/soap/envelope/\" xmlns:ser=\"http://service.earsiv.uut.cs.com.tr/\">\n   <soapenv:Header/>\n   <soapenv:Body>\n      <ser:wsLogin>\n         <userId>".concat(username, "</userId>\n         <password>").concat(pass, "</password>\n         <lang>tr</lang>\n      </ser:wsLogin>\n   </soapenv:Body>\n</soapenv:Envelope>"); },
    SEND_DOCUMENT_EXT: function (sessionId, vkn, docType, docNo, b64Data, docHash, erpCode) { return "\n<soapenv:Envelope xmlns:soapenv=\"http://schemas.xmlsoap.org/soap/envelope/\" xmlns:ser=\"http://service.connector.elenx.com.tr\">\n   <soapenv:Header/>\n   <soapenv:Body>\n      <ser:belgeGonderExt>\n         <ser:vergiTcKimlikNo>".concat(vkn, "</ser:vergiTcKimlikNo>\n         <ser:belgeTuru>").concat(docType, "</ser:belgeTuru>\n         <ser:belgeNo>").concat(docNo, "</ser:belgeNo>\n         <ser:veri>").concat(b64Data, "</ser:veri>\n         <ser:belgeHash>").concat(docHash, "</ser:belgeHash>\n         <ser:mimeType>application/xml</ser:mimeType>\n         <ser:belgeVersiyon>1.0</ser:belgeVersiyon>\n         <ser:erpKodu>").concat(erpCode, "</ser:erpKodu>\n      </ser:belgeGonderExt>\n   </soapenv:Body>\n</soapenv:Envelope>"); },
    CHECK_STATUS_EXT: function (vkn, docNo, docType) { return "\n<soapenv:Envelope xmlns:soapenv=\"http://schemas.xmlsoap.org/soap/envelope/\" xmlns:ser=\"http://service.connector.elenx.com.tr\">\n   <soapenv:Header/>\n   <soapenv:Body>\n      <ser:gidenBelgeDurumSorgulaExt>\n         <ser:vergiTcKimlikNo>".concat(vkn, "</ser:vergiTcKimlikNo>\n         <ser:belgeNo>").concat(docNo, "</ser:belgeNo>\n         <ser:belgeNoTip>YEREL</ser:belgeNoTip>\n         <ser:belgeTuru>").concat(docType, "</ser:belgeTuru>\n      </ser:gidenBelgeDurumSorgulaExt>\n   </soapenv:Body>\n</soapenv:Envelope>"); },
    CREATE_EARSIV_INVOICE_EXT: function (veri, vkn, erpCode, username, password, islemId) {
        // Raw JSON in XML — no &quot; escaping needed for element content per XML spec
        var inputJson = JSON.stringify({
            islemId: islemId,
            vkn: vkn,
            sube: "DFLT",
            kasa: "DFLT",
            donenBelgeFormati: "2",
            erpKodu: erpCode,
            numaraVerilsinMi: 1
        });
        return "\n<soapenv:Envelope xmlns:soapenv=\"http://schemas.xmlsoap.org/soap/envelope/\" xmlns:ser=\"http://service.earsiv.uut.cs.com.tr/\" xmlns:wsse=\"http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd\">\n   <soapenv:Header>\n      <wsse:Security>\n         <wsse:UsernameToken>\n            <wsse:Username>".concat(username, "</wsse:Username>\n            <wsse:Password>").concat(password, "</wsse:Password>\n         </wsse:UsernameToken>\n      </wsse:Security>\n   </soapenv:Header>\n   <soapenv:Body>\n      <ser:faturaOlusturExt>\n         <input>").concat(inputJson, "</input>\n         <fatura>\n            <belgeFormati>UBL</belgeFormati>\n            <belgeIcerigi>").concat(veri, "</belgeIcerigi>\n         </fatura>\n      </ser:faturaOlusturExt>\n   </soapenv:Body>\n</soapenv:Envelope>");
    },
    EARSIV_STATUS: function (vkn, faturaNo) { return "\n<soapenv:Envelope xmlns:soapenv=\"http://schemas.xmlsoap.org/soap/envelope/\" xmlns:ser=\"http://service.earsiv.uut.cs.com.tr/\">\n   <soapenv:Header/>\n   <soapenv:Body>\n      <ser:faturaSorgula>\n         <vknTckn>".concat(vkn, "</vknTckn>\n         <faturaNo>").concat(faturaNo, "</faturaNo>\n      </ser:faturaSorgula>\n   </soapenv:Body>\n</soapenv:Envelope>"); },
    EARSIV_STATUS_BY_UUID: function (vkn, uuid) { return "\n<soapenv:Envelope xmlns:soapenv=\"http://schemas.xmlsoap.org/soap/envelope/\" xmlns:ser=\"http://service.earsiv.uut.cs.com.tr/\">\n   <soapenv:Header/>\n   <soapenv:Body>\n      <ser:faturaSorgula>\n         <vknTckn>".concat(vkn, "</vknTckn>\n         <ettn>").concat(uuid, "</ettn>\n      </ser:faturaSorgula>\n   </soapenv:Body>\n</soapenv:Envelope>"); }
};
