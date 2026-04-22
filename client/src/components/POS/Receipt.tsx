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

function turkishToAscii(str: string) {
    if (!str) return '';
    const map: any = {
        'ş': 's', 'Ş': 'S', 'ğ': 'g', 'Ğ': 'G',
        'ü': 'u', 'Ü': 'U', 'ö': 'o', 'Ö': 'O',
        'ç': 'c', 'Ç': 'C', 'ı': 'i', 'İ': 'I',
        '₺': 'TL'
    };
    return str.replace(/[şŞğĞüÜöÖçÇıİ₺]/g, c => map[c] || c);
}

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
        <div className="bg-white text-black rounded-lg shadow-2xl mx-auto overflow-hidden flex flex-col items-center" style={{ width: '320px', fontFamily: '"Courier New", Courier, monospace' }}>
            {/* Header */}
            <div className="flex flex-col items-center w-full" style={{ textAlign: 'center', padding: '16px 12px 8px', borderBottom: '2px dashed #333' }}>
                {s.showLogo && s.logoUrl && (
                    <div style={{ marginBottom: '8px' }}>
                        <img src={s.logoUrl} alt="Logo" style={{ maxWidth: '120px', maxHeight: '60px', margin: '0 auto', display: 'block', objectFit: 'contain' }} />
                    </div>
                )}
                <div style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '2px', color: '#000' }}>{(s.storeName || 'JETPOS MARKET').toUpperCase()}</div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#333', marginTop: '2px' }}>
                    {s.subtitle1 && <div>{s.subtitle1.toUpperCase()}</div>}
                    {s.subtitle2 && <div>{s.subtitle2.toUpperCase()}</div>}
                    {s.address && <div style={{ marginTop: '2px' }}>{s.address.toUpperCase()}</div>}
                    {s.phone && <div>TEL: {s.phone}</div>}
                    {(s.taxOffice || s.taxNumber) && (
                        <div style={{ marginTop: '2px' }}>
                            {s.taxOffice && <span>V.D: {s.taxOffice.toUpperCase()} </span>}
                            {s.taxNumber && <span>V.N: {s.taxNumber}</span>}
                        </div>
                    )}
                </div>
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
                <span style={{ width: '30px', textAlign: 'center' }}>KDV</span>
                <span style={{ width: '40px', textAlign: 'center' }}>AD</span>
                <span style={{ width: '70px', textAlign: 'right' }}>TUTAR</span>
            </div>

            {/* Items */}
            <div style={{ padding: '0 12px' }}>
                {data.items.map((item, index) => (
                    <div key={index} style={{ padding: '6px 0', borderBottom: '1px dashed #ccc' }}>
                        <div style={{ fontSize: '12px', fontWeight: 900, color: '#000', textTransform: 'uppercase' }}>{item.name}</div>
                        {item.barcode && <div style={{ fontSize: '9px', color: '#666', marginBottom: '2px' }}>{item.barcode}</div>}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 800, color: '#222' }}>
                            <span style={{ flex: 1 }}>{item.quantity} {item.unit || 'AD'} X ₺{(item.sale_price || item.price || 0).toFixed(2)}</span>
                            <span style={{ width: '30px', textAlign: 'center' }}>%{item.vat_rate || 0}</span>
                            <span style={{ width: '70px', textAlign: 'right', fontWeight: 900, color: '#000' }}>₺{((item.sale_price || item.price || 0) * item.quantity).toFixed(2)}</span>
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
            ${item.barcode ? `<div style="font-size:10px;color:#333;margin-bottom:2px;">${item.barcode}</div>` : ''}
            <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:900;color:#000;">
                <span style="flex:1">${item.quantity} ${item.unit || 'AD'} X ₺${(item.sale_price || item.price || 0).toFixed(2)}</span>
                <span style="width:30px;text-align:center;">%${item.vat_rate || 0}</span>
                <span style="width:70px;text-align:right;">₺${((item.sale_price || item.price || 0) * item.quantity).toFixed(2)}</span>
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

    return `
<!DOCTYPE html>
<html style="opacity: 1 !important; visibility: visible !important;">
<head>
    <meta charset="utf-8">
    <style>
        body { 
            background-color: #ffffff !important; 
            color: #000000 !important; 
            margin: 0; 
            padding: 0;
            width: 100%; 
            font-family: monospace;
            font-weight: bold;
            letter-spacing: 0.5px;
            opacity: 1 !important;
            visibility: visible !important;
        }
        .wrapper { 
            width: 72mm !important; 
            min-width: 72mm !important;
            margin: 0 auto !important; 
            padding: 0; 
            display: block;
            opacity: 1 !important;
            visibility: visible !important;
        }
        .center-stack {
            display: block;
            text-align: center;
            width: 100%;
        }
        .table { width: 100%; border-collapse: collapse; }
        .bold { font-weight: 900; }
        .font-lg { font-size: 22px; }
        .font-md { font-size: 14px; }
        .font-sm { font-size: 11px; }
        .font-xs { font-size: 10px; }
        .dashed-hr { border-bottom: 2px dashed #000; margin: 5px 0; width: 100%; }
        .solid-hr { border-bottom: 3px solid #000; margin: 5px 0; width: 100%; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="center-stack">
            ${logoLine}
            <div class="font-lg bold" style="margin-top:5px; letter-spacing: 2px;">${(s.storeName || 'JETPOS MARKET').toUpperCase()}</div>
            <div class="font-xs" style="margin: 5px 0;">
                ${s.subtitle1 ? `<div>${s.subtitle1.toUpperCase()}</div>` : ''}
                ${s.subtitle2 ? `<div>${s.subtitle2.toUpperCase()}</div>` : ''}
                ${addressLine}
                ${phoneLine}
                ${taxLine}
            </div>
        </div>
        
        <div class="dashed-hr"></div>
        
        <table class="table font-sm">
            <tr>
                <td align="left">TARİH: ${data.date.toLocaleDateString('tr-TR')}</td>
                <td align="right">SAAT: ${data.date.toLocaleTimeString('tr-TR')}</td>
            </tr>
            <tr>
                <td colspan="2" align="left">FİŞ NO: ${data.saleId}</td>
            </tr>
        </table>
        
        <div class="dashed-hr"></div>
        
        <table class="table font-xs">
            <tr>
                <td align="left" width="60%">ÜRÜN</td>
                <td align="center" width="20%">AD</td>
                <td align="right" width="20%">TUTAR</td>
            </tr>
        </table>
        <div style="border-bottom: 2px dashed #000; margin: 2px 0;"></div>
        
        <div class="font-sm" style="margin-top: 5px;">
            ${data.items.map(item => `
                <div style="margin-bottom: 8px;">
                    <div>${turkishToAscii(item.name.toUpperCase())}</div>
                    <table class="table">
                        <tr>
                            <td align="left">${item.quantity} AD X ₺${(item.sale_price || item.price || 0).toFixed(2)}</td>
                            <td align="right">₺${((item.sale_price || item.price || 0) * item.quantity).toFixed(2)}</td>
                        </tr>
                    </table>
                </div>
            `).join('')}
        </div>
        
        <div class="solid-hr" style="margin-top: 10px;"></div>
        
        <table class="table" style="margin: 5px 0;">
            <tr>
                <td align="left" class="font-lg bold">TOPLAM:</td>
                <td align="right" class="font-lg bold">₺${data.total.toFixed(2)}</td>
            </tr>
        </table>
        
        <div class="dashed-hr"></div>
        
        <table class="table font-sm">
            <tr>
                <td align="left">ÖDEME TİPİ:</td>
                <td align="right">${data.paymentMethod.toUpperCase()}</td>
            </tr>
        </table>
        
        <div class="dashed-hr"></div>
        
        <div class="center font-xs" style="margin-top:10px;">
            <div>${(s.footerMessage || 'BİZİ TERCİH ETTİĞİNİZ İÇİN TEŞEKKÜRLER').toUpperCase()}</div>
            <div style="margin: 3px 0;">MALİ DEĞERİ YOKTUR</div>
            <div>BİLGİ FİŞİDİR</div>
        </div>
        
        <div style="height:40mm; text-align:center; font-size: 8px;">.</div>
    </div>
</body>
</html>`;
}

// ──────────────────────────────────────────────
// ELECTRON KONTROL
// ──────────────────────────────────────────────
function isElectron(): boolean {
    return typeof window !== 'undefined' && (!!((window as any).electron?.isElectron) || !!(window as any).require);
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

    const electron = (window as any).electron;
    if (electron?.isElectron) {
        return new Promise((resolve) => {
            electron.once('silent-print-result', (result: { success: boolean }) => {
                resolve(result.success);
            });
            electron.send('silent-print-receipt', { html, printerName: printerName || null });
        });
    }

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
        const electron = (window as any).electron;
        if (electron?.isElectron) {
            return new Promise((resolve) => {
                electron.once('silent-print-result', (result: { success: boolean }) => {
                    resolve(result.success);
                });
                electron.send('silent-print-receipt', { html });
            });
        }
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
                setTimeout(() => {
                    try {
                        iframe.contentWindow?.print();
                        resolve(true);
                    } catch {
                        resolve(false);
                    }
                }, 500);
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