"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Key, Mail, ArrowRight, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PortalLoginPage() {
    const [licenseKey, setLicenseKey] = useState("");
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

            if (!supabaseUrl || !anonKey) {
                setError("Sistem yapılandırması hatalı.");
                return;
            }

            const res = await fetch(
                `${supabaseUrl}/rest/v1/tenants?license_key=eq.${licenseKey}&contact_email=eq.${email}&select=*`,
                {
                    headers: {
                        apikey: anonKey,
                        Authorization: `Bearer ${anonKey}`,
                    },
                }
            );

            if (res.ok) {
                const data = await res.json();
                if (data.length > 0) {
                    // Normalize data for the portal (company_name -> client_name, contact_email -> user_email)
                    const normalized = {
                        ...data[0],
                        client_name: data[0].company_name,
                        user_email: data[0].contact_email
                    };
                    sessionStorage.setItem("jetpos_customer_auth", JSON.stringify(normalized));
                    router.push("/portal");
                } else {
                    setError("Geçersiz lisans anahtarı veya e-posta.");
                }
            } else {
                setError("Giriş yapılırken bir hata oluştu.");
            }
        } catch (err) {
            setError("Sunucuya bağlanılamadı.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: "100vh", background: "#060914",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "1rem", position: "relative", overflow: "hidden"
        }}>
            {/* Background elements */}
            <div style={{
                position: "absolute", top: "-10%", left: "-10%", width: "40%", height: "40%",
                background: "radial-gradient(circle, rgba(37,99,235,0.1) 0%, transparent 70%)",
                filter: "blur(60px)", pointerEvents: "none"
            }} />
            <div style={{
                position: "absolute", bottom: "-10%", right: "-10%", width: "40%", height: "40%",
                background: "radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)",
                filter: "blur(60px)", pointerEvents: "none"
            }} />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ width: "100%", maxWidth: "420px", position: "relative", zIndex: 1 }}
            >
                <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
                    <div style={{
                        width: "4rem", height: "4rem", borderRadius: "1.25rem",
                        background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        margin: "0 auto 1.25rem",
                        boxShadow: "0 0 40px rgba(37,99,235,0.3)"
                    }}>
                        <Sparkles style={{ width: "1.75rem", height: "1.75rem", color: "white" }} />
                    </div>
                    <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "white", margin: 0 }}>Müşteri Paneli</h1>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.95rem", marginTop: "0.5rem" }}>
                        Lisans bilgilerinize erişmek için giriş yapın
                    </p>
                </div>

                <div style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "1.5rem", padding: "2.5rem",
                    backdropFilter: "blur(20px)"
                }}>
                    <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                        <div>
                            <label style={{ display: "block", color: "rgba(255,255,255,0.6)", fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.5rem" }}>
                                E-posta Adresi
                            </label>
                            <div style={{ position: "relative" }}>
                                <Mail style={{
                                    position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)",
                                    width: "1rem", height: "1rem", color: "rgba(255,255,255,0.3)"
                                }} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="ornek@mail.com"
                                    style={{
                                        width: "100%", padding: "0.875rem 1rem 0.875rem 2.85rem",
                                        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                                        borderRadius: "0.875rem", color: "white", fontSize: "1rem",
                                        outline: "none", fontFamily: "inherit", boxSizing: "border-box"
                                    }}
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: "block", color: "rgba(255,255,255,0.6)", fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.5rem" }}>
                                Lisans Anahtarı
                            </label>
                            <div style={{ position: "relative" }}>
                                <Key style={{
                                    position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)",
                                    width: "1rem", height: "1rem", color: "rgba(255,255,255,0.3)"
                                }} />
                                <input
                                    type="text"
                                    required
                                    value={licenseKey}
                                    onChange={e => setLicenseKey(e.target.value.toUpperCase())}
                                    placeholder="JETPOS-XXXX-XXXX"
                                    style={{
                                        width: "100%", padding: "0.875rem 1rem 0.875rem 2.85rem",
                                        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                                        borderRadius: "0.875rem", color: "white", fontSize: "1rem",
                                        letterSpacing: "0.05em",
                                        outline: "none", fontFamily: "inherit", boxSizing: "border-box"
                                    }}
                                />
                            </div>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                style={{
                                    padding: "0.75rem", borderRadius: "0.75rem",
                                    background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
                                    color: "#f87171", fontSize: "0.875rem", textAlign: "center"
                                }}
                            >
                                {error}
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                padding: "1rem", borderRadius: "0.875rem", border: "none",
                                background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                                color: "white", fontWeight: 700, fontSize: "1rem",
                                cursor: loading ? "not-allowed" : "pointer",
                                opacity: loading ? 0.7 : 1,
                                boxShadow: "0 8px 20px rgba(37,99,235,0.3)",
                                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                                transition: "all 0.2s"
                            }}
                        >
                            {loading ? "Giriş Yapılıyor..." : (
                                <>
                                    Sisteme Giriş Yap
                                    <ArrowRight style={{ width: "1.1rem", height: "1.1rem" }} />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div style={{
                    marginTop: "2rem", textAlign: "center",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                    color: "rgba(255,255,255,0.3)", fontSize: "0.875rem"
                }}>
                    <ShieldCheck style={{ width: "1rem", height: "1rem" }} />
                    <span>Güvenli Lisans Doğrulama Sistemi</span>
                </div>
            </motion.div>
        </div>
    );
}
