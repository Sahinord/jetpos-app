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
    const labelWidth = settings.width || 40; // mm
    const labelHeight = settings.height || 30; // mm
    const printerName = settings.printerName || "";

    // 1. JsBarcode ile yüksek çözünürlüklü barkod oluştur (SVG/Canvas)
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, product.barcode, {
        format: "CODE128",
        width: 2,
        height: 60,
        displayValue: false,
        margin: 0,
        background: "#ffffff",
        lineColor: "#000000"
    });
    const barcodeDataUrl = canvas.toDataURL("image/png");

    const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        @page { size: ${labelWidth}mm ${labelHeight}mm; margin: 0; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            width: ${labelWidth}mm; 
            height: ${labelHeight}mm;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: #fff;
            color: #000;
            overflow: hidden;
            padding: 2mm;
        }
        .name { 
            font-family: Arial, sans-serif; 
            font-size: 9pt; 
            font-weight: 800; 
            text-align: center;
            width: 100%;
            margin-bottom: 1mm;
            line-height: 1.1;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
        .price { 
            font-family: Arial, sans-serif; 
            font-size: 14pt; 
            font-weight: 900; 
            margin-bottom: 1mm;
        }
        .barcode-img {
            width: 90%;
            height: 10mm;
            object-fit: stretch;
        }
        .barcode-text { 
            font-family: 'Courier New', monospace; 
            font-size: 7pt; 
            font-weight: bold;
            letter-spacing: 1px;
            margin-top: 0.5mm;
        }
    </style>
</head>
<body>
    <div class="name">${product.name}</div>
    <div class="price">₺${Number(product.sale_price).toFixed(2)}</div>
    <img src="${barcodeDataUrl}" class="barcode-img" />
    <div class="barcode-text">${product.barcode}</div>
</body>
</html>`;

    // 2. Electron ortamındaysak Sessiz Yazdırma (Silent Print) kullan
    if (window.require) {
        try {
            const { ipcRenderer } = window.require('electron');
            ipcRenderer.send('silent-print', {
                html: html,
                printerName: printerName,
                width: labelWidth,
                height: labelHeight
            });
            return;
        } catch (e) {
            console.error("Electron IPC error:", e);
        }
    }

    // 3. Web/Fallback: iframe tabanlı yazdırma
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
