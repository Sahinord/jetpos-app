"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Download, Clock, BookOpen, LogOut, Sparkles,
    Calendar, CheckCircle2, AlertTriangle, ExternalLink,
    ChevronRight, Play, LayoutDashboard, MessageSquare,
    Bell, TrendingUp, ShoppingBag, CreditCard, Video,
    Github, Settings, HelpCircle, ArrowUpRight, Zap,
    Layers, User, Globe, Briefcase, BarChart3, PieChart,
    Smartphone, Monitor, Tablet, Trash2, Printer, DownloadCloud,
    Camera, Palette, ShieldCheck, Mail, Lock, Plus, Info,
    X, Check, Search, Filter, History, Eye, Menu
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

function hexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : "59, 130, 246";
}


// --- TYPES ---
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
    features?: Record<string, boolean>;
    custom_logo_url?: string;
    branding_config?: { primary_color?: string; hide_jetpos_badge?: boolean };
};

type Guide = { id: string; title: string; content: string; };
type Announcement = { id: string; title: string; message: string; type: string; created_at: string; };
type SupportTicket = { id: string; subject: string; message: string; status: string; created_at: string; };
type Device = { id: string; device_name: string; device_type: string; last_active: string; is_online: boolean; device_id: string; };
type Invoice = { id: string; invoice_no: string; amount: number; status: string; invoice_date: string; pdf_url: string; };

