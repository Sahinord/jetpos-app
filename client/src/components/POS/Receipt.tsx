"use client";

import React, { useState, useRef, forwardRef } from 'react';
import { Printer, X, Check } from 'lucide-react';

interface ReceiptSettings {
    storeName?: string;
    subtitle1?: string;
    subtitle2?: string;
    footerMessage?: string;
    footerNote1?: string;
    footerNote2?: string;
    showLogo?: boolean;
    logoUrl?: string;
    phone?: string;
    address?: string;
    taxOffice?: string;
    taxNumber?: string;
}

interface ReceiptData {
    items: any[];
    total: number;
    date: Date;
    paymentMethod: string;
    saleId: string;
    receivedAmount?: number;
    changeAmount?: number;
    receiptSettings?: ReceiptSettings;
}

const DEFAULT_SETTINGS: ReceiptSettings = {
    storeName: 'JETPOS MARKET',
    subtitle1: 'MODERN PERAKENDE SİSTEMLERİ',
    subtitle2: 'GÜVENLİ VE HIZLI SATIŞ SİSTEMİ',
    footerMessage: 'BİZİ TERCİH ETTİĞİNİZ İÇİN TEŞEKKÜRLER',
    footerNote1: 'MALİ DEĞERİ YOKTUR',
    footerNote2: 'BİLGİ FİŞİDİR',
    showLogo: false,
    logoUrl: '',
    phone: '',
    address: '',
    taxOffice: '',
    taxNumber: '',
};

function getSettings(data: ReceiptData | null): ReceiptSettings {
    return { ...DEFAULT_SETTINGS, ...((data as any)?.receiptSettings || {}) };
}

