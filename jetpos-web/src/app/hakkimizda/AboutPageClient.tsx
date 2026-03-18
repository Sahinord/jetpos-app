"use client";

import { motion } from "framer-motion";
import { ArrowRight, MapPin, Calendar } from "lucide-react";
import Link from "next/link";

const FALLBACK = {
    hero: {
        title: "Türk İşletmelerinin Dijital Dönüşüm Ortağı",
        subtitle: "2022 yılında İstanbul'dan başlayan bir yolculuk. Küçük esnaftan büyük zincirlere kadar binlerce işletme JetPOS ile çalışıyor.",
        founded: "2022",
        location: "İstanbul, Türkiye",
    },
    story: {
        title: "Hikayemiz",
        paragraphs: [
            "JetPOS, küçük esnafın karmaşık ve pahalı yazılımlarla boğuştuğunu gören bir ekip tarafından kuruldu.",
            "Bugün Türkiye'nin dört bir yanında 2.400+ işletme JetPOS ile çalışıyor.",
        ],
    },
    values: {
        items: [
            { icon: "🎯", title: "Sadelik", desc: "Karmaşık menüler, gereksiz adımlar yok." },
            { icon: "💡", title: "Yenilik", desc: "Yapay zeka ve bulutla geleceğe hazırlıyoruz." },
            { icon: "🤝", title: "Güven", desc: "Banka düzeyinde güvenlik, şeffaf fiyatlandırma." },
            { icon: "⚡", title: "Hız", desc: "Kurulumdan ilk satışa 30 dakika." },
        ],
    },
    stats: {
        items: [
            { value: "2.400+", label: "Aktif İşletme" },
            { value: "12M+", label: "İşlenen İşlem" },
            { value: "%98", label: "Memnuniyet" },
            { value: "2022", label: "Kuruluş Yılı" },
        ],
    },
    team: {
        title: "Ekibimiz",
        subtitle: "JetPOS'u gerçek işletme sahipleri ve yazılım geliştiricilerden oluşan bir ekip inşa ediyor.",
        members: [
            { name: "Kurucu & CEO", role: "Ürün Vizyonu", initials: "JT" },
            { name: "CTO", role: "Teknoloji & Altyapı", initials: "AT" },
            { name: "Müşteri Başarı", role: "Destek & Onboarding", initials: "MS" },
        ],
    },
};

