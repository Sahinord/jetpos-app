"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
    Wallet,
    LayoutDashboard,
    FileInput,
    FileOutput,
    ArrowLeftRight,
    FilePlus,
    Scale,
    FileSearch,
    Construction,
    ChevronRight,
    type LucideIcon,
    Sparkles,
    Box
} from "lucide-react";
import KasaTanitim from "./KasaTanitim";
import OdaTanitim from "./OdaTanitim";
import KasaFis from "./KasaFis";
import KasaRaporu from "./KasaRaporu";

interface KasaPageProps {
    pageId: string;
    showToast?: (message: string, type: "success" | "error" | "info" | "warning") => void;
}

const PAGE_INFO: Record<string, { title: string; description: string; icon: LucideIcon; color: string; gradient: string }> = {
    cash_define: {
        title: "Kasa Tanıtımı",
        description: "İşletmenizin kasalarını tanımlayın ve yönetin.",
        icon: Wallet,
        color: "text-blue-400",
        gradient: "from-blue-500/20 to-transparent"
    },
    cash_room: {
        title: "Oda / Masa Tanıtımı",
        description: "Oda, masa ve yerleşim birimlerini yönetin.",
        icon: LayoutDashboard,
        color: "text-purple-400",
        gradient: "from-purple-500/20 to-transparent"
    },
    cash_in: {
        title: "Kasa Tahsilat Fişi",
        description: "Nakit tahsilat ve giriş işlemlerini kaydedin.",
        icon: FileInput,
        color: "text-emerald-400",
        gradient: "from-emerald-500/20 to-transparent"
    },
    cash_out: {
        title: "Kasa Ödeme Fişi (Tediye)",
        description: "Nakit ödeme ve çıkış işlemlerini kaydedin.",
        icon: FileOutput,
        color: "text-rose-400",
        gradient: "from-rose-500/20 to-transparent"
    },
    cash_transfer: {
        title: "Kasa Virman Fişi",
        description: "Kasalar arası bakiye transferi gerçekleştirin.",
        icon: ArrowLeftRight,
        color: "text-amber-400",
        gradient: "from-amber-500/20 to-transparent"
    },
    cash_opening: {
        title: "Kasa Devir Fişi",
        description: "Açılış bakiyeleri ve devir işlemlerini yönetin.",
        icon: FilePlus,
        color: "text-cyan-400",
        gradient: "from-cyan-500/20 to-transparent"
    },
    cash_balance: {
        title: "Kasa Bakiye Raporu",
        description: "Güncel kasa durumlarını ve toplamları izleyin.",
        icon: Scale,
        color: "text-teal-400",
        gradient: "from-teal-500/20 to-transparent"
    },
    cash_history: {
        title: "Kasa Hareket Raporu",
        description: "Detaylı işlem geçmişi ve hareket analizi.",
        icon: FileSearch,
        color: "text-indigo-400",
        gradient: "from-indigo-500/20 to-transparent"
    },
};

export default function KasaPage({ pageId, showToast }: KasaPageProps) {
    const info = PAGE_INFO[pageId] || {
        title: "Kasa İşlemleri",
        description: "Modül seçimi yapınız.",
        icon: Box,
        color: "text-slate-400",
        gradient: "from-slate-500/20 to-transparent"
    };

    const renderContent = () => {
        switch (pageId) {
            case "cash_define":
                return <KasaTanitim showToast={showToast} />;
            case "cash_room":
                return <OdaTanitim showToast={showToast} />;
            case "cash_in":
                return <KasaFis type="Tahsilat" showToast={showToast} />;
            case "cash_out":
                return <KasaFis type="Tediye" showToast={showToast} />;
            case "cash_transfer":
                return <KasaFis type="Virman" showToast={showToast} />;
            case "cash_opening":
                return <KasaFis type="Devir" showToast={showToast} />;
            case "cash_balance":
                return <KasaRaporu mode="Bakiye" showToast={showToast} />;
            case "cash_history":
                return <KasaRaporu mode="Hareket" showToast={showToast} />;
            default:
                return (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-card p-12 text-center border-white/5 relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
                        <div className="relative z-10">
                            <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/10 shadow-2xl">
                                <Construction className="w-10 h-10 text-primary animate-pulse" />
                            </div>
                            <h2 className="text-2xl font-black text-white mb-3">Geliştirme Devam Ediyor</h2>
                            <p className="text-secondary max-w-md mx-auto mb-8 font-medium">
                                <span className="text-primary font-bold">{info.title}</span> ekranı şu an aktif olarak kodlanmaktadır.
                                En kısa sürede tam fonksiyonel olarak hizmetinize sunulacaktır.
                            </p>
                        </div>
                    </motion.div>
                );
        }
    };

    const Icon = info.icon;

    return (
        <div className="min-h-screen">
            {/* Dynamic Content Area */}
            <div className="relative">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={pageId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, ease: "circOut" }}
                    >
                        {renderContent()}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
