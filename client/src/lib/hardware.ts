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
 * Barkod Yazıcı (iframe tabanlı - kasa çekmecesi tetiklemez, yeni pencere açmaz)
 */
export async function printBarcodeLabel(product: any, settings: any = {}) {
    // iframe tabanlı yazdırma: window.open açmaz, kasa çekmecesiyle çakışmaz
    return new Promise<void>((resolve) => {
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

        const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        @page { size: ${settings.width || '40mm'} ${settings.height || '30mm'}; margin: 0; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Libre Barcode 39', 'Courier New', monospace; padding: 3px; text-align: center; background: #fff; }
        .name { font-family: Arial, sans-serif; font-size: 10px; font-weight: bold; margin-bottom: 2px; color: #000; }
        .price { font-family: Arial, sans-serif; font-size: 14px; font-weight: 900; color: #000; margin-bottom: 2px; }
        .barcode { font-family: 'Libre Barcode 39', cursive; font-size: 36px; line-height: 1; color: #000; letter-spacing: 2px; }
        .barcode-text { font-family: 'Courier New', monospace; font-size: 7px; color: #000; letter-spacing: 1px; margin-top: 1px; }
    </style>
    <link rel="preload" href="https://fonts.googleapis.com/css2?family=Libre+Barcode+39&display=swap" as="style" onload="this.rel='stylesheet'">
    <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+39&display=swap" rel="stylesheet">
</head>
<body>
    <div class="name">${product.name}</div>
    <div class="price">&#8378;${Number(product.sale_price).toFixed(2)}</div>
    <div class="barcode">*${product.barcode}*</div>
    <div class="barcode-text">${product.barcode}</div>
</body>
</html>`;

        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc) {
            doc.open();
            doc.write(html);
            doc.close();

            // Font yüklenmesini bekle, sonra yazdır
            setTimeout(() => {
                try {
                    iframe.contentWindow?.print();
                } catch (e) {
                    console.error('Yazdırma hatası:', e);
                }
                setTimeout(() => {
                    try { document.body.removeChild(iframe); } catch { }
                    resolve();
                }, 500);
            }, 1200); // Font yüklenme süresi için bekleme
        } else {
            document.body.removeChild(iframe);
            resolve();
        }
    });
}