export default function AboutPageClient({ content }: { content: Record<string, any> | null }) {
    const c = content ?? FALLBACK;
    const hero = c.hero ?? FALLBACK.hero;
    const story = c.story ?? FALLBACK.story;
    const values = c.values ?? FALLBACK.values;
    const stats = c.stats ?? FALLBACK.stats;
    const team = c.team ?? FALLBACK.team;

    return (
        <div style={{ paddingTop: "7rem", paddingBottom: "5rem" }}>
            <div className="site-container">

                {/* Hero */}
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: "center", marginBottom: "5rem", maxWidth: "700px", margin: "0 auto 5rem" }}>
                    <span className="badge" style={{ marginBottom: "1.25rem", display: "inline-flex" }}>Hakkımızda</span>
                    <h1 style={{ fontSize: "clamp(2.25rem, 6vw, 3.75rem)", fontWeight: 800, color: "white", lineHeight: 1.15, marginBottom: "1.25rem", letterSpacing: "-0.03em" }}>
                        <span className="holographic-text">{hero.title}</span>
                    </h1>
                    <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "1.1rem", lineHeight: 1.75, marginBottom: "2rem" }}>
                        {hero.subtitle}
                    </p>
                    <div style={{ display: "flex", gap: "1.5rem", justifyContent: "center", flexWrap: "wrap", color: "rgba(255,255,255,0.4)", fontSize: "0.875rem" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                            <Calendar style={{ width: "0.875rem" }} /> Kuruluş: {hero.founded}
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                            <MapPin style={{ width: "0.875rem" }} /> {hero.location}
                        </span>
                    </div>
                </motion.div>

                {/* Stats */}
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "5rem" }}>
                    {(stats.items || []).map((s: any, i: number) => (
                        <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "1.25rem", padding: "1.75rem", textAlign: "center" }}>
                            <div style={{ fontSize: "2.25rem", fontWeight: 900, color: "white", letterSpacing: "-0.03em", marginBottom: "0.25rem" }}>{s.value}</div>
                            <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>{s.label}</div>
                        </div>
                    ))}
                </motion.div>

                {/* Story */}
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem", alignItems: "center", marginBottom: "5rem" }}
                    className="about-story-grid"
                >
                    <div>
                        <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 800, color: "white", marginBottom: "1.5rem", letterSpacing: "-0.02em" }}>
                            {story.title}
                        </h2>
                        {(story.paragraphs || []).map((p: string, i: number) => (
                            <p key={i} style={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.8, marginBottom: "1rem", fontSize: "1rem" }}>{p}</p>
                        ))}
                    </div>
                    <div style={{ background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.15)", borderRadius: "1.5rem", padding: "2.5rem", position: "relative", overflow: "hidden" }}>
                        <div style={{ position: "absolute", top: "-2rem", right: "-2rem", width: "8rem", height: "8rem", background: "radial-gradient(circle, rgba(37,99,235,0.15), transparent)", borderRadius: "50%" }} />
                        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🚀</div>
                        <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "white", marginBottom: "0.75rem" }}>Misyonumuz</h3>
                        <p style={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.7, fontSize: "0.95rem" }}>
                            Her ölçekten Türk işletmesine, büyük şirketlerle aynı teknolojik avantajları sağlamak.
                        </p>
                    </div>
                </motion.div>

                {/* Values */}
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ marginBottom: "5rem" }}>
                    <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 800, color: "white", textAlign: "center", marginBottom: "2.5rem", letterSpacing: "-0.02em" }}>
                        Değerlerimiz
                    </h2>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
                        {(values.items || []).map((v: any, i: number) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                                style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "1.25rem", padding: "1.75rem" }}>
                                <div style={{ fontSize: "2rem", marginBottom: "0.875rem" }}>{v.icon}</div>
                                <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "white", marginBottom: "0.5rem" }}>{v.title}</h3>
                                <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>{v.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Team */}
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ marginBottom: "5rem" }}>
                    <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 800, color: "white", textAlign: "center", marginBottom: "0.75rem" }}>
                        {team.title}
                    </h2>
                    <p style={{ color: "rgba(255,255,255,0.45)", textAlign: "center", marginBottom: "2.5rem" }}>{team.subtitle}</p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem", maxWidth: "700px", margin: "0 auto" }}>
                        {(team.members || []).map((m: any, i: number) => (
                            <div key={i} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "1.25rem", padding: "1.75rem", textAlign: "center" }}>
                                <div style={{
                                    width: "3.5rem", height: "3.5rem", borderRadius: "50%",
                                    background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontWeight: 800, fontSize: "1rem", color: "white",
                                    margin: "0 auto 1rem"
                                }}>
                                    {m.initials}
                                </div>
                                <p style={{ fontWeight: 800, color: "white", marginBottom: "0.25rem" }}>{m.name}</p>
                                <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)" }}>{m.role}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* CTA */}
                <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                    style={{ background: "rgba(37,99,235,0.07)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: "1.5rem", padding: "3rem 2rem", textAlign: "center" }}>
                    <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "white", marginBottom: "0.75rem" }}>
                        JetPOS Ailesine Katılın
                    </h2>
                    <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "2rem", maxWidth: "400px", margin: "0 auto 2rem" }}>
                        14 gün ücretsiz deneyin, kredi kartı gerekmez.
                    </p>
                    <Link href="/demo" className="btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
                        Ücretsiz Demo Talep Et <ArrowRight style={{ width: "1rem" }} />
                    </Link>
                </motion.div>
            </div>

            <style>{`
                @media (max-width: 768px) {
                    .about-story-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </div>
    );
}
