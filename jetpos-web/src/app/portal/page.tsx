"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Download, Clock, BookOpen, LogOut, Sparkles,
    Calendar, CheckCircle2, AlertTriangle, ExternalLink,
    ChevronRight, Play
} from "lucide-react";
import { useRouter } from "next/navigation";

type License = {
    id: string;
    license_key: string;
    client_name: string;
    user_email: string;
    plan_type: string;
    total_days: number;
    download_link: string;
    created_at: string;
    expires_at: string | null;
};

type Guide = {
    id: string;
    title: string;
    content: string;
};

export default function PortalPage() {
    const [license, setLicense] = useState<License | null>(null);
    const [guides, setGuides] = useState<Guide[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const auth = sessionStorage.getItem("jetpos_customer_auth");
        if (!auth) {
            router.push("/portal/login");
            return;
        }
        setLicense(JSON.parse(auth));
        loadGuides();
        setLoading(false);
    }, []);

    const loadGuides = async () => {
        try {
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
            if (!supabaseUrl || !anonKey) return;

            const res = await fetch(`${supabaseUrl}/rest/v1/customer_guides?is_active=eq.true&order=order_index.asc`, {
                headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` }
            });
            if (res.ok) setGuides(await res.json());
        } catch (e) {
            console.error("Guide load error:", e);
        }
    };

    const handleLogout = () => {
        sessionStorage.removeItem("jetpos_customer_auth");
        router.push("/portal/login");
    };

    if (loading || !license) return null;

    // Days remaining calculation
    const daysRemaining = license.expires_at
        ? Math.max(0, Math.ceil((new Date(license.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : license.total_days;

    const progress = Math.min(100, (daysRemaining / (license.total_days || 365)) * 100);

    return (
        <div style={{ minHeight: "100vh", background: "#060914", color: "white" }}>
            {/* Header */}
            <header style={{
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                padding: "1rem 2rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backdropFilter: "blur(20px)",
                background: "rgba(6,9,20,0.8)",
                position: "sticky",
                top: 0,
                zIndex: 10
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{
                        width: "2.5rem", height: "2.5rem", borderRadius: "0.75rem",
                        background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                        display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                        <Sparkles style={{ width: "1.25rem", height: "1.25rem", color: "white" }} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: "1rem", fontWeight: 800, margin: 0 }}>JetPOS Müşteri Paneli</h1>
                        <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", margin: 0 }}>Hoş geldiniz, {license.client_name}</p>
                    </div>
                </div>
                <button onClick={handleLogout} style={{
                    background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
                    borderRadius: "0.75rem", padding: "0.5rem 1rem",
                    color: "#fca5a5", fontSize: "0.875rem", fontWeight: 600,
                    cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem"
                }}>
                    <LogOut style={{ width: "1rem", height: "1rem" }} />
                    Çıkış Yap
                </button>
            </header>

            <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "2rem" }}>

                    {/* Left Column: Actions & Guides */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

                        {/* Download Section */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{
                                background: "linear-gradient(135deg, rgba(37,99,235,0.15), rgba(124,58,237,0.15))",
                                border: "1px solid rgba(37,99,235,0.3)",
                                borderRadius: "1.5rem", padding: "2rem",
                                position: "relative", overflow: "hidden"
                            }}
                        >
                            <div style={{ position: "relative", zIndex: 1 }}>
                                <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.5rem" }}>Güncel Sürüm Hazır!</h2>
                                <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: "1.5rem", maxWidth: "450px" }}>
                                    JetPOS'un en son özelliklerini ve güvenlik güncellemelerini içeren setup dosyasını hemen indirebilirsiniz.
                                </p>
                                <a
                                    href={license.download_link}
                                    style={{
                                        display: "inline-flex", alignItems: "center", gap: "0.75rem",
                                        background: "white", color: "#060914",
                                        padding: "1rem 2rem", borderRadius: "1rem",
                                        fontWeight: 800, fontSize: "1.1rem",
                                        textDecoration: "none", boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
                                        transition: "transform 0.2s"
                                    }}
                                    onMouseOver={e => e.currentTarget.style.transform = "translateY(-2px)"}
                                    onMouseOut={e => e.currentTarget.style.transform = "translateY(0)"}
                                >
                                    <Download style={{ width: "1.25rem", height: "1.25rem" }} />
                                    Setup (v.Son Sürüm) İndir
                                </a>
                            </div>
                            <div style={{
                                position: "absolute", right: "-2rem", bottom: "-2rem",
                                opacity: 0.1, pointerEvents: "none"
                            }}>
                                <Download style={{ width: "20rem", height: "20rem" }} />
                            </div>
                        </motion.section>

                        {/* Guides Section */}
                        <section>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
                                <BookOpen style={{ width: "1.5rem", height: "1.5rem", color: "#60a5fa" }} />
                                <h2 style={{ fontSize: "1.25rem", fontWeight: 800 }}>JetPOS Kullanım Rehberi</h2>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                {guides.map((guide, i) => (
                                    <motion.div
                                        key={guide.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: i * 0.1 }}
                                        style={{
                                            background: "rgba(255,255,255,0.03)",
                                            border: "1px solid rgba(255,255,255,0.08)",
                                            borderRadius: "1.25rem", padding: "1.5rem",
                                            cursor: "pointer"
                                        }}
                                        whileHover={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.15)" }}
                                    >
                                        <div style={{
                                            width: "2.5rem", height: "2.5rem", borderRadius: "0.75rem",
                                            background: "rgba(96,165,250,0.1)",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            marginBottom: "1rem", color: "#60a5fa"
                                        }}>
                                            <Play style={{ width: "1.1rem", height: "1.1rem", fill: "currentColor" }} />
                                        </div>
                                        <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.5rem" }}>{guide.title}</h3>
                                        <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.5, margin: 0 }}>
                                            {guide.content.substring(0, 100)}...
                                        </p>
                                        <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", gap: "0.4rem", color: "#60a5fa", fontSize: "0.8rem", fontWeight: 600 }}>
                                            Devamını Oku <ChevronRight style={{ width: "0.9rem", height: "0.9rem" }} />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Right Column: License Status */}
                    <aside style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                        <div style={{
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: "1.5rem", padding: "2rem"
                        }}>
                            <h3 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <Clock style={{ width: "1.1rem", height: "1.1rem", color: "#22c55e" }} />
                                Lisans Durumu
                            </h3>

                            <div style={{ marginBottom: "2rem" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                                    <span style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.4)" }}>Kalan Süre</span>
                                    <span style={{ fontSize: "0.875rem", fontWeight: 700, color: daysRemaining < 30 ? "#f87171" : "#4ade80" }}>
                                        {daysRemaining} Gün
                                    </span>
                                </div>
                                <div style={{ height: "8px", background: "rgba(255,255,255,0.05)", borderRadius: "10px", overflow: "hidden" }}>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        style={{
                                            height: "100%",
                                            background: `linear-gradient(90deg, ${daysRemaining < 30 ? "#ef4444, #f87171" : "#22c55e, #4ade80"})`,
                                            borderRadius: "10px"
                                        }}
                                    />
                                </div>
                                {daysRemaining < 30 && (
                                    <div style={{
                                        marginTop: "1rem", padding: "0.75rem", borderRadius: "0.75rem",
                                        background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
                                        display: "flex", gap: "0.5rem", alignItems: "flex-start"
                                    }}>
                                        <AlertTriangle style={{ width: "1rem", height: "1rem", color: "#f87171", flexShrink: 0 }} />
                                        <p style={{ fontSize: "0.75rem", color: "#fca5a5", margin: 0 }}>
                                            Lisans süreniz dolmak üzere! Yenilemek için destek ekibiyle iletişime geçin.
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                <div style={{ padding: "1rem", borderRadius: "1rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                                    <p style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)", marginBottom: "0.25rem", textTransform: "uppercase", fontWeight: 700 }}>Paket</p>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                        <CheckCircle2 style={{ width: "1rem", height: "1rem", color: "#3b82f6" }} />
                                        <span style={{ fontWeight: 800 }}>{license.plan_type}</span>
                                    </div>
                                </div>
                                <div style={{ padding: "1rem", borderRadius: "1rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                                    <p style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)", marginBottom: "0.25rem", textTransform: "uppercase", fontWeight: 700 }}>Lisans Anahtarı</p>
                                    <code style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.8)", fontFamily: "monospace" }}>{license.license_key}</code>
                                </div>
                            </div>

                            <button style={{
                                width: "100%", marginTop: "1.5rem", padding: "1rem",
                                borderRadius: "1rem", border: "1px solid rgba(255,255,255,0.1)",
                                background: "rgba(255,255,255,0.05)", color: "white",
                                fontWeight: 700, cursor: "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem"
                            }}>
                                <ExternalLink style={{ width: "1rem", height: "1rem" }} />
                                Destek Talebi Oluştur
                            </button>
                        </div>
                    </aside>

                </div>
            </main>
        </div>
    );
}