export default function PortalPage() {
    // --- STATE ---
    const [license, setLicense] = useState<License | null>(null);
    const [guides, setGuides] = useState<Guide[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [devices, setDevices] = useState<Device[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [salesSummary, setSalesSummary] = useState({ total_sales: 0, count: 0, growth: 12 });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("dashboard");
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    // --- UI STATE ---
    const [showTicketModal, setShowTicketModal] = useState(false);
    const [ticketSubject, setTicketSubject] = useState("");
    const [ticketMessage, setTicketMessage] = useState("");
    const [savingTicket, setSavingTicket] = useState(false);
    const [notifCount, setNotifCount] = useState(0);
    const [recentSales, setRecentSales] = useState<any[]>([]);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);


    const router = useRouter();

    // --- INITIAL LOAD ---
    useEffect(() => {
        const auth = sessionStorage.getItem("jetpos_customer_auth");
        if (!auth) {
            router.push("/portal/login");
            return;
        }
        
        const initialData = JSON.parse(auth);
        setLicense(initialData);
        
        loadInitialData(initialData.id);
        setupRealtime(initialData.id);
        setLoading(false);
    }, []);

    const loadInitialData = async (tenantId: string) => {
        refreshLicense(tenantId);
        loadGuides();
        loadAnnouncements();
        loadTickets(tenantId);
        loadDevices(tenantId);
        loadInvoices(tenantId);
        fetchSalesSummary(tenantId);
    };

    const setupRealtime = (tenantId: string) => {
        const channel = supabase.channel(`portal_realtime_${tenantId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tenants', filter: `id=eq.${tenantId}` }, () => { refreshLicense(tenantId); })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `tenant_id=is.null` }, () => { loadAnnouncements(); })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets', filter: `tenant_id=eq.${tenantId}` }, () => { loadTickets(tenantId); })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tenant_devices', filter: `tenant_id=eq.${tenantId}` }, () => { loadDevices(tenantId); })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tenant_invoices', filter: `tenant_id=eq.${tenantId}` }, () => { loadInvoices(tenantId); })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sales', filter: `tenant_id=eq.${tenantId}` }, () => { fetchSalesSummary(tenantId); })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    };

    // --- DATA FETCHERS ---
    const refreshLicense = async (tenantId: string) => {
        const { data } = await supabase.from("tenants").select("*").eq("id", tenantId).single();
        if (data) {
            setLicense({ ...data, client_name: data.company_name, user_email: data.contact_email });
        }
    };

    const loadGuides = async () => {
        const { data } = await supabase.from("customer_guides").select("*").eq("is_active", true).order("order_index");
        if (data) setGuides(data);
    };

    const loadAnnouncements = async () => {
        const { data } = await supabase.from("notifications").select("*").is("tenant_id", null).order("created_at", { ascending: false });
        if (data) {
            setAnnouncements(data);
            setNotifCount(data.length);
        }
    };

    const loadTickets = async (tenantId: string) => {
        const { data } = await supabase.from("support_tickets").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false });
        if (data) setTickets(data);
    };

    const loadDevices = async (tenantId: string) => {
        const { data } = await supabase.from("tenant_devices").select("*").eq("tenant_id", tenantId);
        if (data) setDevices(data);
    };

    const loadInvoices = async (tenantId: string) => {
        const { data } = await supabase.from("tenant_invoices").select("*").eq("tenant_id", tenantId);
        if (data) setInvoices(data);
    };

    const fetchSalesSummary = async (tenantId: string) => {
        const { data } = await supabase.from("sales").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false });
        if (data) {
            const total = data.reduce((sum, s) => sum + (s.total_amount || 0), 0);
            setSalesSummary({ total_sales: total, count: data.length, growth: 12.5 });
            setRecentSales(data.slice(0, 5));
        }
    };

    const handleCreateTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ticketSubject || !ticketMessage || !license) return;
        setSavingTicket(true);
        try {
            const { error } = await supabase.from("support_tickets").insert({
                tenant_id: license.id, subject: ticketSubject, message: ticketMessage, status: 'open'
            });
            if (!error) {
                setTicketSubject(""); setTicketMessage(""); setShowTicketModal(false);
            }
        } finally { setSavingTicket(false); }
    };

    const handleLogout = () => {
        sessionStorage.removeItem("jetpos_customer_auth");
        router.push("/portal/login");
    };

    // --- RENDER HELPERS ---
    if (loading || !license) return (
        <div style={{ height: "100vh", background: "#060914", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} style={{ width: "30px", height: "30px", border: "2px solid #3b82f6", borderTopColor: "transparent", borderRadius: "50%" }} />
        </div>
    );

    const daysRemaining = license.expires_at
        ? Math.max(0, Math.ceil((new Date(license.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : license.total_days;

    const progress = Math.min(100, (daysRemaining / 365) * 100);

    const menuItems = [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        { id: "devices", label: "Cihaz Yönetimi", icon: Smartphone },
        { id: "billing", label: "Ödeme & Faturalar", icon: CreditCard },
        { id: "guides", label: "Rehberler", icon: BookOpen },
        { id: "support", label: "Destek", icon: MessageSquare },
        { id: "training", label: "Eğitimler", icon: Video },
        { id: "settings", label: "Ayarlar", icon: Settings },
    ];

    const isEnterprise = license.plan_type === "ENTERPRISE";

    const sidebarContent = (
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <div style={{ padding: "2.5rem 2rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                {isEnterprise && license.custom_logo_url ? (
                    <img src={license.custom_logo_url} style={{ height: "2.5rem", width: "auto" }} alt="Logo" />
                ) : (
                    <div style={{ 
                        width: "2.5rem", height: "2.5rem", borderRadius: "10px",
                        background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                        display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                        <Sparkles style={{ width: "1.2rem", color: "white" }} />
                    </div>
                )}
                <div style={{ overflow: "hidden" }}>
                    <h1 style={{ fontSize: "1rem", fontWeight: 900, margin: 0, letterSpacing: "-0.5px", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{isEnterprise ? license.client_name : "JetPOS Portal"}</h1>
                    <span style={{ fontSize: "0.6rem", color: "#3b82f6", fontWeight: 800, textTransform: "uppercase" }}>{license.plan_type} PANEL</span>
                </div>
            </div>

            <nav style={{ flex: 1, padding: "0 1rem" }}>
                {menuItems.map((item) => (
                    <button key={item.id} onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                        style={{
                            width: "100%", display: "flex", alignItems: "center", gap: "0.8rem",
                            padding: "0.9rem 1.2rem", borderRadius: "12px", border: "none",
                            background: activeTab === item.id ? "rgba(37,99,235,0.1)" : "transparent",
                            color: activeTab === item.id ? "#3b82f6" : "rgba(255,255,255,0.4)",
                            fontSize: "0.875rem", fontWeight: activeTab === item.id ? 800 : 600, 
                            cursor: "pointer", transition: "all 0.2s", textAlign: "left", marginBottom: "4px"
                        }}
                    >
                        <item.icon style={{ width: "1.1rem" }} />
                        {item.label}
                    </button>
                ))}
            </nav>

            <div style={{ padding: "1.5rem", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                    <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "50%", background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <User style={{ width: "1rem", color: "white" }} />
                    </div>
                    <div style={{ minWidth: 0, overflow: "hidden" }}>
                        <div style={{ fontSize: "0.85rem", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{license.client_name}</div>
                        <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)" }}>Müşteri Hesabı</div>
                    </div>
                </div>
                <button onClick={handleLogout} style={{
                    width: "100%", padding: "0.7rem", borderRadius: "10px",
                    background: "rgba(239,68,68,0.1)", border: "none", color: "#ef4444",
                    fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem"
                }}>
                    <LogOut style={{ width: "0.9rem" }} /> Çıkış Yap
                </button>
            </div>
        </div>
    );

    return (
        <div style={{ minHeight: "100vh", background: "#060914", color: "white", display: "flex", flexDirection: "column", fontFamily: "'Inter', sans-serif" }}>
            
            {/* --- RESPONSIVE SIDEBAR --- */}
            <aside className="desktop-sidebar" style={{ 
                width: "280px", background: "rgba(11,14,26,0.9)", borderRight: "1px solid rgba(255,255,255,0.06)",
                position: "fixed", height: "100vh", zIndex: 100, backdropFilter: "blur(40px)"
            }}>
                {sidebarContent}
            </aside>

            {/* --- MOBILE HEADER --- */}
            <header className="mobile-header" style={{
                position: "sticky", top: 0, zIndex: 90, background: "rgba(11,14,26,0.8)",
                backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)",
                padding: "1rem 1.5rem", display: "none", justifyContent: "space-between", alignItems: "center"
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{ width: "2rem", height: "2rem", borderRadius: "8px", background: "linear-gradient(135deg, #2563eb, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Sparkles style={{ width: "1rem", color: "white" }} />
                    </div>
                    <span style={{ fontWeight: 800 }}>JetPOS</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(true)} style={{ background: "none", border: "none", color: "white", cursor: "pointer" }}><Menu /></button>
            </header>

            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                        style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(5px)" }}
                    >
                        <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 25 }}
                            style={{ width: "80%", maxWidth: "300px", background: "#0b0e1a", height: "100%", position: "relative" }}
                        >
                            <button onClick={() => setIsMobileMenuOpen(false)} style={{ position: "absolute", right: "1rem", top: "1rem", background: "none", border: "none", color: "white" }}><X /></button>
                            {sidebarContent}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- MAIN PAGE --- */}
            <main className="main-content" style={{ flex: 1, marginLeft: "280px", padding: "3rem" }}>
                
                {/* --- HEADER --- */}
                <header style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", alignItems: "center", marginBottom: "3rem" }}>
                    <div>
                        <h2 style={{ fontSize: "clamp(1.5rem, 5vw, 1.85rem)", fontWeight: 900, marginBottom: "0.4rem" }}>
                            {activeTab === "dashboard" ? `Selam, ${license.client_name.split(' ')[0]} 👋` : menuItems.find(i => i.id === activeTab)?.label}
                        </h2>
                        <p style={{ color: "rgba(255,255,255,0.4)", fontWeight: 500, fontSize: "0.9rem" }}>{new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    <div style={{ display: "flex", gap: "0.75rem", width: "100%", maxWidth: "fit-content" }}>
                        <button style={{ width: "3rem", height: "3rem", borderRadius: "14px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "white", position: "relative" }}>
                            <Bell style={{ width: "1.1rem" }} />
                            {notifCount > 0 && <span style={{ position: "absolute", top: "10px", right: "10px", width: "8px", height: "8px", background: "#f59e0b", borderRadius: "50%", border: "2px solid #060914" }} />}
                        </button>
                        <button onClick={() => setShowUpgradeModal(true)} style={{ flex: 1, padding: "0 1.5rem", height: "3rem", borderRadius: "14px", background: "var(--primary-color)", border: "none", color: "white", fontWeight: 800, fontSize: "0.85rem", cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                            <Sparkles style={{ width: "1rem" }} /> Paket Yükselt
                        </button>


                    </div>
                </header>

                <AnimatePresence mode="wait">
                    {/* --- DASHBOARD TAB --- */}
                    {activeTab === "dashboard" && (
                        <motion.div key="dash" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                            <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
                                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "24px", padding: "2rem" }}>
                                    <div style={{ width: "3rem", height: "3rem", borderRadius: "14px", background: "rgba(34,197,94,0.1)", color: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.5rem" }}><TrendingUp style={{ width: "1.4rem" }} /></div>
                                    <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.3)", fontWeight: 800, textTransform: "uppercase", marginBottom: "0.5rem" }}>Toplam Ciro</div>
                                    <div style={{ fontSize: "2.25rem", fontWeight: 900 }}>₺{salesSummary.total_sales.toLocaleString('tr-TR')}</div>
                                    <div style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "#22c55e", fontWeight: 700 }}>↑ %{salesSummary.growth} (Canlı)</div>
                                </div>
                                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "24px", padding: "2rem" }}>
                                    <div style={{ width: "3rem", height: "3rem", borderRadius: "14px", background: "rgba(59,130,246,0.1)", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.5rem" }}><ShoppingBag style={{ width: "1.4rem" }} /></div>
                                    <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.3)", fontWeight: 800, textTransform: "uppercase", marginBottom: "0.5rem" }}>İşlem Sayısı</div>
                                    <div style={{ fontSize: "2.25rem", fontWeight: 900 }}>{salesSummary.count} <small style={{ fontSize: "1rem", color: "rgba(255,255,255,0.2)" }}>Fiş</small></div>
                                </div>
                                <div style={{ background: "linear-gradient(135deg, #1e3a8a, #4338ca)", borderRadius: "24px", padding: "2rem" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                                        <div style={{ width: "3rem", height: "3rem", borderRadius: "14px", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}><ShieldCheck style={{ width: "1.4rem" }} /></div>
                                        <div style={{ background: "rgba(255,255,255,0.2)", padding: "0.4rem 0.8rem", borderRadius: "99px", fontSize: "0.75rem", fontWeight: 900 }}>{daysRemaining} Gün</div>
                                    </div>
                                    <div style={{ fontSize: "0.8rem", fontWeight: 800, opacity: 0.6, textTransform: "uppercase", marginBottom: "0.5rem" }}>Aktif Lisans Paketiniz</div>
                                    <div style={{ height: "8px", background: "rgba(255,255,255,0.1)", borderRadius: "10px", marginTop: "1rem" }}>
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} style={{ height: "100%", background: "white", borderRadius: "100px" }} />
                                    </div>
                                    <div style={{ marginTop: "1.25rem", fontWeight: 800, fontSize: "1.25rem" }}>{license.plan_type}</div>
                                </div>
                            </div>

                            <div className="dashboard-content-grid" style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "2rem" }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                                    {/* Son Duyurular */}
                                    <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "28px", padding: "2rem" }}>
                                        <h3 style={{ fontWeight: 900, fontSize: "1.25rem", marginBottom: "2rem", display: "flex", gap: "0.75rem", alignItems: "center" }}><Bell style={{ color: "#f59e0b", width: "1.25rem" }} /> Son Duyurular</h3>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                            {announcements.length > 0 ? announcements.map(a => (
                                                <div key={a.id} style={{ display: "flex", gap: "1.25rem", padding: "1.5rem", background: "rgba(255,255,255,0.02)", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.03)" }}>
                                                    <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "12px", background: "rgba(59,130,246,0.1)", color: "var(--primary-color)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Info style={{ width: "1.1rem" }} /></div>
                                                    <div>
                                                        <div style={{ fontWeight: 800, fontSize: "1rem", marginBottom: "0.25rem" }}>{a.title}</div>
                                                        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.875rem", margin: 0, lineHeight: 1.5 }}>{a.message}</p>
                                                        <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.2)", marginTop: "0.75rem" }}>{new Date(a.created_at).toLocaleDateString('tr-TR')}</div>
                                                    </div>
                                                </div>
                                            )) : <div style={{ textAlign: "center", padding: "2rem", color: "rgba(255,255,255,0.2)" }}>Yeni duyuru yok.</div>}
                                        </div>
                                    </div>

                                    {/* Canlı İşlem Akışı */}
                                    <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "28px", padding: "2rem" }}>
                                        <h3 style={{ fontWeight: 900, fontSize: "1.25rem", marginBottom: "1.5rem", display: "flex", gap: "0.75rem", alignItems: "center" }}><ShoppingBag style={{ color: "var(--primary-color)", width: "1.25rem" }} /> Canlı İşlem Akışı</h3>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                            {recentSales.map((s, i) => (
                                                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", background: "rgba(255,255,255,0.02)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.03)" }}>
                                                    <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                                                        <div style={{ width: "2rem", height: "2rem", borderRadius: "8px", background: "var(--primary-bg)", color: "var(--primary-color)", display: "flex", alignItems: "center", justifyContent: "center" }}><Printer style={{ width: "0.9rem" }} /></div>
                                                        <div>
                                                            <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>Satış #{s.id.slice(0, 8)}</div>
                                                            <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)" }}>{new Date(s.created_at).toLocaleTimeString('tr-TR')}</div>
                                                        </div>
                                                    </div>
                                                    <div style={{ fontWeight: 900, color: "#4ade80" }}>+₺{s.total_amount.toLocaleString('tr-TR')}</div>
                                                </div>
                                            ))}
                                            {recentSales.length === 0 && <div style={{ textAlign: "center", padding: "2rem", color: "rgba(255,255,255,0.2)" }}>Henüz işlem yok.</div>}
                                        </div>
                                    </div>
                                </div>

                                <div className="right-panel" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                                    <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "28px", padding: "2rem" }}>
                                        <h3 style={{ fontWeight: 900, fontSize: "1rem", marginBottom: "1.5rem", textTransform: "uppercase", letterSpacing: "1px", color: "rgba(255,255,255,0.4)" }}>Hızlı İşlemler</h3>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                            <a href={license.download_link} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem", borderRadius: "16px", background: "rgba(255,255,255,0.03)", color: "white", textDecoration: "none", fontWeight: 700, fontSize: "0.9rem" }}><Download style={{ width: "1.1rem" }} /> JetPOS İndir</a>
                                            <button onClick={() => setShowTicketModal(true)} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem", borderRadius: "16px", background: "var(--primary-bg)", color: "var(--primary-color)", border: "none", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer" }}><MessageSquare style={{ width: "1.1rem" }} /> Destek Talebi</button>
                                        </div>
                                    </div>
                                    <div style={{ background: `linear-gradient(135deg, rgba(var(--primary-color-rgb), 0.2), rgba(var(--primary-color-rgb), 0.05))`, border: "1px solid var(--primary-bg)", borderRadius: "28px", padding: "2rem" }}>
                                        <h3 style={{ fontWeight: 900, fontSize: "1.2rem", marginBottom: "0.5rem" }}>AI Analiz</h3>
                                        <p style={{ fontSize: "0.8rem", opacity: 0.6, marginBottom: "1.5rem" }}>İşletme verileriniz yapay zeka ile inceleniyor.</p>
                                        <button style={{ width: "100%", padding: "0.8rem", borderRadius: "12px", background: "white", color: "#000", fontWeight: 800, border: "none", cursor: "pointer" }}>Raporu Gör</button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}


                    {/* --- DEVICES TAB --- */}
                    {activeTab === "devices" && (
                        <motion.div key="devices" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "28px", padding: "2rem" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                                    <h3 style={{ fontWeight: 900, fontSize: "1.4rem" }}>Aktif Cihazlar</h3>
                                    <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)" }}>Şu an {devices.length} aktif bağlantı</span>
                                </div>
                                <div style={{ display: "grid", gap: "1rem" }}>
                                    {devices.length > 0 ? devices.map(d => (
                                        <div key={d.id} style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center", justifyContent: "space-between", padding: "1.5rem", background: "rgba(255,255,255,0.02)", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.03)" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                                                <div style={{ width: "3.5rem", height: "3.5rem", borderRadius: "14px", background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.5)" }}>
                                                    {d.device_type === 'pos' ? <Monitor /> : d.device_type === 'mobile' ? <Smartphone /> : <Tablet />}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 800, fontSize: "1.1rem", marginBottom: "0.25rem" }}>{d.device_name} {d.is_online && <span style={{ width: "8px", height: "8px", background: "#22c55e", borderRadius: "50%", display: "inline-block", marginLeft: "8px" }} />}</div>
                                                    <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.3)" }}>Son Görülme: {new Date(d.last_active).toLocaleString('tr-TR')}</div>
                                                </div>
                                            </div>
                                            <button style={{ padding: "0.75rem 1.25rem", borderRadius: "12px", background: "rgba(239,68,68,0.1)", border: "none", color: "#ef4444", fontWeight: 700, cursor: "pointer" }}>Bağlantıyı Kes</button>
                                        </div>
                                    )) : <div style={{ textAlign: "center", padding: "4rem", color: "rgba(255,255,255,0.2)" }}>Kayıtlı cihazınız yok.</div>}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* --- BILLING TAB --- */}
                    {activeTab === "billing" && (
                        <motion.div key="billing" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <div className="billing-grid" style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: "2rem" }}>
                                <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "28px", padding: "2rem" }}>
                                    <h3 style={{ fontWeight: 900, fontSize: "1.4rem", marginBottom: "2rem" }}>Fatura Geçmişi</h3>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                        {invoices.length > 0 ? invoices.map(inv => (
                                            <div key={inv.id} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", padding: "1.5rem", background: "rgba(255,255,255,0.02)", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.03)" }}>
                                                <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
                                                    <div style={{ width: "3.5rem", height: "3.5rem", borderRadius: "14px", background: "rgba(34,197,94,0.1)", color: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center" }}><CheckCircle2 /></div>
                                                    <div>
                                                        <div style={{ fontWeight: 800 }}>{inv.invoice_no}</div>
                                                        <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.3)" }}>{new Date(inv.invoice_date).toLocaleDateString('tr-TR')}</div>
                                                    </div>
                                                </div>
                                                <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
                                                    <div style={{ fontWeight: 900, fontSize: "1.1rem" }}>₺{inv.amount.toLocaleString('tr-TR')}</div>
                                                    <button style={{ width: "3rem", height: "3rem", borderRadius: "12px", background: "rgba(255,255,255,0.05)", border: "none", color: "white", cursor: "pointer" }}><DownloadCloud style={{ width: "1.25rem" }} /></button>
                                                </div>
                                            </div>
                                        )) : <div style={{ textAlign: "center", padding: "4rem", color: "rgba(255,255,255,0.2)" }}>Henüz fatura oluşmadı.</div>}
                                    </div>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                                    <div style={{ background: "linear-gradient(180deg, rgba(37,99,235,0.1), transparent)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "28px", padding: "2rem" }}>
                                        <h3 style={{ fontWeight: 900, fontSize: "1.2rem", marginBottom: "1.5rem" }}>Ödeme Yöntemi</h3>
                                        <div style={{ background: "rgba(255,255,255,0.03)", padding: "1.5rem", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.06)", marginBottom: "2rem" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                                                <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "rgba(255,255,255,0.4)" }}>KAYITLI KART</div>
                                                <CreditCard style={{ width: "1.2rem", color: "#3b82f6" }} />
                                            </div>
                                            <div style={{ fontSize: "1.25rem", fontWeight: 800, fontFamily: "monospace", letterSpacing: "2px" }}>**** **** **** 4492</div>
                                        </div>
                                        <button style={{ width: "100%", padding: "1rem", borderRadius: "14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontWeight: 800, cursor: "pointer" }}>Kartı Değiştir</button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* --- SUPPORT TAB --- */}
                    {activeTab === "support" && (
                        <motion.div key="support" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
                            <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "28px", padding: "2rem" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
                                    <h3 style={{ fontWeight: 900, fontSize: "1.4rem" }}>Destek Talepleriniz</h3>
                                    <button onClick={() => setShowTicketModal(true)} style={{ padding: "0.75rem 1.5rem", borderRadius: "12px", background: "#f59e0b", color: "#000", fontWeight: 800, border: "none", cursor: "pointer" }}>Yeni Talep Oluştur</button>
                                </div>
                                <div style={{ display: "grid", gap: "1rem" }}>
                                    {tickets.length > 0 ? tickets.map(t => (
                                        <div key={t.id} style={{ padding: "1.5rem", background: "rgba(255,255,255,0.02)", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.03)" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                                                <div style={{ fontWeight: 800, fontSize: "1.1rem" }}>{t.subject}</div>
                                                <span style={{ padding: "0.25rem 0.75rem", borderRadius: "99px", background: t.status === 'open' ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.1)', color: t.status === 'open' ? '#f59e0b' : '#4ade80', fontSize: "0.75rem", fontWeight: 800 }}>{t.status === 'open' ? 'Açık' : 'Çözüldü'}</span>
                                            </div>
                                            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem", margin: "0.5rem 0 1rem 0" }}>{t.message}</p>
                                            <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.2)" }}>{new Date(t.created_at).toLocaleString('tr-TR')}</div>
                                        </div>
                                    )) : <div style={{ textAlign: "center", padding: "4rem", color: "rgba(255,255,255,0.2)" }}>Henüz destek talebiniz bulunmuyor.</div>}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* --- GUIDES TAB --- */}
                    {activeTab === "guides" && (
                        <motion.div key="guides" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "28px", padding: "2rem" }}>
                                <h3 style={{ fontWeight: 900, fontSize: "1.4rem", marginBottom: "2rem" }}>Müşteri Rehberi</h3>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
                                    {guides.map(g => (
                                        <div key={g.id} style={{ padding: "1.75rem", background: "rgba(255,255,255,0.02)", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.03)" }}>
                                            <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "10px", background: "rgba(168,85,247,0.1)", color: "#a855f7", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.25rem" }}>
                                                <BookOpen style={{ width: "1.2rem" }} />
                                            </div>
                                            <div style={{ fontWeight: 800, fontSize: "1.1rem", marginBottom: "0.75rem" }}>{g.title}</div>
                                            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem", lineHeight: 1.6, margin: 0 }}>{g.content}</p>
                                        </div>
                                    ))}
                                    {guides.length === 0 && <div style={{ textAlign: "center", padding: "4rem", gridColumn: "1/-1", color: "rgba(255,255,255,0.2)" }}>Henüz rehber eklenmemiş.</div>}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* --- TRAINING TAB --- */}
                    {activeTab === "training" && (
                        <motion.div key="training" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
                            <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "28px", padding: "2rem" }}>
                                <h3 style={{ fontWeight: 900, fontSize: "1.4rem", marginBottom: "2rem" }}>Eğitim Videoları</h3>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "2rem" }}>
                                    {[
                                        { title: "JetPOS Kurulum Rehberi", duration: "12:45", category: "Başlangıç" },
                                        { title: "Entegrasyon Ayarları", duration: "08:20", category: "İleri Seviye" },
                                        { title: "Stok ve Depo Yönetimi", duration: "15:10", category: "Yönetim" },
                                        { title: "Gün Sonu ve Raporlama", duration: "06:45", category: "Operasyon" }
                                    ].map((v, i) => (
                                        <div key={i} onClick={() => {}} style={{ cursor: "pointer" }}>
                                            <div style={{ width: "100%", aspectRatio: "16/9", background: "rgba(255,255,255,0.03)", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem", position: "relative", overflow: "hidden" }}>
                                                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.6))" }} />
                                                <div style={{ padding: "1rem", borderRadius: "50%", background: "white", color: "#000", zIndex: 1 }}><Play style={{ width: "1.2rem", fill: "currentColor" }} /></div>
                                                <span style={{ position: "absolute", bottom: "1rem", right: "1rem", padding: "0.2rem 0.5rem", background: "rgba(0,0,0,0.8)", borderRadius: "6px", fontSize: "0.7rem", fontWeight: 800 }}>{v.duration}</span>
                                            </div>
                                            <div style={{ padding: "0 0.5rem" }}>
                                                <div style={{ fontSize: "0.75rem", color: "var(--primary-color)", fontWeight: 800, textTransform: "uppercase", marginBottom: "0.25rem" }}>{v.category}</div>
                                                <div style={{ fontWeight: 800, fontSize: "1rem" }}>{v.title}</div>
                                            </div>
                                        </div>

                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* --- SETTINGS TAB --- */}
                    {activeTab === "settings" && (
                        <motion.div key="settings" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
                            <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "28px", padding: "2rem", maxWidth: "800px" }}>
                                <h3 style={{ fontWeight: 900, fontSize: "1.4rem", marginBottom: "2rem" }}>Hesap Ayarları</h3>
                                <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                                    <section>
                                        <h4 style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.3)", fontWeight: 800, textTransform: "uppercase", marginBottom: "1rem", letterSpacing: "1px" }}>Profil</h4>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                            <div>
                                                <label style={{ display: "block", fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginBottom: "0.5rem" }}>Şirket Adı</label>
                                                <input readOnly value={license.client_name} style={{ width: "100%", padding: "0.875rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", color: "white" }} />
                                            </div>
                                            <div>
                                                <label style={{ display: "block", fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginBottom: "0.5rem" }}>İletişim E-postas</label>
                                                <input readOnly value={license.user_email} style={{ width: "100%", padding: "0.875rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", color: "white" }} />
                                            </div>
                                        </div>
                                    </section>
                                    <section>
                                        <h4 style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.3)", fontWeight: 800, textTransform: "uppercase", marginBottom: "1rem", letterSpacing: "1px" }}>Lisans & Plan</h4>
                                        <div style={{ padding: "1.5rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <div>
                                                <div style={{ fontWeight: 800, fontSize: "1.1rem" }}>{license.plan_type} Paketi</div>
                                                <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)" }}>{daysRemaining} gün geçerli</div>
                                            </div>
                                            <div style={{ padding: "0.5rem 1rem", borderRadius: "99px", background: "rgba(34,197,94,0.1)", color: "#22c55e", fontSize: "0.75rem", fontWeight: 900 }}>AKTİF LİSANS</div>
                                        </div>
                                    </section>
                                    <section>
                                        <h4 style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.3)", fontWeight: 800, textTransform: "uppercase", marginBottom: "1rem", letterSpacing: "1px" }}>Bildirim Tercihleri</h4>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                            {["E-posta Bildirimleri", "Kritik Sistem Duyuruları", "Fatura Hatırlatıcıları"].map((n, i) => (
                                                <label key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem", background: "rgba(255,255,255,0.01)", borderRadius: "14px", cursor: "pointer" }}>
                                                    <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>{n}</span>
                                                    <input type="checkbox" defaultChecked style={{ width: "1.2rem", height: "1.2rem", accentColor: license.branding_config?.primary_color || "#3b82f6" }} />
                                                </label>
                                            ))}
                                        </div>
                                    </section>
                                </div>
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </main>

            {/* --- MODAL --- */}
            <AnimatePresence>
                {showTicketModal && (
                    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "32px", padding: "2rem", width: "100%", maxWidth: "500px" }}>
                            <h3 style={{ fontSize: "1.5rem", fontWeight: 900, marginBottom: "2rem" }}>Destek Talebi</h3>
                            <form onSubmit={handleCreateTicket} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                                <input required value={ticketSubject} onChange={e => setTicketSubject(e.target.value)} placeholder="Konu" style={{ padding: "1rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "white" }} />
                                <textarea required value={ticketMessage} onChange={e => setTicketMessage(e.target.value)} rows={4} placeholder="Mesajınız..." style={{ padding: "1rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "white", resize: "none" }} />
                                <div style={{ display: "flex", gap: "1rem" }}>
                                    <button type="button" onClick={() => setShowTicketModal(false)} style={{ flex: 1, padding: "1rem", borderRadius: "12px", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontWeight: 700 }}>İptal</button>
                                    <button type="submit" disabled={savingTicket} style={{ flex: 2, padding: "1rem", borderRadius: "12px", background: "#2563eb", border: "none", color: "white", fontWeight: 800 }}>{savingTicket ? "Gönderiliyor..." : "Talebi Gönder"}</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- UPGRADE MODAL --- */}
            <AnimatePresence>
                {showUpgradeModal && (
                    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(15px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: "1rem" }}>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} style={{ background: "#060914", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "32px", padding: "2.5rem", width: "100%", maxWidth: "1000px", maxHeight: "90vh", overflowY: "auto" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2.5rem" }}>
                                <div>
                                    <h2 style={{ fontSize: "1.75rem", fontWeight: 900, marginBottom: "0.5rem" }}>Lisans Paketini Yükselt</h2>
                                    <p style={{ color: "rgba(255,255,255,0.4)" }}>İşletmenizi büyütmek için size en uygun planı seçin.</p>
                                </div>
                                <button onClick={() => setShowUpgradeModal(false)} style={{ background: "rgba(255,255,255,0.04)", border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", cursor: "pointer" }}><X style={{ width: "1.2rem" }} /></button>
                            </div>
                            
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
                                {[
                                    { name: "BASIC", price: "₺499", features: ["Temel Adisyon", "Masa Yönetimi", "1 Cihaz", "E-posta Destek"] },
                                    { name: "PRO", price: "₺899", features: ["Gelişmiş Adisyon", "Mobil Uygulama", "3 Cihaz", "7/24 Destek", "QNB Entegrasyonu"], featured: true },
                                    { name: "ENTERPRISE", price: "Teklif Al", features: ["Tüm Özellikler", "Beyaz Etiket (Markalama)", "Sınırsız Cihaz", "AI Asistan", "Özel Entegrasyon"] }
                                ].map((p, i) => (
                                    <div key={i} style={{ 
                                        padding: "2.5rem", borderRadius: "28px", 
                                        background: p.featured ? "rgba(var(--primary-color-rgb), 0.05)" : "rgba(255,255,255,0.02)",
                                        border: p.featured ? "2px solid var(--primary-color)" : "1px solid rgba(255,255,255,0.05)",
                                        position: "relative", display: "flex", flexDirection: "column"
                                    }}>
                                        {p.featured && <span style={{ position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)", background: "var(--primary-color)", padding: "0.25rem 1rem", borderRadius: "99px", fontSize: "0.75rem", fontWeight: 900 }}>EN POPÜLER</span>}
                                        <div style={{ fontSize: "1rem", fontWeight: 900, color: p.featured ? "var(--primary-color)" : "rgba(255,255,255,0.4)", marginBottom: "1rem" }}>{p.name}</div>
                                        <div style={{ fontSize: "2.5rem", fontWeight: 900, marginBottom: "2rem" }}>{p.price}<small style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.2)" }}> {p.name !== 'ENTERPRISE' && '/ ay'}</small></div>
                                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2.5rem" }}>
                                            {p.features.map((f, fi) => (
                                                <div key={fi} style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.9rem" }}>
                                                    <Check style={{ width: "1rem", color: "#22c55e" }} /> {f}
                                                </div>
                                            ))}
                                        </div>
                                        <button style={{ 
                                            padding: "1rem", borderRadius: "14px", 
                                            background: p.featured ? "var(--primary-color)" : "rgba(255,255,255,0.05)",
                                            color: p.featured ? "white" : "rgba(255,255,255,0.6)", fontWeight: 800, border: "none", cursor: "pointer",
                                            transition: "all 0.2s"
                                        }}>Şimdi Seç</button>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                
                :root {
                    --primary-color: ${license.branding_config?.primary_color || "#3b82f6"};
                    --primary-color-rgb: ${hexToRgb(license.branding_config?.primary_color || "#3b82f6")};
                    --primary-bg: rgba(var(--primary-color-rgb), 0.1);
                }

                body { margin: 0; font-family: 'Inter', sans-serif; background: #060914; min-height: 100vh; color: white; }
                
                button:active { transform: scale(0.98); }
                a:hover, button:hover { opacity: 0.9; }

                @media (max-width: 1024px) {
                    .desktop-sidebar { display: none !important; }
                    .mobile-header { display: flex !important; }
                    .main-content { margin-left: 0 !important; padding: 2rem 1.5rem !important; }
                    .dashboard-content-grid { grid-template-columns: 1fr !important; }
                    .billing-grid { grid-template-columns: 1fr !important; }
                }

                @media (max-width: 640px) {
                    .stats-grid { grid-template-columns: 1fr !important; }
                    .main-content { padding: 1.5rem 1rem !important; }
                }



                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
            `}</style>
        </div>
    );
}
