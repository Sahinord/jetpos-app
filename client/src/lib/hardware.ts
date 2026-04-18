import JsBarcode from "jsbarcode";

/**
 * JetPOS Hardware Integration Library
 * Web Serial API and Web USB based drivers
 */

/**
 * Terazi (Scale) Entegrasyonu
 * Standart CAS veya benzeri protokolleri destekler (9600 baud, 8 data bits)
 */
export async function readScaleWeight(): Promise<number> {
    if (!('serial' in navigator)) {
        throw new Error("Tarayıcınız Web Serial API desteklemiyor. Lütfen Chrome kullanın.");
    }

    try {
        const port = await (navigator as any).serial.requestPort();
        await port.open({ baudRate: 9600 });

        const reader = port.readable.getReader();

        // Genellikle terazi sürekli veri basar: "ST,GS,+  0.150kg" veya benzeri
        let rawData = "";
        const startTime = Date.now();

        while (Date.now() - startTime < 3000) { // Max 3 saniye denesin
            const { value, done } = await reader.read();
            if (done) break;

            const chunk = new TextDecoder().decode(value);
            rawData += chunk;

            // Basit bir regex ile kg değerini ayıkla (Örn: 0.150 veya 1.250)
            const match = rawData.match(/(\d+\.\d{3})/);
            if (match) {
                reader.releaseLock();
                await port.close();
                return parseFloat(match[1]);
            }
        }

        reader.releaseLock();
        await port.close();
        throw new Error("Zaman aşımı: Teraziden veri okunamadı.");
    } catch (err: any) {
        console.error("Scale read error:", err);
        throw err;
    }
}


/**
 * Barkod Yazıcı (JsBarcode & Electron Destekli)
 */
export async function printBarcodeLabel(product: any, settings: any = {}) {
    // 1. Ayarları ve Şablonu Belirle
    let labelWidth = settings.width || 40; // mm
    let labelHeight = settings.height || 30; // mm
    const printerName = settings.printerName || "";
    const templateId = settings.templateId || localStorage.getItem('last_label_template') || 'standard';

    // Kayıtlı tasarımı yüklemeye çalış
    let savedPositions: any = {};
    let savedStyles: any = {};
    const savedDesign = localStorage.getItem(`label_design_${templateId}`);
    if (savedDesign) {
        try {
            const parsed = JSON.parse(savedDesign);
            savedPositions = parsed.positions || {};
            savedStyles = {
                alignments: parsed.alignments || {},
                fontScales: parsed.fontScales || {},
                colors: parsed.colors || {},
                fontStyles: parsed.fontStyles || {}
            };
        } catch (e) {
            console.error("Saved design load error:", e);
        }
    }

    // 2. Barkod Üretimi
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, product.barcode, {
        format: "CODE128",
        width: 2,
        height: 60,
        displayValue: false,
        margin: 5,
        background: "#ffffff",
        lineColor: "#000000"
    });
    const barcodeDataUrl = canvas.toDataURL("image/png");

    // 3. HTML Şablonunu Oluştur (Absolute Positioning)
    const [priceInt, priceDec] = Number(product.sale_price).toFixed(2).split('.');

    // Varsayılan Pozisyonlar (Eğer kayıtlı yoksa)
    const pos = (id: string, defX: number, defY: number) => {
        const p = savedPositions[id] || { xMm: defX, yMm: defY };
        return `left:${p.xMm}mm; top:${p.yMm}mm;`;
    };

    const style = (id: string, baseSize: number) => {
        const scale = savedStyles.fontScales?.[id] || 1;
        const align = savedStyles.alignments?.[id] || 'left';
        const color = savedStyles.colors?.[id] || '#000000';
        const fs = savedStyles.fontStyles?.[id] || { b: true, i: false };
        return `font-size:${baseSize * scale}mm; text-align:${align}; color:${color}; font-weight:${fs.b ? '900' : 'normal'}; font-style:${fs.i ? 'italic' : 'normal'};`;
    };

    const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        @page { size: ${labelWidth}mm ${labelHeight}mm; margin: 0; }
        * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        body { 
            width: ${labelWidth}mm; 
            height: ${labelHeight}mm;
            background: #fff;
            color: #000;
            overflow: hidden;
            font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
        }
        .elem { position: absolute; word-wrap: break-word; line-height: 1.1; }
        .name { max-width: ${labelWidth - 4}mm; ${pos('name', 2, 2)} ${style('name', 3.5)} }
        .price-container { 
            ${pos('price', 2, 18)} 
            display: flex; 
            align-items: flex-start; 
            gap: 1mm;
            ${style('price', 1)} /* scale influence */
        }
        .price-int { font-size: 8mm; font-weight: 900; line-height: 1; }
        .price-dec-group { display: flex; flex-direction: column; margin-top: 0.5mm; }
        .price-dec { font-size: 4mm; font-weight: 900; line-height: 1; }
        .price-symbol { font-size: 3mm; font-weight: 800; }
        .barcode-group { ${pos('barcode', 2, 8)} text-align: center; }
        .barcode-img { height: 10mm; width: auto; max-width: ${labelWidth - 4}mm; }
        .barcode-text { font-family: monospace; font-size: 2.5mm; font-weight: bold; margin-top: 0.5mm; }
    </style>
