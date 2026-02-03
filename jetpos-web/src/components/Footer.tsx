"use client";

import { Mail, Phone, Instagram, Linkedin, Twitter, Github, Zap } from "lucide-react";

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="relative border-t border-white/10">
            <div className="container py-16">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
                    {/* Brand */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-400 rounded-xl flex items-center justify-center">
                                <Zap className="w-5 h-5 text-white fill-current" />
                            </div>
                            <span className="text-2xl font-bold text-white">
                                Jet<span className="text-blue-400">POS</span>
                            </span>
                        </div>
                        <p className="text-white/70 leading-relaxed">
                            İşletmenizi dijital çağa taşıyan, yapay zeka destekli stok ve satış yönetim platformu.
                        </p>
                        <div className="flex items-center gap-4">
                            <a
                                href="https://instagram.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 glass-ultra rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:border-blue-400/50 border border-white/10 transition-all"
                                aria-label="Instagram"
                            >
                                <Instagram className="w-5 h-5" />
                            </a>
                            <a
                                href="https://linkedin.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 glass-ultra rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:border-blue-400/50 border border-white/10 transition-all"
                                aria-label="LinkedIn"
                            >
                                <Linkedin className="w-5 h-5" />
                            </a>
                            <a
                                href="https://twitter.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 glass-ultra rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:border-blue-400/50 border border-white/10 transition-all"
                                aria-label="Twitter"
                            >
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a
                                href="https://github.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 glass-ultra rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:border-blue-400/50 border border-white/10 transition-all"
                                aria-label="GitHub"
                            >
                                <Github className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Platform */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-6">Platform</h3>
                        <ul className="space-y-4">
                            <li>
                                <a href="#features" className="text-white/70 hover:text-white transition-colors">
                                    Özellikler
                                </a>
                            </li>
                            <li>
                                <a href="#pricing" className="text-white/70 hover:text-white transition-colors">
                                    Fiyatlandırma
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-white/70 hover:text-white transition-colors">
                                    Entegrasyonlar
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-white/70 hover:text-white transition-colors">
                                    API Dokümantasyonu
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Kurumsal */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-6">Kurumsal</h3>
                        <ul className="space-y-4">
                            <li>
                                <a href="#" className="text-white/70 hover:text-white transition-colors">
                                    Hakkımızda
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-white/70 hover:text-white transition-colors">
                                    Blog
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-white/70 hover:text-white transition-colors">
                                    Kariyer
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-white/70 hover:text-white transition-colors">
                                    İletişim
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* İletişim */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-6">İletişim</h3>
                        <ul className="space-y-4">
                            <li>
                                <a
                                    href="mailto:info@jetpos.com"
                                    className="flex items-center gap-3 text-white/70 hover:text-white transition-colors"
                                >
                                    <Mail className="w-5 h-5" />
                                    info@jetpos.com
                                </a>
                            </li>
                            <li>
                                <a
                                    href="tel:+905001234567"
                                    className="flex items-center gap-3 text-white/70 hover:text-white transition-colors"
                                >
                                    <Phone className="w-5 h-5" />
                                    +90 500 123 45 67
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-16 pt-8 border-t border-white/10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-white/60 text-sm">
                            © {currentYear} JetPOS. Tüm hakları saklıdır.
                        </p>
                        <div className="flex items-center gap-6">
                            <a href="#" className="text-white/60 hover:text-white text-sm transition-colors">
                                Kullanıcı Sözleşmesi
                            </a>
                            <a href="#" className="text-white/60 hover:text-white text-sm transition-colors">
                                Gizlilik Politikası
                            </a>
                            <a href="#" className="text-white/60 hover:text-white text-sm transition-colors">
                                Kullanım Koşulları
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
