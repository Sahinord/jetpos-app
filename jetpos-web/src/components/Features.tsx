"use client";

import { motion } from "framer-motion";
import { Barcode, FileText, Package, Wallet, CreditCard, Zap, Clock, Sparkles } from "lucide-react";

// EasyTrade benzeri özellikler
const mainFeatures = [
    {
        icon: FileText,
        title: "E-Fatura Yönetimi",
        description: "E-Fatura ve E-Arşiv süreçlerinizi dijital ortamda sorunsuz yönetin.",
        badge: "Bütçe Dostu 💚"
    },
    {
        icon: Package,
        title: "Stok Takibi",
        description: "Perakende işletmenizde stok hareketlerinizi anlık olarak takip edin ve optimize edin."
    },
    {
        icon: Wallet,
        title: "Kasa Takibi",
        description: "Kasa hareketlerinizi kolayca yönetin, raporlayın ve analiz edin."
    },
    {
        icon: CreditCard,
        title: "Ödeme Takibi",
        description: "Alacak ve borçlarınızı sistematik olarak takip edin, vadeli ödemeleri yönetin."
    }
];

const barcodeFeatures = [
    {
        icon: Clock,
        title: "Anında Okuma",
        description: "Gelişmiş algoritma ile barkodları milisaniyeler içinde tanır ve sisteme ekler."
    },
    {
        icon: Zap,
        title: "Hızlı Ürün Bilgisi",
        description: "Barkod okuttuğunuzda ürün adı, fiyatı ve stok bilgileri otomatik olarak gelir."
    },
    {
        icon: Sparkles,
        title: "Anlık Stok Takibi",
        description: "Her satış sonrası stok miktarları otomatik güncellenir, eksik ürünler için uyarı alırsınız."
    }
];

export default function Features() {
    return (
        <>
            {/* Online Barkod Sistemi Section */}
            <section id="features" className="section relative">
                <div className="container">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-20"
                    >
                        <h2 className="text-white mb-6">
                            Online <span className="holographic-text">Barkod</span> Sistemi
                        </h2>
                        <p className="text-lg text-white/70 max-w-3xl mx-auto">
                            Barkod okuyarak anında satış yapın, ürün bilgilerini hızla sisteme alın.
                            Müşteri memnuniyeti ve satış hızınızı artırın.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Kolay Ön Muhasebe Section */}
            <section className="section relative bg-gradient-to-b from-transparent to-blue-950/20">
                <div className="container">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-20"
                    >
                        <h2 className="text-white mb-4">
                            Kolay Ön Muhasebe
                        </h2>
                        <p className="text-2xl font-semibold text-green-400">Bütçe Dostu 💚</p>
                    </motion.div>

                    {/* Main Features Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-24">
                        {mainFeatures.map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                className="group"
                            >
                                <div className="glass-ultra p-8 rounded-2xl border border-blue-500/30 h-full flex flex-col transition-all duration-300 hover:border-blue-400/50 hover:shadow-lg hover:shadow-blue-500/20">
                                    {/* Icon */}
                                    <div className="mb-6">
                                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center">
                                            <feature.icon className="w-7 h-7 text-white" />
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <h3 className="text-xl font-semibold text-white mb-4">
                                        {feature.title}
                                    </h3>
                                    <p className="text-white/70 leading-relaxed mb-4">
                                        {feature.description}
                                    </p>
                                    {feature.badge && (
                                        <span className="text-sm font-semibold text-green-400 mt-auto">
                                            {feature.badge}
                                        </span>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Barkodu Okut, Faturan Hazır Section */}
            <section className="section relative">
                <div className="container">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-20"
                    >
                        <h2 className="text-white mb-6">
                            Barkodu Okut, <span className="holographic-text">Faturan Hazır</span>
                        </h2>
                        <p className="text-lg text-white/70 max-w-3xl mx-auto">
                            Ürünlerini saniyeler içinde sisteme ekle.
                            <br />
                            Hızlı, hatasız ve otomatik faturalama ile zamandan tasarruf et!
                        </p>
                    </motion.div>

                    {/* Barcode Features Grid */}
                    <div className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto">
                        {barcodeFeatures.map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: index * 0.15 }}
                                className="text-center"
                            >
                                <div className="glass-ultra p-10 rounded-2xl border border-blue-500/30 h-full hover:border-blue-400/50 transition-all">
                                    {/* Icon */}
                                    <div className="mb-6 flex justify-center">
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center">
                                            <feature.icon className="w-8 h-8 text-white" />
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <h3 className="text-xl font-bold text-white mb-4">
                                        {feature.title}
                                    </h3>
                                    <p className="text-white/70 leading-relaxed">
                                        {feature.description}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
        </>
    );
}
