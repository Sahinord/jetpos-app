"use client";

import { useState } from 'react';
import { useTenant } from '@/lib/tenant-context';
import { Building2, ChevronDown, Check } from 'lucide-react';
import Image from 'next/image';

export default function TenantSwitcher() {
    const { currentTenant, availableTenants, switchTenant } = useTenant();
    const [isOpen, setIsOpen] = useState(false);

    if (!currentTenant || availableTenants.length <= 1) {
        return null; // Tek tenant varsa gösterme
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/10"
            >
                {currentTenant.logo_url ? (
                    <Image
                        src={currentTenant.logo_url}
                        alt={currentTenant.company_name}
                        width={32}
                        height={32}
                        className="rounded-lg object-cover"
                    />
                ) : (
                    <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-primary" />
                    </div>
                )}

                <div className="text-left">
                    <p className="text-sm font-bold text-white">{currentTenant.company_name}</p>
                    <p className="text-xs text-secondary">Aktif Lisans</p>
                </div>

                <ChevronDown className={`w-4 h-4 text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown */}
                    <div className="absolute top-full left-0 mt-2 w-72 bg-[#1e293b] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                        <div className="p-2">
                            <p className="px-3 py-2 text-xs font-bold text-secondary uppercase tracking-wider">
                                Erişilebilir Lisanslar
                            </p>

                            {availableTenants.map((tenant) => (
                                <button
                                    key={tenant.id}
                                    onClick={() => {
                                        switchTenant(tenant.id);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${currentTenant.id === tenant.id
                                            ? 'bg-primary/10 border border-primary/20'
                                            : 'hover:bg-white/5'
                                        }`}
                                >
                                    {tenant.logo_url ? (
                                        <Image
                                            src={tenant.logo_url}
                                            alt={tenant.company_name}
                                            width={32}
                                            height={32}
                                            className="rounded-lg object-cover"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Building2 className="w-5 h-5 text-white/60" />
                                        </div>
                                    )}

                                    <div className="flex-1 text-left">
                                        <p className="text-sm font-bold text-white">{tenant.company_name}</p>
                                        <p className="text-xs text-secondary">{tenant.license_key}</p>
                                    </div>

                                    {currentTenant.id === tenant.id && (
                                        <Check className="w-5 h-5 text-primary flex-shrink-0" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
