"use client";

import { useState, useEffect } from 'react';
import { FileText, Package, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AlisIrsaliyesi from './AlisIrsaliyesi';
import SatisIrsaliyesi from './SatisIrsaliyesi';
import SatisIadeIrsaliyesi from './SatisIadeIrsaliyesi';
import AlisIadeIrsaliyesi from './AlisIadeIrsaliyesi';
import SevkIrsaliyesi from './SevkIrsaliyesi';
import AlisFaturasi from '../Invoice/AlisFaturasi';
import InvoicePanel from '../Invoice/InvoicePanel';
import PerakendeSatisFaturasi from '../Invoice/PerakendeSatisFaturasi';
import IadeFaturasi from '../Invoice/IadeFaturasi';
import IadeFiyatFarkiFisi from '../Invoice/IadeFiyatFarkiFisi';
import EmsaliyetFisleri from '../Invoice/EmsaliyetFisleri';
import HizmetFaturasi from '../Invoice/HizmetFaturasi';
import VATReports from '../Invoice/VATReports';

type ActiveView =
    // İrsaliyeler
    | 'alis_irsaliyesi'
    | 'satis_irsaliyesi'
    | 'satis_iade_irsaliyesi'
    | 'alis_iade_irsaliyesi'
    | 'sevk_irsaliyesi'
    // Faturalar
    | 'alis_faturasi'
    | 'satis_faturasi'
    | 'perakende_satis_faturasi'
    | 'iade_faturasi'
    | 'iade_fiyat_farki'
    | 'emsaliyet_fisleri'
    // Hizmet Faturaları
    | 'alinan_hizmet_faturasi'
    | 'yapilan_hizmet_faturasi'
    | 'yapilan_hizmet_iadesi'
    | 'alinan_hizmet_iadesi'
    // Raporlar
    | 'fatura_listesi'
    | 'fatura_kdv_listesi'
    | 'kdv_analiz_raporu';

interface InvoiceWaybillPageProps {
    category?: 'irsaliye' | 'fatura' | 'hizmet' | 'raporlar';
    initialView?: ActiveView;
}

export default function InvoiceWaybillPage({ category, initialView }: InvoiceWaybillPageProps) {
    const [activeView, setActiveView] = useState<ActiveView>(initialView || 'alis_irsaliyesi');
    const [activeCategory, setActiveCategory] = useState<'irsaliye' | 'fatura' | 'hizmet' | 'raporlar'>(category || 'irsaliye');

    // Dışarıdan kategori veya view değiştiğinde state'i güncelle
    useEffect(() => {
        if (category) {
            setActiveCategory(category);
        }
        if (initialView && initialView !== activeView) {
            setActiveView(initialView);
        }
    }, [category, initialView]);

    const irsaliyeItems = [
        { id: 'alis_irsaliyesi', label: 'Alış İrsaliyesi', color: 'blue' },
        { id: 'satis_irsaliyesi', label: 'Satış İrsaliyesi', color: 'emerald' },
        { id: 'satis_iade_irsaliyesi', label: 'Satış İade İrsaliyesi', color: 'orange' },
        { id: 'alis_iade_irsaliyesi', label: 'Alış İade İrsaliyesi', color: 'purple' },
        { id: 'sevk_irsaliyesi', label: 'Sipariş Sevk İrsaliyesi', color: 'cyan' }
    ];

    const faturaItems = [
        { id: 'alis_faturasi', label: 'Alış Faturası', color: 'blue' },
        { id: 'satis_faturasi', label: 'Satış Faturası', color: 'emerald' },
        { id: 'perakende_satis_faturasi', label: 'Perakende Satış Faturası', color: 'teal' },
        { id: 'iade_faturasi', label: 'İade Faturası', color: 'orange' },
        { id: 'iade_fiyat_farki', label: 'İade Fiyat Farkı Fişi', color: 'amber' },
        { id: 'emsaliyet_fisleri', label: 'Emsaliyet / Proforma', color: 'indigo' }
    ];

    const hizmetItems = [
        { id: 'alinan_hizmet_faturasi', label: 'Alınan Hizmet Faturası', color: 'indigo' },
        { id: 'yapilan_hizmet_faturasi', label: 'Yapılan Hizmet Faturası', color: 'teal' },
        { id: 'yapilan_hizmet_iadesi', label: 'Yapılan Hizmet Fat. İadesi', color: 'pink' },
        { id: 'alinan_hizmet_iadesi', label: 'Alınan Hizmet Fat. İadesi', color: 'amber' }
    ];

    const raporItems = [
        { id: 'fatura_listesi', label: 'Fatura Listesi', color: 'blue' },
        { id: 'fatura_kdv_listesi', label: 'Fatura KDV Listesi', color: 'emerald' },
        { id: 'kdv_analiz_raporu', label: 'KDV Analiz Raporu', color: 'orange' }
    ];

    const renderContent = () => {
        switch (activeView) {
            case 'alis_irsaliyesi':
                return <AlisIrsaliyesi />;
            case 'satis_irsaliyesi':
                return <SatisIrsaliyesi />;
            case 'satis_iade_irsaliyesi':
                return <SatisIadeIrsaliyesi />;
            case 'alis_iade_irsaliyesi':
                return <AlisIadeIrsaliyesi />;
            case 'sevk_irsaliyesi':
                return <SevkIrsaliyesi />;
            case 'alis_faturasi':
                return <AlisFaturasi />;
            case 'satis_faturasi':
                return <InvoicePanel />;
            case 'perakende_satis_faturasi':
                return <PerakendeSatisFaturasi />;
            case 'iade_faturasi':
                return <IadeFaturasi />;
            case 'iade_fiyat_farki':
                return <IadeFiyatFarkiFisi />;
            case 'emsaliyet_fisleri':
                return <EmsaliyetFisleri />;
            case 'alinan_hizmet_faturasi':
                return <HizmetFaturasi type="alinan_hizmet" />;
            case 'yapilan_hizmet_faturasi':
                return <HizmetFaturasi type="yapilan_hizmet" />;
            case 'yapilan_hizmet_iadesi':
                return <HizmetFaturasi type="yapilan_hizmet_iadesi" />;
            case 'alinan_hizmet_iadesi':
                return <HizmetFaturasi type="alinan_hizmet_iadesi" />;
            case 'fatura_kdv_listesi':
                return <VATReports type="list" />;
            case 'kdv_analiz_raporu':
                return <VATReports type="analysis" />;
            case 'fatura_listesi':
                return <VATReports type="invoice_list" />;
            default:
                return (
                    <div className="glass-card p-12 text-center">
                        <div className="text-secondary text-sm">
                            <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p className="font-bold">Bu sayfa henüz oluşturulmadı</p>
                            <p className="text-xs mt-2 opacity-70">Yakında eklenecek...</p>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="w-full h-full flex flex-col p-4 space-y-4 overflow-x-hidden">
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeView}
                    initial={{ opacity: 0, scale: 0.99, y: 5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.99, y: -5 }}
                    transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                    className="w-full h-full"
                >
                    {renderContent()}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
