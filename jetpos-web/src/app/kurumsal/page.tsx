"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Building2, Check, Zap, Shield, Globe, Users, PhoneCall,
    ArrowRight, Star, Layers, HeadphonesIcon, Code2, BarChart3, Lock, ChevronDown
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

/* ─── FEATURES ─────────────────────────────────────── */
const FEATURES = [
    {
        icon: Building2,
        title: "Sınırsız Şube & Depo",
        desc: "Tüm şubelerinizi tek panelden yönetin. Şube bazlı stok, satış ve personel takibi.",
    },
    {
        icon: Users,
        title: "Sınırsız Kullanıcı & Rol",
        desc: "Kasiyerden müdüre her role özel izin sistemi. Sınırsız personel tanımı.",
    },
    {
        icon: Globe,
        title: "Tüm Pazaryeri Entegrasyonları",
        desc: "Trendyol, Yemeksepeti, Getir, Hepsiburada ve daha fazlası. Sipariş ve stok senkronizasyonu.",
    },
    {
        icon: Code2,
        title: "Özel API & ERP Entegrasyonu",
        desc: "SAP, Logo, Netsis gibi ERP sistemlerinize özel entegrasyon geliştirme.",
    },
    {
        icon: Star,
        title: "Beyaz Etiket (White-label)",
        desc: "Kendi markanızla özelleştirilmiş arayüz. Logo, renkler, domain — tamamen sizin.",
    },
    {
        icon: Shield,
        title: "SLA Garantisi",
        desc: "%99.9 uptime garantisi. Anlık destek kanalı. Kesinti tazminatı.",
    },
    {
        icon: HeadphonesIcon,
        title: "Dedicated Hesap Yöneticisi",
        desc: "Size özel bir hesap yöneticisi — onboarding'den günlük destek ve raporlamaya.",
    },
    {
        icon: Layers,
        title: "Yerinde Kurulum & Ekip Eğitimi",
        desc: "Teslimat, kurulum ve tüm ekibinize canlı eğitim. İstanbul dışı dahil.",
    },
    {
        icon: BarChart3,
        title: "Özel Raporlama & KPI Paneli",
        desc: "İşletmenize özel dashboard. Zincir bazlı karşılaştırmalı raporlar.",
    },
    {
        icon: Lock,
        title: "Gelişmiş Güvenlik & Audit Log",
        desc: "Kullanıcı bazlı işlem takibi, fiyat değişim geçmişi, kritik log kayıtları.",
    },
];

const STEPS = [
    { num: "01", title: "Formu Doldurun", desc: "Şirketiniz ve ihtiyaçlarınız hakkında kısa bir form." },
    { num: "02", title: "Sizi Arayalım", desc: "Uzmanımız 24 saat içinde sizi arayarak detayları konuşur." },
    { num: "03", title: "Demo & Teklif", desc: "Özelleştirilmiş demo ve fiyat teklifini e-posta ile iletiriz." },
    { num: "04", title: "Kurulum & Başlangıç", desc: "Ekibinizi eğitiyoruz, entegrasyonlarınızı kuruyoruz." },
];

const FAQS = [
    { q: "Kaç şubeden itibaren Enterprise planı önerilir?", a: "Genellikle 3+ şube veya 20+ kullanıcı olan işletmeler için Enterprise planı daha avantajlıdır. Tek şube için de özel ihtiyaç varsa (white-label, özel entegrasyon) görüşebiliriz." },
    { q: "Mevcut ERP sistemimizle entegre olabiliyor musunuz?", a: "SAP, Logo GO/Tiger, Netsis, Mikro, Luca gibi yaygın ERP sistemleriyle entegrasyon geliştiriyoruz. İhtiyaca göre özel API geliştirme de yapıyoruz." },
    { q: "White-label nasıl çalışıyor?", a: "Kendi domain adresinizde, kendi logo ve renk şemanızla JetPOS altyapısını kullanırsınız. Müşterileriniz JetPOS markasını görmez." },
    { q: "Sözleşme süresi ne kadar?", a: "Minimum 1 yıllık sözleşme yapıyoruz, 2-3 yıllık sözleşmelerde ek indirim uyguluyoruz. Özel ödeme planları konuşulabilir." },
    { q: "Teknik destek nasıl sağlanıyor?", a: "Dedicated hesap yöneticisi + öncelikli destek hattı. Kritik sorunlar için 2 saat SLA, genel sorunlar için 1 iş günü SLA." },
];

