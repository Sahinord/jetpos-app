"use client";

import { motion } from "framer-motion";
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
    Construction,
    type LucideIcon
} from "lucide-react";
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

// Sayfa bilgileri
const PAGE_INFO: Record<string, { title: string; description: string; icon: LucideIcon; color: string }> = {
    cari_tanim: {
        title: "Cari Tanıtımı",
        description: "Müşteri ve tedarikçi cari hesap kartlarını oluşturun ve yönetin.",
        icon: UserPlus,
        color: "from-blue-500 to-blue-600"
    },
    cari_grup: {
        title: "Grup Tanıtımı",
        description: "Cari hesapları gruplandırmak için grup tanımları oluşturun.",
        icon: FolderOpen,
        color: "from-purple-500 to-purple-600"
    },
    cari_ozelkod: {
        title: "Özel Kod Tanıtımı",
        description: "Cari hesaplara özel kodlar atayarak sınıflandırma yapın.",
        icon: Tags,
        color: "from-pink-500 to-rose-600"
    },
    cari_borc: {
        title: "Borç Dekontu",
        description: "Cari hesaba borç kaydı oluşturun.",
        icon: FileOutput,
        color: "from-red-500 to-red-600"
    },
    cari_alacak: {
        title: "Alacak Dekontu",
        description: "Cari hesaba alacak kaydı oluşturun.",
        icon: FileInput,
        color: "from-emerald-500 to-emerald-600"
    },
    cari_virman: {
        title: "Virman Dekontu",
        description: "Cari hesaplar arası virman işlemi yapın.",
        icon: ArrowLeftRight,
        color: "from-amber-500 to-orange-600"
    },
    cari_devir: {
        title: "Devir Fişi",
        description: "Dönem başı cari hesap devir bakiyelerini girin.",
        icon: FilePlus,
        color: "from-cyan-500 to-cyan-600"
    },
    cari_liste: {
        title: "Cari Kartı Listesi",
        description: "Tüm cari hesap kartlarını listeleyin ve yönetin.",
        icon: ClipboardList,
        color: "from-indigo-500 to-indigo-600"
    },
    cari_bakiye: {
        title: "Bakiye Raporu",
        description: "Cari hesap bakiyelerini görüntüleyin.",
        icon: Scale,
        color: "from-teal-500 to-teal-600"
    },
    cari_hareket: {
        title: "Hareket Raporu",
        description: "Cari hesap hareketlerini detaylı inceleyin.",
        icon: FileSearch,
        color: "from-violet-500 to-violet-600"
    },
    cari_mutabakat: {
        title: "Mutabakat Raporu",
        description: "Cari hesap mutabakat işlemlerini yapın.",
        icon: FileText,
        color: "from-slate-500 to-slate-600"
    },
    cari_gunluk: {
        title: "Günlük Hareket Raporu",
        description: "Günlük cari hesap hareketlerini görüntüleyin.",
        icon: CalendarDays,
        color: "from-sky-500 to-sky-600"
    },
    cari_analiz: {
        title: "Cari Analizi",
        description: "Cari hesap analizlerini ve istatistiklerini görüntüleyin.",
        icon: PieChart,
        color: "from-fuchsia-500 to-fuchsia-600"
    },
};

export default function CariPage({ pageId, showToast }: CariPageProps) {
    // Cari Tanıtımı sayfası için özel component
    if (pageId === "cari_tanim") {
        return <CariTanitim showToast={showToast} />;
    }

    // Grup Tanıtımı sayfası için özel component
    if (pageId === "cari_grup") {
        return <GrupTanitim showToast={showToast} />;
    }

    // Özel Kod Tanıtımı sayfası için özel component
    if (pageId === "cari_ozelkod") {
        return <OzelKodTanitim showToast={showToast} />;
    }

    // Borç Dekontu sayfası için özel component
    if (pageId === "cari_borc") {
        return <BorcDekontu showToast={showToast} />;
    }

    // Alacak Dekontu sayfası için özel component
    if (pageId === "cari_alacak") {
        return <AlacakDekontu showToast={showToast} />;
    }

    // Virman Dekontu sayfası için özel component
    if (pageId === "cari_virman") {
        return <VirmanDekontu showToast={showToast} />;
    }

    // Devir Fişi sayfası için özel component
    if (pageId === "cari_devir") {
        return <DevirFisi showToast={showToast} />;
    }

    // Cari Kartı Listesi sayfası için özel component
    if (pageId === "cari_liste") {
        return <CariListesi showToast={showToast} />;
    }

    // Bakiye Raporu sayfası için özel component
    if (pageId === "cari_bakiye") {
        return <BakiyeRaporu showToast={showToast} />;
    }

    // Hareket Raporu sayfası için özel component
    if (pageId === "cari_hareket") {
        return <HareketRaporu showToast={showToast} />;
    }

    // Mutabakat Raporu sayfası için özel component
    if (pageId === "cari_mutabakat") {
        return <MutabakatRaporu showToast={showToast} />;
    }

    // Günlük Hareket sayfası için özel component
    if (pageId === "cari_gunluk") {
        return <GunlukHareket showToast={showToast} />;
    }

    // Cari Analizi sayfası için özel component
    if (pageId === "cari_analiz") {
        return <CariAnalizi showToast={showToast} />;
    }

    const info = PAGE_INFO[pageId] || {
        title: "Cari Hesap",
        description: "Bu sayfa yapım aşamasında.",
        icon: Users,
        color: "from-gray-500 to-gray-600"
    };

    const Icon = info.icon;

    return (
        <div className="max-w-4xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-8"
            >
                {/* Coming Soon */}
                <div className="border-2 border-dashed border-white/20 rounded-2xl p-12 text-center">
                    <Construction className="w-16 h-16 text-secondary/40 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">Yapım Aşamasında</h2>
                    <p className="text-secondary max-w-md mx-auto">
                        Bu sayfa şu anda geliştirme aşamasındadır. Yakında burada {info.title.toLowerCase()} özelliğini kullanabileceksiniz.
                    </p>

                    <div className="mt-8 flex flex-wrap gap-3 justify-center">
                        <div className="px-4 py-2 rounded-lg bg-white/5 border border-white/10">
                            <span className="text-secondary text-sm">✅ Tasarım hazır</span>
                        </div>
                        <div className="px-4 py-2 rounded-lg bg-white/5 border border-white/10">
                            <span className="text-secondary text-sm">🔄 Geliştiriliyor</span>
                        </div>
                        <div className="px-4 py-2 rounded-lg bg-primary/20 border border-primary/30">
                            <span className="text-primary text-sm">⏳ Yakında</span>
                        </div>
                    </div>
                </div>

                {/* Quick Info */}
                <div className="grid grid-cols-3 gap-4 mt-8">
                    <div className="bg-white/5 rounded-xl p-4 text-center">
                        <div className="text-2xl font-black text-white">0</div>
                        <div className="text-xs text-secondary mt-1">Toplam Kayıt</div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 text-center">
                        <div className="text-2xl font-black text-emerald-500">₺0</div>
                        <div className="text-xs text-secondary mt-1">Alacak</div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 text-center">
                        <div className="text-2xl font-black text-red-500">₺0</div>
                        <div className="text-xs text-secondary mt-1">Borç</div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
