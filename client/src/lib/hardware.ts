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
 * Barkod Yazıcı (ZPL/EPL veya HTML Print)
 */
export async function printBarcodeLabel(product: any, settings: any = {}) {
    // Tarayıcı yazdırma penceresini açar (CSS @media print ile optimize edilmiş)
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
        <html>
            <head>
                <style>
                    @page { size: ${settings.width || '40mm'} ${settings.height || '30mm'}; margin: 0; }
                    body { font-family: 'Inter', sans-serif; margin: 5px; text-align: center; }
                    .name { font-size: 10px; font-weight: bold; margin-bottom: 2px; }
                    .price { font-size: 14px; font-weight: 1000; }
                    .barcode { font-family: 'Libre Barcode 39', cursive; font-size: 30px; }
                    .barcode-text { font-size: 8px; }
                </style>
                <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+39&display=swap" rel="stylesheet">
            </head>
            <body>
                <div class="name">${product.name}</div>
                <div class="price">₺${product.sale_price.toFixed(2)}</div>
                <div class="barcode">*${product.barcode}*</div>
                <div class="barcode-text">${product.barcode}</div>
                <script>window.onload = () => { window.print(); window.close(); }</script>
            </body>
        </html>
    `);
    printWindow.document.close();
}