/* ─── CONTACT FORM ─────────────────────────────────── */
function ContactForm() {
    const [form, setForm] = useState({
        ad: "", soyad: "", telefon: "", email: "",
        sirket: "", sube_sayisi: "", mesaj: "",
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.ad || !form.telefon || !form.sirket) {
            setError("Ad, telefon ve şirket zorunludur.");
            return;
        }
        setLoading(true); setError("");
        try {
            const res = await fetch("/api/demo-request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: `${form.ad} ${form.soyad}`.trim(),
                    email: form.email || undefined,
                    phone: form.telefon,
                    company: form.sirket,
                    package_interest: "Kurumsal / Enterprise",
                    message: `[KURUMSAL TEKLIF] Şube Sayısı: ${form.sube_sayisi || "belirtilmedi"}\n\n${form.mesaj}`,
                }),
            });
            if (res.ok) setSuccess(true);
            else setError("Bir hata oluştu, lütfen tekrar deneyin.");
        } catch {
            setError("Bağlantı hatası.");
        } finally {
            setLoading(false); }
    };

    const inp: React.CSSProperties = {
        width: "100%", padding: "0.8rem 1rem",
        border: "1.5px solid rgba(120,134,199,0.2)",
        borderRadius: "0.75rem", fontSize: "0.9rem", color: "#111827",
        outline: "none", background: "rgba(120,134,199,0.03)",
        boxSizing: "border-box", fontFamily: "inherit",
    };

    if (success) return (
        <div style={{ textAlign: "center", padding: "3rem 2rem" }}>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}
                style={{ width: "4rem", height: "4rem", borderRadius: "50%", background: "linear-gradient(135deg,#22c55e,#16a34a)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
                <Check style={{ width: "2rem", height: "2rem", color: "white" }} strokeWidth={3} />
            </motion.div>
            <h3 style={{ fontSize: "1.4rem", fontWeight: 900, color: "#111827", marginBottom: "0.5rem" }}>Talebiniz Alındı!</h3>
            <p style={{ color: "#4B5563", lineHeight: 1.7 }}>24 saat içinde sizi arayacağız.<br />Enterprise çözümünüzü birlikte tasarlayacağız.</p>
        </div>
    );

    return (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <input placeholder="Ad *" value={form.ad} onChange={e => setForm(f => ({ ...f, ad: e.target.value }))} style={inp} />
                <input placeholder="Soyad" value={form.soyad} onChange={e => setForm(f => ({ ...f, soyad: e.target.value }))} style={inp} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <input placeholder="Telefon *" type="tel" value={form.telefon} onChange={e => setForm(f => ({ ...f, telefon: e.target.value }))} style={inp} />
                <input placeholder="E-posta" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={inp} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem" }}>
                <input placeholder="Şirket / İşletme Adı *" value={form.sirket} onChange={e => setForm(f => ({ ...f, sirket: e.target.value }))} style={inp} />
                <select value={form.sube_sayisi} onChange={e => setForm(f => ({ ...f, sube_sayisi: e.target.value }))}
                    style={{ ...inp, cursor: "pointer", appearance: "none" }}>
                    <option value="">Şube Sayısı</option>
                    <option value="1-2">1-2 Şube</option>
                    <option value="3-5">3-5 Şube</option>
                    <option value="6-10">6-10 Şube</option>
                    <option value="10+">10+ Şube</option>
                </select>
            </div>
            <textarea
                placeholder="Özel ihtiyaçlarınızı kısaca anlatın... (ERP entegrasyonu, white-label, vb.)"
                value={form.mesaj} onChange={e => setForm(f => ({ ...f, mesaj: e.target.value }))}
                rows={4}
                style={{ ...inp, resize: "vertical", minHeight: "100px" }}
            />
            {error && <p style={{ fontSize: "0.8rem", color: "#ef4444", margin: 0 }}>{error}</p>}
            <button type="submit" disabled={loading} style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                padding: "1rem", borderRadius: "0.875rem", border: "none",
                background: loading ? "#9CA3AF" : "linear-gradient(135deg,#7886C7,#5A659F)",
                color: "white", fontWeight: 700, fontSize: "1rem",
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: loading ? "none" : "0 4px 20px rgba(120,134,199,0.4)",
            }}>
                {loading ? "Gönderiliyor..." : (<><PhoneCall style={{ width: "1rem", height: "1rem" }} /> Teklif Talep Et <ArrowRight style={{ width: "1rem", height: "1rem" }} /></>)}
            </button>
        </form>
    );
}

