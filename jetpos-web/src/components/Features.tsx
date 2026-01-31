"use client";

import { motion } from "framer-motion";
import { Brain, ShoppingBag, Users, Printer, FileText, Zap } from "lucide-react";

const features = [
    {
        icon: Brain,
        title: "AI Satış Analizi",
        description: "Yapay zeka destekli satış tahminleri ve stok önerileri ile işletmenizi geleceğe taşıyın."
    },
    {
        icon: ShoppingBag,
        title: "Pazar Yeri Senkronu",
        description: "Trendyol, Getir ve Yemeksepeti siparişlerinizi merkezden yönetin."
    },
    {
        icon: Users,
        title: "Personel Yönetimi",
        description: "Vardiya takibi, performans analizi ve maaş hesaplamaları otomatik."
    },
    {
        icon: Printer,
        title: "Akıllı POS Sistemi",
        description: "Hızlı satış, barkod okuma ve entegre ödeme sistemleri."
    },
    {
        icon: FileText,
        title: "Fatura Yönetimi",
        description: "E-Fatura, e-Arşiv ve tüm mali süreçler tek tıkla."
    },
    {
        icon: Zap,
        title: "Gerçek Zamanlı Sync",
        description: "Tüm cihazlarınızda anlık senkronizasyon ve bulut yedekleme."
    }
];

export default function Features() {
    return (
        <section className="section relative">
            <div className="container">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-24"
                >
                    <div className="inline-flex items-center gap-2 px-5 py-3 glass-ultra rounded-full mb-8 border border-blue-500/30">
                        <Zap className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-semibold text-blue-300">
                            Özellikler
                        </span>
                    </div>
                    <h2 className="text-white mb-6">
                        Geleceğin Teknolojisi
                    </h2>
                    <p className="text-lg text-white/70 max-w-3xl mx-auto">
                        İşletmenizi dijital çağa taşıyan, yapay zeka destekli özelliklerin tamamı
                    </p>
                </motion.div>

                {/* Features Grid - Much more spacing */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                            className="group"
                        >
                            <div className="glass-ultra p-10 rounded-2xl border border-blue-500/30 h-full flex flex-col transition-all duration-300 hover:border-blue-400/50 hover:shadow-lg hover:shadow-blue-500/20">
                                {/* Icon */}
                                <div className="mb-8">
                                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center">
                                        <feature.icon className="w-7 h-7 text-white" />
                                    </div>
                                </div>

                                {/* Content */}
                                <h3 className="text-xl font-semibold text-white mb-5">
                                    {feature.title}
                                </h3>
                                <p className="text-white/70 leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Bottom CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                    className="text-center mt-20"
                >
                    <button className="btn-cyber inline-flex items-center gap-3">
                        Tüm Özellikleri Gör
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </motion.div>
            </div>
        </section>
    );
}

function ArrowRight({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
    );
}
