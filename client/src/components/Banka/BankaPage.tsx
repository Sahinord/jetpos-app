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
                        className="glass-card p-12 text-center border-white/5 relative overflow-hidden"
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
            {/* Ultra Premium Header Section */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2"
            >
                <div className="space-y-3">
                    <div className="flex items-center gap-3 mb-1">
                        <div className={`p-2.5 rounded-xl bg-white/5 border border-white/10 ${info.color} shadow-inner`}>
                            <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-secondary/60 leading-none">MODÜL / BANKA YÖNETİMİ</span>
                            <div className="flex items-center gap-2 mt-1">
                                <h1 className="text-4xl font-black text-white tracking-tight uppercase">
                                    {info.title}
                                </h1>
                                <Sparkles className="w-6 h-6 text-primary animate-pulse hidden sm:block" />
                            </div>
                        </div>
                    </div>
                    <p className="text-secondary/70 text-sm font-medium max-w-xl leading-relaxed italic border-l-2 border-primary/20 pl-4">
                        {info.desc}
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                        <Zap className="w-3.5 h-3.5 text-emerald-500 animate-bounce" />
                        <span className="text-[10px] font-black text-emerald-500 tracking-[0.2em] uppercase">SİSTEM ÇALIŞIYOR</span>
                    </div>

                    <div className="h-10 w-px bg-white/10 hidden md:block" />

                    <button className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black text-white tracking-widest transition-all flex items-center gap-3 group shadow-xl">
                        KULLANIM KILAVUZU
                        <ChevronRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </motion.div>

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
