"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LicenseGate from '@/components/LicenseGate';
import { Toaster } from 'sonner';

export default function Home() {
  const [hasLicense, setHasLicense] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if license exists
    const license = localStorage.getItem('licenseKey');
    const tenantId = localStorage.getItem('tenantId');

    if (license && tenantId) {
      // License exists, redirect to dashboard
      router.push('/dashboard');
    } else {
      setLoading(false);
    }
  }, [router]);

  const handleLicenseSuccess = (tenantId: string, companyName: string) => {
    // License validated successfully, redirect to dashboard
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-white font-bold">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <LicenseGate onSuccess={handleLicenseSuccess} />
      <Toaster position="top-center" richColors />
    </>
  );
}
