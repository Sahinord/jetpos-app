"use client";

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Toaster } from 'sonner';

const BarcodeScanner = dynamic(
  () => import('@/components/BarcodeScanner'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500 mx-auto"></div>
          <p className="text-white font-bold">Yükleniyor...</p>
        </div>
      </div>
    )
  }
);

export default function Home() {
  return (
    <>
      <Suspense fallback={<LoadingSpinner />}>
        <BarcodeScanner />
      </Suspense>
      <Toaster position="top-center" richColors />
    </>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500 mx-auto"></div>
        <p className="text-white font-bold">Scanner Hazırlanıyor...</p>
      </div>
    </div>
  );
}
