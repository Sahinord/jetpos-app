"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, CheckCircle2, Loader2, Gift } from "lucide-react";
import { supabase } from "@/lib/supabase";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ComingSoonPage() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (status === "loading") return;

        const trimmedEmail = email.trim().toLowerCase();
        if (!EMAIL_REGEX.test(trimmedEmail)) {
            setStatus("error");
            setErrorMessage("Geçerli bir e-posta adresi girin.");
            return;
        }

        setStatus("loading");
        setErrorMessage("");

        const { error } = await supabase
            .from("early_access_signups")
            .insert([{ email: trimmedEmail, source: "jetpos-shop-coming-soon" }]);

        if (error && error.code !== "23505") {
            // 23505 = unique constraint (zaten kayıtlı) — kullanıcıya hata gibi gösterme
            setStatus("error");
            setErrorMessage("Bir hata oluştu. Lütfen tekrar deneyin.");
            return;
        }

        setStatus("success");
    };

    return (
        <main
            style={{
                position: "relative",
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                padding: "2rem",
                textAlign: "center",
            }}
        >
            {/* Arka plan gradyan blobları */}
            <div
                style={{
                    position: "absolute",
                    top: "-10%",
                    right: "-10%",
                    width: "560px",
                    height: "560px",
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(120,134,199,0.18) 0%, transparent 70%)",
                    filter: "blur(40px)",
                    animation: "floatBlob 12s ease-in-out infinite",
                    pointerEvents: "none",
                }}
            />
            <div
                style={{
                    position: "absolute",
                    bottom: "-15%",
                    left: "-10%",
                    width: "480px",
                    height: "480px",
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(154,167,223,0.16) 0%, transparent 70%)",
                    filter: "blur(40px)",
                    animation: "floatBlob 14s ease-in-out infinite reverse",
                    pointerEvents: "none",
                }}
            />
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: "radial-gradient(circle, rgba(120,134,199,0.12) 1px, transparent 1px)",
                    backgroundSize: "30px 30px",
                    maskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black 0%, transparent 100%)",
                    WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black 0%, transparent 100%)",
                    pointerEvents: "none",
                }}
            />

            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                style={{ position: "relative", zIndex: 1, maxWidth: "640px" }}
            >
                <h1
                    style={{
                        fontSize: "clamp(2.4rem, 6vw, 4rem)",
                        fontWeight: 900,
                        lineHeight: 1.15,
                        letterSpacing: "-0.02em",
                        color: "#111827",
                        marginBottom: "1.25rem",
                    }}
                >
                    Çok Yakında
                    <br />
                    <span
                        style={{
                            background: "linear-gradient(135deg, #7886C7 0%, #5A659F 60%, #9AA7DF 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                        }}
                    >
                        Sizlerle!
                    </span>
                </h1>

                <p
                    style={{
                        fontSize: "1.05rem",
                        color: "#4B5563",
                        fontWeight: 500,
                        lineHeight: 1.6,
                        marginBottom: "2.5rem",
                        maxWidth: "480px",
                        marginLeft: "auto",
                        marginRight: "auto",
                    }}
                >
                    JetPOS Shop üzerinde çalışıyoruz. E-posta adresini bırak,
                    açıldığımız anda <strong style={{ color: "#111827" }}>ilk sen</strong> haberdar ol
                    ve erken erişim avantajlarından yararlan.
                </p>

                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.5 }}
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.6rem",
                        background: "linear-gradient(135deg, rgba(120,134,199,0.12) 0%, rgba(154,167,223,0.12) 100%)",
                        border: "1px solid rgba(120,134,199,0.3)",
                        borderRadius: "9999px",
                        padding: "0.55rem 1.25rem",
                        marginBottom: "2.5rem",
                    }}
                >
                    <Gift size={16} color="#5A659F" />
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#5A659F" }}>
                        Ön Beta&apos;ya katıl, JetPOS&apos;u <span style={{ color: "#111827" }}>ilk ay ücretsiz</span> dene
                    </span>
                </motion.div>

                {status === "success" ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "0.6rem",
                            background: "white",
                            border: "1px solid rgba(34,197,94,0.25)",
                            borderRadius: "16px",
                            padding: "1.1rem 1.5rem",
                            maxWidth: "440px",
                            margin: "0 auto",
                            boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
                        }}
                    >
                        <CheckCircle2 size={20} color="#16a34a" />
                        <span style={{ fontWeight: 700, color: "#111827", fontSize: "0.95rem" }}>
                            Listeye eklendin! Açıldığımızda haberin olacak.
                        </span>
                    </motion.div>
                ) : (
                    <form
                        onSubmit={handleSubmit}
                        style={{
                            display: "flex",
                            gap: "0.6rem",
                            maxWidth: "440px",
                            margin: "0 auto",
                            flexWrap: "wrap",
                        }}
                    >
                        <div style={{ position: "relative", flex: "1 1 240px" }}>
                            <Mail
                                size={18}
                                style={{
                                    position: "absolute",
                                    left: "1rem",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    color: "#9CA3AF",
                                }}
                            />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="ornek@eposta.com"
                                style={{
                                    width: "100%",
                                    padding: "0.95rem 1rem 0.95rem 2.75rem",
                                    borderRadius: "14px",
                                    border: "1px solid #E5E7EB",
                                    background: "white",
                                    fontSize: "0.95rem",
                                    fontWeight: 500,
                                    color: "#111827",
                                    outline: "none",
                                }}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={status === "loading"}
                            style={{
                                flex: "0 0 auto",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "0.5rem",
                                padding: "0.95rem 1.75rem",
                                borderRadius: "14px",
                                border: "none",
                                background: "linear-gradient(135deg, #7886C7 0%, #5A659F 100%)",
                                color: "white",
                                fontWeight: 700,
                                fontSize: "0.95rem",
                                cursor: status === "loading" ? "default" : "pointer",
                                opacity: status === "loading" ? 0.75 : 1,
                                boxShadow: "0 10px 25px rgba(120,134,199,0.35)",
                            }}
                        >
                            {status === "loading" ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                "Haber Ver"
                            )}
                        </button>
                    </form>
                )}

                {status === "error" && (
                    <p style={{ marginTop: "0.85rem", fontSize: "0.85rem", color: "#dc2626", fontWeight: 600 }}>
                        {errorMessage}
                    </p>
                )}

                <p style={{ marginTop: "3rem", fontSize: "0.8rem", color: "#9CA3AF", fontWeight: 500 }}>
                    © {new Date().getFullYear()} JetPOS — Tüm hakları saklıdır.
                </p>
            </motion.div>
        </main>
    );
}
