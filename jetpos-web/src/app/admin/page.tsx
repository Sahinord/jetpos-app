"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Lock, LogOut, Check, CheckCircle2, PhoneCall,
    Search, Mail, Plus, Globe,
    RefreshCw, Sparkles, TrendingUp, AlertCircle, Eye,
    LayoutDashboard, Trash2, Edit, BookOpen, ExternalLink, Calendar,
    FileText, Building2, ShieldCheck, Clock, MessageSquare, Bell, Menu, X, Heart
} from "lucide-react";

import { supabase } from "@/lib/supabase";

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "jetpos2025";

// Güvenli admin fetch â€“ service role key server'da kalÄ±r
async function adminFetch(path: string, options: RequestInit = {}) {
    const token = sessionStorage.getItem("jetpos_admin_token") || "";
    return fetch(path, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            "x-admin-token": token,
            ...(options.headers || {}),
        },
    });
}

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
    const [activeTab, setActiveTab] = useState<"dashboard" | "requests" | "licenses" | "blog" | "guides" | "about" | "tickets" | "announcements" | "crm">("dashboard");
    const [blogPosts, setBlogPosts] = useState<any[]>([]);
    const [aboutContent, setAboutContent] = useState<Record<string, any>>({});
    const [showNewPost, setShowNewPost] = useState(false);
    const [editingPost, setEditingPost] = useState<any | null>(null);
    const [postForm, setPostForm] = useState({ title: "", slug: "", excerpt: "", content: "", category: "Genel", author: "JetPOS Ekibi", read_time: 5, published: false, featured: false });
    const [savingPost, setSavingPost] = useState(false);
    const [savingAbout, setSavingAbout] = useState(false);
    const [requests, setRequests] = useState<DemoRequest[]>([]);
    const [licenses, setLicenses] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [selectedRequest, setSelectedRequest] = useState<DemoRequest | null>(null);
    const [selectedLicense, setSelectedLicense] = useState<any | null>(null);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [stats, setStats] = useState({ totalRequests: 0, activeLicenses: 0, activeGuides: 0, pendingCalls: 0 });
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    // Guide state
    const [guides, setGuides] = useState<any[]>([]);
    const [showNewGuide, setShowNewGuide] = useState(false);
    const [editingGuide, setEditingGuide] = useState<any | null>(null);
    const [guideForm, setGuideForm] = useState({ title: "", content: "", order_index: 0, is_active: true });
    const [savingGuide, setSavingGuide] = useState(false);

    // Support Tickets & Announcements
    const [tickets, setTickets] = useState<any[]>([]);
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [showNewAnnounce, setShowNewAnnounce] = useState(false);
    const [announceForm, setAnnounceForm] = useState({ title: "", message: "", type: "info" });
    const [savingAnnounce, setSavingAnnounce] = useState(false);

    // Form states for new license
    const [showNewLicense, setShowNewLicense] = useState(false);
    const [newLicenseData, setNewLicenseData] = useState({
        client_name: "",
        user_email: "",
        plan_type: "PRO",
        license_key: "",
        total_days: 365,
        download_link: "https://github.com/Sahinord/jetpos-app/releases/latest/download/JetPOS-Setup.exe",
        features: {
            adisyon: true,
            mobile_app: true,
            trendyol_go: false,
            getir: false,
            qnb_invoice: false,
            ai_features: true
        },
        custom_logo_url: "",
        branding_config: { primary_color: "#3b82f6", hide_jetpos_badge: false },
        max_stores: 1
    });

    // Edit license state
    const [showEditLicense, setShowEditLicense] = useState(false);
    const [editingLicense, setEditingLicense] = useState<any>(null);

    useEffect(() => {
        const saved = sessionStorage.getItem("jetpos_admin_auth");
        if (saved === "true") {
            setAuthed(true);
            loadAll();

            const channel = supabase
                .channel('admin_licenses_realtime')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'tenants' }, () => { loadLicenses(); })
                .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, () => { loadTickets(); })
                .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => { loadAnnouncements(); loadCrmStats(); })
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, []);

    const loadAll = () => {
        loadRequests();
        loadLicenses();
        loadBlogPosts();
        loadAboutContent();
        loadGuides();
        loadTickets();
        loadAnnouncements();
        loadCrmStats();
    };

    const loadGuides = async () => {
        try {
            const res = await adminFetch("/api/admin/guides");
            if (res.ok) setGuides(await res.json());
        } catch (e) { console.error(e); }
    };

    const saveGuide = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingGuide(true);
        try {
            const res = editingGuide
                ? await adminFetch(`/api/admin/guides?id=${editingGuide.id}`, { method: "PATCH", body: JSON.stringify(guideForm) })
                : await adminFetch("/api/admin/guides", { method: "POST", body: JSON.stringify(guideForm) });
            if (res.ok) showToast(editingGuide ? "Rehber güncellendi" : "Rehber oluÅŸturuldu");
            else showToast("Hata oluÅŸtu", "error");
            setShowNewGuide(false);
            setEditingGuide(null);
            setGuideForm({ title: "", content: "", order_index: 0, is_active: true });
            loadGuides();
        } finally { setSavingGuide(false); }
    };

    const deleteGuide = async (id: string) => {
        if (!confirm("Bu rehberi silmek istediÄŸinize emin misiniz?")) return;
        const res = await adminFetch(`/api/admin/guides?id=${id}`, { method: "DELETE" });
        if (res.ok) showToast("Rehber silindi");
        loadGuides();
    };

    const loadBlogPosts = async () => {
        try {
            const res = await adminFetch("/api/admin/blog");
            if (res.ok) setBlogPosts(await res.json());
            else if (res.status === 401) showToast("Yetki hatasÄ±", "error");
        } catch (e) { console.error(e); }
    };

    const loadAboutContent = async () => {
        try {
            const res = await adminFetch("/api/admin/about");
            if (res.ok) setAboutContent(await res.json());
        } catch (e) { console.error(e); }
    };

    const savePost = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingPost(true);
        try {
            const res = editingPost
                ? await adminFetch(`/api/admin/blog?id=${editingPost.id}`, { method: "PATCH", body: JSON.stringify(postForm) })
                : await adminFetch("/api/admin/blog", { method: "POST", body: JSON.stringify(postForm) });
            if (res.ok) showToast(editingPost ? "YazÄ± güncellendi" : "YazÄ± oluÅŸturuldu");
            else showToast("Hata oluÅŸtu", "error");
            setShowNewPost(false);
            setEditingPost(null);
            setPostForm({ title: "", slug: "", excerpt: "", content: "", category: "Genel", author: "JetPOS Ekibi", read_time: 5, published: false, featured: false });
            loadBlogPosts();
        } finally { setSavingPost(false); }
    };

    const deletePost = async (id: string) => {
        if (!confirm("Bu yazÄ±yÄ± silmek istediÄŸinize emin misiniz?")) return;
        const res = await adminFetch(`/api/admin/blog?id=${id}`, { method: "DELETE" });
        if (res.ok) showToast("YazÄ± silindi");
        loadBlogPosts();
    };

    const togglePublish = async (post: any) => {
        await adminFetch(`/api/admin/blog?id=${post.id}`, {
            method: "PATCH",
            body: JSON.stringify({ published: !post.published }),
        });
        loadBlogPosts();
    };

    const saveAboutSection = async (section: string, newContent: any) => {
        setSavingAbout(true);
        try {
            const res = await adminFetch(`/api/admin/about?section=${section}`, {
                method: "PATCH",
                body: JSON.stringify(newContent),
            });
            if (res.ok) showToast("Kaydedildi"); else showToast("Hata", "error");
            loadAboutContent();
        } finally { setSavingAbout(false); }
    };


    const updateStats = () => {
        setStats({
            totalRequests: requests.length,
            activeLicenses: licenses.length,
            activeGuides: guides.length,
            pendingCalls: requests.filter(r => r.status === "new").length
        });
    };

    useEffect(() => {
        updateStats();
    }, [requests, licenses]);

    const showToast = (message: string, type: "success" | "error" = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const loadTickets = async () => {
        try {
            const res = await adminFetch("/api/admin/tickets");
            if (res.ok) setTickets(await res.json());
        } catch (e) { console.error(e); }
    };

    const loadAnnouncements = async () => {
        try {
            const res = await adminFetch("/api/admin/announcements");
            if (res.ok) setAnnouncements(await res.json());
        } catch (e) { console.error(e); }
    };

    const [crmGlobalStats, setCrmGlobalStats] = useState<any[]>([]);
    const loadCrmStats = async () => {
        try {
            const { data, error } = await supabase
                .from('tenants')
                .select(`
                    id, 
                    company_name, 
                    license_key,
                    cari_hesaplar(count),
                    loyalty_points(count)
                `)
                .order('company_name');

            if (data) setCrmGlobalStats(data);
        } catch (e) { console.error(e); }
    };

    const saveAnnounce = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingAnnounce(true);
        try {
            const res = await adminFetch("/api/admin/announcements", { method: "POST", body: JSON.stringify(announceForm) });
            if (res.ok) {
                showToast("Duyuru yayÄ±nlandÄ±");
                setShowNewAnnounce(false);
                setAnnounceForm({ title: "", message: "", type: "info" });
                loadAnnouncements(); loadCrmStats();
            }
        } finally { setSavingAnnounce(false); }
    };

    const updateTicketStatus = async (id: string, status: string) => {
        try {
            await adminFetch(`/api/admin/tickets?id=${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
            loadTickets();
            showToast("Talep güncellendi");
        } catch (e) { console.error(e); }
    };

    const deleteAnnounce = async (id: string) => {
        if (!confirm("Bu duyuruyu silmek istediÄŸinize emin misiniz?")) return;
        try {
            await adminFetch(`/api/admin/announcements?id=${id}`, { method: "DELETE" });
            loadAnnouncements(); loadCrmStats();
            showToast("Duyuru silindi");
        } catch (e) { console.error(e); }
    };

    const loadRequests = async () => {
        setLoading(true);
        try {
            const res = await adminFetch("/api/admin/requests");
            if (res.ok) setRequests(await res.json());
            else if (res.status === 401) showToast("Yetki hatasÄ±", "error");
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const loadLicenses = async () => {
        try {
            const res = await adminFetch("/api/admin/licenses");
            if (res.ok) {
                const data = await res.json();
                setLicenses(data);
            } else {
                showToast(`Lisanslar alÄ±namadÄ±: ${res.status}`, "error");
            }
        } catch (e) {
            console.error("License load error:", e);
            showToast("BaÄŸlantÄ± hatasÄ±", "error");
        }
    };

    const createLicense = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await adminFetch("/api/admin/licenses", {
                method: "POST",
                body: JSON.stringify(newLicenseData),
            });
            if (res.ok) {
                showToast("Lisans baÅŸarÄ±yla oluÅŸturuldu");
                setShowNewLicense(false);
                loadLicenses();
                setNewLicenseData({
                    client_name: "",
                    user_email: "",
                    plan_type: "PRO",
                    license_key: "",
                    total_days: 365,
                    download_link: "https://github.com/Sahinord/jetpos-app/releases/latest/download/JetPOS-Setup.exe",
                    features: {
                        adisyon: true,
                        mobile_app: true,
                        trendyol_go: false,
                        getir: false,
                        qnb_invoice: false,
                        ai_features: true
                    },
                    custom_logo_url: "",
                    branding_config: { primary_color: "#3b82f6", hide_jetpos_badge: false }
                });
            } else {
                const err = await res.json();
                showToast(err.message || err.error || "Kaydetme baÅŸarÄ±sÄ±z", "error");
            }
        } catch (e) {
            showToast("Sunucuya eriÅŸilemedi", "error");
        } finally { setLoading(false); }
    };

    const updateLicense = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await adminFetch(`/api/admin/licenses?id=${editingLicense.id}`, {
                method: "PATCH",
                body: JSON.stringify(editingLicense),
            });
            if (res.ok) {
                showToast("Lisans güncellendi");
                setShowEditLicense(false);
                loadLicenses();
            } else {
                showToast("Güncelleme baÅŸarÄ±sÄ±z", "error");
            }
        } catch (e) {
            showToast("BaÄŸlantÄ± hatasÄ±", "error");
        } finally { setLoading(false); }
    };

    const deleteLicense = async (id: string) => {
        if (!confirm("Bu lisansÄ± silmek istediÄŸinize emin misiniz?")) return;
        const res = await adminFetch(`/api/admin/licenses?id=${id}`, { method: "DELETE" });
        if (res.ok) { showToast("Lisans silindi"); loadLicenses(); }
    };

    const updateStatus = async (id: string, status: DemoRequest["status"]) => {
        setUpdatingId(id);
        try {
            await adminFetch(`/api/admin/requests?id=${id}`, {
                method: "PATCH",
                body: JSON.stringify({ status }),
            });
            setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
            if (selectedRequest?.id === id) {
                setSelectedRequest(prev => prev ? { ...prev, status } : null);
            }
        } finally { setUpdatingId(null); }
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === ADMIN_PASSWORD) {
            setAuthed(true);
            // Token'Ä± session'a kaydet â€“ API route'lar bunu x-admin-token ile kullanacak
            sessionStorage.setItem("jetpos_admin_auth", "true");
            sessionStorage.setItem("jetpos_admin_token", ADMIN_PASSWORD);
            loadAll();
        } else {
            setPasswordError(true);
            setTimeout(() => setPasswordError(false), 2000);
        }
    };

    const handleLogout = () => {
        setAuthed(false);
        sessionStorage.removeItem("jetpos_admin_auth");
        sessionStorage.removeItem("jetpos_admin_token");
    };

    const filteredRequests = requests.filter(r => {
        const matchSearch = !search || [r.name, r.email, r.phone, r.company].some(v => v?.toLowerCase().includes(search.toLowerCase()));
        const matchStatus = filterStatus === "all" || r.status === filterStatus;
        return matchSearch && matchStatus;
    });

    const filteredLicenses = licenses.filter(l => {
        const s = search.toLowerCase();
        return !s ||
            (l.client_name?.toLowerCase() || "").includes(s) ||
            (l.user_email?.toLowerCase() || "").includes(s) ||
            (l.license_key?.toLowerCase() || "").includes(s);
    });

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const sidebarContent = (
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <div style={{ padding: "2.5rem 2rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "10px", background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ShieldCheck style={{ width: "1.2rem", color: "white" }} />
                </div>
                <div>
                    <h1 style={{ fontSize: "1.1rem", fontWeight: 900, margin: 0 }}>Super Admin</h1>
                    <span style={{ fontSize: "0.6rem", color: "#3b82f6", fontWeight: 800 }}>V2.0 PRO</span>
                </div>
            </div>

            <nav style={{ flex: 1, padding: "0 1rem" }}>
                {[
                    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
                    { id: "requests", label: "Yeni Talepler", icon: PhoneCall },
                    { id: "licenses", label: "Lisans YÃ¶netimi", icon: ShieldCheck },
                    { id: "tickets", label: "Destek Talepleri", icon: MessageSquare },
                    { id: "announcements", label: "Duyurular", icon: Bell },
                    { id: "crm", label: "CRM Analizi", icon: Heart },
                    { id: "blog", label: "Blog YazÄ±larÄ±", icon: FileText },
                    { id: "guides", label: "Rehberler", icon: BookOpen },
                    { id: "about", label: "HakkÄ±mÄ±zda", icon: Building2 },
                ].map(item => (
                    <button key={item.id} onClick={() => { setActiveTab(item.id as any); setIsMobileMenuOpen(false); }} style={{
                        width: "100%", display: "flex", alignItems: "center", gap: "0.8rem", padding: "0.8rem 1.25rem", borderRadius: "12px", border: "none",
                        background: activeTab === item.id ? "rgba(37,99,235,0.1)" : "transparent",
                        color: activeTab === item.id ? "#3b82f6" : "rgba(255,255,255,0.4)",
                        fontSize: "0.85rem", fontWeight: activeTab === item.id ? 800 : 500, cursor: "pointer", transition: "all 0.2s", textAlign: "left", marginBottom: "4px"
                    }}>
                        <item.icon style={{ width: "1.1rem" }} /> {item.label}
                    </button>
                ))}
            </nav>

            <div style={{ padding: "1.5rem", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <button onClick={handleLogout} style={{ width: "100%", padding: "0.75rem", borderRadius: "10px", background: "rgba(239,68,68,0.1)", border: "none", color: "#ef4444", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                    <LogOut style={{ width: "0.9rem" }} /> Ã‡Ä±kÄ±ÅŸ Yap
                </button>
            </div>
        </div>
    );

    // Login screen
    if (!authed) {
        return (
            <div style={{ height: "100vh", background: "#060914", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif" }}>
                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ width: "100%", maxWidth: "400px", padding: "3rem", background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "2rem", backdropFilter: "blur(20px)" }}>
                    <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
                        <div style={{ width: "3.5rem", height: "3.5rem", borderRadius: "1rem", background: "#2563eb", color: "white", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}><ShieldCheck style={{ width: "1.8rem" }} /></div>
                        <h1 style={{ fontSize: "1.75rem", fontWeight: 900, marginBottom: "0.5rem" }}>Güvenli GiriÅŸ</h1>
                        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem" }}>Super Admin yÃ¶netim paneline eriÅŸim</p>
                    </div>
                    <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                        <div style={{ position: "relative" }}>
                            <Lock style={{ position: "absolute", top: "1rem", left: "1rem", width: "1rem", color: "rgba(255,255,255,0.3)" }} />
                            <input type="password" placeholder="Admin Åifresi" value={password} onChange={e => setPassword(e.target.value)} style={{ width: "100%", padding: "1rem 1rem 1rem 3rem", background: "rgba(255,255,255,0.05)", border: passwordError ? "1px solid #ef4444" : "1px solid rgba(255,255,255,0.1)", borderRadius: "14px", color: "white", outline: "none" }} />
                        </div>
                        <button type="submit" style={{ padding: "1rem", borderRadius: "14px", background: "#2563eb", color: "white", fontWeight: 800, border: "none", cursor: "pointer", fontSize: "1rem" }}>Sisteme GiriÅŸ Yap</button>
                        {passwordError && <p style={{ color: "#ef4444", fontSize: "0.8rem", textAlign: "center", margin: 0 }}>YanlÄ±ÅŸ ÅŸifre! LÃ¼tfen tekrar deneyin.</p>}
                    </form>
                </motion.div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: "100vh", background: "#060914", color: "white", display: "flex", flexDirection: "column", fontFamily: "'Inter', sans-serif" }}>

            {/* --- RESPONSIVE SIDEBAR --- */}
            <aside className="admin-sidebar" style={{ width: "280px", background: "rgba(11,14,26,0.9)", borderRight: "1px solid rgba(255,255,255,0.06)", position: "fixed", height: "100vh", zIndex: 100, backdropFilter: "blur(40px)" }}>
                {sidebarContent}
            </aside>

            {/* --- MOBILE HEADER --- */}
            <header className="admin-mobile-header" style={{ position: "sticky", top: 0, zIndex: 90, background: "rgba(11,14,26,0.8)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "1rem 1.5rem", display: "none", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <ShieldCheck style={{ width: "1.2rem", color: "#3b82f6" }} />
                    <span style={{ fontWeight: 800 }}>Admin Panel</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(true)} style={{ background: "none", border: "none", color: "white", cursor: "pointer" }}><Menu /></button>
            </header>

            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(5px)" }}>
                        <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 25 }} style={{ width: "80%", maxWidth: "300px", background: "#0b0e1a", height: "100%", position: "relative" }}>
                            <button onClick={() => setIsMobileMenuOpen(false)} style={{ position: "absolute", right: "1rem", top: "1.5rem", background: "none", border: "none", color: "white" }}><X /></button>
                            {sidebarContent}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <main className="admin-main-content" style={{ flex: 1, marginLeft: "280px", padding: "3rem" }}>
            <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
                {activeTab === "crm" && (<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2.5rem" }}><div><h2 style={{ fontSize: "1.75rem", fontWeight: 900, marginBottom: "0.25rem", color: "white" }}>Global CRM Takibi</h2><p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.875rem" }}>Tüm müşterilerin sadakat programı verileri</p></div></div><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>{crmGlobalStats.filter(t => t.license_key !== `ADM257SA67`).map((t) => (<div key={t.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "1.25rem", padding: "1.5rem", borderLeft: "4px solid #f472b6" }}><h3 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: "1rem" }}>{t.company_name || t.license_key}</h3><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}><div style={{ padding: "1rem", background: "rgba(0,0,0,0.2)", borderRadius: "1rem" }}><div style={{ fontSize: "1.5rem", fontWeight: 900 }}>{t.cari_hesaplar?.[0]?.count || 0}</div><div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", fontWeight: 800 }}>Müşteri</div></div><div style={{ padding: "1rem", background: "rgba(0,0,0,0.2)", borderRadius: "1rem" }}><div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#f472b6" }}>{t.loyalty_points?.[0]?.count || 0}</div><div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", fontWeight: 800 }}>Puan Hareketi</div></div></div></div>))}</div></motion.div>)} {activeTab === "dashboard" && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2.5rem" }}>
                            <div>
                                <h2 style={{ fontSize: "1.75rem", fontWeight: 900, marginBottom: "0.25rem", background: "linear-gradient(to right, #fff, #94a3b8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>YÃ¶netim Paneli</h2>
                                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.875rem" }}>HoÅŸ geldiniz, sistem durumu ve istatistikler aÅŸaÄŸÄ±dadÄ±r.</p>
                            </div>
                            <button onClick={loadAll} style={{ padding: "0.6rem 1.2rem", borderRadius: "0.75rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", fontWeight: 600 }}>
                                <RefreshCw className={loading ? "animate-spin" : ""} style={{ width: "1rem" }} /> Yenile
                            </button>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem", marginBottom: "2.5rem" }}>
                            {[
                                 { label: "Toplam Talep", value: stats.totalRequests, icon: Mail, color: "#3b82f6", trend: "+12%" },
                                { label: "Aktif Lisanslar", value: stats.activeLicenses, icon: CheckCircle2, color: "#22c55e", trend: "Stabil" },
                                { label: "EÄŸitim Rehberleri", value: stats.activeGuides, icon: BookOpen, color: "#a855f7", trend: "Yeni" },
                                { label: "Bekleyen Aramalar", value: stats.pendingCalls, icon: PhoneCall, color: "#f59e0b", trend: "Acil" },
                            ].map((s, i) => (
                                <motion.div key={i} whileHover={{ y: -5, background: "rgba(255,255,255,0.05)" }} style={{
                                    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                                    borderRadius: "1.5rem", padding: "2rem", display: "flex", alignItems: "center", gap: "1.5rem",
                                    transition: "all 0.3s ease", cursor: "default"
                                }}>
                                    <div style={{
                                        width: "4rem", height: "4rem", borderRadius: "1.25rem",
                                        background: `${s.color}15`, display: "flex", alignItems: "center", justifyContent: "center"
                                    }}>
                                        <s.icon style={{ color: s.color, width: "1.75rem", height: "1.75rem" }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                                            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.875rem", fontWeight: 600 }}>{s.label}</span>
                                            <span style={{ fontSize: "0.7rem", color: s.color, background: `${s.color}10`, padding: "0.1rem 0.4rem", borderRadius: "4px" }}>{s.trend}</span>
                                        </div>
                                        <div style={{ fontSize: "2.25rem", fontWeight: 900, letterSpacing: "-1px" }}>{s.value}</div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "2rem" }}>
                            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "1.75rem", padding: "2rem", boxShadow: "0 20px 50px rgba(0,0,0,0.2)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                                    <h3 style={{ fontSize: "1.1rem", fontWeight: 800 }}>Son Talepler</h3>
                                    <button onClick={() => setActiveTab("requests")} style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer", fontSize: "0.875rem", fontWeight: 600 }}>TÃ¼münÃ¼ GÃ¶r â†’</button>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                    {requests.slice(0, 4).length > 0 ? requests.slice(0, 4).map(r => (
                                        <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", background: "rgba(255,255,255,0.02)", borderRadius: "1rem", border: "1px solid rgba(255,255,255,0.03)" }}>
                                            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                                                <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "0.75rem", background: "linear-gradient(135deg, #1e293b, #334155)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.8rem" }}>{r.name[0]}</div>
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{r.name}</div>
                                                    <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)" }}>{r.company}</div>
                                                </div>
                                            </div>
                                            <div style={{ fontSize: "0.7rem", background: STATUS_CONFIG[r.status].bg, color: STATUS_CONFIG[r.status].color, padding: "0.4rem 0.75rem", borderRadius: "99px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>{STATUS_CONFIG[r.status].label}</div>
                                        </div>
                                    )) : (
                                        <div style={{ textAlign: "center", padding: "3rem", color: "rgba(255,255,255,0.2)" }}>HenÃ¼z talep bulunmuyor.</div>
                                    )}
                                </div>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                                <div style={{ background: "linear-gradient(135deg, #1d4ed8, #2563eb)", borderRadius: "1.75rem", padding: "2rem", color: "white", position: "relative", overflow: "hidden" }}>
                                    <div style={{ position: "relative", zIndex: 2 }}>
                                        <h3 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "0.5rem" }}>Lisans OluÅŸtur</h3>
                                        <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.8)", marginBottom: "1.5rem" }}>HÄ±zlÄ±ca yeni bir mÃ¼ÅŸteri lisansÄ± tanÄ±mlayÄ±n ve paylaÅŸÄ±n.</p>
                                        <button onClick={() => { setActiveTab("licenses"); setShowNewLicense(true); }} style={{ width: "100%", padding: "1rem", borderRadius: "1rem", background: "white", color: "#2563eb", fontWeight: 800, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}>
                                            <Sparkles style={{ width: "1.1rem" }} /> Åimdi BaÅŸla
                                        </button>
                                    </div>
                                    <TrendingUp style={{ position: "absolute", right: "-1rem", bottom: "-1rem", width: "10rem", height: "10rem", color: "rgba(255,255,255,0.1)", transform: "rotate(-15deg)" }} />
                                </div>
                                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "1.75rem", padding: "2rem" }}>
                                    <h3 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: "1.25rem" }}>Sistem NotlarÄ±</h3>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                        <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.85rem", color: "rgba(255,255,255,0.5)" }}>
                                            <div style={{ width: "0.5rem", height: "0.5rem", borderRadius: "50%", background: "#22c55e", marginTop: "0.25rem", flexShrink: 0 }} />
                                            <span>Supabase baÄŸlantÄ±sÄ± aktif.</span>
                                        </div>
                                        <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.85rem", color: "rgba(255,255,255,0.5)" }}>
                                            <div style={{ width: "0.5rem", height: "0.5rem", borderRadius: "50%", background: "#3b82f6", marginTop: "0.25rem", flexShrink: 0 }} />
                                            <span>Otomatik yedekleme devrede.</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === "requests" && (
                    <>
                        <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
                            <div style={{ position: "relative", flex: 1 }}>
                                <Search style={{ position: "absolute", left: "0.8rem", top: "50%", transform: "translateY(-50%)", width: "1rem", height: "1rem", color: "rgba(255,255,255,0.3)" }} />
                                <input type="text" placeholder="Talep ara..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: "100%", padding: "0.75rem 1rem 0.75rem 2.5rem", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "0.75rem", color: "white" }} />
                            </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: selectedRequest ? "1fr 380px" : "1fr", gap: "1.5rem" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                {filteredRequests.map((req, i) => (
                                    <motion.div key={req.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onClick={() => setSelectedRequest(req)} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "1rem", padding: "1.25rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "1rem" }}>
                                        <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "0.75rem", background: "linear-gradient(135deg, #2563eb, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>{req.name[0]}</div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 700 }}>{req.name}</div>
                                            <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)" }}>{req.company} â€¢ {req.email}</div>
                                        </div>
                                        <div style={{ padding: "0.2rem 0.6rem", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 700, background: STATUS_CONFIG[req.status].bg, color: STATUS_CONFIG[req.status].color }}>{STATUS_CONFIG[req.status].label}</div>
                                    </motion.div>
                                ))}
                            </div>
                            {selectedRequest && (
                                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "1.25rem", padding: "1.5rem", height: "fit-content", position: "sticky", top: "6rem" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                                        <h3 style={{ margin: 0 }}>Talep DetayÄ±</h3>
                                        <button onClick={() => setSelectedRequest(null)} style={{ background: "none", border: "none", color: "white", cursor: "pointer" }}>Ã—</button>
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                        <div><label style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Firma</label><div>{selectedRequest.company}</div></div>
                                        <div><label style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>E-posta</label><div>{selectedRequest.email}</div></div>
                                        <div><label style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Telefon</label><div>{selectedRequest.phone}</div></div>
                                        <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                                                <button key={key} onClick={() => updateStatus(selectedRequest.id, key as any)} style={{ padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid rgba(255,255,255,0.1)", background: selectedRequest.status === key ? cfg.bg : "transparent", color: selectedRequest.status === key ? cfg.color : "white", cursor: "pointer", textAlign: "left" }}>{cfg.label}</button>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </>
                )}

                {activeTab === "licenses" && (
                    <>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2rem" }}>
                            <div style={{ position: "relative", flex: 1, maxWidth: "400px" }}>
                                <Search style={{ position: "absolute", left: "0.8rem", top: "50%", transform: "translateY(-50%)", width: "1rem", height: "1rem", color: "rgba(255,255,255,0.3)" }} />
                                <input type="text" placeholder="Lisans ara..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: "100%", padding: "0.75rem 1rem 0.75rem 2.5rem", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "0.75rem", color: "white" }} />
                            </div>
                            <button onClick={() => setShowNewLicense(true)} style={{ padding: "0.75rem 1.5rem", borderRadius: "0.75rem", background: "#2563eb", border: "none", color: "white", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <Sparkles style={{ width: "1rem", height: "1rem" }} />
                                Yeni Lisans TanÄ±mla
                            </button>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))", gap: "1rem" }}>
                            {filteredLicenses.map((l, i) => (
                                <motion.div key={l.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{
                                    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                                    borderRadius: "1.25rem", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem",
                                    position: "relative", overflow: "hidden"
                                }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                                            <div style={{ width: "2.75rem", height: "2.75rem", borderRadius: "0.75rem", background: "rgba(34,197,94,0.1)", color: "#4ade80", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                <CheckCircle2 style={{ width: "1.25rem", height: "1.25rem" }} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 800, fontSize: "1.1rem" }}>{l.client_name}</div>
                                                <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                                    <Mail style={{ width: "0.75rem" }} /> {l.user_email}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", gap: "0.5rem" }}>
                                            <button 
                                                onClick={() => {
                                                    setEditingLicense({
                                                        ...l,
                                                        features: l.features || {}
                                                    });
                                                    setShowEditLicense(true);
                                                }}
                                                style={{ padding: "0.5rem", borderRadius: "0.5rem", background: "rgba(37,99,235,0.1)", color: "#60a5fa", border: "none", cursor: "pointer" }}
                                            >
                                                <Edit style={{ width: "0.9rem" }} />
                                            </button>
                                            <button onClick={() => deleteLicense(l.id)} style={{ padding: "0.5rem", borderRadius: "0.5rem", background: "rgba(239,68,68,0.1)", color: "#f87171", border: "none", cursor: "pointer" }}><Trash2 style={{ width: "0.9rem" }} /></button>
                                        </div>
                                    </div>

                                    <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: "0.75rem", padding: "1rem", border: "1px solid rgba(255,255,255,0.05)" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                                            <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", fontWeight: 700 }}>Lisans AnahtarÄ±</span>
                                            <span style={{ fontSize: "0.7rem", color: "#60a5fa", fontWeight: 800 }}>{l.plan_type} PLAN</span>
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <code style={{ fontSize: "1.1rem", color: "white", letterSpacing: "1px" }}>{l.license_key}</code>
                                            <div style={{ 
                                                display: "flex", 
                                                alignItems: "center", 
                                                gap: "0.4rem", 
                                                fontSize: "0.85rem", 
                                                fontWeight: 700,
                                                color: l.total_days < 7 ? "#f87171" : (l.total_days < 30 ? "#f59e0b" : "#4ade80"),
                                                background: l.total_days < 7 ? "rgba(239,68,68,0.1)" : (l.total_days < 30 ? "rgba(245,158,11,0.1)" : "rgba(34,197,94,0.1)"),
                                                padding: "0.25rem 0.6rem",
                                                borderRadius: "0.5rem"
                                            }}>
                                                <Clock style={{ width: "0.9rem" }} /> {l.total_days} Gün Kalan
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                                        <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: "0.75rem", padding: "0.75rem", border: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                                            <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", fontWeight: 700 }}>Mağaza Limiti</span>
                                            <span style={{ fontSize: "1rem", fontWeight: 800, color: "white" }}>{l.max_stores || 1} Adet</span>
                                        </div>
                                        <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: "0.75rem", padding: "0.75rem", border: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                                            <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", fontWeight: 700 }}>Plan</span>
                                            <span style={{ fontSize: "1rem", fontWeight: 800, color: "#60a5fa" }}>{l.plan_type}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {showNewLicense && (
                            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
                                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "1.5rem", padding: "2rem", width: "100%", maxWidth: "450px" }}>
                                    <h2 style={{ marginBottom: "1.5rem" }}>Yeni Lisans Ekle</h2>
                                    <form onSubmit={createLicense} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                        <input type="text" placeholder="MÃ¼ÅŸteri AdÄ±" required value={newLicenseData.client_name} onChange={e => setNewLicenseData({ ...newLicenseData, client_name: e.target.value })} style={{ padding: "0.75rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.5rem", color: "white" }} />
                                        <input type="email" placeholder="E-posta" required value={newLicenseData.user_email} onChange={e => setNewLicenseData({ ...newLicenseData, user_email: e.target.value })} style={{ padding: "0.75rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.5rem", color: "white" }} />
                                        <input type="text" placeholder="Lisans AnahtarÄ± (Ã–rn: JETPOS-1234)" required value={newLicenseData.license_key} onChange={e => setNewLicenseData({ ...newLicenseData, license_key: e.target.value.toUpperCase() })} style={{ padding: "0.75rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.5rem", color: "white" }} />
                                        <select value={newLicenseData.plan_type} onChange={e => setNewLicenseData({ ...newLicenseData, plan_type: e.target.value })} style={{ padding: "0.75rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.5rem", color: "white" }}>
                                            <option value="BASIC">BASIC</option>
                                            <option value="PRO">PRO</option>
                                            <option value="ENTERPRISE">ENTERPRISE</option>
                                        </select>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                            <div>
                                                <label style={{ display: "block", fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginBottom: "0.5rem", fontWeight: 600 }}>Download Link</label>
                                                <input value={newLicenseData.download_link} onChange={e => setNewLicenseData({ ...newLicenseData, download_link: e.target.value })} style={{ width: "100%", padding: "0.75rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.5rem", color: "white" }} />
                                            </div>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                            <div style={{ padding: "0.5rem", background: "rgba(255,255,255,0.02)", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.05)" }}>
                                                <label style={{ display: "block", fontSize: "0.7rem", color: "rgba(255,255,255,0.5)", marginBottom: "0.5rem", fontWeight: 800, textTransform: "uppercase" }}>Ã–zellikler</label>
                                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem" }}>
                                                    {Object.entries(newLicenseData.features).map(([f, val]) => (
                                                        <label key={f} style={{ display: "flex", alignItems: "center", gap: "0.3rem", cursor: "pointer", fontSize: "0.7rem" }}>
                                                            <input type="checkbox" checked={val} onChange={e => setNewLicenseData({ ...newLicenseData, features: { ...newLicenseData.features, [f]: e.target.checked } })} />
                                                            {f.replace(/_/g, " ")}
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                            <div style={{ padding: "0.5rem", background: "rgba(255,255,255,0.02)", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.05)" }}>
                                                <label style={{ display: "block", fontSize: "0.7rem", color: "rgba(255,255,255,0.5)", marginBottom: "0.5rem", fontWeight: 800, textTransform: "uppercase" }}>Enterprise (Beyaz Etiket)</label>
                                                <input placeholder="Logo URL" value={newLicenseData.custom_logo_url} onChange={e => setNewLicenseData({ ...newLicenseData, custom_logo_url: e.target.value })} style={{ width: "100%", padding: "0.4rem", background: "rgba(30,41,59,0.5)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.4rem", color: "white", fontSize: "0.7rem", marginBottom: "0.4rem" }} />
                                                <input placeholder="Renk (Hex)" value={newLicenseData.branding_config.primary_color} onChange={e => setNewLicenseData({ ...newLicenseData, branding_config: { ...newLicenseData.branding_config, primary_color: e.target.value } })} style={{ width: "100%", padding: "0.4rem", background: "rgba(30,41,59,0.5)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.4rem", color: "white", fontSize: "0.7rem" }} />
                                            </div>
                                        </div>
                                        </div>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                            <div>
                                                <label style={{ display: "block", fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginBottom: "0.5rem", fontWeight: 600 }}>Gün SayÄ±sÄ±</label>
                                                <input type="number" placeholder="Gün SayÄ±sÄ±" value={newLicenseData.total_days} onChange={e => setNewLicenseData({ ...newLicenseData, total_days: parseInt(e.target.value) })} style={{ width: "100%", padding: "0.75rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.5rem", color: "white" }} />
                                            </div>
                                            <div>
                                                <label style={{ display: "block", fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginBottom: "0.5rem", fontWeight: 600 }}>Mağaza Limiti</label>
                                                <input type="number" placeholder="Mağaza SayÄ±sÄ±" value={newLicenseData.max_stores} onChange={e => setNewLicenseData({ ...newLicenseData, max_stores: parseInt(e.target.value) })} style={{ width: "100%", padding: "0.75rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.5rem", color: "white" }} />
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                                            <button type="button" onClick={() => setShowNewLicense(false)} style={{ flex: 1, padding: "0.75rem", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "white", cursor: "pointer" }}>İptal</button>
                                            <button type="submit" style={{ flex: 1, padding: "0.75rem", borderRadius: "0.75rem", background: "#2563eb", border: "none", color: "white", fontWeight: 700, cursor: "pointer" }}>Kaydet</button>
                                        </div>
                                    </form>
                                </motion.div>
                            </div>
                        )}

                        {showEditLicense && (
                            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
                                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "1.5rem", padding: "2rem", width: "100%", maxWidth: "450px" }}>
                                    <h2 style={{ marginBottom: "1.5rem" }}>LisansÄ± DÃ¼zenle</h2>
                                    <form onSubmit={updateLicense} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                        <input type="text" placeholder="MÃ¼ÅŸteri AdÄ±" required value={editingLicense.client_name} onChange={e => setEditingLicense({ ...editingLicense, client_name: e.target.value })} style={{ padding: "0.75rem", background: "rgba(30,41,59,0.5)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.5rem", color: "white" }} />
                                        <input type="email" placeholder="E-posta" required value={editingLicense.user_email} onChange={e => setEditingLicense({ ...editingLicense, user_email: e.target.value })} style={{ padding: "0.75rem", background: "rgba(30,41,59,0.5)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.5rem", color: "white" }} />
                                        <input type="text" placeholder="Lisans AnahtarÄ±" required value={editingLicense.license_key} onChange={e => setEditingLicense({ ...editingLicense, license_key: e.target.value.toUpperCase() })} style={{ padding: "0.75rem", background: "rgba(30,41,59,0.5)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.5rem", color: "white" }} />
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                            <div>
                                                <label style={{ display: "block", fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginBottom: "0.35rem", fontWeight: 600 }}>Plan</label>
                                                <select value={editingLicense.plan_type} onChange={e => setEditingLicense({ ...editingLicense, plan_type: e.target.value })} style={{ width: "100%", padding: "0.7rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.5rem", color: "white" }}>
                                                    <option value="BASIC">BASIC</option>
                                                    <option value="PRO">PRO</option>
                                                    <option value="ENTERPRISE">ENTERPRISE</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label style={{ display: "block", fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginBottom: "0.35rem", fontWeight: 600 }}>BitiÅŸ Tarihi</label>
                                                <input type="date" value={editingLicense.expires_at ? new Date(editingLicense.expires_at).toISOString().split('T')[0] : ""} onChange={e => setEditingLicense({ ...editingLicense, expires_at: new Date(e.target.value).toISOString() })} style={{ width: "100%", padding: "0.7rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.5rem", color: "white" }} />
                                            </div>
                                        </div>

                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                            <div style={{ padding: "0.75rem", background: "rgba(255,255,255,0.02)", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.05)" }}>
                                                <label style={{ display: "block", fontSize: "0.7rem", color: "rgba(255,255,255,0.5)", marginBottom: "0.75rem", fontWeight: 800, textTransform: "uppercase" }}>Ã–zellik Paketi</label>
                                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                                                    {Object.entries({
                                                        adisyon: "Adisyon",
                                                        mobile_app: "Mobil",
                                                        trendyol_go: "Trendyol",
                                                        getir: "GetirYemek",
                                                        qnb_invoice: "QNB Fatura",
                                                        ai_features: "AI Asistan"
                                                    }).map(([f, label]) => (
                                                        <label key={f} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.75rem", color: editingLicense.features[f] ? "#60a5fa" : "rgba(255,255,255,0.4)" }}>
                                                            <input type="checkbox" checked={editingLicense.features[f] || false} onChange={e => setEditingLicense({ ...editingLicense, features: { ...editingLicense.features, [f]: e.target.checked } })} />
                                                            {label}
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                            <div style={{ padding: "0.75rem", background: "rgba(255,255,255,0.02)", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.05)" }}>
                                                <label style={{ display: "block", fontSize: "0.7rem", color: "rgba(255,255,255,0.5)", marginBottom: "0.75rem", fontWeight: 800, textTransform: "uppercase" }}>Enterprise (Markalama)</label>
                                                <input placeholder="Logo URL" value={editingLicense.custom_logo_url || ""} onChange={e => setEditingLicense({ ...editingLicense, custom_logo_url: e.target.value })} style={{ width: "100%", padding: "0.5rem", background: "rgba(30,41,59,0.5)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.5rem", color: "white", fontSize: "0.8rem", marginBottom: "0.5rem" }} />
                                                <input placeholder="Birincil Renk" value={editingLicense.branding_config?.primary_color || ""} onChange={e => setEditingLicense({ ...editingLicense, branding_config: { ...editingLicense.branding_config, primary_color: e.target.value } })} style={{ width: "100%", padding: "0.5rem", background: "rgba(30,41,59,0.5)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.5rem", color: "white", fontSize: "0.8rem" }} />
                                            </div>
                                        </div>

                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                            <div>
                                                <label style={{ display: "block", fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginBottom: "0.35rem", fontWeight: 600 }}>Mağaza Limiti</label>
                                                <input type="number" value={editingLicense.max_stores || 1} onChange={e => setEditingLicense({ ...editingLicense, max_stores: parseInt(e.target.value) })} style={{ width: "100%", padding: "0.7rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.5rem", color: "white" }} />
                                            </div>
                                            <div>
                                                {/* Gelecekte eklemek için boÅŸluk */}
                                            </div>
                                        </div>

                                        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                                            <button type="button" onClick={() => setShowEditLicense(false)} style={{ flex: 1, padding: "0.75rem", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "white", cursor: "pointer" }}>İptal</button>
                                            <button type="submit" style={{ flex: 1, padding: "0.75rem", borderRadius: "0.75rem", background: "#2563eb", border: "none", color: "white", fontWeight: 700, cursor: "pointer" }}>Güncelle</button>
                                        </div>
                                    </form>
                                </motion.div>
                            </div>
                        )}
                    </>
                )}

                {activeTab === "blog" && (
                    <>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                            <div>
                                <h2 style={{ fontSize: "1.5rem", fontWeight: 900, marginBottom: "0.25rem" }}>Blog YÃ¶netimi</h2>
                                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.875rem" }}>{blogPosts.length} yazÄ± Â· {blogPosts.filter(p => p.published).length} yayÄ±nda</p>
                            </div>
                            <div style={{ display: "flex", gap: "0.75rem" }}>
                                <a href="/blog" target="_blank" style={{ padding: "0.6rem 1rem", borderRadius: "0.6rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", textDecoration: "none", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                    <Globe style={{ width: "0.85rem" }} /> Siteyi GÃ¶r
                                </a>
                                <button onClick={() => { setEditingPost(null); setPostForm({ title: "", slug: "", excerpt: "", content: "", category: "Genel", author: "JetPOS Ekibi", read_time: 5, published: false, featured: false }); setShowNewPost(true); }} style={{ padding: "0.6rem 1.25rem", borderRadius: "0.6rem", background: "#2563eb", border: "none", color: "white", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem" }}>
                                    <Plus style={{ width: "0.9rem" }} /> Yeni YazÄ±
                                </button>
                            </div>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            {blogPosts.map((post) => (
                                <motion.div key={post.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "1rem", padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", gap: "1.25rem" }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.25rem" }}>
                                            <span style={{ fontWeight: 800, color: "white", fontSize: "0.95rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{post.title}</span>
                                            {post.featured && <span style={{ fontSize: "0.6rem", fontWeight: 800, background: "rgba(245,158,11,0.15)", color: "#f59e0b", padding: "0.1rem 0.4rem", borderRadius: "4px", flexShrink: 0 }}>Ã–NE Ã‡IKAN</span>}
                                        </div>
                                        <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)" }}>{post.category} Â· {post.read_time} dk Â· /blog/{post.slug}</div>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
                                        <button onClick={() => togglePublish(post)} style={{ padding: "0.35rem 0.875rem", borderRadius: "9999px", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.75rem", background: post.published ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.07)", color: post.published ? "#4ade80" : "rgba(255,255,255,0.4)" }}>
                                            {post.published ? "âœ“ YayÄ±nda" : "Taslak"}
                                        </button>
                                        <a href={`/blog/${post.slug}`} target="_blank" style={{ padding: "0.35rem", borderRadius: "0.4rem", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", textDecoration: "none", display: "flex" }}><Eye style={{ width: "0.85rem" }} /></a>
                                        <button onClick={() => { setEditingPost(post); setPostForm({ title: post.title, slug: post.slug, excerpt: post.excerpt || "", content: post.content || "", category: post.category || "Genel", author: post.author || "JetPOS Ekibi", read_time: post.read_time || 5, published: post.published, featured: post.featured }); setShowNewPost(true); }} style={{ padding: "0.35rem", borderRadius: "0.4rem", background: "rgba(37,99,235,0.1)", color: "#60a5fa", border: "none", cursor: "pointer", display: "flex" }}><Edit style={{ width: "0.85rem" }} /></button>
                                        <button onClick={() => deletePost(post.id)} style={{ padding: "0.35rem", borderRadius: "0.4rem", background: "rgba(239,68,68,0.1)", color: "#f87171", border: "none", cursor: "pointer", display: "flex" }}><Trash2 style={{ width: "0.85rem" }} /></button>
                                    </div>
                                </motion.div>
                            ))}
                            {blogPosts.length === 0 && (
                                <div style={{ textAlign: "center", padding: "3rem", color: "rgba(255,255,255,0.25)" }}>
                                    <FileText style={{ width: "3rem", margin: "0 auto 1rem", display: "block" }} />
                                    <p>HenÃ¼z blog yazÄ±sÄ± yok. Yeni YazÄ± butonuna tÄ±klayÄ±n.</p>
                                </div>
                            )}
                        </div>

                        {showNewPost && (
                            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "1rem" }}>
                                <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "1.5rem", padding: "2rem", width: "100%", maxWidth: "680px", maxHeight: "90vh", overflowY: "auto" }}>
                                    <h2 style={{ marginBottom: "1.5rem", fontWeight: 800 }}>{editingPost ? "YazÄ±yÄ± DÃ¼zenle" : "Yeni Blog YazÄ±sÄ±"}</h2>
                                    <form onSubmit={savePost} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                            <div>
                                                <label style={{ display: "block", fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginBottom: "0.35rem", fontWeight: 600 }}>BaÅŸlÄ±k *</label>
                                                <input value={postForm.title} onChange={e => { setPostForm(p => ({ ...p, title: e.target.value, slug: p.slug || e.target.value.toLowerCase().replace(/ÄŸ/g, 'g').replace(/Ã¼/g, 'u').replace(/ÅŸ/g, 's').replace(/Ä±/g, 'i').replace(/Ã¶/g, 'o').replace(/ç/g, 'c').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') })); }} required placeholder="YazÄ± baÅŸlÄ±ÄŸÄ±" style={{ width: "100%", padding: "0.7rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.5rem", color: "white", fontFamily: "inherit" }} />
                                            </div>
                                            <div>
                                                <label style={{ display: "block", fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginBottom: "0.35rem", fontWeight: 600 }}>Slug (URL) *</label>
                                                <input value={postForm.slug} onChange={e => setPostForm(p => ({ ...p, slug: e.target.value }))} required placeholder="yazi-url-slug" style={{ width: "100%", padding: "0.7rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.5rem", color: "white", fontFamily: "inherit" }} />
                                            </div>
                                        </div>
                                        <div>
                                            <label style={{ display: "block", fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginBottom: "0.35rem", fontWeight: 600 }}>Ã–zet</label>
                                            <textarea value={postForm.excerpt} onChange={e => setPostForm(p => ({ ...p, excerpt: e.target.value }))} rows={2} placeholder="KÄ±sa açÄ±klama (listede gÃ¶rünÃ¼r)" style={{ width: "100%", padding: "0.7rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.5rem", color: "white", fontFamily: "inherit", resize: "vertical" }} />
                                        </div>
                                        <div>
                                            <label style={{ display: "block", fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginBottom: "0.35rem", fontWeight: 600 }}>İçerik (Markdown)</label>
                                            <textarea value={postForm.content} onChange={e => setPostForm(p => ({ ...p, content: e.target.value }))} rows={10} placeholder="## BaÅŸlÄ±k&#10;İçerik buraya..." style={{ width: "100%", padding: "0.7rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.5rem", color: "white", fontFamily: "monospace", fontSize: "0.875rem", resize: "vertical" }} />
                                        </div>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                                            <div>
                                                <label style={{ display: "block", fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginBottom: "0.35rem", fontWeight: 600 }}>Kategori</label>
                                                <select value={postForm.category} onChange={e => setPostForm(p => ({ ...p, category: e.target.value }))} style={{ width: "100%", padding: "0.7rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.5rem", color: "white" }}>
                                                    {["Genel", "Rehber", "E-Ticaret & Fatura", "Stok & Depo", "Teknoloji"].map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label style={{ display: "block", fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginBottom: "0.35rem", fontWeight: 600 }}>Yazar</label>
                                                <input value={postForm.author} onChange={e => setPostForm(p => ({ ...p, author: e.target.value }))} style={{ width: "100%", padding: "0.7rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.5rem", color: "white", fontFamily: "inherit" }} />
                                            </div>
                                            <div>
                                                <label style={{ display: "block", fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginBottom: "0.35rem", fontWeight: 600 }}>Okuma (dk)</label>
                                                <input type="number" value={postForm.read_time} onChange={e => setPostForm(p => ({ ...p, read_time: parseInt(e.target.value) }))} style={{ width: "100%", padding: "0.7rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.5rem", color: "white", fontFamily: "inherit" }} />
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", gap: "1.5rem" }}>
                                            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.875rem", color: "rgba(255,255,255,0.7)" }}>
                                                <input type="checkbox" checked={postForm.published} onChange={e => setPostForm(p => ({ ...p, published: e.target.checked }))} />
                                                YayÄ±nda
                                            </label>
                                            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.875rem", color: "rgba(255,255,255,0.7)" }}>
                                                <input type="checkbox" checked={postForm.featured} onChange={e => setPostForm(p => ({ ...p, featured: e.target.checked }))} />
                                                Ã–ne Ã‡Ä±kan
                                            </label>
                                        </div>
                                        <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
                                            <button type="button" onClick={() => { setShowNewPost(false); setEditingPost(null); }} style={{ flex: 1, padding: "0.875rem", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "white", cursor: "pointer", fontFamily: "inherit" }}>İptal</button>
                                            <button type="submit" disabled={savingPost} style={{ flex: 2, padding: "0.875rem", borderRadius: "0.75rem", background: "#2563eb", border: "none", color: "white", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                                                {savingPost ? "Kaydediliyor..." : (editingPost ? "Güncelle" : "OluÅŸtur")}
                                            </button>
                                        </div>
                                    </form>
                                </motion.div>
                            </div>
                        )}
                    </>
                )}

                {activeTab === "guides" && (
                    <>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                            <div>
                                <h2 style={{ fontSize: "1.5rem", fontWeight: 900, marginBottom: "0.25rem" }}>MÃ¼ÅŸteri Rehberi YÃ¶netimi</h2>
                                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.875rem" }}>MÃ¼ÅŸteri portalÄ±ndaki rehberleri buradan dÃ¼zenleyin</p>
                            </div>
                            <div style={{ display: "flex", gap: "0.75rem" }}>
                                <a href="/portal" target="_blank" style={{ padding: "0.6rem 1rem", borderRadius: "0.6rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", textDecoration: "none", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                    <Globe style={{ width: "0.85rem" }} /> Portal GÃ¶r
                                </a>
                                <button onClick={() => { setEditingGuide(null); setGuideForm({ title: "", content: "", order_index: (guides.length + 1), is_active: true }); setShowNewGuide(true); }} style={{ padding: "0.6rem 1.25rem", borderRadius: "0.6rem", background: "#2563eb", border: "none", color: "white", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem" }}>
                                    <Plus style={{ width: "0.9rem" }} /> Yeni Rehber
                                </button>
                            </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))", gap: "1rem" }}>
                            {guides.map((guide) => (
                                <motion.div key={guide.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "1rem", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                            <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "0.75rem", background: "rgba(168,85,247,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#a855f7" }}>
                                                <BookOpen style={{ width: "1.1rem" }} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 800, fontSize: "1.1rem" }}>{guide.title}</div>
                                                <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)" }}>SÄ±ra: {guide.order_index}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", gap: "0.5rem" }}>
                                            <button onClick={() => { setEditingGuide(guide); setGuideForm({ title: guide.title, content: guide.content, order_index: guide.order_index, is_active: guide.is_active }); setShowNewGuide(true); }} style={{ padding: "0.5rem", borderRadius: "0.50rem", background: "rgba(59,130,246,0.1)", color: "#60a5fa", border: "none" }}><Edit style={{ width: "0.9rem" }} /></button>
                                            <button onClick={() => deleteGuide(guide.id)} style={{ padding: "0.5rem", borderRadius: "0.50rem", background: "rgba(239,68,68,0.1)", color: "#f87171", border: "none" }}><Trash2 style={{ width: "0.9rem" }} /></button>
                                        </div>
                                    </div>
                                    <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.5, margin: 0, height: "4.5em", overflow: "hidden" }}>{guide.content}</p>
                                    {!guide.is_active && <div style={{ fontSize: "0.7rem", color: "rgba(239,68,68,1)", fontWeight: 800 }}>â€¢ PASİF</div>}
                                </motion.div>
                            ))}
                        </div>

                        {showNewGuide && (
                            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "1rem" }}>
                                <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "1.5rem", padding: "2rem", width: "100%", maxWidth: "600px" }}>
                                    <h2 style={{ marginBottom: "1.5rem", fontWeight: 800 }}>{editingGuide ? "Rehberi DÃ¼zenle" : "Yeni Rehber Ekle"}</h2>
                                    <form onSubmit={saveGuide} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                                        <div>
                                            <label style={{ display: "block", fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginBottom: "0.5rem", fontWeight: 600 }}>BaÅŸlÄ±k</label>
                                            <input value={guideForm.title} onChange={e => setGuideForm({ ...guideForm, title: e.target.value })} required style={{ width: "100%", padding: "0.75rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.5rem", color: "white" }} />
                                        </div>
                                        <div>
                                            <label style={{ display: "block", fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginBottom: "0.5rem", fontWeight: 600 }}>İçerik</label>
                                            <textarea value={guideForm.content} onChange={e => setGuideForm({ ...guideForm, content: e.target.value })} rows={6} required style={{ width: "100%", padding: "0.75rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.5rem", color: "white" }} />
                                        </div>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                            <div>
                                                <label style={{ display: "block", fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginBottom: "0.5rem", fontWeight: 600 }}>SÄ±ra (GÃ¶rünÃ¼m SÄ±rasÄ±)</label>
                                                <input type="number" value={guideForm.order_index} onChange={e => setGuideForm({ ...guideForm, order_index: parseInt(e.target.value) })} style={{ width: "100%", padding: "0.75rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.5rem", color: "white" }} />
                                            </div>
                                            <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: "0.75rem" }}>
                                                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                                                    <input type="checkbox" checked={guideForm.is_active} onChange={e => setGuideForm({ ...guideForm, is_active: e.target.checked })} />
                                                    Aktif mi?
                                                </label>
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                                            <button type="button" onClick={() => setShowNewGuide(false)} style={{ flex: 1, padding: "0.875rem", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "white" }}>İptal</button>
                                            <button type="submit" disabled={savingGuide} style={{ flex: 2, padding: "0.875rem", borderRadius: "0.75rem", background: "#2563eb", color: "white", fontWeight: 700 }}>{savingGuide ? "Kaydediliyor..." : (editingGuide ? "Güncelle" : "OluÅŸtur")}</button>
                                        </div>
                                    </form>
                                </motion.div>
                            </div>
                        )}
                    </>
                )}

                {activeTab === "tickets" && (
                    <div style={{ animation: "fadeIn 0.3s ease-out" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                            <div>
                                <h2 style={{ fontSize: "1.5rem", fontWeight: 900, marginBottom: "0.25rem" }}>Destek Talepleri</h2>
                                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.875rem" }}>MÃ¼ÅŸterilerden gelen yardÄ±m talepleri</p>
                            </div>
                        </div>

                        <div style={{ display: "grid", gap: "1rem" }}>
                            {tickets.length > 0 ? tickets.map(t => (
                                <div key={t.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "1rem", padding: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
                                        <div style={{ width: "3rem", height: "3rem", borderRadius: "1rem", background: t.status === 'open' ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)', color: t.status === 'open' ? '#4ade80' : 'rgba(255,255,255,0.4)', display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <MessageSquare style={{ width: "1.5rem" }} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 800, fontSize: "1.1rem", marginBottom: "0.25rem" }}>{t.subject}</div>
                                            <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.4)" }}>
                                                <span style={{ fontWeight: 700, color: "white" }}>{(t.tenants as any)?.company_name}</span> â€¢ {new Date(t.created_at).toLocaleString('tr-TR')}
                                            </div>
                                            <p style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "rgba(255,255,255,0.7)", maxWidth: "600px" }}>{t.message}</p>
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", gap: "0.75rem" }}>
                                        {t.status === 'open' ? (
                                            <button onClick={() => updateTicketStatus(t.id, 'closed')} style={{ padding: "0.6rem 1rem", borderRadius: "0.6rem", background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.2)", color: "#4ade80", fontWeight: 700, cursor: "pointer" }}>Ã‡Ã¶zÃ¼ldÃ¼ Olarak İÅŸaretle</button>
                                        ) : (
                                            <button onClick={() => updateTicketStatus(t.id, 'open')} style={{ padding: "0.6rem 1rem", borderRadius: "0.6rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontWeight: 700, cursor: "pointer" }}>Geri Aç</button>
                                        )}
                                    </div>
                                </div>
                            )) : (
                                <div style={{ textAlign: "center", padding: "4rem", color: "rgba(255,255,255,0.2)" }}>HenÃ¼z destek talebi bulunmuyor.</div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === "announcements" && (
                    <div style={{ animation: "fadeIn 0.3s ease-out" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                            <div>
                                <h2 style={{ fontSize: "1.5rem", fontWeight: 900, marginBottom: "0.25rem" }}>Sistem DuyurularÄ±</h2>
                                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.875rem" }}>TÃ¼m mÃ¼ÅŸterilere gidecek global mesajlar</p>
                            </div>
                            <button onClick={() => setShowNewAnnounce(true)} style={{ padding: "0.75rem 1.5rem", borderRadius: "0.75rem", background: "#f59e0b", color: "#000", fontWeight: 800, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <Plus style={{ width: "1.1rem" }} /> Yeni Duyuru
                            </button>
                        </div>

                        <div style={{ display: "grid", gap: "1rem" }}>
                            {announcements.map(a => (
                                <div key={a.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "1.5rem", padding: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                    <div style={{ display: "flex", gap: "1.25rem" }}>
                                        <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "0.75rem", background: "rgba(245,158,11,0.1)", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <Bell style={{ width: "1.25rem" }} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 800, fontSize: "1.1rem", marginBottom: "0.25rem" }}>{a.title}</div>
                                            <p style={{ fontSize: "0.95rem", color: "rgba(255,255,255,0.5)", margin: 0, lineHeight: 1.6 }}>{a.message}</p>
                                            <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.2)", marginTop: "0.75rem" }}>{new Date(a.created_at).toLocaleString('tr-TR')}</div>
                                        </div>
                                    </div>
                                    <button onClick={() => deleteAnnounce(a.id)} style={{ padding: "0.5rem", borderRadius: "0.5rem", background: "rgba(239,68,68,0.1)", border: "none", color: "#ef4444", cursor: "pointer" }}><Trash2 style={{ width: "1.1rem" }} /></button>
                                </div>
                            ))}
                        </div>

                        {showNewAnnounce && (
                            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
                                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "2rem", padding: "2.5rem", width: "100%", maxWidth: "500px" }}>
                                    <h3 style={{ fontSize: "1.5rem", fontWeight: 900, marginBottom: "2rem" }}>Yeni Duyuru YayÄ±nla</h3>
                                    <form onSubmit={saveAnnounce} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                                        <div>
                                            <label style={{ display: "block", fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginBottom: "0.5rem", fontWeight: 700, textTransform: "uppercase" }}>BaÅŸlÄ±k</label>
                                            <input required value={announceForm.title} onChange={e => setAnnounceForm({ ...announceForm, title: e.target.value })} style={{ width: "100%", padding: "0.875rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.75rem", color: "white" }} />
                                        </div>
                                        <div>
                                            <label style={{ display: "block", fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginBottom: "0.5rem", fontWeight: 700, textTransform: "uppercase" }}>Mesaj</label>
                                            <textarea required value={announceForm.message} onChange={e => setAnnounceForm({ ...announceForm, message: e.target.value })} rows={4} style={{ width: "100%", padding: "0.875rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.75rem", color: "white", resize: "none" }} />
                                        </div>
                                        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                                            <button type="button" onClick={() => setShowNewAnnounce(false)} style={{ flex: 1, padding: "1rem", borderRadius: "1rem", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontWeight: 700, cursor: "pointer" }}>İptal</button>
                                            <button type="submit" disabled={savingAnnounce} style={{ flex: 2, padding: "1rem", borderRadius: "1rem", background: "#f59e0b", color: "#000", fontWeight: 800, border: "none", cursor: "pointer" }}>
                                                {savingAnnounce ? "YayÄ±nlanÄ±yor..." : "Duyuruyu YayÄ±nla"}
                                            </button>
                                        </div>
                                    </form>
                                </motion.div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "about" && (
                    <>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                            <div>
                                <h2 style={{ fontSize: "1.5rem", fontWeight: 900, marginBottom: "0.25rem" }}>HakkÄ±mÄ±zda YÃ¶netimi</h2>
                                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.875rem" }}>Site içeriÄŸini buradan dÃ¼zenleyin</p>
                            </div>
                            <a href="/hakkimizda" target="_blank" style={{ padding: "0.6rem 1rem", borderRadius: "0.6rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", textDecoration: "none", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                <Globe style={{ width: "0.85rem" }} /> SayfayÄ± GÃ¶r
                            </a>
                        </div>

                        {["hero", "story"].map(section => {
                            const data = aboutContent[section] ?? {};
                            return (
                                <div key={section} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "1rem", padding: "1.5rem", marginBottom: "1rem" }}>
                                    <h3 style={{ fontWeight: 800, color: "white", marginBottom: "1rem", textTransform: "capitalize" }}>{section === "hero" ? "ğŸ  Hero BÃ¶lÃ¼mÃ¼" : "ğŸ“– Hikaye BÃ¶lÃ¼mÃ¼"}</h3>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                        {Object.entries(data).map(([key, val]) => (
                                            typeof val === "string" ? (
                                                <div key={key}>
                                                    <label style={{ display: "block", fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", fontWeight: 700, marginBottom: "0.3rem", textTransform: "uppercase" }}>{key}</label>
                                                    <input defaultValue={val} id={`about-${section}-${key}`} style={{ width: "100%", padding: "0.625rem 0.875rem", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.5rem", color: "white", fontFamily: "inherit", fontSize: "0.875rem" }} />
                                                </div>
                                            ) : null
                                        ))}
                                        <button onClick={() => {
                                            const updated = { ...data };
                                            Object.keys(data).forEach(key => {
                                                if (typeof data[key] === "string") {
                                                    const el = document.getElementById(`about-${section}-${key}`) as HTMLInputElement;
                                                    if (el) updated[key] = el.value;
                                                }
                                            });
                                            saveAboutSection(section, updated);
                                        }} disabled={savingAbout} style={{ alignSelf: "flex-start", padding: "0.5rem 1.25rem", borderRadius: "0.5rem", background: "#2563eb", border: "none", color: "white", fontWeight: 700, cursor: "pointer", fontSize: "0.85rem" }}>
                                            {savingAbout ? "Kaydediliyor..." : "Kaydet"}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}

                        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "1rem", padding: "1.5rem" }}>
                            <h3 style={{ fontWeight: 800, color: "white", marginBottom: "0.75rem" }}>ğŸ“Š İstatistikler</h3>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.75rem" }}>
                                {((aboutContent.stats ?? {}).items ?? []).map((item: any, i: number) => (
                                    <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "0.75rem", padding: "0.875rem" }}>
                                        <input defaultValue={item.value} id={`stat-val-${i}`} placeholder="DeÄŸer" style={{ width: "100%", padding: "0.375rem 0.5rem", background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.1)", color: "white", fontWeight: 800, fontSize: "1.1rem", marginBottom: "0.375rem", fontFamily: "inherit" }} />
                                        <input defaultValue={item.label} id={`stat-lbl-${i}`} placeholder="Etiket" style={{ width: "100%", padding: "0.375rem 0.5rem", background: "transparent", border: "none", color: "rgba(255,255,255,0.5)", fontSize: "0.8rem", fontFamily: "inherit" }} />
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => {
                                const items = ((aboutContent.stats ?? {}).items ?? []).map((item: any, i: number) => ({
                                    value: (document.getElementById(`stat-val-${i}`) as HTMLInputElement)?.value ?? item.value,
                                    label: (document.getElementById(`stat-lbl-${i}`) as HTMLInputElement)?.value ?? item.label,
                                }));
                                saveAboutSection("stats", { items });
                            }} disabled={savingAbout} style={{ marginTop: "1rem", padding: "0.5rem 1.25rem", borderRadius: "0.5rem", background: "#2563eb", border: "none", color: "white", fontWeight: 700, cursor: "pointer", fontSize: "0.85rem" }}>
                                {savingAbout ? "Kaydediliyor..." : "İstatistikleri Kaydet"}
                            </button>
                        </div>
                    </>
                )}
            </div>
            </main>

            <AnimatePresence>
                {toast && (
                    <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} style={{
                        position: "fixed", bottom: "2rem", left: "50%", transform: "translateX(-50%)",
                        padding: "1rem 2rem", borderRadius: "1rem",
                        background: toast.type === "success" ? "#10b981" : "#ef4444",
                        color: "white", fontWeight: 700, boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
                        zIndex: 1000, display: "flex", alignItems: "center", gap: "0.75rem"
                    }}>
                        {toast.type === "success" ? <CheckCircle2 style={{ width: "1.25rem" }} /> : <AlertCircle style={{ width: "1.25rem" }} />}
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                
                @media (max-width: 1024px) {
                    .admin-sidebar { display: none !important; }
                    .admin-mobile-header { display: flex !important; }
                    .admin-main-content { margin-left: 0 !important; padding: 2rem 1.5rem !important; }
                }

                @media (max-width: 640px) {
                    .stats-grid { grid-template-columns: 1fr !important; }
                    .admin-main-content { padding: 1.5rem 1rem !important; }
                }

                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
            `}</style>
        </div>
    );
}
