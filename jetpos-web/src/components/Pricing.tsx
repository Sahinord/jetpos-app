"use client";

import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send } from "lucide-react";

export default function Contact() {
    return (
        <section id="contact" className="section relative">
            <div className="container">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-20"
                >
                    <h2 className="text-white mb-6">
                        <span className="holographic-text">İletişime</span> Geçin
                    </h2>
                    <p className="text-lg text-white/70 max-w-3xl mx-auto">
                        Sorularınız mı var? Ekibimiz size yardımcı olmak için burada.
                    </p>
                </motion.div>

                <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
                    {/* Contact Form */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="glass-ultra p-10 rounded-2xl border border-blue-500/30">
                            <h3 className="text-2xl font-bold text-white mb-6">Bize Ulaşın</h3>
                            <form className="space-y-6">
                                <div>
                                    <label htmlFor="name" className="block text-white/80 mb-2 font-medium">
                                        Ad Soyad
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        className="w-full px-4 py-3 glass-dark rounded-lg border border-blue-500/20 text-white placeholder-white/40 focus:border-blue-400/50 focus:outline-none transition-all"
                                        placeholder="Adınız ve soyadınız"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-white/80 mb-2 font-medium">
                                        E-posta
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        className="w-full px-4 py-3 glass-dark rounded-lg border border-blue-500/20 text-white placeholder-white/40 focus:border-blue-400/50 focus:outline-none transition-all"
                                        placeholder="ornek@email.com"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="phone" className="block text-white/80 mb-2 font-medium">
                                        Telefon
                                    </label>
                                    <input
                                        type="tel"
                                        id="phone"
                                        className="w-full px-4 py-3 glass-dark rounded-lg border border-blue-500/20 text-white placeholder-white/40 focus:border-blue-400/50 focus:outline-none transition-all"
                                        placeholder="+90 500 123 45 67"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="message" className="block text-white/80 mb-2 font-medium">
                                        Mesajınız
                                    </label>
                                    <textarea
                                        id="message"
                                        rows={5}
                                        className="w-full px-4 py-3 glass-dark rounded-lg border border-blue-500/20 text-white placeholder-white/40 focus:border-blue-400/50 focus:outline-none transition-all resize-none"
                                        placeholder="Mesajınızı buraya yazın..."
                                    />
                                </div>
                                <button type="submit" className="btn-cyber w-full flex items-center justify-center gap-3">
                                    Gönder
                                    <Send className="w-5 h-5" />
                                </button>
                            </form>
                        </div>
                    </motion.div>

                    {/* Contact Info */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="space-y-8"
                    >
                        <div className="glass-ultra p-8 rounded-2xl border border-blue-500/30 hover:border-blue-400/50 transition-all">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center mb-6">
                                <Mail className="w-7 h-7 text-white" />
                            </div>
                            <h4 className="text-xl font-bold text-white mb-2">E-posta</h4>
                            <a
                                href="mailto:info@jetpos.com"
                                className="text-white/70 hover:text-blue-400 transition-colors text-lg"
                            >
                                info@jetpos.com
                            </a>
                        </div>

                        <div className="glass-ultra p-8 rounded-2xl border border-blue-500/30 hover:border-blue-400/50 transition-all">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center mb-6">
                                <Phone className="w-7 h-7 text-white" />
                            </div>
                            <h4 className="text-xl font-bold text-white mb-2">Telefon</h4>
                            <a
                                href="tel:+905001234567"
                                className="text-white/70 hover:text-blue-400 transition-colors text-lg"
                            >
                                +90 500 123 45 67
                            </a>
                        </div>

                        <div className="glass-ultra p-8 rounded-2xl border border-blue-500/30 hover:border-blue-400/50 transition-all">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center mb-6">
                                <MapPin className="w-7 h-7 text-white" />
                            </div>
                            <h4 className="text-xl font-bold text-white mb-2">Adres</h4>
                            <p className="text-white/70 text-lg leading-relaxed">
                                Atatürk Mahallesi, Teknoloji Caddesi No: 123<br />
                                Şişli / İstanbul
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
