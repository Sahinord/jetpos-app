"use client";

import BarcodeScanner from '@/components/BarcodeScanner';
import BottomNav from '@/components/BottomNav';

export default function ScannerPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-card to-background pb-24">
            <BarcodeScanner />
            <BottomNav />
        </div>
    );
}
