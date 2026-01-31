"use client";

import { motion } from "framer-motion";
import { Check, Zap, Rocket, Crown, Sparkles } from "lucide-react";

const plans = [
    {
        name: "Başlangıç",
        price: "₺299",
        period: "/ay",
        description: "Küçük işletmeler için ideal başlangıç paketi",
        icon: Zap,
        features: [
            "5 Kullanıcı",
            "1000 Ürün",
            "Temel POS",
            "Stok Yönetimi",
            "E-Fatura",
            "Email Destek"
        ],
        popular: false
    },
    {
        name: "Profesyonel",
        price: "₺599",
        period: "/ay",
        description: "Büyüyen işletmeler için güçlü çözüm",
        icon: Rocket,
        features: [
            "20 Kullanıcı",
            "Sınırsız Ürün",
            "Gelişmiş POS",
            "AI Analiz",
            "Pazar Yeri Entegrasyonu",
            "Personel Yönetimi",
            "Öncelikli Destek",
            "Özel Eğitim"
        ],
        popular: true
    },
    {
        name: "Enterprise",
        price: "Özel",
        period: "fiyat",
        description: "Kurumsal çözümler ve özel geliştirmeler",
        icon: Crown,
        features: [
            "Sınırsız Kullanıcı",
            "Sınırsız Ürün",
            "Özel Modüller",
            "Dedicated Server",
            "API Erişimi",
            "Özel Entegrasyonlar",
            "7/24 Destek",
            "Yerinde Kurulum"
        ],
        popular: false
    }
];

export default function Pricing() {
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
                        <Sparkles className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-semibold text-blue-300">
                            Fiyatlandırma
                        </span>
                    </div>
                    <h2 className="text-white mb-6">
                        Size Uygun Planı Seçin
                    </h2>
                    <p className="text-lg text-white/70 max-w-3xl mx-auto">
                        Her ölçekte işletme için esnek ve uygun fiyatlı çözümler
                    </p>
                </motion.div>

                {/* Pricing Cards - Much more spacing */}
                <div className="grid md:grid-cols-3 gap-12 max-w-7xl mx-auto">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: index * 0.15 }}
                            className="group relative"
                        >
                            {/* Popular Badge */}
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                                    <div className="glass-ultra px-6 py-2 rounded-full border border-blue-400/50">
                                        <span className="text-sm font-semibold text-blue-300">
                                            ⭐ Popüler
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className={`glass-ultra p-10 rounded-2xl border h-full flex flex-col transition-all duration-300 ${plan.popular
                                    ? 'border-blue-400/50 shadow-lg shadow-blue-500/20'
                                    : 'border-blue-500/30 hover:border-blue-400/50'
                                }`}>
                                {/* Icon */}
                                <div className="mb-8">
                                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center">
                                        <plan.icon className="w-7 h-7 text-white" />
                                    </div>
                                </div>

                                {/* Plan Name */}
                                <h3 className="text-2xl font-semibold text-white mb-3">
                                    {plan.name}
                                </h3>
                                <p className="text-white/60 text-sm mb-8">
                                    {plan.description}
                                </p>

                                {/* Price */}
                                <div className="mb-10">
                                    <div className="flex items-end gap-2">
                                        <span className="text-4xl font-bold text-white">
                                            {plan.price}
                                        </span>
                                        <span className="text-white/60 mb-1">
                                            {plan.period}
                                        </span>
                                    </div>
                                </div>

                                {/* Features */}
                                <div className="flex-1 space-y-5 mb-10">
                                    {plan.features.map((feature, i) => (
                                        <div key={i} className="flex items-start gap-3">
                                            <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <Check className="w-3 h-3 text-blue-400" />
                                            </div>
                                            <span className="text-white/80">
                                                {feature}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* CTA Button */}
                                <button className={`w-full py-4 rounded-lg font-semibold text-white transition-all duration-300 ${plan.popular
                                        ? 'btn-cyber'
                                        : 'glass-ultra border border-blue-500/30 hover:border-blue-400/50 hover:bg-white/10'
                                    }`}>
                                    {plan.price === "Özel" ? "İletişime Geç" : "Hemen Başla"}
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Bottom Note */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="text-center mt-20"
                >
                    <div className="glass-ultra px-8 py-6 rounded-xl border border-blue-500/30 inline-block">
                        <p className="text-white/80">
                            <span className="text-blue-400 font-semibold">14 gün ücretsiz</span> deneme ile başlayın.
                            Kredi kartı gerekmez! 🎉
                        </p>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