/* ─── FAQ ITEM ─────────────────────────────────────── */
function FaqItem({ q, a }: { q: string; a: string }) {
    const [open, setOpen] = useState(false);
    return (
        <div style={{ borderBottom: "1px solid rgba(120,134,199,0.12)" }}>
            <button onClick={() => setOpen(!open)} style={{
                width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "1.25rem 0", background: "none", border: "none", cursor: "pointer", textAlign: "left",
            }}>
                <span style={{ fontWeight: 700, color: "#111827", fontSize: "0.95rem", paddingRight: "1rem" }}>{q}</span>
                <ChevronDown style={{
                    width: "1.1rem", height: "1.1rem", color: "#7886C7", flexShrink: 0,
                    transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s",
                }} />
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: "hidden" }}>
                        <p style={{ color: "#4B5563", fontSize: "0.9rem", lineHeight: 1.7, paddingBottom: "1.25rem" }}>{a}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ─── PAGE ─────────────────────────────────────────── */
export default function KurumsalPage() {
    return (
        <>
            <div className="site-bg" />
            <main style={{ position: "relative", zIndex: 1, minHeight: "100vh" }}>
                <Navbar />

                {/* ── Hero ── */}
                <section style={{ paddingTop: "9rem", paddingBottom: "6rem" }}>
                    <div className="site-container" style={{ textAlign: "center" }}>
                        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
                            <div style={{
                                display: "inline-flex", alignItems: "center", gap: "0.5rem",
                                background: "rgba(120,134,199,0.08)", border: "1px solid rgba(120,134,199,0.2)",
                                borderRadius: "9999px", padding: "0.4rem 1rem", marginBottom: "2rem",
                            }}>
                                <Building2 style={{ width: "0.9rem", height: "0.9rem", color: "#7886C7" }} />
                                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#7886C7", letterSpacing: "0.05em" }}>
                                    ENTERPRISE & KURUMSAL
                                </span>
                            </div>
                            <h1 style={{ fontSize: "clamp(2.2rem,5vw,3.8rem)", fontWeight: 900, color: "#111827", letterSpacing: "-0.03em", marginBottom: "1.25rem", lineHeight: 1.1 }}>
                                Büyük İşletmeler İçin<br />
                                <span style={{ backgroundImage: "linear-gradient(135deg,#7886C7,#5A659F)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                                    Özel Çözümler
                                </span>
                            </h1>
                            <p style={{ fontSize: "1.1rem", color: "#4B5563", maxWidth: "560px", margin: "0 auto 2.5rem", lineHeight: 1.7 }}>
                                Çok şubeli zincirler, franchise ağları ve kurumsal işletmeler için white-label, özel entegrasyon ve SLA garantili paket.
                            </p>
                            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
                                <a href="#iletisim" style={{
                                    display: "inline-flex", alignItems: "center", gap: "0.5rem",
                                    background: "linear-gradient(135deg,#7886C7,#5A659F)",
                                    color: "white", padding: "0.875rem 2rem", borderRadius: "0.875rem",
                                    fontWeight: 700, textDecoration: "none",
                                    boxShadow: "0 4px 20px rgba(120,134,199,0.35)",
                                }}>
                                    <PhoneCall style={{ width: "1rem", height: "1rem" }} />
                                    Teklif Talep Et
                                </a>
                                <a href="#ozellikler" style={{
                                    display: "inline-flex", alignItems: "center", gap: "0.5rem",
                                    background: "white", border: "1.5px solid rgba(120,134,199,0.25)",
                                    color: "#374151", padding: "0.875rem 2rem", borderRadius: "0.875rem",
                                    fontWeight: 700, textDecoration: "none",
                                }}>
                                    Özelliklere Bak
                                    <ArrowRight style={{ width: "1rem", height: "1rem" }} />
                                </a>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* ── Stats ── */}
                <section style={{ paddingBottom: "5rem" }}>
                    <div className="site-container">
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "1rem" }}>
                            {[
                                { val: "∞", label: "Sınırsız Şube" },
                                { val: "∞", label: "Sınırsız Kullanıcı" },
                                { val: "%99.9", label: "Uptime SLA" },
                                { val: "2 saat", label: "Kritik Destek SLA" },
                            ].map((s, i) => (
                                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                                    style={{ background: "white", border: "1px solid rgba(120,134,199,0.15)", borderRadius: "1rem", padding: "1.5rem", textAlign: "center" }}>
                                    <div style={{ fontSize: "2rem", fontWeight: 900, color: "#7886C7", marginBottom: "0.25rem" }}>{s.val}</div>
                                    <div style={{ fontSize: "0.82rem", color: "#6B7280", fontWeight: 600 }}>{s.label}</div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Features ── */}
                <section id="ozellikler" style={{ paddingBottom: "6rem" }}>
                    <div className="site-container">
                        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
                            <h2 style={{ fontSize: "clamp(1.6rem,3vw,2.4rem)", fontWeight: 900, color: "#111827", marginBottom: "0.75rem" }}>
                                Enterprise Özellikleri
                            </h2>
                            <p style={{ color: "#4B5563", fontSize: "1rem" }}>Standart planların ötesinde, işletmenize özel her şey.</p>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: "1rem" }}>
                            {FEATURES.map((f, i) => (
                                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                    style={{ background: "white", border: "1px solid rgba(120,134,199,0.15)", borderRadius: "1rem", padding: "1.5rem" }}>
                                    <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "0.75rem", background: "rgba(120,134,199,0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
                                        <f.icon style={{ width: "1.2rem", height: "1.2rem", color: "#7886C7" }} />
                                    </div>
                                    <h3 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#111827", marginBottom: "0.4rem" }}>{f.title}</h3>
                                    <p style={{ fontSize: "0.82rem", color: "#6B7280", lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── How it works ── */}
                <section style={{ paddingBottom: "6rem", background: "rgba(120,134,199,0.03)", borderTop: "1px solid rgba(120,134,199,0.08)", borderBottom: "1px solid rgba(120,134,199,0.08)" }}>
                    <div className="site-container" style={{ paddingTop: "4rem" }}>
                        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
                            <h2 style={{ fontSize: "clamp(1.6rem,3vw,2.4rem)", fontWeight: 900, color: "#111827", marginBottom: "0.75rem" }}>
                                Nasıl Çalışır?
                            </h2>
                            <p style={{ color: "#4B5563", fontSize: "1rem" }}>Teklif talebinden canlıya geçişe 4 adım.</p>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "1.5rem" }}>
                            {STEPS.map((s, i) => (
                                <div key={i} style={{ textAlign: "center" }}>
                                    <div style={{ fontSize: "2.5rem", fontWeight: 900, color: "rgba(120,134,199,0.2)", marginBottom: "0.75rem" }}>{s.num}</div>
                                    <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#111827", marginBottom: "0.5rem" }}>{s.title}</h3>
                                    <p style={{ fontSize: "0.85rem", color: "#6B7280", lineHeight: 1.6 }}>{s.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Contact + FAQ ── */}
                <section id="iletisim" style={{ paddingTop: "6rem", paddingBottom: "6rem" }}>
                    <div className="site-container">
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "start" }}>

                            {/* Form */}
                            <div>
                                <h2 style={{ fontSize: "clamp(1.5rem,2.5vw,2rem)", fontWeight: 900, color: "#111827", marginBottom: "0.5rem" }}>
                                    Teklif Talep Edin
                                </h2>
                                <p style={{ color: "#4B5563", fontSize: "0.9rem", marginBottom: "2rem", lineHeight: 1.6 }}>
                                    24 saat içinde uzmanımız sizi arayarak ihtiyaçlarınızı dinleyecek ve özelleştirilmiş teklif hazırlayacak.
                                </p>
                                <div style={{ background: "white", border: "1px solid rgba(120,134,199,0.15)", borderRadius: "1.25rem", padding: "2rem" }}>
                                    <ContactForm />
                                </div>
                            </div>

                            {/* FAQ */}
                            <div>
                                <h2 style={{ fontSize: "clamp(1.5rem,2.5vw,2rem)", fontWeight: 900, color: "#111827", marginBottom: "0.5rem" }}>
                                    Sık Sorulan Sorular
                                </h2>
                                <p style={{ color: "#4B5563", fontSize: "0.9rem", marginBottom: "2rem", lineHeight: 1.6 }}>
                                    Enterprise çözümü hakkında merak ettikleriniz.
                                </p>
                                <div>
                                    {FAQS.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} />)}
                                </div>

                                {/* CTA card */}
                                <div style={{
                                    marginTop: "2rem", background: "linear-gradient(135deg,rgba(120,134,199,0.08),rgba(90,101,159,0.05))",
                                    border: "1px solid rgba(120,134,199,0.2)", borderRadius: "1rem", padding: "1.5rem",
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                                        <Zap style={{ width: "1.1rem", height: "1.1rem", color: "#7886C7" }} />
                                        <span style={{ fontWeight: 800, color: "#111827" }}>Hızlı Demo Ayarlayalım</span>
                                    </div>
                                    <p style={{ fontSize: "0.82rem", color: "#6B7280", lineHeight: 1.6, margin: "0 0 1rem" }}>
                                        Formu doldurmadan önce sistemi görmek ister misiniz? Sizi arayalım, 30 dakikalık bir demo yapalım.
                                    </p>
                                    <a href="tel:05366610169" style={{
                                        display: "inline-flex", alignItems: "center", gap: "0.4rem",
                                        color: "#7886C7", fontWeight: 700, fontSize: "0.85rem", textDecoration: "none",
                                    }}>
                                        <PhoneCall style={{ width: "0.85rem", height: "0.85rem" }} />
                                        0536 661 0169
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <Footer />
            </main>
        </>
    );
}
