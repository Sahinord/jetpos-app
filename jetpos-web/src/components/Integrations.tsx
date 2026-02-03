"use client";

import { motion } from "framer-motion";
import { Brain, Shield, FileBarChart2, TrendingUp, BadgeDollarSign, FileText } from "lucide-react";

const digitalFeatures = [
    {
        icon: Brain,
        title: "Yapay Zeka",
        description: "Ürün, stok, kazanç, gider yönetiminiz hakkında yapay zekadan içgörüler elde edin"
    },
    {
        icon: Shield,
        title: "Güvenlik",
        description: "Tüm ticari operasyonlarınızın takibini bulut tabanlı yapın"
    },
    {
        icon: FileBarChart2,
        title: "Raporlar",
        description: "Ticaretinizin her fonksiyonu için bilgilerinizi kolayca raporlayın"
    },
    {
        icon: TrendingUp,
        title: "Gelir-Gider",
        description: "İşletmenizin nakit akışını online olarak izleyin"
    },
    {
        icon: BadgeDollarSign,
        title: "Kârlılık",
        description: "Easytrade'in partner çözümleri ile kârınızı arttırın"
    },
    {
        icon: FileText,
        title: "E-Fatura",
        description: "Sadece 3 tıkla kolayca fatura kesin"
    }
];

export default function Integrations() {
    return (
        <>
            {/* Güçlü Entegrasyonlar Section */}
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
                            Güçlü <span className="holographic-text">Entegrasyonlar</span>
                        </h2>
                        <p className="text-lg text-white/70 max-w-3xl mx-auto mb-4">
                            Easytrade ile satışlarınızı takip edin, performansınızı artırın.
                        </p>
                        <p className="text-white/60 max-w-2xl mx-auto">
                            Tüm cihazlarınız ve uygulamalarınız arasında sorunsuz entegrasyon sağlayın.
                        </p>
                    </motion.div>

                    {/* Integration Logos/Cards Placeholder */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="glass-ultra p-16 rounded-3xl border border-blue-500/30 text-center"
                    >
                        <div className="flex flex-wrap justify-center items-center gap-12">
                            {["Trendyol", "Getir", "Yemeksepeti", "N11", "HepsiBurada"].map((platform, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.3 + index * 0.1 }}
                                    className="glass-dark px-8 py-4 rounded-xl border border-blue-500/20 hover:border-blue-400/50 transition-all"
                                >
                                    <span className="text-xl font-bold text-white">{platform}</span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Ticaretinizi Dijitalleştirin Section */}
            <section className="section relative bg-gradient-to-b from-transparent to-blue-950/20">
                <div className="container">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-20"
                    >
                        <h2 className="text-white mb-6">
                            Ticaretinizi <span className="holographic-text">Dijitalleştirin</span>
                        </h2>
                    </motion.div>

                    {/* Digital Features Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {digitalFeatures.map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                className="text-center group"
                            >
                                <div className="glass-ultra p-8 rounded-2xl border border-blue-500/30 h-full hover:border-blue-400/50 hover:shadow-lg hover:shadow-blue-500/20 transition-all">
                                    {/* Icon */}
                                    <div className="mb-6 flex justify-center">
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
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

                    {/* Final CTA */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.8 }}
                        className="text-center mt-20"
                    >
                        <h3 className="text-2xl md:text-3xl text-white mb-6">
                            Ticaretinizi Dijitalleştirin
                        </h3>
                        <p className="text-white/70 mb-8 max-w-2xl mx-auto">
                            Easytrade ile bugün başlayın ve pro planlarımızla daha fazla özelliğin keyfini çıkarın.
                        </p>
                        <button className="btn-cyber text-lg px-10 py-5">
                            Hemen Başlayın
                        </button>
                    </motion.div>
                </div>
            </section>
        </>
    );
}
