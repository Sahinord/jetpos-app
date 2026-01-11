import React, { useRef, forwardRef } from 'react';
import { useReactToPrint } from 'react-to-print';

interface ReceiptProps {
    data: {
        items: any[];
        total: number;
        date: Date;
        paymentMethod: string;
        saleId: string;
    } | null;
}

const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(({ data }, ref) => {
    if (!data) return null;

    return (
        <div style={{ display: 'none' }}>
            <div ref={ref} className="thermal-receipt" style={{
                width: '80mm',
                padding: '2mm',
                fontFamily: '"Courier New", Courier, monospace',
                fontSize: '12px',
                lineHeight: '1.2',
                color: '#000',
                backgroundColor: '#fff',
                textTransform: 'uppercase'
            }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                    <h1 style={{ margin: '0', fontSize: '18px', fontWeight: 'bold' }}>ANTİGRAVİTY MARKET</h1>
                    <div style={{ fontSize: '10px', marginTop: '2px' }}>MODERN PERAKENDE SİSTEMLERİ</div>
                    <div style={{ fontSize: '10px' }}>TEL: 0555 555 55 55</div>
                    <div style={{ margin: '5px 0' }}>********************************</div>
                </div>

                {/* Info */}
                <div style={{ fontSize: '11px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>TARİH: {data.date.toLocaleDateString('tr-TR')}</span>
                        <span>SAAT: {data.date.toLocaleTimeString('tr-TR')}</span>
                    </div>
                    <div>FİŞ NO: {data.saleId}</div>
                    <div style={{ margin: '5px 0' }}>--------------------------------</div>
                </div>

                {/* Table Header */}
                <div style={{ fontSize: '11px', fontWeight: 'bold', display: 'flex', borderBottom: '1px solid #000', paddingBottom: '2px' }}>
                    <span style={{ flex: 1 }}>ÜRÜN</span>
                    <span style={{ width: '40px', textAlign: 'center' }}>AD</span>
                    <span style={{ width: '60px', textAlign: 'right' }}>TUTAR</span>
                </div>

                {/* Items */}
                <div style={{ marginBottom: '10px' }}>
                    {data.items.map((item, index) => (
                        <div key={index} style={{ padding: '3px 0', borderBottom: '1px dashed #eee' }}>
                            <div style={{ fontSize: '11px', fontWeight: 'bold' }}>{item.name}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                                <span>{item.quantity} {item.unit || 'AD'} X ₺{item.sale_price.toFixed(2)}</span>
                                <span>₺{(item.sale_price * item.quantity).toFixed(2)}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ margin: '5px 0' }}>********************************</div>

                {/* Totals */}
                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>TOPLAM:</span>
                        <span>₺{data.total.toFixed(2)}</span>
                    </div>
                </div>

                {/* Payment Detail */}
                <div style={{ fontSize: '11px', marginTop: '5px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>ÖDEME:</span>
                        <span>{data.paymentMethod}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>KDV (%10):</span>
                        <span>₺{(data.total * 0.1).toFixed(2)}</span>
                    </div>
                </div>

                <div style={{ margin: '10px 0' }}>--------------------------------</div>

                {/* Footer */}
                <div style={{ textAlign: 'center', fontSize: '10px' }}>
                    <div>YİNE BEKLERİZ</div>
                    <div style={{ marginTop: '5px', fontWeight: 'bold' }}>MALİ DEĞERİ YOKTUR</div>
                    <div>BİLGİ FİŞİDİR</div>
                </div>

                {/* Spacing for cutter */}
                <div style={{ height: '20mm' }}></div>
            </div>
        </div>
    );
});

Receipt.displayName = 'Receipt';

export const PrintReceiptButton = ({ data, onAfterPrint }: { data: any, onAfterPrint?: () => void }) => {
    const componentRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        onAfterPrint: onAfterPrint,
    });

    React.useEffect(() => {
        if (data) {
            // Auto-trigger print when data is provided after checkout
            const timer = setTimeout(() => {
                const btn = document.getElementById('print-receipt-trigger');
                if (btn) btn.click();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [data]);

    return (
        <>
            <button
                className="hidden"
                id="print-receipt-trigger"
                onClick={() => handlePrint()}
            >
                Yazdır
            </button>
            <Receipt ref={componentRef} data={data} />
        </>
    );
};
