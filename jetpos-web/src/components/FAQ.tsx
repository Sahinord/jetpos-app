"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, HelpCircle } from "lucide-react";

const faqs = [
    {
        question: "JetPOS'u kullanmak için internet bağlantısı şart mı?",
        answer: "JetPOS bulut tabanlı bir sistemdir, bu nedenle verilerin her yerden erişilebilir olması için internet bağlantısı önerilir. Ancak internet kesintilerinde bile işlem yapmaya devam edebileceğiniz 'offline' modumuz çok yakında hizmete girecektir."
    },
    {
        question: "Verilerim ne kadar güvende?",
        answer: "Verileriniz, dünyanın en güvenli bulut altyapılarından biri olan Supabase (banka düzeyinde şifreleme ile) üzerinde barındırılır. Günlük yedeklemeler ve gelişmiş güvenlik protokolleri ile ticari sırlarınız her zaman koruma altındadır."
    },
    {
        question: "E-Fatura geçiş süreci ne kadar sürer?",
        answer: "JetPOS ve QNB eFinans entegrasyonu sayesinde süreç oldukça hızlıdır. Gerekli belgeleri tamamladıktan sonra genellikle 24-48 saat içinde e-fatura kesmeye başlayabilirsiniz. Ekibimiz tüm süreçte size ücretsiz destek vermektedir."
    },
    {
        question: "El terminali satın almam gerekiyor mu?",
        answer: "Hayır! JetPOS'un en büyük avantajı, herhangi bir Android veya iOS akıllı telefonu bir barkod okuyucuya ve el terminaline dönüştürebilmesidir. Mevcut telefonlarınızla anında kullanmaya başlayabilirsiniz."
    },
    {
        question: "Farklı şubelerimi tek bir yerden yönetebilir miyim?",
        answer: "Evet, JetPOS çoklu şube desteği sunar. Tüm şubelerinizin stoklarını, satışlarını ve kasa hareketlerini tek bir yönetici panelinden gerçek zamanlı olarak takip edebilirsiniz."
    }
];

export default function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <section style={{ padding: "8rem 0", position: "relative", zIndex: 2 }}>
            <div className="site-container" style={{ maxWidth: "800px" }}>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    style={{ textAlign: "center", marginBottom: "4rem" }}
                >
                    <div style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        background: "rgba(59,130,246,0.1)",
                        padding: "0.5rem 1.25rem",
                        borderRadius: "99px",
                        border: "1px solid rgba(59,130,246,0.2)",
                        marginBottom: "1.5rem"
                    }}>
                        <HelpCircle style={{ width: "1rem", height: "1rem", color: "#3b82f6" }} />
                        <span style={{ fontSize: "0.875rem", color: "#93c5fd", fontWeight: 600 }}>Destek Merkezi</span>
                    </div>
                    <h2 style={{
                        fontSize: "clamp(2rem, 5vw, 3rem)",
                        fontWeight: 900,
                        color: "white",
                        marginBottom: "1rem"
                    }}>
                        Merak Edilen <span className="holographic-text">Her Şey</span>
                    </h2>
                    <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "1.1rem" }}>
                        JetPOS hakkında en çok sorulan soruların yanıtları.
                    </p>
                </motion.div>

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {faqs.map((faq, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            style={{
                                background: "rgba(255,255,255,0.03)",
                                border: `1px solid ${openIndex === index ? "rgba(59,130,246,0.3)" : "rgba(255,255,255,0.08)"}`,
                                borderRadius: "1.25rem",
                                overflow: "hidden",
                                transition: "all 0.3s ease"
                            }}
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                style={{
                                    width: "100%",
                                    padding: "1.5rem",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    textAlign: "left"
                                }}
                            >
                                <span style={{
                                    color: openIndex === index ? "#60a5fa" : "white",
                                    fontWeight: 700,
                                    fontSize: "1.1rem",
                                    transition: "color 0.3s"
                                }}>
                                    {faq.question}
                                </span>
                                <div style={{
                                    width: "2rem",
                                    height: "2rem",
                                    borderRadius: "50%",
                                    background: openIndex === index ? "#3b82f6" : "rgba(255,255,255,0.05)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    transition: "all 0.3s"
                                }}>
                                    {openIndex === index ? (
                                        <Minus style={{ width: "1rem", height: "1rem", color: "white" }} />
                                    ) : (
                                        <Plus style={{ width: "1rem", height: "1rem", color: "rgba(255,255,255,0.4)" }} />
                                    )}
                                </div>
                            </button>

                            <AnimatePresence>
                                {openIndex === index && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <div style={{
                                            padding: "0 1.5rem 1.5rem",
                                            color: "rgba(255,255,255,0.5)",
                                            lineHeight: 1.7,
                                            fontSize: "1rem"
                                        }}>
                                            {faq.answer}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    style={{ textAlign: "center", marginTop: "4rem" }}
                >
                    <p style={{ color: "rgba(255,255,255,0.4)" }}>
                        Başka bir sorunuz mu var? <a href="#contact" style={{ color: "#3b82f6", fontWeight: 600, textDecoration: "none" }}>Bize ulaşın</a>
                    </p>
                </motion.div>

            </div>
        </section>
    );
}
