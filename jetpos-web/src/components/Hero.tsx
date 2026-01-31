"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Play } from "lucide-react";

export default function Hero() {
    return (
        <section className="relative min-h-screen flex items-center pt-20">
            <div className="container relative z-10 py-20">
                <div className="grid lg:grid-cols-2 gap-24 items-center">
                    {/* Left Column - Content */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="space-y-12"
                    >
                        {/* Badge */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className="inline-flex items-center gap-2 px-5 py-3 glass-ultra rounded-full border border-blue-500/30"
                        >
                            <Sparkles className="w-4 h-4 text-blue-400" />
                            <span className="text-sm font-semibold text-blue-300">
                                AI Destekli Stok Ekosistemi
                            </span>
                        </motion.div>

                        {/* Heading */}
                        <div className="space-y-8">
                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="text-white"
                            >
                                İşletmenizi{" "}
                                <span className="holographic-text">Zekayla</span>
                                <br />
                                Yönetin
                            </motion.h1>
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="text-lg text-white/80 leading-relaxed max-w-xl"
                            >
                                Stok yönetiminden AI analizlerine, pazar yeri entegrasyonlarından
                                personele kadar her şey tek bir akıllı platformda.
                            </motion.p>
                        </div>

                        {/* CTA Buttons */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="flex flex-wrap items-center gap-6"
                        >
                            <button className="btn-cyber group flex items-center gap-3">
                                Hemen Başla
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button className="glass-ultra px-6 py-4 rounded-lg font-semibold text-white hover:bg-white/10 transition-all border border-white/20">
                                <span className="flex items-center gap-2">
                                    <Play className="w-5 h-5" />
                                    Demo İzle
                                </span>
                            </button>
                        </motion.div>
                    </motion.div>

                    {/* Right Column - Dashboard Preview */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1, delay: 0.4 }}
                        className="relative lg:block hidden"
                    >
                        <div className="glass-ultra p-8 rounded-2xl border border-blue-500/30">
                            {/* Dashboard Header */}
                            <div className="mb-8">
                                <h3 className="text-2xl font-bold text-white mb-1">Dashboard</h3>
                                <p className="text-sm text-white/60">Gerçek Zamanlı Analitik</p>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-6 mb-8">
                                <div className="glass-dark p-6 rounded-xl border border-blue-500/20">
                                    <div className="text-sm text-white/60 mb-2">Günlük Satış</div>
                                    <div className="text-2xl font-bold text-blue-400">₺48.2K</div>
                                </div>
                                <div className="glass-dark p-6 rounded-xl border border-blue-500/20">
                                    <div className="text-sm text-white/60 mb-2">Aktif Ürün</div>
                                    <div className="text-2xl font-bold text-blue-400">1,247</div>
                                </div>
                                <div className="glass-dark p-6 rounded-xl border border-blue-500/20">
                                    <div className="text-sm text-white/60 mb-2">Müşteri</div>
                                    <div className="text-2xl font-bold text-blue-400">892</div>
                                </div>
                                <div className="glass-dark p-6 rounded-xl border border-blue-500/20">
                                    <div className="text-sm text-white/60 mb-2">Sipariş</div>
                                    <div className="text-2xl font-bold text-blue-400">156</div>
                                </div>
                            </div>

                            {/* Chart Visualization */}
                            <div className="glass-dark p-6 rounded-xl border border-blue-500/20">
                                <div className="flex items-end justify-between h-32 gap-3">
                                    {[65, 45, 80, 55, 90, 70, 95].map((height, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ height: 0 }}
                                            animate={{ height: `${height}%` }}
                                            transition={{ delay: 0.8 + i * 0.1, duration: 0.5 }}
                                            className="flex-1 rounded-t-lg bg-gradient-to-t from-blue-600 to-blue-400"
                                        />
                                    ))}
                                </div>
                                <div className="flex justify-between mt-4 text-xs text-white/50">
                                    <span>Pzt</span>
                                    <span>Sal</span>
                                    <span>Çar</span>
                                    <span>Per</span>
                                    <span>Cum</span>
                                    <span>Cmt</span>
                                    <span>Paz</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
