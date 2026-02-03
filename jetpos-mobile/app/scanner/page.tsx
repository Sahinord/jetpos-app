"use client";

import BarcodeScanner from '@/components/BarcodeScanner';
import BottomNav from '@/components/BottomNav';

export default function ScannerPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-24">
            <BarcodeScanner />
            <BottomNav />
        </div>
    );
}
