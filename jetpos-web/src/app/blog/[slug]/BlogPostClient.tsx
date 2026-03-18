"use client";

import { motion } from "framer-motion";
import { Clock, ArrowLeft, Tag, Calendar, User } from "lucide-react";
import Link from "next/link";

function formatDate(str: string) {
    return new Date(str).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

// Very basic markdown renderer (bold, headers, lists)
function renderMarkdown(text: string) {
    if (!text) return null;
    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];
    let listItems: string[] = [];

    const flushList = () => {
        if (listItems.length > 0) {
            elements.push(
                <ul key={elements.length} style={{ color: "rgba(255,255,255,0.7)", paddingLeft: "1.5rem", lineHeight: 1.8, marginBottom: "1rem" }}>
                    {listItems.map((li, i) => <li key={i}>{li}</li>)}
                </ul>
            );
            listItems = [];
        }
    };

    lines.forEach((line, i) => {
        if (line.startsWith("## ")) {
            flushList();
            elements.push(<h2 key={i} style={{ fontSize: "1.4rem", fontWeight: 800, color: "white", marginTop: "2rem", marginBottom: "0.75rem" }}>{line.slice(3)}</h2>);
        } else if (line.startsWith("### ")) {
            flushList();
            elements.push(<h3 key={i} style={{ fontSize: "1.1rem", fontWeight: 700, color: "rgba(255,255,255,0.9)", marginTop: "1.5rem", marginBottom: "0.5rem" }}>{line.slice(4)}</h3>);
        } else if (line.startsWith("- ")) {
            listItems.push(line.slice(2));
        } else if (/^\d+\. /.test(line)) {
            listItems.push(line.replace(/^\d+\. /, ""));
        } else if (line.trim() === "") {
            flushList();
            elements.push(<br key={i} />);
        } else {
            flushList();
            // Bold
            const parts = line.split(/\*\*(.*?)\*\*/g);
            elements.push(
                <p key={i} style={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.8, marginBottom: "0.5rem" }}>
                    {parts.map((p, j) => j % 2 === 1 ? <strong key={j} style={{ color: "white" }}>{p}</strong> : p)}
                </p>
            );
        }
    });
    flushList();
    return elements;
}

export default function BlogPostClient({ post }: { post: any }) {
    const color = "#60a5fa";

    return (
        <div style={{ paddingTop: "7rem", paddingBottom: "5rem" }}>
            <div className="site-container" style={{ maxWidth: "780px" }}>

                {/* Back */}
                <Link href="/blog" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", color: "rgba(255,255,255,0.4)", textDecoration: "none", fontSize: "0.875rem", marginBottom: "2rem", transition: "color 0.2s" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "white")}
                    onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
                >
                    <ArrowLeft style={{ width: "0.875rem" }} /> Blog&apos;a Dön
                </Link>

                <motion.article initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    {/* Meta */}
                    <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
                        {post.category && (
                            <span style={{ fontSize: "0.7rem", fontWeight: 700, background: "rgba(96,165,250,0.15)", color: "#60a5fa", padding: "0.2rem 0.625rem", borderRadius: "9999px" }}>
                                {post.category}
                            </span>
                        )}
                        {(post.tags || []).map((tag: string, i: number) => (
                            <span key={i} style={{ fontSize: "0.7rem", fontWeight: 600, background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)", padding: "0.2rem 0.625rem", borderRadius: "9999px", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                                <Tag style={{ width: "0.5rem" }} />{tag}
                            </span>
                        ))}
                    </div>

                    {/* Title */}
                    <h1 style={{ fontSize: "clamp(1.75rem, 5vw, 2.75rem)", fontWeight: 900, color: "white", lineHeight: 1.2, marginBottom: "1.25rem", letterSpacing: "-0.03em" }}>
                        {post.title}
                    </h1>

                    {/* Author & Date */}
                    <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", color: "rgba(255,255,255,0.35)", fontSize: "0.8rem", marginBottom: "2.5rem", flexWrap: "wrap" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                            <User style={{ width: "0.75rem" }} />{post.author || "JetPOS Ekibi"}
                        </span>
                        {post.created_at && (
                            <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                                <Calendar style={{ width: "0.75rem" }} />{formatDate(post.created_at)}
                            </span>
                        )}
                        <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                            <Clock style={{ width: "0.75rem" }} />{post.read_time || 5} dk okuma
                        </span>
                    </div>

                    {/* Divider */}
                    <div style={{ height: "1px", background: "rgba(255,255,255,0.07)", marginBottom: "2.5rem" }} />

                    {/* Excerpt */}
                    {post.excerpt && (
                        <p style={{ fontSize: "1.125rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.75, marginBottom: "2rem", fontStyle: "italic", background: "rgba(37,99,235,0.05)", border: "1px solid rgba(37,99,235,0.15)", borderRadius: "0.75rem", padding: "1rem 1.25rem" }}>
                            {post.excerpt}
                        </p>
                    )}

                    {/* Content */}
                    <div style={{ fontSize: "1rem" }}>
                        {renderMarkdown(post.content || "")}
                    </div>

                    {/* CTA */}
                    <div style={{ marginTop: "3rem", padding: "2rem", background: "rgba(37,99,235,0.07)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: "1.25rem", textAlign: "center" }}>
                        <p style={{ color: "rgba(255,255,255,0.7)", marginBottom: "1rem", fontWeight: 600 }}>
                            JetPOS&apos;u 14 gün ücretsiz deneyin
                        </p>
                        <Link href="/demo" className="btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", textDecoration: "none", padding: "0.75rem 1.75rem", fontSize: "0.9rem" }}>
                            Ücretsiz Demo Talep Et →
                        </Link>
                    </div>
                </motion.article>
            </div>
        </div>
    );
}