// ──────────────────────────────────────────────
// IN-APP RECEIPT PREVIEW (Uygulama İçi Fiş Görüntüsü)
// ──────────────────────────────────────────────
const ReceiptPreview = ({ data }: { data: ReceiptData | null }) => {
    if (!data) return null;
    const s = getSettings(data);

    return (
        <div className="bg-white text-black rounded-lg shadow-2xl mx-auto overflow-hidden" style={{ width: '320px', fontFamily: '"Courier New", Courier, monospace' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', padding: '16px 12px 8px', borderBottom: '2px dashed #333' }}>
                {s.showLogo && s.logoUrl && (
                    <div style={{ marginBottom: '8px' }}>
                        <img src={s.logoUrl} alt="Logo" style={{ maxWidth: '120px', maxHeight: '60px', margin: '0 auto', objectFit: 'contain' }} />
                    </div>
                )}
                <div style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '2px', color: '#000' }}>{s.storeName}</div>
                {s.subtitle1 && <div style={{ fontSize: '10px', fontWeight: 700, color: '#333', marginTop: '2px' }}>{s.subtitle1}</div>}
                {s.subtitle2 && <div style={{ fontSize: '10px', fontWeight: 700, color: '#333' }}>{s.subtitle2}</div>}
                {s.address && <div style={{ fontSize: '9px', fontWeight: 700, color: '#555', marginTop: '3px' }}>{s.address}</div>}
                {s.phone && <div style={{ fontSize: '9px', fontWeight: 700, color: '#555' }}>TEL: {s.phone}</div>}
                {(s.taxOffice || s.taxNumber) && (
                    <div style={{ fontSize: '9px', fontWeight: 700, color: '#555', marginTop: '2px' }}>
                        {s.taxOffice && <span>V.D: {s.taxOffice} </span>}
                        {s.taxNumber && <span>V.N: {s.taxNumber}</span>}
                    </div>
                )}
            </div>

            {/* Date & Info */}
            <div style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 800, color: '#000', borderBottom: '1px dashed #999' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>TARİH: {data.date.toLocaleDateString('tr-TR')}</span>
                    <span>SAAT: {data.date.toLocaleTimeString('tr-TR')}</span>
                </div>
                <div style={{ marginTop: '2px' }}>FİŞ NO: {data.saleId}</div>
            </div>

            {/* Items Header */}
            <div style={{ display: 'flex', padding: '6px 12px', fontSize: '10px', fontWeight: 900, color: '#000', borderBottom: '2px solid #000', textTransform: 'uppercase', letterSpacing: '1px' }}>
                <span style={{ flex: 1 }}>ÜRÜN</span>
                <span style={{ width: '40px', textAlign: 'center' }}>AD</span>
                <span style={{ width: '70px', textAlign: 'right' }}>TUTAR</span>
            </div>

            {/* Items */}
            <div style={{ padding: '0 12px' }}>
                {data.items.map((item, index) => (
                    <div key={index} style={{ padding: '6px 0', borderBottom: '1px dashed #ccc' }}>
                        <div style={{ fontSize: '12px', fontWeight: 900, color: '#000', textTransform: 'uppercase' }}>{item.name}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 800, color: '#222' }}>
                            <span>{item.quantity} {item.unit || 'AD'} X ₺{item.sale_price.toFixed(2)}</span>
                            <span style={{ fontWeight: 900, color: '#000' }}>₺{(item.sale_price * item.quantity).toFixed(2)}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Divider */}
            <div style={{ padding: '0 12px', margin: '4px 0' }}>
                <div style={{ borderTop: '2px solid #000' }} />
            </div>

            {/* Total */}
            <div style={{ padding: '8px 12px', fontSize: '16px', fontWeight: 900, color: '#000' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>TOPLAM:</span>
                    <span style={{ fontSize: '20px' }}>₺{data.total.toFixed(2)}</span>
                </div>
            </div>

            {/* Cash Details */}
            {(data.receivedAmount || 0) > 0 && (
                <div style={{ padding: '4px 12px 8px', fontSize: '12px', fontWeight: 800, color: '#000', borderTop: '1px dashed #999' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>ALINAN NAKİT:</span>
                        <span>₺{data.receivedAmount?.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                        <span>PARA ÜSTÜ:</span>
                        <span style={{ fontWeight: 900 }}>₺{data.changeAmount?.toFixed(2)}</span>
                    </div>
                </div>
            )}

            {/* Payment Method */}
            <div style={{ padding: '4px 12px', fontSize: '12px', fontWeight: 800, color: '#000', borderTop: '1px dashed #999' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>ÖDEME TİPİ:</span>
                    <span>{data.paymentMethod}</span>
                </div>
            </div>

            {/* Footer */}
            <div style={{ textAlign: 'center', padding: '10px 12px 16px', borderTop: '2px dashed #333', marginTop: '4px' }}>
                {s.footerMessage && <div style={{ fontSize: '10px', fontWeight: 800, color: '#000' }}>{s.footerMessage}</div>}
                {s.footerNote1 && <div style={{ fontSize: '11px', fontWeight: 900, color: '#000', marginTop: '4px', letterSpacing: '1px' }}>{s.footerNote1}</div>}
                {s.footerNote2 && <div style={{ fontSize: '10px', fontWeight: 800, color: '#333' }}>{s.footerNote2}</div>}
            </div>
        </div>
    );
};

// ──────────────────────────────────────────────
// GENERATE PRINT HTML (Yazdırma için HTML oluştur)
// ──────────────────────────────────────────────
function generatePrintHTML(data: ReceiptData | null): string {
    if (!data) return '';
    const s = getSettings(data);

    const itemRows = data.items.map(item => `
        <div style="padding:4px 0;border-bottom:1px dashed #000;">
            <div style="font-size:13px;font-weight:900;color:#000;text-transform:uppercase;">${item.name}</div>
            <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:900;color:#000;">
                <span>${item.quantity} ${item.unit || 'AD'} X ₺${item.sale_price.toFixed(2)}</span>
                <span>₺${(item.sale_price * item.quantity).toFixed(2)}</span>
            </div>
        </div>
    `).join('');

    const cashSection = (data.receivedAmount || 0) > 0 ? `
        <div style="font-size:12px;font-weight:900;color:#000;margin-top:4px;">
            <div style="display:flex;justify-content:space-between;">
                <span>ALINAN NAKİT:</span>
                <span>₺${data.receivedAmount?.toFixed(2)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
                <span>PARA ÜSTÜ:</span>
                <span>₺${data.changeAmount?.toFixed(2)}</span>
            </div>
        </div>
    ` : '';

    const addressLine = s.address ? `<div style="font-size:9px;font-weight:900;color:#000!important;">${s.address}</div>` : '';
    const phoneLine = s.phone ? `<div style="font-size:9px;font-weight:900;color:#000!important;">TEL: ${s.phone}</div>` : '';
    const taxLine = (s.taxOffice || s.taxNumber) ? `<div style="font-size:9px;font-weight:900;color:#000!important;">${s.taxOffice ? 'V.D: ' + s.taxOffice + ' ' : ''}${s.taxNumber ? 'V.N: ' + s.taxNumber : ''}</div>` : '';
    const logoLine = (s.showLogo && s.logoUrl) ? `<div style="margin-bottom:8px;"><img src="${s.logoUrl}" style="max-width:120px;max-height:60px;margin:0 auto;display:block;object-fit:contain;" /></div>` : '';

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
    <style>
        @page { margin: 0; size: 80mm auto; }
        * { margin:0; padding:0; box-sizing:border-box; }
        body {
            font-family: 'Courier New', Courier, monospace;
            width: 70mm;
            padding: 2mm 5mm;
            margin: 0;
            overflow: hidden;
            color: #000 !important;
            background: #fff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        div, span, p { color: #000 !important; }
    </style>
</head>
<body>
    <div style="text-align:center;margin-bottom:8px;">
        ${logoLine}
        <div style="font-size:20px;font-weight:900;letter-spacing:2px;color:#000!important;">${s.storeName}</div>
        ${s.subtitle1 ? `<div style="font-size:10px;font-weight:900;color:#000!important;">${s.subtitle1}</div>` : ''}
        ${s.subtitle2 ? `<div style="font-size:10px;font-weight:900;color:#000!important;">${s.subtitle2}</div>` : ''}
        ${addressLine}
        ${phoneLine}
        ${taxLine}
        <div style="margin:4px 0;font-weight:900;color:#000!important;">******************************</div>
    </div>

    <div style="font-size:12px;font-weight:900;margin-bottom:6px;color:#000!important;">
        <div style="display:flex;justify-content:space-between;">
            <span>TARİH: ${data.date.toLocaleDateString('tr-TR')}</span>
            <span>SAAT: ${data.date.toLocaleTimeString('tr-TR')}</span>
        </div>
        <div>FİŞ NO: ${data.saleId}</div>
        <div style="margin:4px 0;color:#000!important;">------------------------------</div>
    </div>

    <div style="font-size:11px;font-weight:900;display:flex;border-bottom:2px solid #000;padding-bottom:2px;color:#000!important;">
        <span style="flex:1">ÜRÜN</span>
        <span style="width:40px;text-align:center;">AD</span>
        <span style="width:60px;text-align:right;">TUTAR</span>
    </div>

    <div style="margin-bottom:6px;">
        ${itemRows}
    </div>

    <div style="font-weight:900;color:#000!important;">******************************</div>

    <div style="font-size:16px;font-weight:900;margin:4px 0;color:#000!important;">
        <div style="display:flex;justify-content:space-between;">
            <span>TOPLAM:</span>
            <span>₺${data.total.toFixed(2)}</span>
        </div>
    </div>

    ${cashSection}

    <div style="font-size:12px;font-weight:900;margin-top:4px;color:#000!important;">
        <div style="display:flex;justify-content:space-between;">
            <span>ÖDEME TİPİ:</span>
            <span>${data.paymentMethod}</span>
        </div>
    </div>

    <div style="margin:8px 0;font-weight:900;color:#000!important;">------------------------------</div>

    <div style="text-align:center;font-weight:900;color:#000!important;">
        ${s.footerMessage ? `<div style="font-size:10px;">${s.footerMessage}</div>` : ''}
        ${s.footerNote1 ? `<div style="margin-top:4px;font-size:12px;">${s.footerNote1}</div>` : ''}
        ${s.footerNote2 ? `<div style="font-size:10px;">${s.footerNote2}</div>` : ''}
    </div>

    <div style="height:20mm;"></div>
</body>
</html>`;
}

// ──────────────────────────────────────────────
// ELECTRON KONTROL
// ──────────────────────────────────────────────
function isElectron(): boolean {
    return typeof window !== 'undefined' && !!(window as any).require;
}

// ──────────────────────────────────────────────
// SILENT PRINT - Sadece Electron'da sessiz yazdırır
// Tarayıcıda dış pencere AÇMAZ
// ──────────────────────────────────────────────
async function silentPrint(data: ReceiptData | null, printerName?: string): Promise<boolean> {
    if (!isElectron()) {
        console.log('Tarayıcı modu: Sessiz yazdırma atlandı (fiş modal içinde görüntüleniyor)');
        return false;
    }

    const html = generatePrintHTML(data);

    try {
        const { ipcRenderer } = (window as any).require('electron');
        return new Promise((resolve) => {
            ipcRenderer.once('silent-print-result', (_event: any, result: { success: boolean }) => {
                resolve(result.success);
            });
            ipcRenderer.send('silent-print-receipt', { html, printerName: printerName || null });
        });
    } catch (err) {
        console.error('Electron silent print hatası:', err);
        return false;
    }
}

// ──────────────────────────────────────────────
// MANUAL PRINT - "Tekrar Yazdır" butonu için
// ──────────────────────────────────────────────
async function manualPrint(data: ReceiptData | null): Promise<boolean> {
    const html = generatePrintHTML(data);

    if (isElectron()) {
        try {
            const { ipcRenderer } = (window as any).require('electron');
            return new Promise((resolve) => {
                ipcRenderer.once('silent-print-result', (_event: any, result: { success: boolean }) => {
                    resolve(result.success);
                });
                ipcRenderer.send('silent-print-receipt', { html });
            });
        } catch (err) {
            console.error('Electron manual print hatası:', err);
        }
    }

    return new Promise((resolve) => {
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = 'none';
        iframe.style.opacity = '0';
        iframe.style.pointerEvents = 'none';
        document.body.appendChild(iframe);

        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc) {
            doc.open();
            doc.write(html);
            doc.close();

            iframe.onload = () => {
                try {
                    iframe.contentWindow?.print();
                    resolve(true);
                } catch {
                    resolve(false);
                }
                setTimeout(() => {
                    document.body.removeChild(iframe);
                }, 1000);
            };
        } else {
            resolve(false);
        }
    });
}

// ──────────────────────────────────────────────
// PRINT RECEIPT BUTTON (Satış sonrası otomatik yazdırma)
// ──────────────────────────────────────────────
export const PrintReceiptButton = ({ data, onAfterPrint, printerName }: { data: any, onAfterPrint?: () => void, printerName?: string }) => {
    React.useEffect(() => {
        if (data) {
            const timer = setTimeout(async () => {
                await silentPrint(data, printerName);
                onAfterPrint?.();
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [data]);

    return null;
};

// ──────────────────────────────────────────────
// MANUAL PRINT TRIGGER (Tekrar Yazdır butonu için export)
// ──────────────────────────────────────────────
export async function triggerManualPrint(data: ReceiptData | null): Promise<boolean> {
    return manualPrint(data);
}

// ──────────────────────────────────────────────
// RECEIPT PREVIEW COMPONENT (Modal içinde görünecek)
// ──────────────────────────────────────────────
export { ReceiptPreview };

export default ReceiptPreview;