"use client";

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// jsPDF'in varsayılan fontu (Helvetica) yalnızca Latin-1 destekler; İ, ı, ş, ğ
// ve ₺ (Türk Lirası) glyph'lerini içermez — bu yüzden Z raporunda Türkçe metin
// bozuk çıkıyordu ("MALİ"→"MAL0", "Değer"→"De er", "₺"→"°"). Çözüm: Türkçe + ₺
// içeren bir Unicode TTF'i (DejaVuSans) çalışma anında gömmek. Font public/'ten
// tek seferlik çekilip base64 olarak önbelleğe alınır (bundle'ı şişirmez).
const FONT_NAME = 'DejaVuSans';
let cachedFontBase64: string | null = null;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const CHUNK = 0x8000; // büyük dizide String.fromCharCode(...) stack taşmasını önle
    for (let i = 0; i < bytes.length; i += CHUNK) {
        binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + CHUNK)));
    }
    return btoa(binary);
}

/**
 * DejaVuSans'ı jsPDF dokümanına yükler ve aktif font yapar. Başarılı olursa
 * kullanılacak font adını, başarısız olursa (örn. çevrimdışı) null döner —
 * çağıran o durumda varsayılan fontla devam eder (bozuk ama çökmez).
 */
async function ensureTurkishFont(doc: jsPDF): Promise<string | null> {
    try {
        if (!cachedFontBase64) {
            const res = await fetch('/fonts/DejaVuSans.ttf');
            if (!res.ok) throw new Error(`font fetch ${res.status}`);
            cachedFontBase64 = arrayBufferToBase64(await res.arrayBuffer());
        }
        doc.addFileToVFS('DejaVuSans.ttf', cachedFontBase64);
        doc.addFont('DejaVuSans.ttf', FONT_NAME, 'normal');
        // Bold varyantı da aynı dosyaya bağlanır; autoTable'ın kalın başlıkları
        // "font yok" hatası vermeden doğru glyph'lerle render edilir.
        doc.addFont('DejaVuSans.ttf', FONT_NAME, 'bold');
        doc.setFont(FONT_NAME, 'normal');
        return FONT_NAME;
    } catch (err) {
        console.warn('[reports] Türkçe font yüklenemedi, varsayılana düşülüyor:', err);
        return null;
    }
}

export const generateZReportPDF = async (stats: any, topProducts: any[]) => {
    const doc = new jsPDF();
    const dateStr = new Date().toLocaleDateString('tr-TR');

    const font = await ensureTurkishFont(doc);
    // autoTable'ın her çağrıya uygulayacağı ortak stiller (font gömülemezse
    // undefined bırakılır → jsPDF varsayılanı).
    const tableFont = font || undefined;

    // Header
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42);
    doc.text("JETPOS - MALİ Z RAPORU", 105, 20, { align: "center" });

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Rapor Tarihi: ${dateStr}`, 105, 28, { align: "center" });

    // Summary Stats
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("Finansal Özet", 14, 45);

    const summaryData = [
        ["Toplam Ciro (KDV Dahil)", `₺${stats.totalSales.toLocaleString('tr-TR')}`],
        ["Toplam KDV", `₺${(stats.totalVat || 0).toLocaleString('tr-TR')}`],
        ["Net Kar", `₺${stats.totalProfit.toLocaleString('tr-TR')}`],
        ["İşlem Sayısı", stats.itemCount.toString()],
        ["Ortalama Sepet", `₺${stats.avgBasket.toFixed(2)}`]
    ];

    autoTable(doc, {
        startY: 50,
        head: [['Açıklama', 'Değer']],
        body: summaryData,
        theme: 'striped',
        styles: tableFont ? { font: tableFont } : undefined,
        headStyles: { fillColor: [59, 130, 246], font: tableFont, fontStyle: 'bold' },
    });

    // VAT Breakdown
    if (stats.vatBreakdown && Object.keys(stats.vatBreakdown).length > 0) {
        doc.text("KDV Detayları", 14, (doc as any).lastAutoTable.finalY + 15);
        const vatData = Object.entries(stats.vatBreakdown).map(([rate, amount]: any) => [
            `%${rate} KDV`,
            `₺${amount.toLocaleString('tr-TR')}`
        ]);

        autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY + 20,
            head: [['KDV Oranı', 'Tahsil Edilen Tutar']],
            body: vatData,
            theme: 'grid',
            styles: tableFont ? { font: tableFont } : undefined,
            headStyles: { fillColor: [245, 158, 11], font: tableFont, fontStyle: 'bold' },
        });
    }

    // Top Products
    doc.text("En Çok Satan Ürünler", 14, (doc as any).lastAutoTable.finalY + 15);

    const productData = topProducts.map((p, i) => [
        i + 1,
        p.name,
        p.barcode,
        p.totalQty,
        `₺${p.totalRevenue.toLocaleString('tr-TR')}`
    ]);

    autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [['#', 'Ürün Adı', 'Barkod', 'Adet/KG', 'Toplam Ciro']],
        body: productData,
        theme: 'grid',
        styles: tableFont ? { font: tableFont } : undefined,
        headStyles: { fillColor: [45, 212, 191], font: tableFont, fontStyle: 'bold' },
    });

    // Footer
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text("JetPOS Muhasebe Sistemi tarafından otomatik oluşturulmuştur.", 105, finalY, { align: "center" });

    doc.save(`Mali_Z_Raporu_${dateStr.replace(/\./g, '_')}.pdf`);
};

export const exportZReportExcel = (stats: any, topProducts: any[]) => {
    const dateStr = new Date().toLocaleDateString('tr-TR');

    // Summary Data
    const summary: (string | number)[][] = [
        ["JetPOS Mali Z-Raporu"],
        ["Tarih", dateStr],
        [],
        ["FİNANSAL ÖZET"],
        ["Toplam Ciro", stats.totalSales],
        ["Toplam KDV", stats.totalVat || 0],
        ["Net Kar", stats.totalProfit],
        ["İşlem Sayısı", stats.itemCount],
        ["Ortalama Sepet", stats.avgBasket],
        [],
        ["KDV DETAYLARI"],
        ["KDV Oranı", "Tutar"]
    ];

    if (stats.vatBreakdown) {
        Object.entries(stats.vatBreakdown).forEach(([rate, amount]: any) => {
            summary.push([`%${rate}`, amount]);
        });
    }

    summary.push([], ["EN ÇOK SATANLAR"], ["#", "Ürün Adı", "Barkod", "Satış Adedi", "Toplam Ciro"]);

    // Add products
    topProducts.forEach((p, i) => {
        summary.push([i + 1, p.name, p.barcode, p.totalQty, p.totalRevenue]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(summary);

    // Sütun genişlikleri — aksi halde başlıklar/ürün adları kırpılıyordu.
    worksheet['!cols'] = [
        { wch: 26 }, // etiketler + sıra no
        { wch: 32 }, // değerler + ürün adı (uzun)
        { wch: 18 }, // barkod
        { wch: 14 }, // satış adedi
        { wch: 16 }, // toplam ciro
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Z Raporu");

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, `Mali_Z_Raporu_${dateStr.replace(/\./g, '_')}.xlsx`);
};
