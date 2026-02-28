"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QNBClient = void 0;
var soap_templates_1 = require("./soap-templates");
var ubl_builder_1 = require("./ubl-builder");
var crypto_1 = __importDefault(require("crypto"));
// Regex Helpers
var extractTagContent = function (xml, tag) {
    // Handle both <tagName> and <ns:tagName>
    var regex = new RegExp("<([a-z0-9]+:)?".concat(tag, "[^>]*>([^<]+)</([a-z0-9]+:)?").concat(tag, ">"), 'i');
    var match = xml.match(regex);
    return match ? match[2] : null;
};
var extractFault = function (xml) {
    var faultString = extractTagContent(xml, 'faultstring');
    var detail = extractTagContent(xml, 'detail') || extractTagContent(xml, 'message');
    if (faultString) {
        return detail ? "".concat(faultString, " (").concat(detail, ")") : faultString;
    }
    return null;
};
var QNBClient = /** @class */ (function () {
    function QNBClient() {
        this.baseUrl = process.env.QNB_BASE_URL || 'https://erpefaturatest1.qnbesolutions.com.tr';
        this.earsivBaseUrl = process.env.QNB_EARSIV_BASE_URL || 'https://earsivtest.qnbesolutions.com.tr';
        this.connectorTestUrl = process.env.QNB_CONNECTOR_TEST_URL || 'https://connectortest.qnbesolutions.com.tr';
        this.vkn = process.env.NEXT_PUBLIC_QNB_TEST_VKN || process.env.QNB_TEST_VKN || '';
        this.earsivUsername = process.env.QNB_EARSIV_USERNAME || (this.vkn + '.portaltest');
        this.erpCode = process.env.QNB_ERP_CODE || 'JET31270';
        this.password = process.env.QNB_TEST_PASSWORD;
    }
    /**
     * Updated Login Logic based on latest documentation
     */
    QNBClient.prototype.login = function () {
        return __awaiter(this, arguments, void 0, function (serviceType) {
            var pass, username_1, earsivEndpoint, earsivSessionCookie, initRes, initCookie, e_1, connectorUrl, loginHeaders, response, text, fault, connectorCookie, connectorSessionCookie, returnVal, jsessionId, tokenVal, allCookies, err_1, username, url, response, text, fault, err_2;
            if (serviceType === void 0) { serviceType = 'EFATURA'; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.password || this.password === 'CHANGE_ME_FROM_MAIL') {
                            return [2 /*return*/, { success: false, error: 'Şifre tanımlanmamış (.env.local kontrol edin)' }];
                        }
                        pass = this.password;
                        if (!(serviceType === 'EARSIV')) return [3 /*break*/, 9];
                        username_1 = this.earsivUsername;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 8, , 9]);
                        earsivEndpoint = "".concat(this.earsivBaseUrl, "/earsiv/ws/EarsivWebService");
                        console.log("[QNB Login] Step 1: Getting earsivtest session from ".concat(earsivEndpoint));
                        earsivSessionCookie = '';
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, fetch(earsivEndpoint, { method: 'GET' })];
                    case 3:
                        initRes = _a.sent();
                        initCookie = initRes.headers.get('set-cookie');
                        if (initCookie) {
                            earsivSessionCookie = initCookie.split(';')[0];
                            console.log("[QNB Login] earsivtest session: ".concat(earsivSessionCookie));
                        }
                        return [3 /*break*/, 5];
                    case 4:
                        e_1 = _a.sent();
                        return [3 /*break*/, 5];
                    case 5:
                        connectorUrl = "".concat(this.connectorTestUrl, "/connector/ws/userService");
                        console.log("[QNB Login] Step 2: Login at connectortest @ ".concat(connectorUrl));
                        loginHeaders = {
                            'Content-Type': 'text/xml;charset=UTF-8',
                            'SOAPAction': '""'
                        };
                        if (earsivSessionCookie)
                            loginHeaders['Cookie'] = earsivSessionCookie;
                        return [4 /*yield*/, fetch(connectorUrl, {
                                method: 'POST',
                                headers: loginHeaders,
                                body: soap_templates_1.SOAP_TEMPLATES.LOGIN(username_1, pass).trim()
                            })];
                    case 6:
                        response = _a.sent();
                        return [4 /*yield*/, response.text()];
                    case 7:
                        text = _a.sent();
                        console.log("[QNB Login] Connector response:", text.substring(0, 200));
                        fault = extractFault(text);
                        if (fault)
                            return [2 /*return*/, { success: false, error: fault }];
                        connectorCookie = response.headers.get('set-cookie');
                        connectorSessionCookie = '';
                        if (connectorCookie)
                            connectorSessionCookie = connectorCookie.split(';')[0];
                        console.log("[QNB Login] Connector session: ".concat(connectorSessionCookie));
                        returnVal = extractTagContent(text, 'return');
                        console.log("[QNB Login] Return val: ".concat(returnVal));
                        jsessionId = '';
                        if (connectorSessionCookie) {
                            tokenVal = connectorSessionCookie.split('=').slice(1).join('=');
                            if (tokenVal)
                                jsessionId = "JSESSIONID=".concat(tokenVal);
                        }
                        console.log("[QNB Login] JSESSIONID alias: ".concat(jsessionId));
                        allCookies = [earsivSessionCookie, connectorSessionCookie, jsessionId]
                            .filter(Boolean).join('; ');
                        if (returnVal === 'true' || connectorSessionCookie || earsivSessionCookie) {
                            this.earsivCookie = allCookies || 'SESSION_ESTABLISHED';
                            console.log("[QNB Login] Final earsiv cookie: ".concat(this.earsivCookie));
                            return [2 /*return*/, { success: true, sessionId: this.earsivCookie }];
                        }
                        if (returnVal && returnVal.length > 10) {
                            this.earsivCookie = "JSESSIONID=".concat(returnVal);
                            return [2 /*return*/, { success: true, sessionId: returnVal }];
                        }
                        return [2 /*return*/, { success: false, error: 'Oturum açılamadı' }];
                    case 8:
                        err_1 = _a.sent();
                        return [2 /*return*/, { success: false, error: err_1.message }];
                    case 9:
                        username = this.vkn;
                        url = "".concat(this.baseUrl, "/efatura/ws/connectorService");
                        _a.label = 10;
                    case 10:
                        _a.trys.push([10, 13, , 14]);
                        console.log("[QNB Login] Attempting EFATURA @ ".concat(url));
                        return [4 /*yield*/, fetch(url, {
                                method: 'POST',
                                headers: { 'Content-Type': 'text/xml;charset=UTF-8', 'SOAPAction': '""' },
                                body: soap_templates_1.SOAP_TEMPLATES.LOGIN(username, pass).trim()
                            })];
                    case 11:
                        response = _a.sent();
                        return [4 /*yield*/, response.text()];
                    case 12:
                        text = _a.sent();
                        fault = extractFault(text);
                        if (!fault) {
                            return [2 /*return*/, this.processLoginResponse(text, response.headers, serviceType)];
                        }
                        return [2 /*return*/, { success: false, error: fault }];
                    case 13:
                        err_2 = _a.sent();
                        return [2 /*return*/, { success: false, error: err_2.message }];
                    case 14: return [2 /*return*/];
                }
            });
        });
    };
    QNBClient.prototype.processLoginResponse = function (text, headers, serviceType) {
        var cookieHeader = headers.get('set-cookie');
        var sessionCookie = '';
        if (cookieHeader) {
            sessionCookie = cookieHeader.split(';')[0];
        }
        console.log("[QNB Login] Set-Cookie raw: ".concat(cookieHeader));
        console.log("[QNB Login] Session cookie: ".concat(sessionCookie));
        var returnVal = extractTagContent(text, 'return');
        console.log("[QNB Login] Return val: ".concat(returnVal));
        if (returnVal === 'true' || sessionCookie) {
            if (serviceType === 'EFATURA') {
                this.efaturaCookie = sessionCookie || 'SESSION_ESTABLISHED';
            }
            else {
                this.earsivCookie = sessionCookie || 'SESSION_ESTABLISHED';
            }
            return { success: true, sessionId: sessionCookie || 'SESSION_ESTABLISHED' };
        }
        if (returnVal && returnVal.length > 10) {
            var cookieVal = "JSESSIONID=".concat(returnVal);
            if (serviceType === 'EFATURA') {
                this.efaturaCookie = cookieVal;
            }
            else {
                this.earsivCookie = cookieVal;
            }
            return { success: true, sessionId: returnVal };
        }
        return { success: false, error: 'Oturum açılamadı' };
    };
    QNBClient.prototype.checkDocumentStatus = function (docNo_1) {
        return __awaiter(this, arguments, void 0, function (docNo, docType) {
            var endpoint, cookie, soapBody, loginRes, loginRes, response, text, fault, durum, ettn, pdfUrl, realFaturaNo, error_1;
            if (docType === void 0) { docType = 'EFATURA'; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        endpoint = '';
                        cookie = '';
                        soapBody = '';
                        if (!(docType === 'EARSIV')) return [3 /*break*/, 3];
                        endpoint = "".concat(this.earsivBaseUrl, "/earsiv/ws/EarsivWebService");
                        if (!!this.earsivCookie) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.login('EARSIV')];
                    case 1:
                        loginRes = _a.sent();
                        if (!loginRes.success)
                            throw new Error('EARSIV Login failed: ' + loginRes.error);
                        _a.label = 2;
                    case 2:
                        cookie = this.earsivCookie || '';
                        // Eğer gecici ID ile gelmişse ve ETTN varsa (bir şekilde iletilmeli), UUID üzerinden sorgulanabilir.
                        // Şimdilik faturaNo üzerinden deniyoruz.
                        soapBody = soap_templates_1.SOAP_TEMPLATES.EARSIV_STATUS(this.vkn, docNo);
                        return [3 /*break*/, 6];
                    case 3:
                        endpoint = "".concat(this.baseUrl, "/efatura/ws/connectorService");
                        if (!!this.efaturaCookie) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.login('EFATURA')];
                    case 4:
                        loginRes = _a.sent();
                        if (!loginRes.success)
                            throw new Error('EFATURA Login failed: ' + loginRes.error);
                        _a.label = 5;
                    case 5:
                        cookie = this.efaturaCookie || '';
                        soapBody = soap_templates_1.SOAP_TEMPLATES.CHECK_STATUS_EXT(this.vkn, docNo, docType);
                        _a.label = 6;
                    case 6:
                        _a.trys.push([6, 9, , 10]);
                        return [4 /*yield*/, fetch(endpoint, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'text/xml;charset=UTF-8',
                                    'SOAPAction': '',
                                    'Cookie': cookie
                                },
                                body: soapBody.trim()
                            })];
                    case 7:
                        response = _a.sent();
                        return [4 /*yield*/, response.text()];
                    case 8:
                        text = _a.sent();
                        fault = extractFault(text);
                        if (fault) {
                            console.warn("QNB Status Check Fault (".concat(docType, "):"), fault);
                            return [2 /*return*/, null];
                        }
                        durum = extractTagContent(text, 'durum') || extractTagContent(text, 'durumAciklamasi') || extractTagContent(text, 'resultText');
                        ettn = extractTagContent(text, 'ettn') || extractTagContent(text, 'faturaUuid');
                        pdfUrl = extractTagContent(text, 'url') || extractTagContent(text, 'faturaUrl') || extractTagContent(text, 'pdfUrl');
                        realFaturaNo = extractTagContent(text, 'faturaNo');
                        if (!durum && !pdfUrl && !realFaturaNo)
                            return [2 /*return*/, null];
                        return [2 /*return*/, {
                                belgeNo: realFaturaNo || docNo,
                                durum: durum || 'BILINMIYOR',
                                ettn: ettn || '',
                                gonderimDurumu: text,
                                pdfUrl: pdfUrl || undefined
                            }];
                    case 9:
                        error_1 = _a.sent();
                        console.error("Status Check Error:", error_1);
                        return [2 /*return*/, null];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    QNBClient.prototype.sendInvoice = function (invoiceData_1) {
        return __awaiter(this, arguments, void 0, function (invoiceData, docType) {
            var endpoint, soapBody, cookie, ublXml, b64Data, docHash, islemId, fs, path, debugPath, loginRes, response, text, fault, returnRaw, faturaNo, url, ettn, resultCode, resultText, parsed, noMatch, urlMatch, tempId, resultOid, error_2;
            if (docType === void 0) { docType = 'EFATURA'; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        endpoint = '';
                        soapBody = '';
                        cookie = '';
                        ublXml = (0, ubl_builder_1.generateUBL)(invoiceData, this.erpCode, this.vkn);
                        b64Data = Buffer.from(ublXml, 'utf-8').toString('base64');
                        docHash = crypto_1.default.createHash('md5').update(ublXml).digest('hex').toUpperCase();
                        if (!(docType === 'EARSIV')) return [3 /*break*/, 3];
                        islemId = crypto_1.default.randomUUID();
                        endpoint = "".concat(this.earsivBaseUrl, "/earsiv/ws/EarsivWebService");
                        soapBody = soap_templates_1.SOAP_TEMPLATES.CREATE_EARSIV_INVOICE_EXT(b64Data, this.vkn, this.erpCode, this.earsivUsername, this.password || '', islemId);
                        console.log("[QNB Send] Endpoint: ".concat(endpoint, ", islemId: ").concat(islemId));
                        return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require('fs')); })];
                    case 1:
                        fs = _a.sent();
                        return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require('path')); })];
                    case 2:
                        path = _a.sent();
                        debugPath = path.join(process.cwd(), 'debug_ubl.xml');
                        fs.writeFileSync(debugPath, ublXml, 'utf-8');
                        console.log("[QNB Debug] UBL written to ".concat(debugPath));
                        return [3 /*break*/, 6];
                    case 3:
                        if (!!this.efaturaCookie) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.login('EFATURA')];
                    case 4:
                        loginRes = _a.sent();
                        if (!loginRes.success)
                            throw new Error('e-Fatura Login failed: ' + loginRes.error);
                        _a.label = 5;
                    case 5:
                        cookie = this.efaturaCookie || '';
                        endpoint = "".concat(this.baseUrl, "/efatura/ws/connectorService");
                        soapBody = soap_templates_1.SOAP_TEMPLATES.SEND_DOCUMENT_EXT(cookie, this.vkn, 'FATURA_UBL', invoiceData.invoiceNumber || 'TASLAK-' + Date.now(), b64Data, docHash, this.erpCode);
                        _a.label = 6;
                    case 6:
                        _a.trys.push([6, 9, , 10]);
                        console.log("[QNB Send] DocType: ".concat(docType, ", Endpoint: ").concat(endpoint));
                        console.log("[QNB Send] SOAP Body Length: ".concat(soapBody.length, ", First 200 chars: ").concat(soapBody.slice(0, 200), "..."));
                        return [4 /*yield*/, fetch(endpoint, {
                                method: 'POST',
                                headers: __assign({ 'Content-Type': 'text/xml;charset=UTF-8', 'SOAPAction': '""', 'Cookie': cookie }, (docType === 'EARSIV' && this.password ? {
                                    'Authorization': 'Basic ' + Buffer.from("".concat(this.earsivUsername, ":").concat(this.password)).toString('base64')
                                } : {})),
                                body: soapBody.trim()
                            })];
                    case 7:
                        response = _a.sent();
                        return [4 /*yield*/, response.text()];
                    case 8:
                        text = _a.sent();
                        console.log("[QNB Response] Status: ".concat(response.status));
                        console.log("[QNB Response Full] ".concat(text.substring(0, 1500)));
                        fault = extractFault(text);
                        if (fault)
                            return [2 /*return*/, { success: false, error: fault }];
                        if (docType === 'EARSIV') {
                            returnRaw = extractTagContent(text, 'return');
                            console.log("[QNB E-Ar\u015Fiv] Raw return: ".concat(returnRaw === null || returnRaw === void 0 ? void 0 : returnRaw.substring(0, 500)));
                            faturaNo = extractTagContent(text, 'faturaNo');
                            url = extractTagContent(text, 'url') || extractTagContent(text, 'faturaUrl');
                            ettn = extractTagContent(text, 'ettn') || extractTagContent(text, 'faturaUuid');
                            resultCode = extractTagContent(text, 'resultCode');
                            resultText = extractTagContent(text, 'resultText');
                            // Try to parse return tag as JSON (QNB wraps results in JSON)
                            if (returnRaw) {
                                try {
                                    parsed = JSON.parse(returnRaw);
                                    faturaNo = faturaNo || parsed.faturaNo || parsed.belgeNo || parsed.invoiceNo;
                                    url = url || parsed.url || parsed.faturaUrl || parsed.pdfUrl || parsed.htmlUrl;
                                    ettn = ettn || parsed.ettn || parsed.uuid;
                                    console.log("[QNB E-Ar\u015Fiv] Parsed JSON return: faturaNo=".concat(faturaNo, ", url=").concat(url));
                                }
                                catch (_b) {
                                    noMatch = returnRaw.match(/faturaNo["\s:]+([A-Z0-9]+)/);
                                    urlMatch = returnRaw.match(/https?:\/\/[^\s"<]+/);
                                    if (noMatch)
                                        faturaNo = faturaNo || noMatch[1];
                                    if (urlMatch)
                                        url = url || urlMatch[0];
                                }
                            }
                            console.log("QNB E-Ar\u015Fiv Response - No: ".concat(faturaNo, ", Code: ").concat(resultCode, ", Text: ").concat(resultText, ", URL: ").concat(url));
                            if (resultCode && resultCode !== 'AE00000' && resultCode !== '0') {
                                return [2 /*return*/, { success: false, error: "QNB Error (".concat(resultCode, "): ").concat(resultText) }];
                            }
                            if (faturaNo || ettn) {
                                return [2 /*return*/, { success: true, listId: (faturaNo || ettn), pdfUrl: url || undefined, ettn: ettn || undefined }];
                            }
                            tempId = 'EP-' + Date.now().toString().slice(-10);
                            return [2 /*return*/, { success: true, listId: tempId, pdfUrl: url || undefined, ettn: ettn || undefined }];
                        }
                        else {
                            resultOid = extractTagContent(text, 'belgeOid');
                            if (resultOid)
                                return [2 /*return*/, { success: true, listId: resultOid }];
                        }
                        return [2 /*return*/, { success: false, error: 'Belge gönderildi ancak ID alınamadı.' }];
                    case 9:
                        error_2 = _a.sent();
                        console.error('Send Invoice Error:', error_2);
                        return [2 /*return*/, { success: false, error: error_2.message }];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    return QNBClient;
}());
exports.QNBClient = QNBClient;
