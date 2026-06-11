import React, { useState, useEffect } from 'react';
import { useTenant } from '@/lib/tenant-context';
import { motion, AnimatePresence } from 'framer-motion';

import BusinessInfoStep from './Steps/BusinessInfoStep';
import PosSetupStep from './Steps/PosSetupStep';
import InventorySetupStep from './Steps/InventorySetupStep';
import KdsSetupStep from './Steps/KdsSetupStep';
import QrMenuSetupStep from './Steps/QrMenuSetupStep';
import CompletionStep from './Steps/CompletionStep';
import { Lock, ArrowRight } from 'lucide-react';

export default function SetupWizard() {
  const { currentTenant } = useTenant();
  const [steps, setSteps] = useState<{ id: string, component: any }[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [setupEmployeeId, setSetupEmployeeId] = useState<string | null>(null);
  const [recoveryPin, setRecoveryPin] = useState('');
  const [recoveryError, setRecoveryError] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const { verifyEmployeePin } = useTenant();

  useEffect(() => {
    console.log("SetupWizard mounted, checking tenant status:", currentTenant);
    if (!currentTenant) {
      console.log("SetupWizard waiting for currentTenant...");
      return;
    }
    
    const requiredSteps = [];
    
    // 1. General Setup (Business & Admin Account)
    if (!currentTenant.setup_completed) {
      console.log("SetupWizard: setup_completed is false, adding BusinessInfoStep");
      requiredSteps.push({ id: 'business', component: BusinessInfoStep });
    } else {
      console.log("SetupWizard: setup_completed is true, skipping BusinessInfoStep");
    }

    // 2. Module Setups
    const features = currentTenant.features || {};
    const moduleSetup = currentTenant.module_setup || {};
    
    console.log("SetupWizard features:", features);
    console.log("SetupWizard moduleSetup:", moduleSetup);

    if (features.pos && !moduleSetup.pos) requiredSteps.push({ id: 'pos', component: PosSetupStep });
    if (features.inventory && !moduleSetup.inventory) requiredSteps.push({ id: 'inventory', component: InventorySetupStep });
    if (features.kds && !moduleSetup.kds) requiredSteps.push({ id: 'kds', component: KdsSetupStep });
    if (features.qr_menu && !moduleSetup.qr_menu) requiredSteps.push({ id: 'qr_menu', component: QrMenuSetupStep });
    
    // Always add completion summary at the end if there are any steps to complete
    if (requiredSteps.length > 0) {
      requiredSteps.push({ id: 'completion', component: CompletionStep });
    }

    setSteps(requiredSteps);
    setLoading(false);
    console.log("SetupWizard generated steps:", requiredSteps.map(s => s.id));
  }, [currentTenant]);

  const handleNext = (employeeId?: string) => {
    console.log(`SetupWizard handleNext called. Current step: ${currentStepIndex}, Passing employeeId:`, employeeId);
    if (employeeId) {
      setSetupEmployeeId(employeeId);
    }
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      console.log(`SetupWizard moving to next step: ${steps[currentStepIndex + 1].id}`);
    } else {
      console.log("SetupWizard completed all steps. Reloading app.");
      // All steps done, reload app
      window.location.reload();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
         <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (steps.length === 0) return null;

  const CurrentStepComponent = steps[currentStepIndex].component;
  const isCompletion = steps[currentStepIndex].id === 'completion';
  const isBusinessStep = steps[currentStepIndex].id === 'business';

  // Sayfa yenilendiğinde owner yetkisini kaybettiysek PIN ile geri alma ekranı
  if (!isBusinessStep && !setupEmployeeId && currentTenant && !currentTenant.setup_completed) {
    const handleRecoveryLogin = async () => {
      setRecoveryLoading(true);
      setRecoveryError('');
      const res = await verifyEmployeePin(recoveryPin);
      if (res.success && res.employee?.role === 'owner') {
        setSetupEmployeeId(res.employee.id);
      } else {
        setRecoveryError(res.message || 'Geçersiz veya yetkisiz PIN. Sadece işletme sahibi devam edebilir.');
      }
      setRecoveryLoading(false);
    };

    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center">
          <div className="w-16 h-16 bg-blue-500/20 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Kuruluma Devam Et</h2>
          <p className="text-slate-400 text-sm mb-8">Kaldığınız yerden devam etmek için İşletme Sahibi (Patron) PIN kodunuzu girin.</p>
          
          {recoveryError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium p-3 rounded-xl mb-6">
              {recoveryError}
            </div>
          )}

          <div className="space-y-4">
            <input 
              type="password" 
              value={recoveryPin}
              onChange={(e) => setRecoveryPin(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="PIN Kodunuz"
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-center text-2xl tracking-[0.5em] text-white focus:border-blue-500/50 outline-none transition-all"
              autoFocus
              onKeyPress={(e) => e.key === 'Enter' && handleRecoveryLogin()}
            />
            <button
              onClick={handleRecoveryLogin}
              disabled={recoveryLoading || recoveryPin.length < 4}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {recoveryLoading ? 'Doğrulanıyor...' : 'Devam Et'}
              {!recoveryLoading && <ArrowRight size={20} />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-slate-200">
       {/* Setup Header */}
       {!isCompletion && (
         <div className="p-6 border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
            <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
               <div>
                 <h1 className="text-2xl font-black text-white">JetPOS Sistem Kurulumu</h1>
                 <p className="text-slate-400 text-sm mt-1">Lisansınıza özel modüller hazırlanıyor...</p>
               </div>
               
               {/* Progress indicator */}
               <div className="flex items-center gap-3">
                 <div className="text-sm font-bold text-blue-400">
                   Adım {currentStepIndex + 1} / {steps.length - 1}
                 </div>
                 <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-500 ease-out" 
                      style={{ width: `${((currentStepIndex) / (steps.length - 1)) * 100}%` }}
                    />
                 </div>
               </div>
            </div>
         </div>
       )}

       {/* Step Content */}
       <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-4xl mx-auto h-full">
             <AnimatePresence mode="wait">
                <motion.div
                  key={steps[currentStepIndex].id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  <CurrentStepComponent 
                    onNext={handleNext} 
                    tenant={currentTenant} 
                    setupEmployeeId={setupEmployeeId} 
                  />
                </motion.div>
             </AnimatePresence>
          </div>
       </div>
    </div>
  );
}
