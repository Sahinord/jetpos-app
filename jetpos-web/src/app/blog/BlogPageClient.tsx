"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, ArrowRight, Tag, BookOpen, Search } from "lucide-react";
import Link from "next/link";

const CATEGORY_COLORS: Record<string, string> = {
    "Rehber": "#60a5fa",
    "E-Ticaret & Fatura": "#a78bfa",
    "Stok & Depo": "#34d399",
    "Genel": "#f59e0b",
};

function formatDate(str: string) {
    return new Date(str).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

export default function BlogPageClient({ posts }: { posts: any[] }) {
    const [search, setSearch] = useState("");
    const [activeCategory, setActiveCategory] = useState("Tümü");

    const categories = ["Tümü", ...Array.from(new Set(posts.map((p) => p.category).filter(Boolean)))];

    const filtered = posts.filter((p) => {
        const matchSearch = !search || p.title?.toLowerCase().includes(search.toLowerCase()) || p.excerpt?.toLowerCase().includes(search.toLowerCase());
        const matchCat = activeCategory === "Tümü" || p.category === activeCategory;
        return matchSearch && matchCat;
    });

    const featured = filtered.find((p) => p.featured);
    const rest = filtered.filter((p) => !p.featured || p !== featured);

    return (
        <div style={{ paddingTop: "7rem", paddingBottom: "5rem" }}>
            <div className="site-container">

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: "center", marginBottom: "3.5rem" }}>
                    <span className="badge" style={{ marginBottom: "1.25rem", display: "inline-flex", gap: "0.4rem" }}>
                        <BookOpen style={{ width: "0.875rem", height: "0.875rem" }} />
                        Blog & Rehberler
                    </span>
                    <h1 style={{ fontSize: "clamp(2.25rem, 6vw, 3.75rem)", fontWeight: 800, color: "white", lineHeight: 1.15, marginBottom: "1rem", letterSpacing: "-0.03em" }}>
                        İşletmenizi Büyütün,{" "}
                        <span className="holographic-text">Doğru Bilgiyle</span>
                    </h1>
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "1.05rem", maxWidth: "500px", margin: "0 auto" }}>
                        E-Fatura, stok yönetimi, POS seçimi ve daha fazlası hakkında pratik rehberler.
                    </p>
                </motion.div>

                {/* Search & Filter */}
                <div style={{ display: "flex", gap: "1rem", marginBottom: "2.5rem", flexWrap: "wrap", alignItems: "center" }}>
                    <div style={{ position: "relative", flex: 1, minWidth: "240px" }}>
                        <Search style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", width: "1rem", height: "1rem", color: "rgba(255,255,255,0.3)" }} />
                        <input
                            type="text"
                            placeholder="Yazı ara..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{
                                width: "100%", padding: "0.75rem 1rem 0.75rem 2.5rem",
                                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
                                borderRadius: "0.75rem", color: "white", outline: "none",
                                fontFamily: "inherit", fontSize: "0.9rem",
                            }}
                        />
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                style={{
                                    padding: "0.5rem 1rem", borderRadius: "9999px", border: "1px solid rgba(255,255,255,0.1)",
                                    background: activeCategory === cat ? "rgba(37,99,235,0.2)" : "rgba(255,255,255,0.04)",
                                    color: activeCategory === cat ? "#60a5fa" : "rgba(255,255,255,0.55)",
                                    fontWeight: 600, fontSize: "0.825rem", cursor: "pointer",
                                    fontFamily: "inherit", transition: "all 0.2s",
                                }}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Empty state */}
                {filtered.length === 0 && (
                    <div style={{ textAlign: "center", padding: "5rem 1rem", color: "rgba(255,255,255,0.3)" }}>
                        <BookOpen style={{ width: "3rem", height: "3rem", margin: "0 auto 1rem", display: "block" }} />
                        <p>Yazı bulunamadı.</p>
                    </div>
                )}

                {/* Featured post */}
                {featured && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: "2.5rem" }}>
                        <Link href={`/blog/${featured.slug}`} style={{ textDecoration: "none", display: "block" }}>
                            <div style={{
                                background: "rgba(37,99,235,0.07)", border: "1px solid rgba(37,99,235,0.2)",
                                borderRadius: "1.5rem", padding: "2.5rem",
                                display: "grid", gridTemplateColumns: "1fr auto", gap: "2rem", alignItems: "center",
                                transition: "all 0.3s",
                            }}
                                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(37,99,235,0.4)"; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(37,99,235,0.2)"; }}
                            >
                                <div>
                                    <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                                        <span style={{ fontSize: "0.7rem", fontWeight: 800, background: "rgba(37,99,235,0.2)", color: "#60a5fa", padding: "0.2rem 0.625rem", borderRadius: "9999px" }}>
                                            ⭐ ÖNE ÇIKAN
                                        </span>
                                        {featured.category && (
                                            <span style={{ fontSize: "0.7rem", fontWeight: 700, background: `${CATEGORY_COLORS[featured.category] || "#f59e0b"}15`, color: CATEGORY_COLORS[featured.category] || "#f59e0b", padding: "0.2rem 0.625rem", borderRadius: "9999px" }}>
                                                {featured.category}
                                            </span>
                                        )}
                                    </div>
                                    <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "white", marginBottom: "0.75rem", lineHeight: 1.25, letterSpacing: "-0.02em" }}>
                                        {featured.title}
                                    </h2>
                                    <p style={{ color: "rgba(255,255,255,0.55)", marginBottom: "1.25rem", lineHeight: 1.7 }}>{featured.excerpt}</p>
                                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", color: "rgba(255,255,255,0.35)", fontSize: "0.8rem" }}>
                                        <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}><Clock style={{ width: "0.75rem" }} />{featured.read_time} dk okuma</span>
                                        {featured.created_at && <span>{formatDate(featured.created_at)}</span>}
                                    </div>
                                </div>
                                <div style={{ flexShrink: 0 }}>
                                    <div style={{
                                        width: "3.5rem", height: "3.5rem", borderRadius: "50%",
                                        background: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.3)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                    }}>
                                        <ArrowRight style={{ width: "1.25rem", height: "1.25rem", color: "#60a5fa" }} />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                )}

                {/* Rest of posts */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))", gap: "1.25rem" }}>
                    {rest.map((post, i) => {
                        const color = CATEGORY_COLORS[post.category] || "#f59e0b";
                        return (
                            <motion.div key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                                <Link href={`/blog/${post.slug}`} style={{ textDecoration: "none", display: "block", height: "100%" }}>
                                    <div style={{
                                        background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)",
                                        borderRadius: "1.25rem", padding: "1.75rem",
                                        display: "flex", flexDirection: "column", gap: "1rem", height: "100%",
                                        transition: "all 0.3s",
                                    }}
                                        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = `${color}30`; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)"; }}
                                        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; }}
                                    >
                                        {post.category && (
                                            <span style={{ width: "fit-content", fontSize: "0.68rem", fontWeight: 700, background: `${color}15`, color, padding: "0.2rem 0.625rem", borderRadius: "9999px" }}>
                                                {post.category}
                                            </span>
                                        )}
                                        <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "white", lineHeight: 1.35, margin: 0, flex: 1 }}>
                                            {post.title}
                                        </h3>
                                        <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>
                                            {post.excerpt?.substring(0, 120)}{post.excerpt?.length > 120 ? "..." : ""}
                                        </p>
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "rgba(255,255,255,0.3)", fontSize: "0.75rem" }}>
                                            <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                                                <Clock style={{ width: "0.7rem" }} />{post.read_time} dk
                                            </span>
                                            <span style={{ color, display: "flex", alignItems: "center", gap: "0.3rem", fontWeight: 600 }}>
                                                Oku <ArrowRight style={{ width: "0.75rem" }} />
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
