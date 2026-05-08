"use client";

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export const exportToExcel = (data: any[], fileName: string) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, `${fileName}_${new Date().getTime()}.xlsx`);
};

export const importFromExcel = (file: File, callback: (data: any[]) => void) => {
    console.log(`[Excel Import] File: ${file.name}, Size: ${file.size} bytes`);
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { 
                type: 'array',
                cellDates: true,
                cellNF: false,
                cellText: false
            });
            const worksheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[worksheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
            callback(jsonData);
        } catch (error: any) {
            console.error("❌ Excel Reading Error:", error);
            alert(`Excel dosyası okunamadı: ${error.message}\nLütfen dosyayı kapatıp tekrar deneyin veya farklı kaydedin.`);
        }
    };
    reader.onerror = (err) => {
        console.error("❌ FileReader Error:", err);
        alert("Dosya okunurken bir hata oluştu.");
    };
    reader.readAsArrayBuffer(file);
};
