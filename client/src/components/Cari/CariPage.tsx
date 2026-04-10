"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users,
    UserPlus,
    FolderOpen,
    Tags,
    FileOutput,
    FileInput,
    ArrowLeftRight,
    FilePlus,
    ClipboardList,
    Scale,
    FileSearch,
    FileText,
    CalendarDays,
    PieChart,
    LayoutGrid,
    TrendingUp,
    TrendingDown,
    ArrowRight,
    type LucideIcon
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTenant } from "@/lib/tenant-context";

// Components
import CariTanitim from "./CariTanitim";
import GrupTanitim from "./GrupTanitim";
import OzelKodTanitim from "./OzelKodTanitim";
import BorcDekontu from "./BorcDekontu";
import AlacakDekontu from "./AlacakDekontu";
import VirmanDekontu from "./VirmanDekontu";
import DevirFisi from "./DevirFisi";
import CariListesi from "./CariListesi";
import BakiyeRaporu from "./BakiyeRaporu";
import HareketRaporu from "./HareketRaporu";
import MutabakatRaporu from "./MutabakatRaporu";
import GunlukHareket from "./GunlukHareket";
import CariAnalizi from "./CariAnalizi";

interface CariPageProps {
    pageId: string;
    showToast?: (message: string, type: "success" | "error" | "info" | "warning") => void;
}

const PAGE_INFO: Record<string, { title: string; description: string; icon: LucideIcon; color: string; category: string }> = {
    cari_tanim: {
        title: "Cari Tanıtımı",
        description: "Müşteri ve tedarikçi cari hesap kartlarını oluşturun ve yönetin.",
        icon: UserPlus,
        color: "from-blue-500 to-blue-600",
        category: "Tanımlamalar"
    },
    cari_grup: {
        title: "Grup Tanıtımı",
        description: "Cari hesapları gruplandırmak için grup tanımları oluşturun.",
        icon: FolderOpen,
        color: "from-purple-500 to-purple-600",
        category: "Tanımlamalar"
    },
    cari_ozelkod: {
        title: "Özel Kod Tanıtımı",
        description: "Cari hesaplara özel kodlar atayarak sınıflandırma yapın.",
        icon: Tags,
        color: "from-pink-500 to-rose-600",
        category: "Tanımlamalar"
    },
    cari_borc: {
        title: "Borç Dekontu",
        description: "Cari hesaba borç kaydı oluşturun.",
        icon: FileOutput,
        color: "from-red-500 to-red-600",
        category: "İşlemler"
    },
    cari_alacak: {
        title: "Alacak Dekontu",
        description: "Cari hesaba alacak kaydı oluşturun.",
        icon: FileInput,
        color: "from-emerald-500 to-emerald-600",
        category: "İşlemler"
    },
    cari_virman: {
        title: "Virman Dekontu",
        description: "Cari hesaplar arası virman işlemi yapın.",
        icon: ArrowLeftRight,
        color: "from-amber-500 to-orange-600",
        category: "İşlemler"
    },
    cari_devir: {
        title: "Devir Fişi",
        description: "Dönem başı cari hesap devir bakiyelerini girin.",
        icon: FilePlus,
        color: "from-cyan-500 to-cyan-600",
        category: "İşlemler"
    },
    cari_liste: {
        title: "Cari Kartı Listesi",
        description: "Tüm cari hesap kartlarını listeleyin ve yönetin.",
        icon: ClipboardList,
        color: "from-indigo-500 to-indigo-600",
        category: "Raporlar"
    },
    cari_bakiye: {
        title: "Bakiye Raporu",
        description: "Cari hesap bakiyelerini görüntüleyin.",
        icon: Scale,
        color: "from-teal-500 to-teal-600",
        category: "Raporlar"
    },
    cari_hareket: {
        title: "Hareket Raporu",
        description: "Cari hesap hareketlerini detaylı inceleyin.",
        icon: FileSearch,
        color: "from-violet-500 to-violet-600",
        category: "Raporlar"
    },
    cari_mutabakat: {
        title: "Mutabakat Raporu",
        description: "Cari hesap mutabakat işlemlerini yapın.",
        icon: FileText,
        color: "from-slate-500 to-slate-600",
        category: "Raporlar"
    },
    cari_gunluk: {
        title: "Günlük Hareket Raporu",
        description: "Günlük cari hesap hareketlerini görüntüleyin.",
        icon: CalendarDays,
        color: "from-sky-500 to-sky-600",
        category: "Raporlar"
    },
    cari_analiz: {
        title: "Cari Analizi",
        description: "Cari hesap analizlerini ve istatistiklerini görüntüleyin.",
        icon: PieChart,
        color: "from-fuchsia-500 to-fuchsia-600",
        category: "Analiz"
    },
};

