"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { 
    BookOpen, 
    ArrowRight, 
    Search, 
    Zap, 
    Package, 
    ShoppingCart, 
    Users, 
    BarChart3, 
    ShieldCheck,
    ChevronRight,
    PlayCircle
} from "lucide-react";
import { motion } from "framer-motion";

const GUIDES = [
    {
        id: "setup",
        title: "Kurulum ve İlk Adımlar",
        desc: "JetPOS'u saniyeler içinde kurun ve ilk ürününüzü ekleyin.",
        icon: Zap,
        color: "text-amber-500",
        bg: "bg-amber-500/10",
        duration: "2 dk oku"
    },
    {
        id: "inventory",
        title: "Ürün ve Stok Yönetimi",
        desc: "Barkodlu ürün ekleme, varyantlı stok ve depo yönetimi eğitimi.",
        icon: Package,
        color: "text-purple-500",
        bg: "bg-purple-500/10",
        duration: "5 dk oku"
    },
    {
        id: "pos",
        title: "Hızlı Satış (POS) Kullanımı",
        desc: "Kasadaki işlem hızınızı %300 artıracak klavye kısayolları.",
        icon: ShoppingCart,
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
        duration: "4 dk oku"
    },
    {
        id: "finance",
        title: "Cari Hesap ve Finans",
        desc: "Müşteri borç-alacak takibi ve günlük kasa raporları yönetimi.",
        icon: Users,
        color: "text-blue-500",
        bg: "bg-blue-500/10",
        duration: "6 dk oku"
    },
    {
        id: "reporting",
        title: "Raporlama ve Analiz",
        desc: "Satış trendlerinizi analiz edin ve kârlılığınızı takip edin.",
        icon: BarChart3,
        color: "text-rose-500",
        bg: "bg-rose-500/10",
        duration: "3 dk oku"
    },
    {
        id: "integration",
        title: "E-Fatura & Entegrasyonlar",
        desc: "Resmi e-fatura süreçleri ve üçüncü parti yazılım bağlantıları.",
        icon: ShieldCheck,
        color: "text-indigo-500",
        bg: "bg-indigo-500/10",
        duration: "5 dk oku"
    }
];

export default function KilavuzlarPage() {
    return (
        <>
            <div className="site-bg" />
            <main style={{ position: "relative", zIndex: 1, minHeight: "100vh" }}>
                <Navbar />

                {/* Hero section */}
                <section className="pt-32 pb-20 px-4 relative overflow-hidden">
                    <div className="max-w-7xl mx-auto text-center">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-bold mb-8"
                        >
                            <BookOpen size={16} />
                            <span>JetPOS AKADEMİ</span>
                        </motion.div>
                        <motion.h1 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-6"
                        >
                            Yardım <span className="text-primary">&</span> Kılavuzlar
                        </motion.h1>
                        <motion.p 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-xl text-slate-400 max-w-2xl mx-auto mb-12 font-medium"
                        >
                            JetPOS'u bir profesyonel gibi kullanmanız için hazırladığımız detaylı eğitim dokümanlarını keşfedin.
                        </motion.p>

                        {/* Search Bar */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="max-w-2xl mx-auto relative group"
                        >
                            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity" />
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input 
                                type="text"
                                placeholder="Nasıl yardımcı olabiliriz? (Örn: Ürün ekleme)"
                                className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl pl-16 pr-6 text-xl text-white outline-none focus:border-primary/50 backdrop-blur-xl transition-all"
                            />
                        </motion.div>
                    </div>
                </section>

                {/* Grid section */}
                <section className="pb-32 px-4">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {GUIDES.map((guide, idx) => (
                                <motion.div
                                    key={guide.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.1 }}
                                    whileHover={{ y: -5 }}
                                    className="group p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-primary/30 transition-all cursor-pointer relative overflow-hidden"
                                >
                                    <div className={`w-14 h-14 ${guide.bg} rounded-2xl flex items-center justify-center mb-6`}>
                                        <guide.icon className={`w-7 h-7 ${guide.color}`} />
                                    </div>
                                    <h3 className="text-2xl font-black text-white mb-3 tracking-tight group-hover:text-primary transition-colors">{guide.title}</h3>
                                    <p className="text-slate-400 font-medium leading-relaxed mb-6">
                                        {guide.desc}
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{guide.duration}</span>
                                        <div className="flex items-center gap-2 text-primary font-black uppercase text-xs tracking-widest group-hover:gap-3 transition-all">
                                            İncele <ChevronRight size={16} />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Video Support Card */}
                        <motion.div 
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="mt-12 p-10 rounded-[3rem] bg-gradient-to-r from-primary/20 to-purple-500/20 border border-white/10 relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 w-[40%] h-full bg-gradient-to-l from-primary/10 to-transparent flex items-center justify-center opacity-50 group-hover:opacity-100 transition-opacity">
                                <PlayCircle size={120} className="text-white opacity-20 group-hover:scale-110 transition-transform" />
                            </div>
                            <div className="relative z-10 max-w-xl">
                                <h2 className="text-3xl font-black text-white mb-4 tracking-tight">Akademimizin Video Eğitimleri Hazırlanıyor!</h2>
                                <p className="text-lg text-slate-300 mb-8 font-medium">
                                    Okumak yerine izlemeyi mi tercih edersiniz? Adım adım anlatımlı 4K video eğitim serimiz yakında yayında olacak.
                                </p>
                                <button className="px-8 py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                                    HABERDAR ET
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </section>

                <Footer />
            </main>
        </>
    );
}
