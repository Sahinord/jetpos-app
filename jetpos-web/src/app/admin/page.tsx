"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Lock, LogOut, Users, Clock, CheckCircle2, PhoneCall,
    Search, Filter, Mail, Phone, Building2, Briefcase,
    RefreshCw, Sparkles, TrendingUp, AlertCircle, Eye
} from "lucide-react";

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "jetpos2025";

type DemoRequest = {
    id: string;
    name: string;
    email: string;
    phone: string;
    company: string;
    sector: string;
    employee_count: string;
    current_system: string;
    package_interest: string;
    message: string;
    status: "new" | "calling" | "done" | "not_interested";
    created_at: string;
};

const STATUS_CONFIG = {
    new: { label: "Yeni", color: "#3b82f6", bg: "rgba(59,130,246,0.15)", icon: AlertCircle },
    calling: { label: "Aranıyor", color: "#f59e0b", bg: "rgba(245,158,11,0.15)", icon: PhoneCall },
    done: { label: "Tamamlandı", color: "#22c55e", bg: "rgba(34,197,94,0.15)", icon: CheckCircle2 },
    not_interested: { label: "İlgilenmedi", color: "#6b7280", bg: "rgba(107,114,128,0.15)", icon: AlertCircle },
};


function timeAgo(dateStr: string) {
    const now = Date.now();
    const diff = now - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Az önce";
    if (mins < 60) return `${mins} dk önce`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} saat önce`;
    return `${Math.floor(hours / 24)} gün önce`;
}

export default function AdminPage() {
    const [authed, setAuthed] = useState(false);
    const [password, setPassword] = useState("");
    const [passwordError, setPasswordError] = useState(false);
    const [requests, setRequests] = useState<DemoRequest[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [selectedRequest, setSelectedRequest] = useState<DemoRequest | null>(null);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    useEffect(() => {
        const saved = sessionStorage.getItem("jetpos_admin_auth");
        if (saved === "true") {
            setAuthed(true);
            loadRequests();
        }
    }, []);

    const loadRequests = async () => {
        setLoading(true);
        try {
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const serviceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

            if (!supabaseUrl || !serviceKey) {
                console.error("Supabase env vars missing!");
                setLoading(false);
                return;
            }

            const res = await fetch(
                `${supabaseUrl}/rest/v1/demo_requests?select=*&order=created_at.desc`,
                {
                    headers: {
                        apikey: serviceKey,
                        Authorization: `Bearer ${serviceKey}`,
                    },
                }
            );

            if (res.ok) {
                const data = await res.json();
                setRequests(data);
            } else {
                const err = await res.json();
                console.error("Fetch error:", err);
            }
        } catch (e) {
            console.error("Load error:", e);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id: string, status: DemoRequest["status"]) => {
        setUpdatingId(id);
        try {
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const serviceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

            if (supabaseUrl && serviceKey) {
                const res = await fetch(`${supabaseUrl}/rest/v1/demo_requests?id=eq.${id}`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        apikey: serviceKey,
                        Authorization: `Bearer ${serviceKey}`,
                        Prefer: "return=representation",
                    },
                    body: JSON.stringify({ status }),
                });
                if (!res.ok) {
                    console.error("Update failed:", await res.json());
                }
            }

            // Update locally regardless
            setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
            if (selectedRequest?.id === id) {
                setSelectedRequest(prev => prev ? { ...prev, status } : null);
            }
        } finally {
            setUpdatingId(null);
        }
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === ADMIN_PASSWORD) {
            setAuthed(true);
            sessionStorage.setItem("jetpos_admin_auth", "true");
            loadRequests();
        } else {
            setPasswordError(true);
            setTimeout(() => setPasswordError(false), 2000);
        }
    };

    const handleLogout = () => {
        setAuthed(false);
        sessionStorage.removeItem("jetpos_admin_auth");
        setRequests([]);
    };

    const filtered = requests.filter(r => {
        const matchSearch = !search || [r.name, r.email, r.phone, r.company].some(v =>
            v?.toLowerCase().includes(search.toLowerCase())
        );
        const matchStatus = filterStatus === "all" || r.status === filterStatus;
        return matchSearch && matchStatus;
    });

    const stats = {
        total: requests.length,
        new: requests.filter(r => r.status === "new").length,
        calling: requests.filter(r => r.status === "calling").length,
        done: requests.filter(r => r.status === "done").length,
    };

    // Login screen
    if (!authed) {
        return (
            <div style={{
                minHeight: "100vh", background: "#060914",
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "1rem"
            }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ width: "100%", maxWidth: "380px" }}
                >
                    {/* Logo */}
                    <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                        <div style={{
                            width: "3.5rem", height: "3.5rem", borderRadius: "1rem",
                            background: "linear-gradient(135deg, #2563eb, #3b82f6)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            margin: "0 auto 1rem",
                            boxShadow: "0 0 30px rgba(37,99,235,0.4)"
                        }}>
                            <Sparkles style={{ width: "1.5rem", height: "1.5rem", color: "white" }} />
                        </div>
                        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "white", margin: 0 }}>JetPOS Admin</h1>
                        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
                            Demo talep yönetim paneli
                        </p>
                    </div>

                    <motion.div
                        animate={passwordError ? { x: [-8, 8, -8, 8, 0] } : { x: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{
                            background: "rgba(255,255,255,0.03)",
                            border: `1px solid ${passwordError ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.08)"}`,
                            borderRadius: "1.25rem", padding: "2rem",
                            transition: "border-color 0.2s"
                        }}
                    >
                        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                            <div>
                                <label style={{ display: "block", color: "rgba(255,255,255,0.6)", fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.5rem" }}>
                                    Şifre
                                </label>
                                <div style={{ position: "relative" }}>
                                    <Lock style={{
                                        position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)",
                                        width: "1rem", height: "1rem", color: "rgba(255,255,255,0.3)"
                                    }} />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="Admin şifresi"
                                        style={{
                                            width: "100%", padding: "0.875rem 1rem 0.875rem 2.75rem",
                                            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                                            borderRadius: "0.75rem", color: "white", fontSize: "0.95rem",
                                            outline: "none", fontFamily: "inherit", boxSizing: "border-box"
                                        }}
                                        autoFocus
                                    />
                                </div>
                                {passwordError && (
                                    <p style={{ color: "#f87171", fontSize: "0.8rem", marginTop: "0.5rem" }}>Hatalı şifre!</p>
                                )}
                            </div>
                            <button type="submit" style={{
                                padding: "0.875rem", borderRadius: "0.75rem", border: "none",
                                background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                                color: "white", fontWeight: 700, fontSize: "1rem",
                                cursor: "pointer", fontFamily: "inherit",
                                boxShadow: "0 4px 16px rgba(37,99,235,0.4)"
                            }}>
                                Giriş Yap
                            </button>
                        </form>
                    </motion.div>
                </motion.div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: "100vh", background: "#060914", color: "white" }}>
            {/* Top Bar */}
            <div style={{
                background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.07)",
                padding: "1rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between",
                position: "sticky", top: 0, zIndex: 20, backdropFilter: "blur(16px)"
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{
                        width: "2rem", height: "2rem", borderRadius: "0.5rem",
                        background: "linear-gradient(135deg, #2563eb, #3b82f6)",
                        display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                        <Sparkles style={{ width: "1rem", height: "1rem", color: "white" }} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: "1rem", fontWeight: 800, color: "white", margin: 0 }}>JetPOS Admin</h1>
                        <p style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)", margin: 0 }}>Demo Talep Yönetimi</p>
                    </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <button
                        onClick={loadRequests}
                        style={{
                            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: "0.625rem", padding: "0.5rem 1rem",
                            color: "rgba(255,255,255,0.7)", cursor: "pointer", fontFamily: "inherit",
                            display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem"
                        }}
                    >
                        <RefreshCw style={{ width: "0.875rem", height: "0.875rem" }} />
                        Yenile
                    </button>
                    <button
                        onClick={handleLogout}
                        style={{
                            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
                            borderRadius: "0.625rem", padding: "0.5rem 1rem",
                            color: "#fca5a5", cursor: "pointer", fontFamily: "inherit",
                            display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem"
                        }}
                    >
                        <LogOut style={{ width: "0.875rem", height: "0.875rem" }} />
                        Çıkış
                    </button>
                </div>
            </div>

            <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
                {/* Stats */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
                    {[
                        { label: "Toplam Talep", value: stats.total, icon: Users, color: "#60a5fa" },
                        { label: "Yeni", value: stats.new, icon: AlertCircle, color: "#3b82f6" },
                        { label: "Aranıyor", value: stats.calling, icon: PhoneCall, color: "#f59e0b" },
                        { label: "Tamamlandı", value: stats.done, icon: CheckCircle2, color: "#22c55e" },
                    ].map(({ label, value, icon: Icon, color }, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            style={{
                                background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)",
                                borderRadius: "1rem", padding: "1.25rem",
                                display: "flex", alignItems: "center", gap: "1rem"
                            }}
                        >
                            <div style={{
                                width: "2.5rem", height: "2.5rem", borderRadius: "0.75rem",
                                background: `${color}15`, border: `1px solid ${color}30`,
                                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                            }}>
                                <Icon style={{ width: "1.25rem", height: "1.25rem", color }} />
                            </div>
                            <div>
                                <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "white", lineHeight: 1 }}>{value}</div>
                                <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", marginTop: "0.15rem" }}>{label}</div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Filters */}
                <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
                    <div style={{ position: "relative", flex: 1, minWidth: "220px" }}>
                        <Search style={{
                            position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)",
                            width: "1rem", height: "1rem", color: "rgba(255,255,255,0.3)"
                        }} />
                        <input
                            type="text"
                            placeholder="Ad, e-posta, telefon veya firma ara..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{
                                width: "100%", padding: "0.75rem 1rem 0.75rem 2.75rem",
                                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
                                borderRadius: "0.75rem", color: "white", fontSize: "0.875rem",
                                outline: "none", fontFamily: "inherit", boxSizing: "border-box"
                            }}
                        />
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                        {[
                            { key: "all", label: "Tümü" },
                            { key: "new", label: "Yeni" },
                            { key: "calling", label: "Aranıyor" },
                            { key: "done", label: "Bitti" },
                        ].map(({ key, label }) => (
                            <button
                                key={key}
                                onClick={() => setFilterStatus(key)}
                                style={{
                                    padding: "0.625rem 1rem", borderRadius: "0.75rem",
                                    border: `1px solid ${filterStatus === key ? "rgba(59,130,246,0.4)" : "rgba(255,255,255,0.08)"}`,
                                    background: filterStatus === key ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.03)",
                                    color: filterStatus === key ? "#93c5fd" : "rgba(255,255,255,0.5)",
                                    cursor: "pointer", fontFamily: "inherit", fontSize: "0.85rem", fontWeight: 600,
                                    transition: "all 0.15s"
                                }}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Layout: List + Detail */}
                <div style={{ display: "grid", gridTemplateColumns: selectedRequest ? "1fr 380px" : "1fr", gap: "1rem" }}>
                    {/* List */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {loading ? (
                            <div style={{ textAlign: "center", padding: "3rem", color: "rgba(255,255,255,0.3)" }}>
                                <RefreshCw style={{ width: "1.5rem", height: "1.5rem", margin: "0 auto 0.5rem", display: "block", animation: "spin 1s linear infinite" }} />
                                Yükleniyor...
                            </div>
                        ) : filtered.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "3rem", color: "rgba(255,255,255,0.3)" }}>
                                <Users style={{ width: "2rem", height: "2rem", margin: "0 auto 0.5rem", display: "block" }} />
                                Talep bulunamadı
                            </div>
                        ) : filtered.map((req, i) => {
                            const statusCfg = STATUS_CONFIG[req.status];
                            const isSelected = selectedRequest?.id === req.id;
                            return (
                                <motion.div
                                    key={req.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.03 }}
                                    onClick={() => setSelectedRequest(isSelected ? null : req)}
                                    style={{
                                        background: isSelected ? "rgba(59,130,246,0.08)" : "rgba(255,255,255,0.025)",
                                        border: `1px solid ${isSelected ? "rgba(59,130,246,0.3)" : "rgba(255,255,255,0.07)"}`,
                                        borderRadius: "1rem", padding: "1.25rem",
                                        cursor: "pointer", transition: "all 0.15s",
                                        display: "flex", alignItems: "center", gap: "1rem"
                                    }}
                                    onMouseEnter={e => {
                                        if (!isSelected) (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.12)";
                                    }}
                                    onMouseLeave={e => {
                                        if (!isSelected) (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.07)";
                                    }}
                                >
                                    {/* Avatar */}
                                    <div style={{
                                        width: "2.75rem", height: "2.75rem", borderRadius: "0.875rem",
                                        background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        flexShrink: 0, fontSize: "1rem", fontWeight: 800, color: "white"
                                    }}>
                                        {req.name.charAt(0)}
                                    </div>

                                    {/* Info */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                                            <span style={{ fontWeight: 700, color: "white", fontSize: "0.95rem" }}>{req.name}</span>
                                            <span style={{
                                                fontSize: "0.7rem", fontWeight: 700, padding: "0.15rem 0.5rem",
                                                borderRadius: "4px", background: statusCfg.bg, color: statusCfg.color
                                            }}>{statusCfg.label}</span>
                                        </div>
                                        <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                                            <span>{req.company}</span>
                                            <span>{req.sector}</span>
                                            {req.package_interest && <span style={{ color: "#4ade80" }}>{req.package_interest}</span>}
                                        </div>
                                    </div>

                                    {/* Right side */}
                                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                                        <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)", marginBottom: "0.5rem" }}>
                                            <Clock style={{ display: "inline", width: "0.75rem", height: "0.75rem", verticalAlign: "middle", marginRight: "0.2rem" }} />
                                            {timeAgo(req.created_at)}
                                        </div>
                                        <div style={{ display: "flex", gap: "0.375rem", justifyContent: "flex-end" }}>
                                            <a href={`tel:${req.phone}`} onClick={e => e.stopPropagation()}
                                                style={{
                                                    width: "1.75rem", height: "1.75rem", borderRadius: "0.5rem",
                                                    background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.25)",
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    color: "#4ade80"
                                                }}>
                                                <Phone style={{ width: "0.75rem", height: "0.75rem" }} />
                                            </a>
                                            <a href={`mailto:${req.email}`} onClick={e => e.stopPropagation()}
                                                style={{
                                                    width: "1.75rem", height: "1.75rem", borderRadius: "0.5rem",
                                                    background: "rgba(96,165,250,0.15)", border: "1px solid rgba(96,165,250,0.25)",
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    color: "#60a5fa"
                                                }}>
                                                <Mail style={{ width: "0.75rem", height: "0.75rem" }} />
                                            </a>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Detail Panel */}
                    <AnimatePresence>
                        {selectedRequest && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.2 }}
                                style={{
                                    background: "rgba(255,255,255,0.025)",
                                    border: "1px solid rgba(255,255,255,0.08)",
                                    borderRadius: "1.25rem", padding: "1.75rem",
                                    height: "fit-content", position: "sticky", top: "5rem"
                                }}
                            >
                                {/* Header */}
                                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
                                        <div style={{
                                            width: "3rem", height: "3rem", borderRadius: "0.875rem",
                                            background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            fontSize: "1.25rem", fontWeight: 800, color: "white"
                                        }}>
                                            {selectedRequest.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 800, color: "white", fontSize: "1rem" }}>{selectedRequest.name}</div>
                                            <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)" }}>{selectedRequest.company}</div>
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedRequest(null)}
                                        style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: "1.25rem", lineHeight: 1 }}>
                                        ×
                                    </button>
                                </div>

                                {/* Contact */}
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
                                    {[
                                        { icon: Phone, label: selectedRequest.phone, href: `tel:${selectedRequest.phone}`, color: "#4ade80" },
                                        { icon: Mail, label: selectedRequest.email, href: `mailto:${selectedRequest.email}`, color: "#60a5fa" },
                                    ].map(({ icon: Icon, label, href, color }, i) => (
                                        <a key={i} href={href} style={{
                                            display: "flex", alignItems: "center", gap: "0.625rem",
                                            padding: "0.75rem", borderRadius: "0.75rem",
                                            background: `${color}10`, border: `1px solid ${color}25`,
                                            textDecoration: "none", color: "white"
                                        }}>
                                            <Icon style={{ width: "1rem", height: "1rem", color }} />
                                            <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>{label}</span>
                                        </a>
                                    ))}
                                </div>

                                {/* Details */}
                                <div style={{
                                    background: "rgba(255,255,255,0.03)", borderRadius: "0.875rem",
                                    padding: "1rem", marginBottom: "1.5rem",
                                    display: "flex", flexDirection: "column", gap: "0.625rem"
                                }}>
                                    {[
                                        ["Sektör", selectedRequest.sector],
                                        ["Çalışan", selectedRequest.employee_count],
                                        ["Mevcut Sistem", selectedRequest.current_system || "-"],
                                        ["İlgilendiği Paket", selectedRequest.package_interest || "-"],
                                        ["Tarih", timeAgo(selectedRequest.created_at)],
                                    ].map(([k, v]) => (
                                        <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
                                            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem" }}>{k}</span>
                                            <span style={{ color: "white", fontSize: "0.8rem", fontWeight: 600, textAlign: "right" }}>{v}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Message */}
                                {selectedRequest.message && (
                                    <div style={{
                                        background: "rgba(255,255,255,0.03)", borderRadius: "0.875rem",
                                        padding: "1rem", marginBottom: "1.5rem"
                                    }}>
                                        <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>
                                            Not
                                        </p>
                                        <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.75)", lineHeight: 1.6, margin: 0 }}>
                                            {selectedRequest.message}
                                        </p>
                                    </div>
                                )}

                                {/* Status Actions */}
                                <div>
                                    <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem" }}>
                                        Durumu Güncelle
                                    </p>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                        {(Object.entries(STATUS_CONFIG) as [DemoRequest["status"], typeof STATUS_CONFIG["new"]][]).map(([key, cfg]) => {
                                            const Icon = cfg.icon;
                                            const isActive = selectedRequest.status === key;
                                            return (
                                                <button
                                                    key={key}
                                                    disabled={isActive || updatingId === selectedRequest.id}
                                                    onClick={() => updateStatus(selectedRequest.id, key)}
                                                    style={{
                                                        padding: "0.75rem 1rem", borderRadius: "0.75rem",
                                                        border: `1px solid ${isActive ? cfg.color + "40" : "rgba(255,255,255,0.08)"}`,
                                                        background: isActive ? cfg.bg : "rgba(255,255,255,0.02)",
                                                        color: isActive ? cfg.color : "rgba(255,255,255,0.5)",
                                                        cursor: isActive ? "default" : "pointer",
                                                        fontFamily: "inherit", fontWeight: 600, fontSize: "0.85rem",
                                                        display: "flex", alignItems: "center", gap: "0.5rem",
                                                        transition: "all 0.15s"
                                                    }}
                                                >
                                                    <Icon style={{ width: "0.875rem", height: "0.875rem" }} />
                                                    {cfg.label}
                                                    {isActive && <span style={{ marginLeft: "auto", fontSize: "0.7rem" }}>✓ Aktif</span>}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
