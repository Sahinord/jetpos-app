"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
    Landmark,
    FileText,
    PieChart,
    ArrowLeftRight,
    Sparkles,
    ChevronRight,
    Box,
    Calculator,
    Zap,
    Scale
} from "lucide-react";
import BankaTanitim from "./BankaTanitim";
import BankaFis from "./BankaFis";
import BankaRaporu from "./BankaRaporu";

interface BankaPageProps {
    pageId: string;
    showToast?: (message: string, type: "success" | "error" | "info" | "warning") => void;
}

const PAGE_INFO: Record<string, { title: string; desc: string; icon: any; color: string }> = {
    bank_define: { title: "Banka Tanıtmı", desc: "Banka hesap ve şube bilgilerini yönetin", icon: Landmark, color: "text-blue-400" },
    bank_withdraw: { title: "Bankadan Para Çekme", desc: "Nakit çekim işlemlerini kaydedin", icon: FileText, color: "text-rose-400" },
    bank_deposit: { title: "Bankaya Para Yatırma", desc: "Nakit yatırım işlemlerini kaydedin", icon: FileText, color: "text-emerald-400" },
    bank_transfer_in: { title: "Gelen Havaleler", desc: "Hesabınıza gelen transferleri kaydedin", icon: ArrowLeftRight, color: "text-amber-400" },
    bank_transfer_out: { title: "Yapılan Havaleler", desc: "Hesabınızdan giden transferleri kaydedin", icon: ArrowLeftRight, color: "text-orange-400" },
    bank_transfer: { title: "Banka Virman Fişi", desc: "Hesaplar arası bakiye transferi", icon: ArrowLeftRight, color: "text-cyan-400" },
    bank_opening: { title: "Banka Devir Fişi", desc: "Açılış bakiyeleri ve devir işlemleri", icon: FileText, color: "text-slate-400" },
    bank_list: { title: "Banka Listesi", desc: "Tüm kayıtlı banka hesapları", icon: PieChart, color: "text-indigo-400" },
    bank_balance: { title: "Bakiye Raporu", desc: "Hesap bakiye ve durum analizleri", icon: Scale, color: "text-teal-400" },
    bank_history: { title: "Banka Hareketleri", desc: "Detaylı işlem ekstreleri ve döküm", icon: Calculator, color: "text-violet-400" },
};

export default function BankaPage({ pageId, showToast }: BankaPageProps) {
    const info = PAGE_INFO[pageId] || {
        title: "Banka İşlemleri",
        desc: "Finansal yönetim paneli",
        icon: Landmark,
        color: "text-slate-400"
    };

    const renderContent = () => {
        switch (pageId) {
            case "bank_define":
                return <BankaTanitim showToast={showToast} />;
            case "bank_withdraw":
                return <BankaFis type="Para Çekme" showToast={showToast} />;
            case "bank_deposit":
                return <BankaFis type="Para Yatırma" showToast={showToast} />;
            case "bank_transfer_in":
                return <BankaFis type="Gelen Havale" showToast={showToast} />;
            case "bank_transfer_out":
                return <BankaFis type="Yapılan Havale" showToast={showToast} />;
            case "bank_transfer":
                return <BankaFis type="Virman" showToast={showToast} />;
            case "bank_opening":
                return <BankaFis type="Devir" showToast={showToast} />;
            case "bank_list":
                return <BankaRaporu type="Liste" showToast={showToast} />;
            case "bank_balance":
                return <BankaRaporu type="Bakiye" showToast={showToast} />;
            case "bank_history":
                return <BankaRaporu type="Hareket" showToast={showToast} />;
            default:
                return (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-card p-12 text-center border-border relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
                        <div className="relative z-10">
                            <Box className="w-16 h-16 text-secondary/20 mb-4 mx-auto" />
                            <h3 className="text-xl font-black text-secondary tracking-widest uppercase">Sayfa Bulunamadı</h3>
                            <p className="text-secondary/60 text-sm mt-2 font-medium">Bu bölüme ait bileşen henüz tanımlanmamış.</p>
                        </div>
                    </motion.div>
                );
        }
    };

    const Icon = info.icon;

    return (
        <div className="min-h-screen space-y-10">
            {/* Dynamic Content Area */}
            <div className="relative">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={pageId}
                        initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: -30, filter: "blur(10px)" }}
                        transition={{ duration: 0.5, ease: "anticipate" }}
                    >
                        {renderContent()}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
