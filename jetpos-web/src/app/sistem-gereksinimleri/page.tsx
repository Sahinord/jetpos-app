"use client";

import React from "react";
import { motion } from "framer-motion";
import {
    Monitor, Cpu, MemoryStick, HardDrive, Wifi, Gauge,
    Smartphone, Printer, ScanBarcode, Banknote, MonitorSmartphone,
    CloudOff, CheckCircle2, AlertTriangle, Zap, ArrowRight, Globe
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

/* ─── TIERS ─────────────────────────────────────────── */
const TIERS = [
    {
        id: "minimum",
        name: "Minimum",
        tagline: "En alt sınır",
        subtitle: "JetPOS açılır ve satış yapılır; ancak rapor ve yoğun ekranlarda yavaşlama hissedilir.",
        badge: "Çalışır, zorlanır",
        badgeColor: "#f59e0b",
        Icon: AlertTriangle,
        specs: [
            { Icon: Monitor, label: "İşletim Sistemi", value: "Windows 10 (64-bit)" },
            { Icon: Cpu, label: "İşlemci", value: "2 çekirdek · 1.6 GHz (Celeron / Atom sınıfı)" },
            { Icon: MemoryStick, label: "Bellek (RAM)", value: "4 GB" },
            { Icon: HardDrive, label: "Depolama", value: "2 GB boş alan (HDD yeterli)" },
            { Icon: Gauge, label: "Ekran", value: "1280 × 720 çözünürlük" },
            { Icon: Wifi, label: "İnternet", value: "8 Mbps (ADSL yeterli)" },
        ],
    },
    {
        id: "onerilen",
        name: "Önerilen",
        tagline: "Günlük kullanım",
        subtitle: "Kasada bekletmeyen akıcı deneyim; raporlar ve yoğun saatler için ideal denge.",
        badge: "Rahat çalışır",
        badgeColor: "#7886C7",
        Icon: CheckCircle2,
        highlight: true,
        specs: [
            { Icon: Monitor, label: "İşletim Sistemi", value: "Windows 10 / 11 (64-bit)" },
            { Icon: Cpu, label: "İşlemci", value: "4 çekirdek · Intel i3 / Ryzen 3 ve üzeri" },
            { Icon: MemoryStick, label: "Bellek (RAM)", value: "8 GB" },
            { Icon: HardDrive, label: "Depolama", value: "10 GB boş alan · SSD önerilir" },
            { Icon: Gauge, label: "Ekran", value: "1920 × 1080 · dokunmatik opsiyonel" },
            { Icon: Wifi, label: "İnternet", value: "16 Mbps ve üzeri" },
        ],
    },
    {
        id: "ideal",
        name: "İdeal",
        tagline: "Yoğun tempo & çoklu terminal",
        subtitle: "Zincir mağaza, yoğun restoran ve çok kasalı işletmeler için maksimum performans.",
        badge: "Uçarak çalışır",
        badgeColor: "#22c55e",
        Icon: Zap,
        specs: [
            { Icon: Monitor, label: "İşletim Sistemi", value: "Windows 11 (64-bit)" },
            { Icon: Cpu, label: "İşlemci", value: "Intel i5 / Ryzen 5 ve üzeri" },
            { Icon: MemoryStick, label: "Bellek (RAM)", value: "16 GB" },
            { Icon: HardDrive, label: "Depolama", value: "SSD · 20 GB+ boş alan" },
            { Icon: Gauge, label: "Ekran", value: "1920 × 1080 dokunmatik + müşteri ekranı (CFD)" },
            { Icon: Wifi, label: "İnternet", value: "25 Mbps+ · fiber önerilir" },
        ],
    },
];

/* ─── MOBILE / BROWSER ──────────────────────────────── */
const MOBILE_REQS = [
    {
        Icon: Smartphone,
        title: "Android Cihazlar",
        lines: ["Android 8.0 ve üzeri", "2 GB RAM (4 GB önerilir)", "Güncel Chrome tarayıcı", "Kamera — mobil barkod okuma için"],
    },
    {
        Icon: Smartphone,
        title: "iPhone & iPad",
        lines: ["iOS / iPadOS 14 ve üzeri", "Güncel Safari tarayıcı", "Kamera — mobil barkod okuma için"],
    },
    {
        Icon: Globe,
        title: "Web Paneli (Tarayıcı)",
        lines: ["Chrome, Edge veya Safari — güncel sürüm", "Herhangi bir işletim sistemi (macOS dahil)", "Yönetim paneli ve raporlar için yeterli"],
    },
];

/* ─── PERIPHERALS ───────────────────────────────────── */
const PERIPHERALS = [
    {
        Icon: Printer,
        title: "Fiş Yazıcı",
        desc: "58 mm veya 80 mm termal yazıcılar · USB ve Ethernet bağlantı desteklenir.",
    },
    {
        Icon: ScanBarcode,
        title: "Barkod Okuyucu",
        desc: "USB veya Bluetooth HID modunda çalışan tüm okuyucular · telefonunuz da okuyucuya dönüşür.",
    },
    {
        Icon: Banknote,
        title: "Nakit Çekmece",
        desc: "Fiş yazıcı üzerinden RJ11 tetiklemeli standart çekmecelerle uyumlu.",
    },
    {
        Icon: MonitorSmartphone,
        title: "Müşteri Ekranı (CFD)",
        desc: "HDMI ile bağlanan ikinci ekranlarda sepet ve kampanya gösterimi.",
    },
];

export default function SystemRequirementsPage() {
    return (
        <>
            <div className="site-bg" />
            <main style={{ position: "relative", zIndex: 1, minHeight: "100vh" }}>
                <Navbar />

                {/* Hero */}
                <section style={{ paddingTop: "9rem", paddingBottom: "3.5rem", textAlign: "center" }}>
                    <div className="site-container">
                        <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="badge" style={{ marginBottom: "1.5rem" }}>
                            <Cpu style={{ width: "0.85rem", height: "0.85rem" }} />
                            SİSTEM GEREKSİNİMLERİ
                        </motion.span>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            style={{
                                fontSize: "clamp(2.25rem, 6vw, 3.75rem)", fontWeight: 900,
                                color: "#111827", marginBottom: "1.25rem", letterSpacing: "-0.03em", lineHeight: 1.1,
                            }}
                        >
                            JetPOS <span className="holographic-text">Hangi Cihazlarda Çalışır?</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            style={{ fontSize: "1.05rem", color: "#4B5563", maxWidth: "620px", margin: "0 auto", lineHeight: 1.65 }}
                        >
                            JetPOS güçlü donanım istemez — yıllardır köşede duran bilgisayarınızla bile satışa başlayabilirsiniz.
                            Aşağıdaki seviyelerden cihazınıza uyanı bulun.
                        </motion.p>
                    </div>
                </section>

                {/* Desktop tiers */}
                <section style={{ paddingBottom: "5rem" }}>
                    <div className="site-container">
                        <div className="sysreq-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.25rem", maxWidth: "1100px", margin: "0 auto" }}>
                            {TIERS.map((tier, i) => (
                                <motion.div
                                    key={tier.id}
                                    initial={{ opacity: 0, y: 24 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    className="sysreq-card"
                                    style={{
                                        position: "relative",
                                        background: tier.highlight ? "rgba(120,134,199,0.04)" : "white",
                                        border: `1px solid ${tier.highlight ? "rgba(90,101,159,0.35)" : "rgba(120,134,199,0.15)"}`,
                                        borderRadius: "1.25rem",
                                        padding: "1.75rem",
                                        display: "flex", flexDirection: "column", gap: "1.25rem",
                                    }}
                                >
                                    {/* Badge */}
                                    <div style={{
                                        position: "absolute", top: "-0.8rem", left: "50%", transform: "translateX(-50%)",
                                        background: tier.badgeColor, color: "white",
                                        fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.04em",
                                        padding: "0.3rem 0.9rem", borderRadius: "9999px", whiteSpace: "nowrap",
                                    }}>
                                        {tier.badge}
                                    </div>

                                    <div style={{ textAlign: "center", paddingTop: "0.5rem" }}>
                                        <div style={{
                                            width: "3rem", height: "3rem", borderRadius: "0.875rem", margin: "0 auto 0.75rem",
                                            background: `${tier.badgeColor}14`, border: `1px solid ${tier.badgeColor}30`,
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                        }}>
                                            <tier.Icon style={{ width: "1.4rem", height: "1.4rem", color: tier.badgeColor }} />
                                        </div>
                                        <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#111827", marginBottom: "0.2rem" }}>{tier.name}</h3>
                                        <p style={{ fontSize: "0.78rem", fontWeight: 700, color: tier.badgeColor, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.6rem" }}>
                                            {tier.tagline}
                                        </p>
                                        <p style={{ fontSize: "0.85rem", color: "#4B5563", lineHeight: 1.55, minHeight: "3.9rem" }}>{tier.subtitle}</p>
                                    </div>

                                    <div style={{ height: "1px", background: "rgba(120,134,199,0.12)" }} />

                                    <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
                                        {tier.specs.map((s, j) => (
                                            <div key={j} style={{ display: "flex", alignItems: "flex-start", gap: "0.7rem" }}>
                                                <div style={{
                                                    width: "1.9rem", height: "1.9rem", borderRadius: "0.5rem", flexShrink: 0,
                                                    background: "rgba(120,134,199,0.08)",
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                }}>
                                                    <s.Icon style={{ width: "0.9rem", height: "0.9rem", color: "#7886C7" }} />
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: "0.72rem", color: "#6B7280", fontWeight: 600, marginBottom: "0.1rem" }}>{s.label}</div>
                                                    <div style={{ fontSize: "0.85rem", color: "#111827", fontWeight: 600, lineHeight: 1.4 }}>{s.value}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Offline note */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            style={{
                                maxWidth: "1100px", margin: "1.5rem auto 0",
                                background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.2)",
                                borderRadius: "1rem", padding: "1.1rem 1.4rem",
                                display: "flex", alignItems: "center", gap: "0.9rem",
                            }}
                        >
                            <CloudOff style={{ width: "1.2rem", height: "1.2rem", color: "#16a34a", flexShrink: 0 }} />
                            <p style={{ fontSize: "0.9rem", color: "#374151", lineHeight: 1.6, margin: 0 }}>
                                <strong style={{ color: "#111827" }}>İnternet kesilse bile satış durmaz.</strong>{" "}
                                Offline mod tüm seviyelerde çalışır; kesinti sırasındaki satışlar cihazda saklanır, bağlantı gelince otomatik senkronize edilir.
                            </p>
                        </motion.div>
                    </div>
                </section>

                {/* Mobile & browser */}
                <section style={{ paddingBottom: "5rem" }}>
                    <div className="site-container" style={{ maxWidth: "1100px" }}>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            style={{ textAlign: "center", marginBottom: "2.5rem" }}
                        >
                            <h2 style={{ fontSize: "1.9rem", fontWeight: 800, color: "#111827", marginBottom: "0.6rem" }}>
                                Mobil & <span className="holographic-text">Tarayıcı</span>
                            </h2>
                            <p style={{ color: "#4B5563", fontSize: "0.98rem", maxWidth: "560px", margin: "0 auto" }}>
                                Garson uygulaması, mobil barkod okuma ve yönetim paneli için ek kurulum gerekmez — tarayıcıdan çalışır.
                            </p>
                        </motion.div>

                        <div className="sysreq-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.25rem" }}>
                            {MOBILE_REQS.map((m, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.08 }}
                                    className="sysreq-card"
                                    style={{
                                        background: "white", border: "1px solid rgba(120,134,199,0.15)",
                                        borderRadius: "1.25rem", padding: "1.75rem",
                                    }}
                                >
                                    <div style={{
                                        width: "2.75rem", height: "2.75rem", borderRadius: "0.75rem", marginBottom: "1rem",
                                        background: "rgba(120,134,199,0.08)", border: "1px solid rgba(120,134,199,0.2)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                    }}>
                                        <m.Icon style={{ width: "1.2rem", height: "1.2rem", color: "#7886C7" }} />
                                    </div>
                                    <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#111827", marginBottom: "0.8rem" }}>{m.title}</h3>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                        {m.lines.map((line, j) => (
                                            <div key={j} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "0.86rem", color: "#4B5563", lineHeight: 1.5 }}>
                                                <CheckCircle2 style={{ width: "0.9rem", height: "0.9rem", color: "#7886C7", flexShrink: 0, marginTop: "0.15rem" }} />
                                                {line}
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Peripherals */}
                <section style={{ paddingBottom: "5rem" }}>
                    <div className="site-container" style={{ maxWidth: "1100px" }}>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            style={{ textAlign: "center", marginBottom: "2.5rem" }}
                        >
                            <h2 style={{ fontSize: "1.9rem", fontWeight: 800, color: "#111827", marginBottom: "0.6rem" }}>
                                Uyumlu <span className="holographic-text">Donanımlar</span>
                            </h2>
                            <p style={{ color: "#4B5563", fontSize: "0.98rem", maxWidth: "560px", margin: "0 auto" }}>
                                Hiçbiri zorunlu değildir — JetPOS donanımsız da çalışır, ihtiyacınız oldukça ekleyebilirsiniz.
                            </p>
                        </motion.div>

                        <div className="sysreq-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.25rem" }}>
                            {PERIPHERALS.map((p, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.08 }}
                                    className="sysreq-card"
                                    style={{
                                        background: "white", border: "1px solid rgba(120,134,199,0.15)",
                                        borderRadius: "1.25rem", padding: "1.5rem", textAlign: "center",
                                    }}
                                >
                                    <div style={{
                                        width: "3rem", height: "3rem", borderRadius: "0.875rem", margin: "0 auto 1rem",
                                        background: "rgba(120,134,199,0.08)", border: "1px solid rgba(120,134,199,0.2)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                    }}>
                                        <p.Icon style={{ width: "1.25rem", height: "1.25rem", color: "#7886C7" }} />
                                    </div>
                                    <h3 style={{ fontSize: "0.98rem", fontWeight: 800, color: "#111827", marginBottom: "0.5rem" }}>{p.title}</h3>
                                    <p style={{ fontSize: "0.82rem", color: "#6B7280", lineHeight: 1.55 }}>{p.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section style={{ paddingBottom: "7rem" }}>
                    <div className="site-container" style={{ maxWidth: "1000px" }}>
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="sysreq-cta"
                            style={{
                                background: "linear-gradient(135deg, rgba(120,134,199,0.08), rgba(120,134,199,0.03))",
                                border: "1px solid rgba(120,134,199,0.2)",
                                borderRadius: "1.5rem", padding: "3rem",
                                display: "flex", alignItems: "center", gap: "3rem",
                            }}
                        >
                            <div style={{ flex: 1 }}>
                                <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#111827", marginBottom: "0.75rem" }}>
                                    Cihazımın yeterli olup olmadığından emin değilim
                                </h2>
                                <p style={{ color: "#4B5563", fontSize: "1rem", lineHeight: 1.6 }}>
                                    Cihaz modelinizi destek ekibimize iletin, uyumluluğunu ücretsiz kontrol edelim — ya da 14 gün ücretsiz deneyip kendiniz görün.
                                </p>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", alignItems: "stretch" }}>
                                <a href="/demo" className="btn-primary" style={{ textDecoration: "none", justifyContent: "center", gap: "0.6rem" }}>
                                    <Zap size={18} />
                                    14 Gün Ücretsiz Dene
                                    <ArrowRight size={16} />
                                </a>
                                <a href="/iletisim" className="btn-outline" style={{ textDecoration: "none", justifyContent: "center", gap: "0.6rem" }}>
                                    Destek Ekibine Sor
                                </a>
                            </div>
                        </motion.div>
                    </div>
                </section>

                <style>{`
                    .sysreq-card {
                        transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
                        box-shadow: 0 1px 2px rgba(17,24,39,0.04);
                    }
                    .sysreq-card:hover {
                        transform: translateY(-4px);
                        box-shadow: 0 16px 32px rgba(90,101,159,0.16);
                    }
                    @media (max-width: 1024px) {
                        .sysreq-grid-4 { grid-template-columns: repeat(2, 1fr) !important; }
                    }
                    @media (max-width: 900px) {
                        .sysreq-grid { grid-template-columns: 1fr !important; }
                        .sysreq-cta { flex-direction: column; text-align: center; gap: 2rem !important; padding: 2rem !important; }
                    }
                    @media (max-width: 640px) {
                        .sysreq-grid-4 { grid-template-columns: 1fr !important; }
                    }
                `}</style>

                <Footer />
            </main>
        </>
    );
}