</head>
<body>
    <div class="elem name">${product.name}</div>
    
    <div class="elem barcode-group">
        <img src="${barcodeDataUrl}" class="barcode-img" />
        <div class="barcode-text">${product.barcode}</div>
    </div>

    <div class="elem price-container">
        <span class="price-int">${priceInt}</span>
        <div class="price-dec-group">
            <span class="price-dec">,${priceDec}</span>
            <span class="price-symbol">TL</span>
        </div>
    </div>
</body>
</html>`;

    // 4. Electron ortamındaysak Yazdırmayı Tetikle (preload.js köprüsü)
    const electron = (window as any).electron;
    if (electron?.isElectron) {
        try {
            // RP80 veya Etiket yazıcısı tespiti
            const isLabelPrinter = printerName.toLowerCase().includes('label') ||
                printerName.toLowerCase().includes('rp80') ||
                printerName.toLowerCase().includes('rongta') ||
                templateId === 'rp80';

            if (isLabelPrinter) {
                console.log("🚀 RAW ESC/POS Modunda yazdırılıyor...");
                electron.send('print-label-tspl', {
                    printerName,
                    product,
                    width: labelWidth,
                    height: labelHeight
                });
            } else {
                console.log("📄 PDF RAW Modunda yazdırılıyor...");
                electron.send('silent-print', {
                    html: html,
                    printerName: printerName,
                    width: labelWidth,
                    height: labelHeight
                });
            }
            return;
        } catch (e) {
            console.error("Electron IPC error:", e);
        }
    }

    // Eski yöntem fallback (contextIsolation olmadan çalışan eski versiyonlar için)
    if ((window as any).require) {
        try {
            const { ipcRenderer } = (window as any).require('electron');
            const isLabelPrinter = printerName.toLowerCase().includes('label') ||
                printerName.toLowerCase().includes('rp80') ||
                printerName.toLowerCase().includes('rongta') ||
                templateId === 'rp80';

            if (isLabelPrinter) {
                ipcRenderer.send('print-label-tspl', { printerName, product, width: labelWidth, height: labelHeight });
            } else {
                ipcRenderer.send('silent-print', { html, printerName, width: labelWidth, height: labelHeight });
            }
            return;
        } catch (e) {
            console.error("Legacy IPC error:", e);
        }
    }

    // 5. Web/Fallback: iframe tabanlı yazdırma (SADECE tarayıcıda çalışırken)
    return new Promise<void>((resolve) => {
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.opacity = '0';
        document.body.appendChild(iframe);

        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc) {
            doc.open();
            doc.write(html);
            doc.close();

            iframe.contentWindow?.focus();
            setTimeout(() => {
                try {
                    iframe.contentWindow?.print();
                } catch (e) {
                    console.error('Print error:', e);
                }
                setTimeout(() => {
                    document.body.removeChild(iframe);
                    resolve();
                }, 500);
            }, 500);
        } else {
            document.body.removeChild(iframe);
            resolve();
        }
    });
}
