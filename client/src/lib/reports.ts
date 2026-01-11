"use client";

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export const generateZReportPDF = (stats: any, topProducts: any[]) => {
    const doc = new jsPDF();
    const dateStr = new Date().toLocaleDateString('tr-TR');

    // Header
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42);
    doc.text("KARDEŞLER KASAP - Z RAPORU", 105, 20, { align: "center" });

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Rapor Tarihi: ${dateStr}`, 105, 28, { align: "center" });

    // Summary Stats
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("Günün Özeti", 14, 45);

    const summaryData = [
        ["Toplam Ciro", `₺${stats.totalSales.toLocaleString('tr-TR')}`],
        ["Net Kar", `₺${stats.totalProfit.toLocaleString('tr-TR')}`],
        ["İşlem Sayısı", stats.itemCount.toString()],
        ["Ortalama Sepet", `₺${stats.avgBasket.toFixed(2)}`]
    ];

    autoTable(doc, {
        startY: 50,
        head: [['Açıklama', 'Değer']],
        body: summaryData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] }
    });

    // Top Products
    doc.text("Günün En Çok Satan Ürünleri", 14, (doc as any).lastAutoTable.finalY + 15);

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
        headStyles: { fillColor: [45, 212, 191] }
    });

    // Footer
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text("Kardeşler Kasap Muhasebe Sistemi tarafından otomatik oluşturulmuştur.", 105, finalY, { align: "center" });

    doc.save(`Z_Raporu_${dateStr.replace(/\./g, '_')}.pdf`);
};

export const exportZReportExcel = (stats: any, topProducts: any[]) => {
    const dateStr = new Date().toLocaleDateString('tr-TR');

    // Summary Data
    const summary = [
        ["Kardeşler Kasap Z-Raporu"],
        ["Tarih", dateStr],
        [],
        ["GÜNÜN ÖZETİ"],
        ["Toplam Ciro", stats.totalSales],
        ["Net Kar", stats.totalProfit],
        ["İşlem Sayısı", stats.itemCount],
        ["Ortalama Sepet", stats.avgBasket],
        [],
        ["GÜNÜN YILDIZLARI (TOP 5)"],
        ["#", "Ürün Adı", "Barkod", "Satış Adedi", "Toplam Ciro"]
    ];

    // Add products
    topProducts.forEach((p, i) => {
        summary.push([i + 1, p.name, p.barcode, p.totalQty, p.totalRevenue]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(summary);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Z Raporu");

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, `Z_Raporu_${dateStr.replace(/\./g, '_')}.xlsx`);
};
