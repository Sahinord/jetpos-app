export interface QNBAuth {
    username: string;
    password: string;
}

export interface QNBConfig {
    baseUrl: string;
    vkn: string;
    password: string;
}

export interface QNBLoginResponse {
    success: boolean;
    sessionId?: string;
    error?: string;
}

export interface QNBDocumentStatus {
    belgeNo: string;
    durum: string;
    ettn: string;
    gonderimDurumu: string;
    pdfUrl?: string;
}

export interface QNBDocumentRequest {
    belgeNo: string;
    vergiTcKimlikNo: string;
    belgeTuru: 'FATURA_UBL' | 'IRSALIYE_UBL';
    veri: string; // Base64 encoded XML
}