export default function CariPage({ pageId, showToast }: CariPageProps) {
    const { currentTenant } = useTenant();
    const [stats, setStats] = useState({
        total: 0,
        borc: 0,
        alacak: 0,
        loading: true
    });
    const [localPageId, setLocalPageId] = useState<string | null>(null);

    // Eğer props'tan gelen pageId değişirse local state'i güncelle
    useEffect(() => {
        if (pageId && pageId !== "cari_hesap") {
            setLocalPageId(pageId);
        } else {
            setLocalPageId(null);
        }
    }, [pageId]);

    useEffect(() => {
        if (currentTenant && !localPageId) {
            fetchStats();
        }
    }, [currentTenant, localPageId]);

    const fetchStats = async () => {
        try {
            const { data, error } = await supabase
                .from('cari_hesaplar')
                .select('borc_toplami, alacak_toplami')
                .eq('tenant_id', currentTenant?.id);

            if (error) throw error;

            const summary = (data || []).reduce((acc, curr) => ({
                total: acc.total + 1,
                borc: acc.borc + (Number(curr.borc_toplami) || 0),
                alacak: acc.alacak + (Number(curr.alacak_toplami) || 0)
            }), { total: 0, borc: 0, alacak: 0 });

            setStats({ ...summary, loading: false });
        } catch (err) {
            console.error("Cari istatistikleri alınamadı:", err);
            setStats(prev => ({ ...prev, loading: false }));
        }
    };

    // Sayfa Yönlendirme Mantığı
    const activePage = localPageId || pageId;

    if (activePage === "cari_tanim") return <CariTanitim showToast={showToast} />;
    if (activePage === "cari_grup") return <GrupTanitim showToast={showToast} />;
    if (activePage === "cari_ozelkod") return <OzelKodTanitim showToast={showToast} />;
    if (activePage === "cari_borc") return <BorcDekontu showToast={showToast} />;
    if (activePage === "cari_alacak") return <AlacakDekontu showToast={showToast} />;
    if (activePage === "cari_virman") return <VirmanDekontu showToast={showToast} />;
    if (activePage === "cari_devir") return <DevirFisi showToast={showToast} />;
    if (activePage === "cari_liste") return <CariListesi showToast={showToast} />;
    if (activePage === "cari_bakiye") return <BakiyeRaporu showToast={showToast} />;
    if (activePage === "cari_hareket") return <HareketRaporu showToast={showToast} />;
    if (activePage === "cari_mutabakat") return <MutabakatRaporu showToast={showToast} />;
    if (activePage === "cari_gunluk") return <GunlukHareket showToast={showToast} />;
    if (activePage === "cari_analiz") return <CariAnalizi showToast={showToast} />;

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto p-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Stats Overlay */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2 glass-card p-6 flex flex-col justify-center bg-primary/5 border-primary/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                        <Users className="w-24 h-24" />
                    </div>
                    <h1 className="text-2xl font-black text-foreground mb-1 tracking-tight">Cari Hesap Yönetimi</h1>
                    <p className="text-secondary text-sm max-w-sm">Müşteri ve tedarikçilerinizin tüm finansal süreçlerini, borç/alacak takibini ve analizlerini buradan yönetin.</p>
                </div>

                <div className="glass-card p-6 border-emerald-500/20 bg-emerald-500/5 relative overflow-hidden group">
                    <div className="absolute -bottom-2 -right-2 opacity-10 group-hover:scale-110 transition-transform">
                        <TrendingDown className="w-16 h-16 text-emerald-500" />
                    </div>
                    <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Toplam Alacak</div>
                    <div className="text-2xl font-black text-foreground font-mono">
                        {stats.loading ? "..." : `₺${stats.alacak.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`}
                    </div>
                </div>

                <div className="glass-card p-6 border-rose-500/20 bg-rose-500/5 relative overflow-hidden group">
                    <div className="absolute -bottom-2 -right-2 opacity-10 group-hover:scale-110 transition-transform">
                        <TrendingUp className="w-16 h-16 text-rose-500" />
                    </div>
                    <div className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Toplam Borç</div>
                    <div className="text-2xl font-black text-foreground font-mono">
                        {stats.loading ? "..." : `₺${stats.borc.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`}
                    </div>
                </div>
            </div>

            {/* Navigation Grid by Category */}
            {["Tanımlamalar", "İşlemler", "Raporlar", "Analiz"].map((cat) => (
                <div key={cat} className="space-y-3">
                    <h3 className="text-xs font-black text-secondary/60 uppercase tracking-[0.2em] flex items-center gap-2 px-1">
                        <LayoutGrid className="w-3 h-3" /> {cat}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {Object.entries(PAGE_INFO)
                            .filter(([_, info]) => info.category === cat)
                            .map(([id, info]) => (
                                <motion.button
                                    key={id}
                                    whileHover={{ y: -4, scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setLocalPageId(id)}
                                    className="glass-card p-5 text-left flex flex-col gap-3 hover:bg-primary/5 hover:border-primary/30 transition-all border border-border group"
                                >
                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${info.color} flex items-center justify-center text-white shadow-lg shadow-black/10`}>
                                        <info.icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm text-foreground flex items-center justify-between">
                                            {info.title}
                                            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                        </div>
                                        <p className="text-[10px] text-secondary leading-tight mt-1 line-clamp-2">{info.description}</p>
                                    </div>
                                </motion.button>
                            ))}
                    </div>
                </div>
            ))}

            {/* Quick Summary Section */}
            {!stats.loading && (
                <div className="glass-card p-4 bg-white/[0.02] border-border/50 flex items-center justify-between">
                    <div className="flex gap-8">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-secondary font-bold uppercase tracking-wider">Kayıtlı Cari Sayısı</span>
                            <span className="text-lg font-black text-primary">{stats.total}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] text-secondary font-bold uppercase tracking-wider">Net Bakiye</span>
                            <span className={`text-lg font-black ${stats.alacak - stats.borc >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                ₺{(stats.alacak - stats.borc).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={() => setLocalPageId("cari_liste")}
                        className="bg-primary/10 hover:bg-primary text-primary hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all border border-primary/20"
                    >
                        TÜMÜNÜ GÖR
                    </button>
                </div>
            )}
        </div>
    );
}
