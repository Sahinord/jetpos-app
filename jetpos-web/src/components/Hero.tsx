"use client";

import { motion } from "framer-motion";
import { ArrowRight, BarChart3 } from "lucide-react";

export default function Hero() {
    return (
        <section className="relative min-h-screen flex items-center justify-center pt-20">
            <div className="container relative z-10 py-20">
                {/* Centered Content - EasyTrade Style */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-center max-w-4xl mx-auto space-y-12"
                >
                    {/* Main Heading - Bire Bir EasyTrade */}
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-white leading-tight"
                    >
                        Bütün İhtiyaçlarınız{" "}
                        <span className="holographic-text">Tek Sistemde</span>
                    </motion.h1>

                    {/* CTA Button */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <button className="btn-cyber group flex items-center gap-3 mx-auto text-lg px-8 py-5">
                            Ücretsiz Dene
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </motion.div>

                    {/* Hero Subtitle Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="mt-32 pt-16 border-t border-white/10"
                    >
                        <h2 className="text-white mb-6">
                            <span className="holographic-text">Profesyoneller Gibi</span>
                            <br />
                            Stok Takibi Yap
                        </h2>
                    </motion.div>
                </motion.div>

                {/* Floating Barcode Illustration */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8, duration: 1 }}
                    className="absolute top-1/4 right-10 hidden xl:block"
                >
                    <div className="glass-ultra p-6 rounded-2xl border border-blue-500/30">
                        <BarChart3 className="w-20 h-20 text-blue-400" />
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
