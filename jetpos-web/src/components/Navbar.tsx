"use client";

import { Zap, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const navLinks = [
        { href: "#features", label: "Özellikler" },
        { href: "#pricing", label: "Fiyatlandırma" },
    ];

    return (
        <>
            <nav
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
                        ? "glass-ultra border-b border-white/10"
                        : "bg-transparent"
                    }`}
            >
                <div className="container">
                    <div className="flex items-center justify-between h-20">
                        {/* Logo */}
                        <a
                            href="/"
                            className="flex items-center gap-3 z-10"
                            aria-label="JetPOS Ana Sayfa"
                        >
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-400 rounded-xl flex items-center justify-center">
                                <Zap className="w-5 h-5 text-white fill-current" />
                            </div>
                            <span className="text-2xl font-bold text-white">
                                Jet<span className="text-blue-400">POS</span>
                            </span>
                        </a>

                        {/* Desktop Menu */}
                        <div className="hidden md:flex items-center gap-8">
                            {navLinks.map((link) => (
                                <a
                                    key={link.href}
                                    href={link.href}
                                    className="text-sm font-semibold text-white/80 hover:text-white transition-colors"
                                >
                                    {link.label}
                                </a>
                            ))}
                            <button className="btn-cyber">
                                Giriş Yap
                            </button>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 text-white"
                            aria-label="Menü"
                        >
                            {mobileMenuOpen ? (
                                <X className="w-6 h-6" />
                            ) : (
                                <Menu className="w-6 h-6" />
                            )}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-40 md:hidden">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setMobileMenuOpen(false)}
                    />
                    <div className="absolute top-20 left-0 right-0 glass-ultra border-b border-white/10 p-6">
                        <div className="flex flex-col gap-4">
                            {navLinks.map((link) => (
                                <a
                                    key={link.href}
                                    href={link.href}
                                    className="text-white/80 hover:text-white font-semibold py-2"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {link.label}
                                </a>
                            ))}
                            <button className="btn-cyber w-full mt-2">
                                Giriş Yap
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
