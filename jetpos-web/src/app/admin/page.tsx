"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Lock, LogOut, Check, CheckCircle2, PhoneCall,
    Search, Mail, Plus, Globe,
    RefreshCw, Sparkles, TrendingUp, AlertCircle, Eye, EyeOff,
    LayoutDashboard, Trash2, Edit, BookOpen, ExternalLink, Calendar,
    FileText, Building2, ShieldCheck, Clock, MessageSquare, Bell, Menu, X, Heart,
    ShoppingCart, CreditCard, Package, Gamepad2, Users, User, UserPlus, KeyRound
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { type GameConfig } from "@/lib/game-config";

// Güvenli admin fetch – service role key server'da kalır
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

type AdminPanelUser = {
    name: string;
    role: "owner" | "admin" | "staff";
    permissions: Record<string, boolean> | null;
};

type StaffMember = {
    id: string;
    username: string;
    name: string;
    role: "admin" | "staff";
    permissions: Record<string, boolean>;
    allowed_ips: string[];
    active: boolean;
    last_login_at: string | null;
    created_at: string;
};

// "1.2.3.4, 85.100.*" → temiz dizi
const parseIpList = (s: string): string[] =>
    s.split(",").map(x => x.trim()).filter(Boolean).slice(0, 20);

// Staff rolü için açılıp kapatılabilen bölümler
const PERM_OPTIONS: { key: string; label: string }[] = [
    { key: "orders", label: "Siparişler" },
    { key: "requests", label: "Yeni Talepler" },
    { key: "early_access", label: "Erken Erişim" },
    { key: "licenses", label: "Lisanslar" },
    { key: "crm", label: "CRM" },
    { key: "tickets", label: "Destek" },
    { key: "announcements", label: "Duyurular" },
    { key: "blog", label: "Blog" },
    { key: "guides", label: "Rehberler" },
    { key: "about", label: "Hakkımızda" },
    { key: "game", label: "Oyun Ayarları" },
];

// Sekme → izin anahtarı (null = herkes görür)
const TAB_PERMS: Record<string, string | null> = {
    dashboard: null, orders: "orders", requests: "requests", "early-access": "early_access",
    licenses: "licenses", tickets: "tickets", announcements: "announcements", crm: "crm",
    blog: "blog", guides: "guides", about: "about", game: "game",
};

const ROLE_BADGES: Record<string, { label: string; color: string; bg: string }> = {
    owner: { label: "SÜPER ADMİN", color: "#f0b429", bg: "rgba(240,180,41,0.12)" },
    admin: { label: "ADMİN", color: "#7886C7", bg: "rgba(120,134,199,0.15)" },
    staff: { label: "EKİP", color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
};

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
    new: { label: "Yeni", color: "#7886C7", bg: "rgba(120, 134, 199,0.15)", icon: AlertCircle },
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
    const [showPw, setShowPw] = useState(false);
    const [loggingIn, setLoggingIn] = useState(false);
    const [pwFocused, setPwFocused] = useState(false);
    const [loginUsername, setLoginUsername] = useState("");
    const [adminUser, setAdminUser] = useState<AdminPanelUser | null>(null);

    // Ekip & Yetkiler
    const [staffList, setStaffList] = useState<StaffMember[]>([]);
    const [staffForm, setStaffForm] = useState({ username: "", name: "", password: "", role: "staff" as "staff" | "admin", allowedIps: "" });
    const [staffFormPerms, setStaffFormPerms] = useState<Record<string, boolean>>({});
    const [savingStaff, setSavingStaff] = useState(false);
    const [callerIp, setCallerIp] = useState("");
    const [activeTab, setActiveTab] = useState<"dashboard" | "requests" | "licenses" | "blog" | "guides" | "about" | "tickets" | "announcements" | "crm" | "early-access" | "orders" | "game" | "staff">("dashboard");
    const [orders, setOrders] = useState<any[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
    const [orderSearch, setOrderSearch] = useState("");
    const [blogPosts, setBlogPosts] = useState<any[]>([]);
    const [aboutContent, setAboutContent] = useState<Record<string, any>>({});
    const [showNewPost, setShowNewPost] = useState(false);
    const [editingPost, setEditingPost] = useState<any | null>(null);
    const [postForm, setPostForm] = useState({ title: "", slug: "", excerpt: "", content: "", category: "Genel", author: "JetPOS Ekibi", read_time: 5, published: false, featured: false });
    const [savingPost, setSavingPost] = useState(false);
    const [savingAbout, setSavingAbout] = useState(false);
    const [requests, setRequests] = useState<DemoRequest[]>([]);
    const [earlyAccessSignups, setEarlyAccessSignups] = useState<{ id: string; email: string; created_at: string }[]>([]);
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
        branding_config: { primary_color: "#7886C7", hide_jetpos_badge: false },
        max_stores: 1
    });

    // Edit license state
    const [showEditLicense, setShowEditLicense] = useState(false);
    const [editingLicense, setEditingLicense] = useState<any>(null);

    // Oyun ayarları (Sepete Yakala)
    const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);
    const [savingGame, setSavingGame] = useState(false);

    useEffect(() => {
        const saved = sessionStorage.getItem("jetpos_admin_auth");
        if (saved === "true") {
            try {
                const u = sessionStorage.getItem("jetpos_admin_user");
                if (u) setAdminUser(JSON.parse(u));
            } catch { /* yoksay */ }
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
        loadEarlyAccessSignups();
        loadLicenses();
        loadBlogPosts();
        loadAboutContent();
        loadGuides();
        loadTickets();
        loadAnnouncements();
        loadCrmStats();
        loadGameConfig();
        loadStaff();
    };

    const loadStaff = async () => {
        try {
            const res = await adminFetch("/api/admin/staff");
            if (res.ok) {
                setStaffList(await res.json());
                setCallerIp(res.headers.get("x-caller-ip") || "");
            }
        } catch (e) { console.error(e); }
    };

    const createStaff = async () => {
        if (savingStaff) return;
        setSavingStaff(true);
        try {
            const res = await adminFetch("/api/admin/staff", {
                method: "POST",
                body: JSON.stringify({
                    ...staffForm,
                    permissions: staffForm.role === "staff" ? staffFormPerms : {},
                    allowed_ips: parseIpList(staffForm.allowedIps),
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Eklenemedi");
            setStaffForm({ username: "", name: "", password: "", role: "staff", allowedIps: "" });
            setStaffFormPerms({});
            loadStaff();
            showToast("Ekip üyesi eklendi");
        } catch (e) {
            showToast(e instanceof Error ? e.message : "Hata", "error");
        } finally {
            setSavingStaff(false);
        }
    };

    const patchStaff = async (id: string, updates: Record<string, unknown>, okMsg = "Güncellendi") => {
        try {
            const res = await adminFetch(`/api/admin/staff?id=${id}`, { method: "PATCH", body: JSON.stringify(updates) });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Hata");
            loadStaff();
            showToast(okMsg);
        } catch (e) {
            showToast(e instanceof Error ? e.message : "Hata", "error");
        }
    };

    const removeStaff = async (id: string, username: string) => {
        if (!window.confirm(`"${username}" silinsin mi? Bu işlem geri alınamaz.`)) return;
        try {
            const res = await adminFetch(`/api/admin/staff?id=${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Silinemedi");
            loadStaff();
            showToast("Üye silindi");
        } catch (e) {
            showToast(e instanceof Error ? e.message : "Hata", "error");
        }
    };

    const canSee = (tabId: string): boolean => {
        if (tabId === "staff") return !adminUser || adminUser.role !== "staff";
        if (!adminUser || adminUser.role === "owner" || adminUser.role === "admin") return true;
        const perm = TAB_PERMS[tabId];
        return perm === null || perm === undefined || adminUser.permissions?.[perm] === true;
    };

    const loadGameConfig = async () => {
        try {
            const res = await adminFetch("/api/admin/game-config");
            if (res.ok) setGameConfig(await res.json());
        } catch (e) { console.error(e); }
    };

    const saveGameConfig = async () => {
        if (!gameConfig) return;
        setSavingGame(true);
        try {
            const res = await adminFetch("/api/admin/game-config", {
                method: "PATCH",
                body: JSON.stringify(gameConfig),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Kaydedilemedi");
            setGameConfig(data.config); // sunucuda normalize edilmiş hali
            showToast("Oyun ayarları kaydedildi");
        } catch (e) {
            showToast(e instanceof Error ? e.message : "Kaydetme hatası", "error");
        } finally {
            setSavingGame(false);
        }
    };

    const loadEarlyAccessSignups = async () => {
        try {
            const res = await adminFetch("/api/admin/early-access");
            if (res.ok) setEarlyAccessSignups(await res.json());
            else if (res.status === 401) showToast("Yetki hatası", "error");
        } catch (e) { console.error(e); }
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
            if (res.ok) showToast(editingGuide ? "Rehber güncellendi" : "Rehber oluşturuldu");
            else showToast("Hata oluştu", "error");
            setShowNewGuide(false);
            setEditingGuide(null);
            setGuideForm({ title: "", content: "", order_index: 0, is_active: true });
            loadGuides();
        } finally { setSavingGuide(false); }
    };

    const deleteGuide = async (id: string) => {
        if (!confirm("Bu rehberi silmek istediğinize emin misiniz?")) return;
        const res = await adminFetch(`/api/admin/guides?id=${id}`, { method: "DELETE" });
        if (res.ok) showToast("Rehber silindi");
        loadGuides();
    };

    const loadBlogPosts = async () => {
        try {
            const res = await adminFetch("/api/admin/blog");
            if (res.ok) setBlogPosts(await res.json());
            else if (res.status === 401) showToast("Yetki hatası", "error");
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
            if (res.ok) showToast(editingPost ? "Yazı güncellendi" : "Yazı oluşturuldu");
            else showToast("Hata oluştu", "error");
            setShowNewPost(false);
            setEditingPost(null);
            setPostForm({ title: "", slug: "", excerpt: "", content: "", category: "Genel", author: "JetPOS Ekibi", read_time: 5, published: false, featured: false });
            loadBlogPosts();
        } finally { setSavingPost(false); }
    };

    const deletePost = async (id: string) => {
        if (!confirm("Bu yazıyı silmek istediğinize emin misiniz?")) return;
        const res = await adminFetch(`/api/admin/blog?id=${id}`, { method: "DELETE" });
        if (res.ok) showToast("Yazı silindi");
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
                showToast("Duyuru yayınlandı");
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
        if (!confirm("Bu duyuruyu silmek istediğinize emin misiniz?")) return;
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
            if (res.ok) {
                const data: DemoRequest[] = await res.json();
                setRequests(data.filter(r => !r.message?.includes("[SATIN AL FORMU]")));
                setOrders(data.filter(r => r.message?.includes("[SATIN AL FORMU]")));
            }
            else if (res.status === 401) showToast("Yetki hatası", "error");
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const loadLicenses = async () => {
        try {
            const res = await adminFetch("/api/admin/licenses");
            if (res.ok) {
                const data = await res.json();
                setLicenses(data);
            } else {
                showToast(`Lisanslar alınamadı: ${res.status}`, "error");
            }
        } catch (e) {
            console.error("License load error:", e);
            showToast("Bağlantı hatası", "error");
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
                showToast("Lisans başarıyla oluşturuldu");
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
                    branding_config: { primary_color: "#7886C7", hide_jetpos_badge: false },
                    max_stores: 1
                });
            } else {
                const err = await res.json();
                showToast(err.message || err.error || "Kaydetme başarısız", "error");
            }
        } catch (e) {
            showToast("Sunucuya erişilemedi", "error");
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
                showToast("Güncelleme başarısız", "error");
            }
        } catch (e) {
            showToast("Bağlantı hatası", "error");
        } finally { setLoading(false); }
    };

    const deleteLicense = async (id: string) => {
        if (!confirm("Bu lisansı silmek istediğinize emin misiniz?")) return;
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

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loggingIn) return;
        setLoggingIn(true);
        try {
            const res = await fetch("/api/admin/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: loginUsername.trim() || undefined, password }),
            });
            if (res.ok) {
                const data = await res.json();
                const user: AdminPanelUser = data.user || { name: "Süper Admin", role: "owner", permissions: null };
                setAdminUser(user);
                setAuthed(true);
                // Oturum token'ı session'a kaydedilir — API route'lar x-admin-token ile doğrular.
                sessionStorage.setItem("jetpos_admin_auth", "true");
                sessionStorage.setItem("jetpos_admin_token", data.token || password);
                sessionStorage.setItem("jetpos_admin_user", JSON.stringify(user));
                loadAll();
            } else {
                setPasswordError(true);
                setTimeout(() => setPasswordError(false), 2000);
            }
        } catch (e) {
            setPasswordError(true);
            setTimeout(() => setPasswordError(false), 2000);
        } finally {
            setLoggingIn(false);
        }
    };

    const handleLogout = () => {
        setAuthed(false);
        setAdminUser(null);
        sessionStorage.removeItem("jetpos_admin_auth");
        sessionStorage.removeItem("jetpos_admin_token");
        sessionStorage.removeItem("jetpos_admin_user");
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

    const NAV_GROUPS = [
        { label: "Genel", items: [{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard }] },
        {
            label: "Satış & Müşteri", items: [
                { id: "orders", label: "Siparişler", icon: ShoppingCart },
                { id: "requests", label: "Yeni Talepler", icon: PhoneCall },
                { id: "early-access", label: "Erken Erişim", icon: Mail },
                { id: "licenses", label: "Lisans Yönetimi", icon: ShieldCheck },
                { id: "crm", label: "CRM Analizi", icon: Heart },
            ]
        },
        {
            label: "Destek", items: [
                { id: "tickets", label: "Destek Talepleri", icon: MessageSquare },
                { id: "announcements", label: "Duyurular", icon: Bell },
            ]
        },
        {
            label: "İçerik", items: [
                { id: "blog", label: "Blog Yazıları", icon: FileText },
                { id: "guides", label: "Rehberler", icon: BookOpen },
                { id: "about", label: "Hakkımızda", icon: Building2 },
            ]
        },
        { label: "Pazarlama", items: [{ id: "game", label: "Oyun Ayarları", icon: Gamepad2 }] },
        { label: "Sistem", items: [{ id: "staff", label: "Ekip & Yetkiler", icon: Users }] },
    ];

    const roleBadge = ROLE_BADGES[adminUser?.role || "owner"];
    const activeTabLabel = NAV_GROUPS.flatMap(g => g.items).find(i => i.id === activeTab)?.label || "Dashboard";

    // Dashboard yardımcıları
    const hourNow = new Date().getHours();
    const greeting = hourNow < 6 ? "İyi geceler" : hourNow < 12 ? "Günaydın" : hourNow < 18 ? "İyi günler" : "İyi akşamlar";
    const todayStr = new Date().toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" });
    // Son 7 günün talep sayıları (mini grafik)
    const last7 = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (6 - i));
        const next = new Date(d); next.setDate(d.getDate() + 1);
        return requests.filter(r => {
            const t = new Date(r.created_at).getTime();
            return t >= d.getTime() && t < next.getTime();
        }).length;
    });
    const last7max = Math.max(1, ...last7);

    const sidebarContent = (
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            {/* Logo */}
            <div style={{ padding: "2rem 1.75rem 1.5rem", display: "flex", alignItems: "center", gap: "0.85rem" }}>
                <div style={{
                    width: "2.6rem", height: "2.6rem", borderRadius: "0.8rem",
                    background: "linear-gradient(135deg, #5A659F, #7886C7)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 6px 18px rgba(120,134,199,0.35)",
                }}>
                    <ShieldCheck style={{ width: "1.25rem", color: "white" }} />
                </div>
                <div>
                    <h1 style={{ fontSize: "1.05rem", fontWeight: 900, margin: 0, letterSpacing: "-0.02em" }}>
                        Jet<span style={{ color: "#7886C7" }}>POS</span> Admin
                    </h1>
                    <span style={{ fontSize: "0.58rem", color: "rgba(255,255,255,0.35)", fontWeight: 800, letterSpacing: "0.14em" }}>YÖNETİM PANELİ</span>
                </div>
            </div>

            {/* Gruplu menü */}
            <nav style={{ flex: 1, padding: "0 1rem", overflowY: "auto" }}>
                {NAV_GROUPS.map(group => {
                    const visible = group.items.filter(i => canSee(i.id));
                    if (visible.length === 0) return null;
                    return (
                        <div key={group.label} style={{ marginBottom: "1.1rem" }}>
                            <p style={{
                                margin: "0 0 0.4rem", padding: "0 0.9rem",
                                fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.14em",
                                color: "rgba(255,255,255,0.25)", textTransform: "uppercase",
                            }}>
                                {group.label}
                            </p>
                            {visible.map(item => {
                                const active = activeTab === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => { setActiveTab(item.id as typeof activeTab); setIsMobileMenuOpen(false); }}
                                        style={{
                                            width: "100%", display: "flex", alignItems: "center", gap: "0.75rem",
                                            padding: "0.65rem 0.9rem", borderRadius: "0.7rem", border: "none",
                                            background: active ? "linear-gradient(90deg, rgba(120,134,199,0.18), rgba(120,134,199,0.05))" : "transparent",
                                            color: active ? "#B0BAE6" : "rgba(255,255,255,0.45)",
                                            fontSize: "0.83rem", fontWeight: active ? 800 : 500,
                                            cursor: "pointer", transition: "all 0.15s", textAlign: "left", marginBottom: "2px",
                                            borderLeft: `2px solid ${active ? "#7886C7" : "transparent"}`,
                                            fontFamily: "inherit",
                                        }}
                                        onMouseEnter={e => { if (!active) e.currentTarget.style.color = "rgba(255,255,255,0.8)"; }}
                                        onMouseLeave={e => { if (!active) e.currentTarget.style.color = "rgba(255,255,255,0.45)"; }}
                                    >
                                        <item.icon style={{ width: "1.05rem", flexShrink: 0 }} /> {item.label}
                                    </button>
                                );
                            })}
                        </div>
                    );
                })}
            </nav>

            {/* Kullanıcı kartı + çıkış */}
            <div style={{ padding: "1.1rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{
                    display: "flex", alignItems: "center", gap: "0.7rem",
                    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "0.9rem", padding: "0.7rem 0.8rem",
                }}>
                    <div style={{
                        width: "2.1rem", height: "2.1rem", borderRadius: "50%", flexShrink: 0,
                        background: "linear-gradient(135deg, #5A659F, #7886C7)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.85rem", fontWeight: 900, color: "white",
                    }}>
                        {(adminUser?.name || "S").charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 700, color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {adminUser?.name || "Süper Admin"}
                        </p>
                        <span style={{
                            fontSize: "0.55rem", fontWeight: 800, letterSpacing: "0.1em",
                            color: roleBadge.color, background: roleBadge.bg,
                            padding: "0.1rem 0.4rem", borderRadius: "4px",
                        }}>
                            {roleBadge.label}
                        </span>
                    </div>
                    <button
                        onClick={handleLogout}
                        title="Çıkış Yap"
                        style={{
                            width: "2rem", height: "2rem", borderRadius: "0.6rem", flexShrink: 0,
                            background: "rgba(239,68,68,0.1)", border: "none", color: "#ef4444",
                            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                    >
                        <LogOut style={{ width: "0.85rem" }} />
                    </button>
                </div>
            </div>
        </div>
    );

    // Login screen
    if (!authed) {
        return (
            <div style={{
                minHeight: "100vh", background: "#0e1322",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "Inter, sans-serif", position: "relative", overflow: "hidden", padding: "1.5rem",
            }}>
                {/* Nokta ızgarası + marka ışıltıları */}
                <div style={{
                    position: "absolute", inset: 0,
                    backgroundImage: "radial-gradient(rgba(120,134,199,0.14) 1px, transparent 1px)",
                    backgroundSize: "26px 26px",
                    maskImage: "radial-gradient(ellipse at center, rgba(0,0,0,0.8), transparent 75%)",
                    WebkitMaskImage: "radial-gradient(ellipse at center, rgba(0,0,0,0.8), transparent 75%)",
                    pointerEvents: "none",
                }} />
                <div style={{
                    position: "absolute", top: "-180px", right: "-120px", width: "480px", height: "480px",
                    background: "radial-gradient(circle, rgba(139,92,246,0.16) 0%, transparent 70%)", pointerEvents: "none",
                }} />
                <div style={{
                    position: "absolute", bottom: "-180px", left: "-120px", width: "480px", height: "480px",
                    background: "radial-gradient(circle, rgba(120,134,199,0.16) 0%, transparent 70%)", pointerEvents: "none",
                }} />

                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 12 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    style={{ width: "100%", maxWidth: "410px", position: "relative" }}
                >
                    {/* Akışkan gradient çerçeve */}
                    <div style={{
                        padding: "1.5px", borderRadius: "1.75rem",
                        background: "linear-gradient(120deg, #7886C7, #8b5cf6, #06b6d4, #7886C7)",
                        backgroundSize: "300% 300%",
                        animation: "adminAura 7s ease infinite",
                        boxShadow: "0 32px 80px rgba(0,0,0,0.55), 0 0 70px rgba(120, 134, 199, 0.18)",
                    }}>
                        <div style={{
                            background: "rgba(17,24,39,0.97)",
                            borderRadius: "calc(1.75rem - 1.5px)",
                            padding: "2.5rem 2.25rem 2rem",
                        }}>
                            {/* Wordmark + rozet */}
                            <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                                <p style={{ margin: "0 0 1.25rem", fontSize: "1.3rem", fontWeight: 900, color: "white", letterSpacing: "-0.02em" }}>
                                    Jet<span style={{ color: "#7886C7" }}>POS</span>
                                </p>
                                <div style={{
                                    width: "3.5rem", height: "3.5rem", borderRadius: "1.1rem",
                                    background: "linear-gradient(135deg, #5A659F, #7886C7)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    margin: "0 auto 1.25rem",
                                    boxShadow: "0 10px 30px rgba(120,134,199,0.35)",
                                }}>
                                    <ShieldCheck style={{ width: "1.7rem", color: "white" }} />
                                </div>
                                <p style={{ margin: "0 0 0.4rem", fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.24em", color: "#7886C7" }}>
                                    SUPER ADMIN
                                </p>
                                <h1 style={{ fontSize: "1.6rem", fontWeight: 900, margin: "0 0 0.4rem", color: "white", letterSpacing: "-0.02em" }}>
                                    Yönetim Paneli
                                </h1>
                                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem", margin: 0 }}>
                                    Devam etmek için admin şifrenizi girin
                                </p>
                            </div>

                            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                <div style={{
                                    display: "flex", alignItems: "center", gap: "0.75rem",
                                    background: "rgba(255,255,255,0.04)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    borderRadius: "0.95rem", padding: "0.95rem 1rem",
                                }}>
                                    <User style={{ width: "1rem", height: "1rem", flexShrink: 0, color: "rgba(255,255,255,0.3)" }} />
                                    <input
                                        type="text"
                                        placeholder="Kullanıcı adı (süper admin için boş bırak)"
                                        value={loginUsername}
                                        onChange={e => setLoginUsername(e.target.value)}
                                        autoComplete="username"
                                        style={{ flex: 1, background: "none", border: "none", outline: "none", color: "white", fontSize: "0.95rem", fontFamily: "inherit" }}
                                    />
                                </div>
                                <div style={{
                                    display: "flex", alignItems: "center", gap: "0.75rem",
                                    background: pwFocused ? "rgba(120,134,199,0.07)" : "rgba(255,255,255,0.04)",
                                    border: `1px solid ${passwordError ? "rgba(239,68,68,0.6)" : pwFocused ? "rgba(120,134,199,0.55)" : "rgba(255,255,255,0.1)"}`,
                                    boxShadow: passwordError ? "0 0 0 4px rgba(239,68,68,0.12)" : pwFocused ? "0 0 0 4px rgba(120,134,199,0.14)" : "none",
                                    borderRadius: "0.95rem", padding: "0.95rem 1rem",
                                    transition: "all 0.25s",
                                    animation: passwordError ? "loginShake 0.4s ease" : "none",
                                }}>
                                    <Lock style={{ width: "1rem", height: "1rem", flexShrink: 0, color: pwFocused ? "#7886C7" : "rgba(255,255,255,0.3)", transition: "color 0.25s" }} />
                                    <input
                                        type={showPw ? "text" : "password"}
                                        placeholder="Admin Şifresi"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        onFocus={() => setPwFocused(true)}
                                        onBlur={() => setPwFocused(false)}
                                        autoFocus
                                        style={{ flex: 1, background: "none", border: "none", outline: "none", color: "white", fontSize: "0.95rem", fontFamily: "inherit" }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPw(v => !v)}
                                        aria-label={showPw ? "Şifreyi gizle" : "Şifreyi göster"}
                                        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", color: "rgba(255,255,255,0.35)" }}
                                    >
                                        {showPw ? <EyeOff style={{ width: "1rem", height: "1rem" }} /> : <Eye style={{ width: "1rem", height: "1rem" }} />}
                                    </button>
                                </div>

                                {passwordError && (
                                    <div style={{
                                        background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)",
                                        borderRadius: "0.75rem", padding: "0.7rem 0.9rem",
                                        color: "#fca5a5", fontSize: "0.8rem", textAlign: "center",
                                    }}>
                                        Yanlış şifre! Lütfen tekrar deneyin.
                                    </div>
                                )}

                                <button type="submit" disabled={loggingIn || !password} style={{
                                    padding: "0.95rem", borderRadius: "0.95rem", border: "none",
                                    background: (loggingIn || !password) ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg, #5A659F, #7886C7)",
                                    color: (loggingIn || !password) ? "rgba(255,255,255,0.3)" : "white",
                                    fontWeight: 800, fontSize: "0.95rem",
                                    cursor: (loggingIn || !password) ? "not-allowed" : "pointer",
                                    fontFamily: "inherit",
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                                    boxShadow: (loggingIn || !password) ? "none" : "0 6px 20px rgba(120,134,199,0.4)",
                                    transition: "all 0.25s",
                                }}>
                                    {loggingIn ? (
                                        <>
                                            <span style={{
                                                width: "1rem", height: "1rem",
                                                border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "rgba(255,255,255,0.7)",
                                                borderRadius: "50%", display: "inline-block",
                                                animation: "loginSpin 0.8s linear infinite",
                                            }} />
                                            Doğrulanıyor...
                                        </>
                                    ) : (
                                        "Sisteme Giriş Yap"
                                    )}
                                </button>
                            </form>

                            <p style={{ margin: "1.5rem 0 0", textAlign: "center", fontSize: "0.7rem", color: "rgba(255,255,255,0.25)", lineHeight: 1.5 }}>
                                🔒 Tüm girişler kayıt altına alınır. Yetkisiz erişim girişimleri engellenir.
                            </p>
                        </div>
                    </div>
                </motion.div>

                <style>{`
                    @keyframes adminAura {
                        0%   { background-position: 0% 50%; }
                        50%  { background-position: 100% 50%; }
                        100% { background-position: 0% 50%; }
                    }
                    @keyframes loginSpin { to { transform: rotate(360deg); } }
                    @keyframes loginShake {
                        0%, 100% { transform: translateX(0); }
                        25% { transform: translateX(-6px); }
                        75% { transform: translateX(6px); }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div style={{ minHeight: "100vh", background: "#111827", color: "white", display: "flex", flexDirection: "column", fontFamily: "'Inter', sans-serif" }}>

            {/* --- RESPONSIVE SIDEBAR --- */}
            <aside className="admin-sidebar" style={{ width: "280px", background: "rgba(17,24,39,0.9)", borderRight: "1px solid rgba(255,255,255,0.06)", position: "fixed", height: "100vh", zIndex: 100, backdropFilter: "blur(40px)" }}>
                {sidebarContent}
            </aside>

            {/* --- MOBILE HEADER --- */}
            <header className="admin-mobile-header" style={{ position: "sticky", top: 0, zIndex: 90, background: "rgba(17,24,39,0.8)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "1rem 1.5rem", display: "none", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <ShieldCheck style={{ width: "1.2rem", color: "#7886C7" }} />
                    <span style={{ fontWeight: 800 }}>Admin Panel</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(true)} style={{ background: "none", border: "none", color: "white", cursor: "pointer" }}><Menu /></button>
            </header>

            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(5px)" }}>
                        <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 25 }} style={{ width: "80%", maxWidth: "300px", background: "#111827", height: "100%", position: "relative" }}>
                            <button onClick={() => setIsMobileMenuOpen(false)} style={{ position: "absolute", right: "1rem", top: "1.5rem", background: "none", border: "none", color: "white" }}><X /></button>
                            {sidebarContent}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <main className="admin-main-content" style={{ flex: 1, marginLeft: "280px", padding: "3rem" }}>
            <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
                {/* Topbar */}
                <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap",
                    marginBottom: "2rem", paddingBottom: "1.1rem", borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem" }}>
                        <span style={{ color: "rgba(255,255,255,0.3)" }}>Admin</span>
                        <span style={{ color: "rgba(255,255,255,0.2)" }}>/</span>
                        <span style={{ color: "white", fontWeight: 800 }}>{activeTabLabel}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                        <button onClick={loadAll} style={{
                            padding: "0.5rem 1rem", borderRadius: "0.7rem",
                            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                            color: "rgba(255,255,255,0.7)", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600,
                            display: "flex", alignItems: "center", gap: "0.4rem", fontFamily: "inherit",
                        }}>
                            <RefreshCw style={{ width: "0.85rem" }} /> Yenile
                        </button>
                        <a href="/" target="_blank" style={{
                            padding: "0.5rem 1rem", borderRadius: "0.7rem", textDecoration: "none",
                            background: "rgba(120,134,199,0.1)", border: "1px solid rgba(120,134,199,0.25)",
                            color: "#B0BAE6", fontSize: "0.78rem", fontWeight: 700,
                            display: "flex", alignItems: "center", gap: "0.4rem",
                        }}>
                            <Globe style={{ width: "0.85rem" }} /> Siteyi Aç
                        </a>
                    </div>
                </div>
                {activeTab === "crm" && (<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2.5rem" }}><div><h2 style={{ fontSize: "1.75rem", fontWeight: 900, marginBottom: "0.25rem", color: "white" }}>Global CRM Takibi</h2><p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.875rem" }}>Tüm müşterilerin sadakat programı verileri</p></div></div><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>{crmGlobalStats.filter(t => t.license_key !== `ADM257SA67`).map((t) => (<div key={t.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "1.25rem", padding: "1.5rem", borderLeft: "4px solid #f472b6" }}><h3 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: "1rem" }}>{t.company_name || t.license_key}</h3><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}><div style={{ padding: "1rem", background: "rgba(0,0,0,0.2)", borderRadius: "1rem" }}><div style={{ fontSize: "1.5rem", fontWeight: 900 }}>{t.cari_hesaplar?.[0]?.count || 0}</div><div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", fontWeight: 800 }}>Müşteri</div></div><div style={{ padding: "1rem", background: "rgba(0,0,0,0.2)", borderRadius: "1rem" }}><div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#f472b6" }}>{t.loyalty_points?.[0]?.count || 0}</div><div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", fontWeight: 800 }}>Puan Hareketi</div></div></div></div>))}</div></motion.div>)} {activeTab === "dashboard" && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        {/* ── HERO ── */}
                        <div style={{
                            position: "relative", overflow: "hidden",
                            background: "linear-gradient(135deg, #262f55 0%, #3d4877 55%, #5A659F 100%)",
                            borderRadius: "1.5rem", padding: "2rem 2.25rem", marginBottom: "1.75rem",
                        }}>
                            <div style={{
                                position: "absolute", inset: 0,
                                backgroundImage: "radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)",
                                backgroundSize: "20px 20px",
                                maskImage: "linear-gradient(120deg, rgba(0,0,0,0.6), transparent 70%)",
                                WebkitMaskImage: "linear-gradient(120deg, rgba(0,0,0,0.6), transparent 70%)",
                                pointerEvents: "none",
                            }} />
                            <div style={{
                                position: "absolute", top: "-90px", right: "-60px", width: "300px", height: "300px",
                                background: "radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)", pointerEvents: "none",
                            }} />
                            <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
                                <div>
                                    <p style={{ margin: "0 0 0.3rem", fontSize: "0.75rem", fontWeight: 700, color: "rgba(255,255,255,0.55)", textTransform: "capitalize" }}>{todayStr}</p>
                                    <h2 style={{ fontSize: "1.7rem", fontWeight: 900, margin: "0 0 0.4rem", color: "white", letterSpacing: "-0.02em" }}>
                                        {greeting}, {adminUser?.name || "Süper Admin"} 👋
                                    </h2>
                                    <p style={{ margin: 0, color: "rgba(255,255,255,0.65)", fontSize: "0.875rem" }}>
                                        {stats.pendingCalls > 0
                                            ? <>Seni bekleyen <strong style={{ color: "#f0b429" }}>{stats.pendingCalls} arama</strong> var — hadi başlayalım.</>
                                            : "Her şey yolunda görünüyor, bekleyen acil iş yok."}
                                    </p>
                                </div>
                                <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                                    <button onClick={loadAll} style={{
                                        padding: "0.65rem 1.1rem", borderRadius: "0.8rem",
                                        background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)",
                                        color: "white", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.45rem",
                                        fontSize: "0.82rem", fontWeight: 700, fontFamily: "inherit", backdropFilter: "blur(6px)",
                                    }}>
                                        <RefreshCw className={loading ? "animate-spin" : ""} style={{ width: "0.9rem" }} /> Yenile
                                    </button>
                                    {canSee("licenses") && (
                                        <button onClick={() => { setActiveTab("licenses"); setShowNewLicense(true); }} style={{
                                            padding: "0.65rem 1.1rem", borderRadius: "0.8rem", border: "none",
                                            background: "white", color: "#3d4877", cursor: "pointer",
                                            display: "flex", alignItems: "center", gap: "0.45rem",
                                            fontSize: "0.82rem", fontWeight: 800, fontFamily: "inherit",
                                            boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
                                        }}>
                                            <Sparkles style={{ width: "0.9rem" }} /> Lisans Oluştur
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ── STAT KARTLARI ── */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "1.1rem", marginBottom: "1.75rem" }}>
                            {[
                                { label: "Toplam Talep", value: stats.totalRequests, icon: Mail, color: "#7886C7", tab: "requests" as const, sub: `${last7.reduce((a, b) => a + b, 0)} talep / son 7 gün` },
                                { label: "Aktif Lisanslar", value: stats.activeLicenses, icon: ShieldCheck, color: "#22c55e", tab: "licenses" as const, sub: "Canlı müşteriler" },
                                { label: "Bekleyen Aramalar", value: stats.pendingCalls, icon: PhoneCall, color: "#f59e0b", tab: "requests" as const, sub: stats.pendingCalls > 0 ? "Aksiyon bekliyor" : "Temiz ✓" },
                                { label: "Destek Talepleri", value: tickets.length, icon: MessageSquare, color: "#f472b6", tab: "tickets" as const, sub: "Toplam kayıt" },
                            ].filter(s => canSee(s.tab)).map((s, i) => (
                                <motion.div
                                    key={i}
                                    whileHover={{ y: -4 }}
                                    onClick={() => setActiveTab(s.tab)}
                                    style={{
                                        position: "relative", overflow: "hidden",
                                        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                                        borderRadius: "1.25rem", padding: "1.4rem 1.5rem",
                                        cursor: "pointer", transition: "border-color 0.2s",
                                    }}
                                >
                                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: `linear-gradient(90deg, ${s.color}, transparent)` }} />
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.9rem" }}>
                                        <span style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</span>
                                        <div style={{
                                            width: "2.3rem", height: "2.3rem", borderRadius: "0.7rem",
                                            background: `${s.color}18`, display: "flex", alignItems: "center", justifyContent: "center",
                                        }}>
                                            <s.icon style={{ color: s.color, width: "1.1rem" }} />
                                        </div>
                                    </div>
                                    <div style={{ fontSize: "2.1rem", fontWeight: 900, letterSpacing: "-1px", lineHeight: 1 }}>{s.value}</div>
                                    <p style={{ margin: "0.5rem 0 0", fontSize: "0.72rem", color: "rgba(255,255,255,0.35)" }}>{s.sub}</p>
                                </motion.div>
                            ))}
                        </div>

                        {/* ── ANA GRID ── */}
                        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "1.5rem", alignItems: "start" }} className="dash-grid">
                            {/* Son Talepler + mini grafik */}
                            <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "1.5rem", padding: "1.75rem" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.4rem", gap: "1rem", flexWrap: "wrap" }}>
                                    <div>
                                        <h3 style={{ fontSize: "1.05rem", fontWeight: 800, margin: 0 }}>Son Talepler</h3>
                                        <p style={{ margin: "0.2rem 0 0", fontSize: "0.72rem", color: "rgba(255,255,255,0.35)" }}>Son 7 gün aktivitesi</p>
                                    </div>
                                    {/* Mini bar grafik */}
                                    <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", height: "34px" }}>
                                        {last7.map((v, i) => (
                                            <div key={i} title={`${v} talep`} style={{
                                                width: "10px",
                                                height: `${Math.max(12, (v / last7max) * 100)}%`,
                                                borderRadius: "3px",
                                                background: i === 6 ? "linear-gradient(180deg, #7886C7, #5A659F)" : "rgba(120,134,199,0.25)",
                                            }} />
                                        ))}
                                    </div>
                                    <button onClick={() => setActiveTab("requests")} style={{ background: "none", border: "none", color: "#7886C7", cursor: "pointer", fontSize: "0.82rem", fontWeight: 700, fontFamily: "inherit" }}>
                                        Tümünü Gör →
                                    </button>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                                    {requests.slice(0, 5).length > 0 ? requests.slice(0, 5).map(r => (
                                        <div key={r.id} onClick={() => setActiveTab("requests")} style={{
                                            display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem",
                                            padding: "0.8rem 1rem", background: "rgba(255,255,255,0.02)",
                                            borderRadius: "0.9rem", border: "1px solid rgba(255,255,255,0.04)", cursor: "pointer",
                                        }}>
                                            <div style={{ display: "flex", gap: "0.8rem", alignItems: "center", minWidth: 0 }}>
                                                <div style={{
                                                    width: "2.3rem", height: "2.3rem", borderRadius: "0.7rem", flexShrink: 0,
                                                    background: "linear-gradient(135deg, #5A659F, #7886C7)",
                                                    display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.8rem", color: "white",
                                                }}>{r.name[0]}</div>
                                                <div style={{ minWidth: 0 }}>
                                                    <div style={{ fontWeight: 700, fontSize: "0.9rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.name}</div>
                                                    <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.35)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                        {r.company} • {timeAgo(r.created_at)}
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ fontSize: "0.65rem", flexShrink: 0, background: STATUS_CONFIG[r.status].bg, color: STATUS_CONFIG[r.status].color, padding: "0.35rem 0.7rem", borderRadius: "99px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                                {STATUS_CONFIG[r.status].label}
                                            </div>
                                        </div>
                                    )) : (
                                        <div style={{ textAlign: "center", padding: "2.5rem", color: "rgba(255,255,255,0.25)", fontSize: "0.85rem" }}>Henüz talep bulunmuyor.</div>
                                    )}
                                </div>
                            </div>

                            {/* Sağ kolon */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                                {/* Hızlı işlemler */}
                                <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "1.5rem", padding: "1.75rem" }}>
                                    <h3 style={{ fontSize: "1.05rem", fontWeight: 800, margin: "0 0 1.1rem" }}>Hızlı İşlemler</h3>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.7rem" }}>
                                        {[
                                            { label: "Yeni Lisans", icon: ShieldCheck, color: "#22c55e", tab: "licenses" as const, act: () => { setActiveTab("licenses"); setShowNewLicense(true); } },
                                            { label: "Duyuru Yayınla", icon: Bell, color: "#f59e0b", tab: "announcements" as const, act: () => { setActiveTab("announcements"); setShowNewAnnounce(true); } },
                                            { label: "Blog Yazısı", icon: FileText, color: "#a855f7", tab: "blog" as const, act: () => { setActiveTab("blog"); setShowNewPost(true); } },
                                            { label: "Ekip Üyesi", icon: UserPlus, color: "#7886C7", tab: "staff" as const, act: () => setActiveTab("staff") },
                                        ].filter(q => canSee(q.tab)).map((q, i) => (
                                            <button key={i} onClick={q.act} style={{
                                                display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.6rem",
                                                padding: "0.9rem", borderRadius: "0.9rem",
                                                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                                                color: "white", cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                                                transition: "all 0.15s",
                                            }}
                                                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                                            >
                                                <div style={{ width: "2rem", height: "2rem", borderRadius: "0.6rem", background: `${q.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                    <q.icon style={{ width: "0.95rem", color: q.color }} />
                                                </div>
                                                <span style={{ fontSize: "0.78rem", fontWeight: 700 }}>{q.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Sistem durumu */}
                                <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "1.5rem", padding: "1.75rem" }}>
                                    <h3 style={{ fontSize: "1.05rem", fontWeight: 800, margin: "0 0 1.1rem" }}>Sistem Durumu</h3>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                                        {[
                                            { dot: "#22c55e", label: "Supabase bağlantısı", value: "Aktif" },
                                            { dot: "#7886C7", label: "Oturum", value: roleBadge.label },
                                            ...(callerIp ? [{ dot: "#f0b429", label: "IP adresin", value: callerIp }] : []),
                                            ...(canSee("staff") ? [{ dot: "#f472b6", label: "Ekip üyeleri", value: `${staffList.length} kayıtlı` }] : []),
                                            { dot: "#06b6d4", label: "Erken erişim kaydı", value: String(earlyAccessSignups.length) },
                                        ].map((row, i) => (
                                            <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.7rem", fontSize: "0.82rem" }}>
                                                <span style={{ width: "0.5rem", height: "0.5rem", borderRadius: "50%", background: row.dot, flexShrink: 0, boxShadow: `0 0 8px ${row.dot}66` }} />
                                                <span style={{ color: "rgba(255,255,255,0.45)", flex: 1 }}>{row.label}</span>
                                                <span style={{ color: "white", fontWeight: 700, fontSize: "0.78rem" }}>{row.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <style>{`
                            @media (max-width: 1000px) {
                                .dash-grid { grid-template-columns: 1fr !important; }
                            }
                        `}</style>
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
                                        <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "0.75rem", backgroundImage: "linear-gradient(135deg, #7886C7, #B0BAE6)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>{req.name[0]}</div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 700 }}>{req.name}</div>
                                            <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)" }}>{req.company} • {req.email}</div>
                                        </div>
                                        <div style={{ padding: "0.2rem 0.6rem", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 700, background: STATUS_CONFIG[req.status].bg, color: STATUS_CONFIG[req.status].color }}>{STATUS_CONFIG[req.status].label}</div>
                                    </motion.div>
                                ))}
                            </div>
                            {selectedRequest && (
                                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "1.25rem", padding: "1.5rem", height: "fit-content", position: "sticky", top: "6rem" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                                        <h3 style={{ margin: 0 }}>Talep Detayı</h3>
                                        <button onClick={() => setSelectedRequest(null)} style={{ background: "none", border: "none", color: "white", cursor: "pointer" }}>×</button>
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

                {activeTab === "early-access" && (
                    <>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                            <div>
                                <h2 style={{ fontSize: "1.75rem", fontWeight: 900, marginBottom: "0.25rem", color: "white" }}>Erken Erişim Kayıtları</h2>
                                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.875rem" }}>jetpos.shop &ldquo;çok yakında&rdquo; sayfasından bırakılan e-postalar — {earlyAccessSignups.length} kayıt</p>
                            </div>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(earlyAccessSignups.map(s => s.email).join("\n"));
                                    showToast("Tüm e-postalar panoya kopyalandı");
                                }}
                                disabled={earlyAccessSignups.length === 0}
                                style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.7rem 1.25rem", borderRadius: "0.75rem", border: "1px solid rgba(120,134,199,0.3)", background: "rgba(120,134,199,0.1)", color: "#7886C7", fontWeight: 700, fontSize: "0.85rem", cursor: earlyAccessSignups.length === 0 ? "default" : "pointer", opacity: earlyAccessSignups.length === 0 ? 0.5 : 1 }}
                            >
                                <Mail style={{ width: "1rem" }} /> Tümünü Kopyala
                            </button>
                        </div>

                        {earlyAccessSignups.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "4rem 0", color: "rgba(255,255,255,0.3)" }}>Henüz kayıt yok.</div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                {earlyAccessSignups.map((signup) => (
                                    <div key={signup.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "1rem", padding: "1.1rem 1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                                            <div style={{ width: "2.25rem", height: "2.25rem", borderRadius: "0.65rem", backgroundImage: "linear-gradient(135deg, #7886C7, #B0BAE6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                <Mail style={{ width: "1rem", color: "white" }} />
                                            </div>
                                            <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>{signup.email}</span>
                                        </div>
                                        <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", whiteSpace: "nowrap" }}>{timeAgo(signup.created_at)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {activeTab === "licenses" && (
                    <>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2rem" }}>
                            <div style={{ position: "relative", flex: 1, maxWidth: "400px" }}>
                                <Search style={{ position: "absolute", left: "0.8rem", top: "50%", transform: "translateY(-50%)", width: "1rem", height: "1rem", color: "rgba(255,255,255,0.3)" }} />
                                <input type="text" placeholder="Lisans ara..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: "100%", padding: "0.75rem 1rem 0.75rem 2.5rem", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "0.75rem", color: "white" }} />
                            </div>
                            <button onClick={() => setShowNewLicense(true)} style={{ padding: "0.75rem 1.5rem", borderRadius: "0.75rem", background: "#7886C7", border: "none", color: "white", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <Sparkles style={{ width: "1rem", height: "1rem" }} />
                                Yeni Lisans Tanımla
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
                                                style={{ padding: "0.5rem", borderRadius: "0.5rem", background: "rgba(120, 134, 199, 0.1)", color: "#7886C7", border: "none", cursor: "pointer" }}
                                            >
                                                <Edit style={{ width: "0.9rem" }} />
                                            </button>
                                            <button onClick={() => deleteLicense(l.id)} style={{ padding: "0.5rem", borderRadius: "0.5rem", background: "rgba(239,68,68,0.1)", color: "#f87171", border: "none", cursor: "pointer" }}><Trash2 style={{ width: "0.9rem" }} /></button>
                                        </div>
                                    </div>

                                    <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: "0.75rem", padding: "1rem", border: "1px solid rgba(255,255,255,0.05)" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                                            <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", fontWeight: 700 }}>Lisans Anahtarı</span>
                                            <span style={{ fontSize: "0.7rem", color: "#7886C7", fontWeight: 800 }}>{l.plan_type} PLAN</span>
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
                                            <span style={{ fontSize: "1rem", fontWeight: 800, color: "#7886C7" }}>{l.plan_type}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {showNewLicense && (
                            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
                                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "1.5rem", padding: "2rem", width: "100%", maxWidth: "450px" }}>
                                    <h2 style={{ marginBottom: "1.5rem" }}>Yeni Lisans Ekle</h2>
                                    <form onSubmit={createLicense} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                        <input type="text" placeholder="Müşteri Adı" required value={newLicenseData.client_name} onChange={e => setNewLicenseData({ ...newLicenseData, client_name: e.target.value })} style={{ padding: "0.75rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.5rem", color: "white" }} />
                                        <input type="email" placeholder="E-posta" required value={newLicenseData.user_email} onChange={e => setNewLicenseData({ ...newLicenseData, user_email: e.target.value })} style={{ padding: "0.75rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.5rem", color: "white" }} />
                                        <input type="text" placeholder="Lisans Anahtarı (Örn: JETPOS-1234)" required value={newLicenseData.license_key} onChange={e => setNewLicenseData({ ...newLicenseData, license_key: e.target.value.toUpperCase() })} style={{ padding: "0.75rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.5rem", color: "white" }} />
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
                                                <label style={{ display: "block", fontSize: "0.7rem", color: "rgba(255,255,255,0.5)", marginBottom: "0.5rem", fontWeight: 800, textTransform: "uppercase" }}>Özellikler</label>
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
                                                <label style={{ display: "block", fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginBottom: "0.5rem", fontWeight: 600 }}>Gün Sayısı</label>
                                                <input type="number" placeholder="Gün Sayısı" value={newLicenseData.total_days} onChange={e => setNewLicenseData({ ...newLicenseData, total_days: parseInt(e.target.value) })} style={{ width: "100%", padding: "0.75rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.5rem", color: "white" }} />
                                            </div>
                                            <div>
                                                <label style={{ display: "block", fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginBottom: "0.5rem", fontWeight: 600 }}>Mağaza Limiti</label>
                                                <input type="number" placeholder="Mağaza Sayısı" value={newLicenseData.max_stores} onChange={e => setNewLicenseData({ ...newLicenseData, max_stores: parseInt(e.target.value) })} style={{ width: "100%", padding: "0.75rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.5rem", color: "white" }} />
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                                            <button type="button" onClick={() => setShowNewLicense(false)} style={{ flex: 1, padding: "0.75rem", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "white", cursor: "pointer" }}>İptal</button>
                                            <button type="submit" style={{ flex: 1, padding: "0.75rem", borderRadius: "0.75rem", background: "#7886C7", border: "none", color: "white", fontWeight: 700, cursor: "pointer" }}>Kaydet</button>
                                        </div>
                                    </form>
                                </motion.div>
                            </div>
                        )}

                        {showEditLicense && (
                            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
                                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "1.5rem", padding: "2rem", width: "100%", maxWidth: "450px" }}>
                                    <h2 style={{ marginBottom: "1.5rem" }}>Lisansı Düzenle</h2>
                                    <form onSubmit={updateLicense} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                        <input type="text" placeholder="Müşteri Adı" required value={editingLicense.client_name} onChange={e => setEditingLicense({ ...editingLicense, client_name: e.target.value })} style={{ padding: "0.75rem", background: "rgba(30,41,59,0.5)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.5rem", color: "white" }} />
                                        <input type="email" placeholder="E-posta" required value={editingLicense.user_email} onChange={e => setEditingLicense({ ...editingLicense, user_email: e.target.value })} style={{ padding: "0.75rem", background: "rgba(30,41,59,0.5)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.5rem", color: "white" }} />
                                        <input type="text" placeholder="Lisans Anahtarı" required value={editingLicense.license_key} onChange={e => setEditingLicense({ ...editingLicense, license_key: e.target.value.toUpperCase() })} style={{ padding: "0.75rem", background: "rgba(30,41,59,0.5)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.5rem", color: "white" }} />
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
                                                <label style={{ display: "block", fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginBottom: "0.35rem", fontWeight: 600 }}>Bitiş Tarihi</label>
                                                <input type="date" value={editingLicense.expires_at ? new Date(editingLicense.expires_at).toISOString().split('T')[0] : ""} onChange={e => setEditingLicense({ ...editingLicense, expires_at: new Date(e.target.value).toISOString() })} style={{ width: "100%", padding: "0.7rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.5rem", color: "white" }} />
                                            </div>
                                        </div>

                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                            <div style={{ padding: "0.75rem", background: "rgba(255,255,255,0.02)", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.05)" }}>
                                                <label style={{ display: "block", fontSize: "0.7rem", color: "rgba(255,255,255,0.5)", marginBottom: "0.75rem", fontWeight: 800, textTransform: "uppercase" }}>Özellik Paketi</label>
                                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                                                    {Object.entries({
                                                        adisyon: "Adisyon",
                                                        mobile_app: "Mobil",
                                                        trendyol_go: "Trendyol",
                                                        getir: "GetirYemek",
                                                        qnb_invoice: "QNB Fatura",
                                                        ai_features: "AI Asistan"
                                                    }).map(([f, label]) => (
                                                        <label key={f} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.75rem", color: editingLicense.features[f] ? "#7886C7" : "rgba(255,255,255,0.4)" }}>
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
                                                {/* Gelecekte eklemek için boşluk */}
                                            </div>
                                        </div>

                                        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                                            <button type="button" onClick={() => setShowEditLicense(false)} style={{ flex: 1, padding: "0.75rem", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "white", cursor: "pointer" }}>İptal</button>
                                            <button type="submit" style={{ flex: 1, padding: "0.75rem", borderRadius: "0.75rem", background: "#7886C7", border: "none", color: "white", fontWeight: 700, cursor: "pointer" }}>Güncelle</button>
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
                                <h2 style={{ fontSize: "1.5rem", fontWeight: 900, marginBottom: "0.25rem" }}>Blog Yönetimi</h2>
                                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.875rem" }}>{blogPosts.length} yazı Â· {blogPosts.filter(p => p.published).length} yayında</p>
                            </div>
                            <div style={{ display: "flex", gap: "0.75rem" }}>
                                <a href="/blog" target="_blank" style={{ padding: "0.6rem 1rem", borderRadius: "0.6rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", textDecoration: "none", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                    <Globe style={{ width: "0.85rem" }} /> Siteyi Gör
                                </a>
                                <button onClick={() => { setEditingPost(null); setPostForm({ title: "", slug: "", excerpt: "", content: "", category: "Genel", author: "JetPOS Ekibi", read_time: 5, published: false, featured: false }); setShowNewPost(true); }} style={{ padding: "0.6rem 1.25rem", borderRadius: "0.6rem", background: "#7886C7", border: "none", color: "white", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem" }}>
                                    <Plus style={{ width: "0.9rem" }} /> Yeni Yazı
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
                                            {post.featured && <span style={{ fontSize: "0.6rem", fontWeight: 800, background: "rgba(245,158,11,0.15)", color: "#f59e0b", padding: "0.1rem 0.4rem", borderRadius: "4px", flexShrink: 0 }}>ÖNE ÇIKAN</span>}
                                        </div>
                                        <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)" }}>{post.category} Â· {post.read_time} dk Â· /blog/{post.slug}</div>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
                                        <button onClick={() => togglePublish(post)} style={{ padding: "0.35rem 0.875rem", borderRadius: "9999px", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.75rem", background: post.published ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.07)", color: post.published ? "#4ade80" : "rgba(255,255,255,0.4)" }}>
                                            {post.published ? "✓ Yayında" : "Taslak"}
                                        </button>
                                        <a href={`/blog/${post.slug}`} target="_blank" style={{ padding: "0.35rem", borderRadius: "0.4rem", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", textDecoration: "none", display: "flex" }}><Eye style={{ width: "0.85rem" }} /></a>
                                        <button onClick={() => { setEditingPost(post); setPostForm({ title: post.title, slug: post.slug, excerpt: post.excerpt || "", content: post.content || "", category: post.category || "Genel", author: post.author || "JetPOS Ekibi", read_time: post.read_time || 5, published: post.published, featured: post.featured }); setShowNewPost(true); }} style={{ padding: "0.35rem", borderRadius: "0.4rem", background: "rgba(120, 134, 199, 0.1)", color: "#7886C7", border: "none", cursor: "pointer", display: "flex" }}><Edit style={{ width: "0.85rem" }} /></button>
                                        <button onClick={() => deletePost(post.id)} style={{ padding: "0.35rem", borderRadius: "0.4rem", background: "rgba(239,68,68,0.1)", color: "#f87171", border: "none", cursor: "pointer", display: "flex" }}><Trash2 style={{ width: "0.85rem" }} /></button>
                                    </div>
                                </motion.div>
                            ))}
                            {blogPosts.length === 0 && (
                                <div style={{ textAlign: "center", padding: "3rem", color: "rgba(255,255,255,0.25)" }}>
                                    <FileText style={{ width: "3rem", margin: "0 auto 1rem", display: "block" }} />
                                    <p>Henüz blog yazısı yok. Yeni Yazı butonuna tıklayın.</p>
                                </div>
                            )}
                        </div>

                        {showNewPost && (
                            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "1rem" }}>
                                <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "1.5rem", padding: "2rem", width: "100%", maxWidth: "680px", maxHeight: "90vh", overflowY: "auto" }}>
                                    <h2 style={{ marginBottom: "1.5rem", fontWeight: 800 }}>{editingPost ? "Yazıyı Düzenle" : "Yeni Blog Yazısı"}</h2>
                                    <form onSubmit={savePost} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                            <div>
                                                <label style={{ display: "block", fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginBottom: "0.35rem", fontWeight: 600 }}>Başlık *</label>
                                                <input value={postForm.title} onChange={e => { setPostForm(p => ({ ...p, title: e.target.value, slug: p.slug || e.target.value.toLowerCase().replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') })); }} required placeholder="Yazı başlığı" style={{ width: "100%", padding: "0.7rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.5rem", color: "white", fontFamily: "inherit" }} />
                                            </div>
                                            <div>
                                                <label style={{ display: "block", fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginBottom: "0.35rem", fontWeight: 600 }}>Slug (URL) *</label>
                                                <input value={postForm.slug} onChange={e => setPostForm(p => ({ ...p, slug: e.target.value }))} required placeholder="yazi-url-slug" style={{ width: "100%", padding: "0.7rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.5rem", color: "white", fontFamily: "inherit" }} />
                                            </div>
                                        </div>
                                        <div>
                                            <label style={{ display: "block", fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginBottom: "0.35rem", fontWeight: 600 }}>Özet</label>
                                            <textarea value={postForm.excerpt} onChange={e => setPostForm(p => ({ ...p, excerpt: e.target.value }))} rows={2} placeholder="Kısa açıklama (listede görünür)" style={{ width: "100%", padding: "0.7rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.5rem", color: "white", fontFamily: "inherit", resize: "vertical" }} />
                                        </div>
                                        <div>
                                            <label style={{ display: "block", fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginBottom: "0.35rem", fontWeight: 600 }}>İçerik (Markdown)</label>
                                            <textarea value={postForm.content} onChange={e => setPostForm(p => ({ ...p, content: e.target.value }))} rows={10} placeholder="## Başlık&#10;İçerik buraya..." style={{ width: "100%", padding: "0.7rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.5rem", color: "white", fontFamily: "monospace", fontSize: "0.875rem", resize: "vertical" }} />
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
                                                Yayında
                                            </label>
                                            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.875rem", color: "rgba(255,255,255,0.7)" }}>
                                                <input type="checkbox" checked={postForm.featured} onChange={e => setPostForm(p => ({ ...p, featured: e.target.checked }))} />
                                                Öne Çıkan
                                            </label>
                                        </div>
                                        <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
                                            <button type="button" onClick={() => { setShowNewPost(false); setEditingPost(null); }} style={{ flex: 1, padding: "0.875rem", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "white", cursor: "pointer", fontFamily: "inherit" }}>İptal</button>
                                            <button type="submit" disabled={savingPost} style={{ flex: 2, padding: "0.875rem", borderRadius: "0.75rem", background: "#7886C7", border: "none", color: "white", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                                                {savingPost ? "Kaydediliyor..." : (editingPost ? "Güncelle" : "Oluştur")}
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
                                <h2 style={{ fontSize: "1.5rem", fontWeight: 900, marginBottom: "0.25rem" }}>Müşteri Rehberi Yönetimi</h2>
                                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.875rem" }}>Müşteri portalındaki rehberleri buradan düzenleyin</p>
                            </div>
                            <div style={{ display: "flex", gap: "0.75rem" }}>
                                <a href="/portal" target="_blank" style={{ padding: "0.6rem 1rem", borderRadius: "0.6rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", textDecoration: "none", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                    <Globe style={{ width: "0.85rem" }} /> Portal Gör
                                </a>
                                <button onClick={() => { setEditingGuide(null); setGuideForm({ title: "", content: "", order_index: (guides.length + 1), is_active: true }); setShowNewGuide(true); }} style={{ padding: "0.6rem 1.25rem", borderRadius: "0.6rem", background: "#7886C7", border: "none", color: "white", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem" }}>
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
                                                <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)" }}>Sıra: {guide.order_index}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", gap: "0.5rem" }}>
                                            <button onClick={() => { setEditingGuide(guide); setGuideForm({ title: guide.title, content: guide.content, order_index: guide.order_index, is_active: guide.is_active }); setShowNewGuide(true); }} style={{ padding: "0.5rem", borderRadius: "0.50rem", background: "rgba(120, 134, 199, 0.1)", color: "#7886C7", border: "none" }}><Edit style={{ width: "0.9rem" }} /></button>
                                            <button onClick={() => deleteGuide(guide.id)} style={{ padding: "0.5rem", borderRadius: "0.50rem", background: "rgba(239,68,68,0.1)", color: "#f87171", border: "none" }}><Trash2 style={{ width: "0.9rem" }} /></button>
                                        </div>
                                    </div>
                                    <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.5, margin: 0, height: "4.5em", overflow: "hidden" }}>{guide.content}</p>
                                    {!guide.is_active && <div style={{ fontSize: "0.7rem", color: "rgba(239,68,68,1)", fontWeight: 800 }}>• PASİF</div>}
                                </motion.div>
                            ))}
                        </div>

                        {showNewGuide && (
                            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "1rem" }}>
                                <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "1.5rem", padding: "2rem", width: "100%", maxWidth: "600px" }}>
                                    <h2 style={{ marginBottom: "1.5rem", fontWeight: 800 }}>{editingGuide ? "Rehberi Düzenle" : "Yeni Rehber Ekle"}</h2>
                                    <form onSubmit={saveGuide} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                                        <div>
                                            <label style={{ display: "block", fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginBottom: "0.5rem", fontWeight: 600 }}>Başlık</label>
                                            <input value={guideForm.title} onChange={e => setGuideForm({ ...guideForm, title: e.target.value })} required style={{ width: "100%", padding: "0.75rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.5rem", color: "white" }} />
                                        </div>
                                        <div>
                                            <label style={{ display: "block", fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginBottom: "0.5rem", fontWeight: 600 }}>İçerik</label>
                                            <textarea value={guideForm.content} onChange={e => setGuideForm({ ...guideForm, content: e.target.value })} rows={6} required style={{ width: "100%", padding: "0.75rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.5rem", color: "white" }} />
                                        </div>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                            <div>
                                                <label style={{ display: "block", fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginBottom: "0.5rem", fontWeight: 600 }}>Sıra (Görünüm Sırası)</label>
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
                                            <button type="submit" disabled={savingGuide} style={{ flex: 2, padding: "0.875rem", borderRadius: "0.75rem", background: "#7886C7", color: "white", fontWeight: 700 }}>{savingGuide ? "Kaydediliyor..." : (editingGuide ? "Güncelle" : "Oluştur")}</button>
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
                                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.875rem" }}>Müşterilerden gelen yardım talepleri</p>
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
                                                <span style={{ fontWeight: 700, color: "white" }}>{(t.tenants as any)?.company_name}</span> • {new Date(t.created_at).toLocaleString('tr-TR')}
                                            </div>
                                            <p style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "rgba(255,255,255,0.7)", maxWidth: "600px" }}>{t.message}</p>
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", gap: "0.75rem" }}>
                                        {t.status === 'open' ? (
                                            <button onClick={() => updateTicketStatus(t.id, 'closed')} style={{ padding: "0.6rem 1rem", borderRadius: "0.6rem", background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.2)", color: "#4ade80", fontWeight: 700, cursor: "pointer" }}>Çözüldü Olarak İşaretle</button>
                                        ) : (
                                            <button onClick={() => updateTicketStatus(t.id, 'open')} style={{ padding: "0.6rem 1rem", borderRadius: "0.6rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontWeight: 700, cursor: "pointer" }}>Geri Aç</button>
                                        )}
                                    </div>
                                </div>
                            )) : (
                                <div style={{ textAlign: "center", padding: "4rem", color: "rgba(255,255,255,0.2)" }}>Henüz destek talebi bulunmuyor.</div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === "announcements" && (
                    <div style={{ animation: "fadeIn 0.3s ease-out" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                            <div>
                                <h2 style={{ fontSize: "1.5rem", fontWeight: 900, marginBottom: "0.25rem" }}>Sistem Duyuruları</h2>
                                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.875rem" }}>Tüm müşterilere gidecek global mesajlar</p>
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
                                    <h3 style={{ fontSize: "1.5rem", fontWeight: 900, marginBottom: "2rem" }}>Yeni Duyuru Yayınla</h3>
                                    <form onSubmit={saveAnnounce} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                                        <div>
                                            <label style={{ display: "block", fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginBottom: "0.5rem", fontWeight: 700, textTransform: "uppercase" }}>Başlık</label>
                                            <input required value={announceForm.title} onChange={e => setAnnounceForm({ ...announceForm, title: e.target.value })} style={{ width: "100%", padding: "0.875rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.75rem", color: "white" }} />
                                        </div>
                                        <div>
                                            <label style={{ display: "block", fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginBottom: "0.5rem", fontWeight: 700, textTransform: "uppercase" }}>Mesaj</label>
                                            <textarea required value={announceForm.message} onChange={e => setAnnounceForm({ ...announceForm, message: e.target.value })} rows={4} style={{ width: "100%", padding: "0.875rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.75rem", color: "white", resize: "none" }} />
                                        </div>
                                        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                                            <button type="button" onClick={() => setShowNewAnnounce(false)} style={{ flex: 1, padding: "1rem", borderRadius: "1rem", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontWeight: 700, cursor: "pointer" }}>İptal</button>
                                            <button type="submit" disabled={savingAnnounce} style={{ flex: 2, padding: "1rem", borderRadius: "1rem", background: "#f59e0b", color: "#000", fontWeight: 800, border: "none", cursor: "pointer" }}>
                                                {savingAnnounce ? "Yayınlanıyor..." : "Duyuruyu Yayınla"}
                                            </button>
                                        </div>
                                    </form>
                                </motion.div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "orders" && (
                    <>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                            <div>
                                <h2 style={{ fontSize: "1.75rem", fontWeight: 900, marginBottom: "0.25rem", color: "white" }}>Siparişler</h2>
                                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.875rem" }}>/satin-al sayfasından gelen satın alma talepleri — {orders.length} sipariş</p>
                            </div>
                            <button onClick={loadRequests} style={{ padding: "0.6rem 1.2rem", borderRadius: "0.75rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", fontWeight: 600 }}>
                                <RefreshCw className={loading ? "animate-spin" : ""} style={{ width: "1rem" }} /> Yenile
                            </button>
                        </div>

                        <div style={{ position: "relative", marginBottom: "1.5rem" }}>
                            <Search style={{ position: "absolute", left: "0.8rem", top: "50%", transform: "translateY(-50%)", width: "1rem", color: "rgba(255,255,255,0.3)" }} />
                            <input type="text" placeholder="Sipariş ara..." value={orderSearch} onChange={e => setOrderSearch(e.target.value)} style={{ width: "100%", padding: "0.75rem 1rem 0.75rem 2.5rem", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "0.75rem", color: "white" }} />
                        </div>

                        {orders.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "5rem 0", color: "rgba(255,255,255,0.25)" }}>
                                <ShoppingCart style={{ width: "3rem", height: "3rem", margin: "0 auto 1rem", opacity: 0.3 }} />
                                <p>Henüz sipariş yok.</p>
                            </div>
                        ) : (
                            <div style={{ display: "grid", gridTemplateColumns: selectedOrder ? "1fr 400px" : "1fr", gap: "1.5rem" }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                    {orders
                                        .filter(o => {
                                            const s = orderSearch.toLowerCase();
                                            return !s || (o.name?.toLowerCase().includes(s) || o.email?.toLowerCase().includes(s) || o.company?.toLowerCase().includes(s) || o.package_interest?.toLowerCase().includes(s));
                                        })
                                        .map((order) => {
                                            const planMatch = order.package_interest?.match(/Plan: ([^\n|]+)/);
                                            const taksitMatch = order.package_interest?.match(/Taksit: ([^\n|]+)/);
                                            const planLabel = planMatch ? planMatch[1].trim() : order.package_interest || "—";
                                            const taksit = taksitMatch ? taksitMatch[1].trim() : null;
                                            const statusCfg = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.new;
                                            return (
                                                <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                                    onClick={() => setSelectedOrder(order)}
                                                    style={{ background: selectedOrder?.id === order.id ? "rgba(120,134,199,0.08)" : "rgba(255,255,255,0.03)", border: `1px solid ${selectedOrder?.id === order.id ? "rgba(120,134,199,0.3)" : "rgba(255,255,255,0.07)"}`, borderRadius: "1rem", padding: "1.25rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "1rem" }}>
                                                    <div style={{ width: "2.75rem", height: "2.75rem", borderRadius: "0.75rem", background: "rgba(120,134,199,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                                        <CreditCard style={{ width: "1.2rem", color: "#7886C7" }} />
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{order.name}</div>
                                                        <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{order.company} • {order.email}</div>
                                                    </div>
                                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.35rem", flexShrink: 0 }}>
                                                        <span style={{ fontSize: "0.75rem", fontWeight: 800, background: "rgba(120,134,199,0.15)", color: "#B0BAE6", padding: "0.2rem 0.6rem", borderRadius: "99px" }}>{planLabel}</span>
                                                        {taksit && <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)" }}>{taksit}</span>}
                                                        <span style={{ fontSize: "0.7rem", fontWeight: 700, background: statusCfg.bg, color: statusCfg.color, padding: "0.15rem 0.5rem", borderRadius: "4px" }}>{statusCfg.label}</span>
                                                    </div>
                                                    <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.25)", flexShrink: 0 }}>{timeAgo(order.created_at)}</div>
                                                </motion.div>
                                            );
                                        })}
                                </div>

                                {selectedOrder && (() => {
                                    const planMatch = selectedOrder.package_interest?.match(/Plan: ([^\n|]+)/);
                                    const taksitMatch = selectedOrder.package_interest?.match(/Taksit: ([^\n|]+)/);
                                    const periodMatch = selectedOrder.package_interest?.match(/Dönem: ([^\n|]+)/);
                                    const tutar = selectedOrder.package_interest?.match(/Tutar: ([^\n|]+)/);
                                    const statusCfg = STATUS_CONFIG[selectedOrder.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.new;
                                    return (
                                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "1.25rem", padding: "1.75rem", height: "fit-content", position: "sticky", top: "6rem" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                                                <h3 style={{ margin: 0, fontWeight: 800, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                    <Package style={{ width: "1.1rem", color: "#7886C7" }} /> Sipariş Detayı
                                                </h3>
                                                <button onClick={() => setSelectedOrder(null)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "1.25rem" }}>×</button>
                                            </div>

                                            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem", marginBottom: "1.5rem" }}>
                                                {[
                                                    { label: "Ad Soyad", value: selectedOrder.name },
                                                    { label: "E-posta", value: selectedOrder.email },
                                                    { label: "Telefon", value: selectedOrder.phone },
                                                    { label: "Firma", value: selectedOrder.company },
                                                    { label: "Sektör", value: selectedOrder.sector },
                                                ].map(({ label, value }) => value ? (
                                                    <div key={label}>
                                                        <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.15rem" }}>{label}</div>
                                                        <div style={{ fontSize: "0.9rem" }}>{value}</div>
                                                    </div>
                                                ) : null)}
                                            </div>

                                            <div style={{ background: "rgba(120,134,199,0.08)", border: "1px solid rgba(120,134,199,0.2)", borderRadius: "0.875rem", padding: "1.25rem", marginBottom: "1.5rem" }}>
                                                <div style={{ fontSize: "0.7rem", color: "#7886C7", fontWeight: 800, textTransform: "uppercase", marginBottom: "0.75rem" }}>Sipariş Bilgileri</div>
                                                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.875rem" }}>
                                                    {planMatch && <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "rgba(255,255,255,0.4)" }}>Plan</span><span style={{ fontWeight: 700 }}>{planMatch[1].trim()}</span></div>}
                                                    {periodMatch && <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "rgba(255,255,255,0.4)" }}>Dönem</span><span style={{ fontWeight: 700 }}>{periodMatch[1].trim()}</span></div>}
                                                    {taksitMatch && <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "rgba(255,255,255,0.4)" }}>Taksit</span><span style={{ fontWeight: 700 }}>{taksitMatch[1].trim()}</span></div>}
                                                    {tutar && <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "0.5rem", marginTop: "0.25rem" }}><span style={{ color: "rgba(255,255,255,0.4)" }}>Tutar</span><span style={{ fontWeight: 900, color: "#22c55e" }}>{tutar[1].trim()}</span></div>}
                                                </div>
                                            </div>

                                            <div style={{ marginBottom: "1rem" }}>
                                                <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.5rem" }}>Durum Güncelle</div>
                                                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                                                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                                                        <button key={key} onClick={async () => {
                                                            await updateStatus(selectedOrder.id, key as any);
                                                            setSelectedOrder({ ...selectedOrder, status: key });
                                                        }} style={{ padding: "0.6rem 1rem", borderRadius: "0.5rem", border: `1px solid ${selectedOrder.status === key ? cfg.color + "40" : "rgba(255,255,255,0.07)"}`, background: selectedOrder.status === key ? cfg.bg : "transparent", color: selectedOrder.status === key ? cfg.color : "rgba(255,255,255,0.5)", cursor: "pointer", textAlign: "left", fontWeight: selectedOrder.status === key ? 700 : 400, fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                            <cfg.icon style={{ width: "0.85rem" }} /> {cfg.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.25)", textAlign: "right" }}>
                                                {new Date(selectedOrder.created_at).toLocaleString("tr-TR")}
                                            </div>
                                        </motion.div>
                                    );
                                })()}
                            </div>
                        )}
                    </>
                )}

                {activeTab === "staff" && canSee("staff") && (
                    <div>
                        <div style={{ marginBottom: "1.5rem" }}>
                            <h2 style={{ fontSize: "1.4rem", fontWeight: 900, margin: 0 }}>Ekip &amp; Yetkiler</h2>
                            <p style={{ margin: "0.35rem 0 0", fontSize: "0.8rem", color: "rgba(255,255,255,0.4)" }}>
                                Panele erişebilecek ekip üyeleri oluşturun; staff rolündekiler yalnızca izin verdiğiniz bölümleri görür ve kullanabilir.
                            </p>
                        </div>

                        {/* Yeni üye formu */}
                        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", padding: "1.5rem", marginBottom: "1.25rem" }}>
                            <h3 style={{ margin: "0 0 1rem", fontSize: "0.95rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <UserPlus style={{ width: "1rem", color: "#7886C7" }} /> Yeni Ekip Üyesi
                            </h3>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.9rem", marginBottom: "1rem" }}>
                                <input type="text" placeholder="Kullanıcı adı (küçük harf)" value={staffForm.username}
                                    onChange={e => setStaffForm(f => ({ ...f, username: e.target.value.toLowerCase() }))}
                                    style={{ padding: "0.7rem 0.9rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "white", outline: "none", fontSize: "0.85rem", fontFamily: "inherit" }} />
                                <input type="text" placeholder="Ad Soyad" value={staffForm.name}
                                    onChange={e => setStaffForm(f => ({ ...f, name: e.target.value }))}
                                    style={{ padding: "0.7rem 0.9rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "white", outline: "none", fontSize: "0.85rem", fontFamily: "inherit" }} />
                                <input type="password" placeholder="Şifre (min. 8 karakter)" value={staffForm.password}
                                    onChange={e => setStaffForm(f => ({ ...f, password: e.target.value }))}
                                    style={{ padding: "0.7rem 0.9rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "white", outline: "none", fontSize: "0.85rem", fontFamily: "inherit" }} />
                                <select value={staffForm.role} onChange={e => setStaffForm(f => ({ ...f, role: e.target.value as "staff" | "admin" }))}
                                    style={{ padding: "0.7rem 0.9rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "white", outline: "none", fontSize: "0.85rem", fontFamily: "inherit" }}>
                                    <option value="staff" style={{ background: "#111827" }}>Staff (sınırlı yetki)</option>
                                    <option value="admin" style={{ background: "#111827" }}>Admin (tam yetki)</option>
                                </select>
                            </div>
                            <div style={{ marginBottom: "1rem" }}>
                                <input type="text" placeholder="İzinli IP'ler — virgülle ayır, boş bırak = her yerden (örn: 85.100.1.20, 78.190.*)"
                                    value={staffForm.allowedIps}
                                    onChange={e => setStaffForm(f => ({ ...f, allowedIps: e.target.value }))}
                                    style={{ width: "100%", padding: "0.7rem 0.9rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "white", outline: "none", fontSize: "0.85rem", fontFamily: "inherit" }} />
                                {callerIp && (
                                    <p style={{ margin: "0.4rem 0 0", fontSize: "0.7rem", color: "rgba(255,255,255,0.35)" }}>
                                        Şu anki IP&apos;niz: <strong style={{ color: "#7886C7", cursor: "pointer" }} onClick={() => setStaffForm(f => ({ ...f, allowedIps: f.allowedIps ? `${f.allowedIps}, ${callerIp}` : callerIp }))}>{callerIp}</strong> (eklemek için tıkla)
                                    </p>
                                )}
                            </div>
                            {staffForm.role === "staff" && (
                                <>
                                    <p style={{ margin: "0 0 0.6rem", fontSize: "0.7rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                        Erişebileceği Bölümler
                                    </p>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem", marginBottom: "1rem" }}>
                                        {PERM_OPTIONS.map(p => {
                                            const on = staffFormPerms[p.key] === true;
                                            return (
                                                <button key={p.key} onClick={() => setStaffFormPerms(prev => ({ ...prev, [p.key]: !on }))} style={{
                                                    padding: "0.4rem 0.8rem", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 700,
                                                    border: `1px solid ${on ? "rgba(34,197,94,0.5)" : "rgba(255,255,255,0.1)"}`,
                                                    background: on ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.03)",
                                                    color: on ? "#4ade80" : "rgba(255,255,255,0.45)",
                                                    cursor: "pointer", fontFamily: "inherit",
                                                }}>
                                                    {on ? "✓ " : ""}{p.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                            <button onClick={createStaff} disabled={savingStaff || !staffForm.username || staffForm.password.length < 8} style={{
                                padding: "0.7rem 1.6rem", borderRadius: "10px", border: "none",
                                background: (savingStaff || !staffForm.username || staffForm.password.length < 8) ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg, #5A659F, #7886C7)",
                                color: (savingStaff || !staffForm.username || staffForm.password.length < 8) ? "rgba(255,255,255,0.3)" : "white",
                                fontWeight: 800, fontSize: "0.85rem", cursor: (savingStaff || !staffForm.username || staffForm.password.length < 8) ? "not-allowed" : "pointer", fontFamily: "inherit",
                            }}>
                                {savingStaff ? "Ekleniyor..." : "Üye Ekle"}
                            </button>
                        </div>

                        {/* Üye listesi */}
                        {staffList.length === 0 ? (
                            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.85rem" }}>
                                Henüz ekip üyesi yok. (Liste boşsa ve ekleme hata veriyorsa admin_staff migration&apos;ının uygulandığından emin olun.)
                            </p>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
                                {staffList.map(m => {
                                    const badge = ROLE_BADGES[m.role] || ROLE_BADGES.staff;
                                    return (
                                        <div key={m.id} style={{
                                            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                                            borderRadius: "16px", padding: "1.25rem 1.5rem",
                                            opacity: m.active ? 1 : 0.55,
                                        }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.9rem", flexWrap: "wrap" }}>
                                                <div style={{
                                                    width: "2.4rem", height: "2.4rem", borderRadius: "50%", flexShrink: 0,
                                                    background: "linear-gradient(135deg, #5A659F, #7886C7)",
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    fontSize: "0.95rem", fontWeight: 900, color: "white",
                                                }}>
                                                    {(m.name || m.username).charAt(0).toUpperCase()}
                                                </div>
                                                <div style={{ flex: 1, minWidth: "160px" }}>
                                                    <p style={{ margin: 0, fontWeight: 800, fontSize: "0.95rem" }}>
                                                        {m.name || m.username}
                                                        <span style={{ color: "rgba(255,255,255,0.35)", fontWeight: 500, fontSize: "0.8rem" }}> @{m.username}</span>
                                                    </p>
                                                    <p style={{ margin: "0.15rem 0 0", fontSize: "0.7rem", color: "rgba(255,255,255,0.35)" }}>
                                                        Son giriş: {m.last_login_at ? timeAgo(m.last_login_at) : "hiç"}
                                                    </p>
                                                </div>
                                                <span style={{
                                                    fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.1em",
                                                    color: badge.color, background: badge.bg,
                                                    padding: "0.25rem 0.6rem", borderRadius: "6px",
                                                }}>
                                                    {badge.label}
                                                </span>
                                                <button onClick={() => patchStaff(m.id, { active: !m.active }, m.active ? "Üye pasife alındı" : "Üye aktifleştirildi")} style={{
                                                    padding: "0.45rem 0.9rem", borderRadius: "8px", fontSize: "0.72rem", fontWeight: 700,
                                                    border: `1px solid ${m.active ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.12)"}`,
                                                    background: m.active ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.04)",
                                                    color: m.active ? "#4ade80" : "rgba(255,255,255,0.45)",
                                                    cursor: "pointer", fontFamily: "inherit",
                                                }}>
                                                    {m.active ? "Aktif" : "Pasif"}
                                                </button>
                                                <button onClick={() => {
                                                    const current = (m.allowed_ips || []).join(", ");
                                                    const val = window.prompt(`@${m.username} için izinli IP'ler (virgülle ayır, boş = her yerden):`, current);
                                                    if (val !== null) patchStaff(m.id, { allowed_ips: parseIpList(val) }, "IP izinleri güncellendi");
                                                }} title="IP kısıtı" style={{
                                                    padding: "0.45rem 0.9rem", borderRadius: "8px", fontSize: "0.72rem", fontWeight: 700,
                                                    border: `1px solid ${(m.allowed_ips || []).length > 0 ? "rgba(240,180,41,0.45)" : "rgba(255,255,255,0.12)"}`,
                                                    background: (m.allowed_ips || []).length > 0 ? "rgba(240,180,41,0.1)" : "rgba(255,255,255,0.04)",
                                                    color: (m.allowed_ips || []).length > 0 ? "#f0b429" : "rgba(255,255,255,0.45)",
                                                    cursor: "pointer", fontFamily: "inherit",
                                                }}>
                                                    {(m.allowed_ips || []).length > 0 ? `IP: ${m.allowed_ips.length} kural` : "IP: serbest"}
                                                </button>
                                                <button onClick={() => {
                                                    const pw = window.prompt(`@${m.username} için yeni şifre (min. 8 karakter):`);
                                                    if (pw) patchStaff(m.id, { password: pw }, "Şifre güncellendi (oturumları düşürüldü)");
                                                }} title="Şifre sıfırla" style={{
                                                    width: "2rem", height: "2rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)",
                                                    background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.55)",
                                                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                                                }}>
                                                    <KeyRound style={{ width: "0.85rem" }} />
                                                </button>
                                                <button onClick={() => removeStaff(m.id, m.username)} title="Sil" style={{
                                                    width: "2rem", height: "2rem", borderRadius: "8px", border: "none",
                                                    background: "rgba(239,68,68,0.1)", color: "#ef4444",
                                                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                                                }}>
                                                    <Trash2 style={{ width: "0.85rem" }} />
                                                </button>
                                            </div>
                                            {m.role === "staff" && (
                                                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.9rem", paddingTop: "0.9rem", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                                                    {PERM_OPTIONS.map(p => {
                                                        const on = m.permissions?.[p.key] === true;
                                                        return (
                                                            <button key={p.key}
                                                                onClick={() => patchStaff(m.id, { permissions: { ...m.permissions, [p.key]: !on } }, "Yetkiler güncellendi")}
                                                                style={{
                                                                    padding: "0.35rem 0.7rem", borderRadius: "9999px", fontSize: "0.7rem", fontWeight: 700,
                                                                    border: `1px solid ${on ? "rgba(34,197,94,0.5)" : "rgba(255,255,255,0.08)"}`,
                                                                    background: on ? "rgba(34,197,94,0.12)" : "transparent",
                                                                    color: on ? "#4ade80" : "rgba(255,255,255,0.35)",
                                                                    cursor: "pointer", fontFamily: "inherit",
                                                                }}>
                                                                {on ? "✓ " : ""}{p.label}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "game" && (
                    <div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                            <div>
                                <h2 style={{ fontSize: "1.4rem", fontWeight: 900, margin: 0 }}>Sepete Yakala — Oyun Ayarları</h2>
                                <p style={{ margin: "0.35rem 0 0", fontSize: "0.8rem", color: "rgba(255,255,255,0.4)" }}>
                                    Zorluk, ödüller ve skor eşikleri buradan yönetilir. Kaydedince sitede anında geçerli olur.
                                </p>
                            </div>
                            <button onClick={saveGameConfig} disabled={savingGame || !gameConfig} style={{
                                padding: "0.75rem 1.75rem", borderRadius: "12px", border: "none",
                                background: savingGame ? "rgba(255,255,255,0.1)" : "#7886C7",
                                color: "white", fontWeight: 800, fontSize: "0.9rem",
                                cursor: savingGame ? "not-allowed" : "pointer",
                            }}>
                                {savingGame ? "Kaydediliyor..." : "Kaydet"}
                            </button>
                        </div>

                        {!gameConfig ? (
                            <p style={{ color: "rgba(255,255,255,0.4)" }}>Yükleniyor...</p>
                        ) : (
                            <>
                                {/* Genel ayarlar */}
                                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", padding: "1.5rem", marginBottom: "1.25rem" }}>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                                        <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800 }}>Genel</h3>
                                        <label style={{ display: "flex", alignItems: "center", gap: "0.6rem", cursor: "pointer" }}>
                                            <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)", fontWeight: 700 }}>
                                                {gameConfig.enabled ? "Oyun AÇIK" : "Oyun KAPALI"}
                                            </span>
                                            <button
                                                onClick={() => setGameConfig(p => p ? { ...p, enabled: !p.enabled } : p)}
                                                style={{
                                                    width: "2.6rem", height: "1.4rem", borderRadius: "9999px", border: "none",
                                                    background: gameConfig.enabled ? "#22c55e" : "rgba(255,255,255,0.15)",
                                                    position: "relative", cursor: "pointer", transition: "background 0.2s",
                                                }}
                                            >
                                                <span style={{
                                                    position: "absolute", top: "0.2rem",
                                                    left: gameConfig.enabled ? "calc(100% - 1.2rem)" : "0.2rem",
                                                    width: "1rem", height: "1rem", borderRadius: "50%",
                                                    background: "white", transition: "left 0.2s",
                                                }} />
                                            </button>
                                        </label>
                                    </div>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: "1rem" }}>
                                        {([
                                            { k: "maxPlays", label: "Oyun Hakkı (kişi başı)" },
                                            { k: "durationSec", label: "Süre (sn)" },
                                            { k: "spawnEveryMs", label: "Ürün Sıklığı (ms)" },
                                            { k: "baseFallSpeed", label: "Başlangıç Hızı (px/sn)" },
                                            { k: "speedRampPerSec", label: "Hızlanma (px/sn²)" },
                                            { k: "basketWidth", label: "Sepet Genişliği (px)" },
                                        ] as { k: keyof GameConfig; label: string }[]).map(f => (
                                            <div key={f.k}>
                                                <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                                    {f.label}
                                                </label>
                                                <input
                                                    type="number"
                                                    value={Number(gameConfig[f.k])}
                                                    onChange={e => setGameConfig(p => p ? ({ ...p, [f.k]: Number(e.target.value) || 0 } as GameConfig) : p)}
                                                    style={{ width: "100%", padding: "0.65rem 0.85rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "white", outline: "none", fontSize: "0.9rem", fontFamily: "inherit" }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ marginTop: "1rem" }}>
                                        <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                            Dipnot (yasal metin)
                                        </label>
                                        <input
                                            type="text"
                                            value={gameConfig.footnote}
                                            onChange={e => setGameConfig(p => p ? { ...p, footnote: e.target.value } : p)}
                                            style={{ width: "100%", padding: "0.65rem 0.85rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "white", outline: "none", fontSize: "0.85rem", fontFamily: "inherit" }}
                                        />
                                    </div>
                                </div>

                                {/* Ürünler */}
                                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", padding: "1.5rem", marginBottom: "1.25rem" }}>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                                        <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800 }}>Düşen Ürünler</h3>
                                        <button onClick={() => setGameConfig(p => p ? { ...p, items: [...p.items, { emoji: "🎁", points: 10, weight: 10 }] } : p)} style={{ padding: "0.5rem 1rem", borderRadius: "10px", border: "1px solid rgba(120,134,199,0.4)", background: "rgba(120,134,199,0.1)", color: "#7886C7", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer" }}>
                                            + Ürün Ekle
                                        </button>
                                    </div>
                                    <p style={{ margin: "0 0 1rem", fontSize: "0.72rem", color: "rgba(255,255,255,0.35)" }}>
                                        Puan negatifse bombadır. Ağırlık = düşme sıklığı (oran: ağırlık / toplam).
                                    </p>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                        {gameConfig.items.map((it, idx) => (
                                            <div key={idx} style={{ display: "grid", gridTemplateColumns: "70px 1fr 1fr 36px", gap: "0.6rem", alignItems: "center" }}>
                                                <input type="text" value={it.emoji} title="Emoji"
                                                    onChange={e => setGameConfig(p => p ? { ...p, items: p.items.map((x, i) => i === idx ? { ...x, emoji: e.target.value } : x) } : p)}
                                                    style={{ padding: "0.55rem", textAlign: "center", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "white", outline: "none", fontSize: "1rem", fontFamily: "inherit" }} />
                                                <div>
                                                    <input type="number" value={it.points} title="Puan"
                                                        onChange={e => setGameConfig(p => p ? { ...p, items: p.items.map((x, i) => i === idx ? { ...x, points: Number(e.target.value) || 0 } : x) } : p)}
                                                        style={{ width: "100%", padding: "0.55rem 0.75rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: it.points < 0 ? "#f87171" : "#4ade80", outline: "none", fontSize: "0.85rem", fontFamily: "inherit" }} />
                                                    <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.3)" }}>puan</span>
                                                </div>
                                                <div>
                                                    <input type="number" value={it.weight} title="Ağırlık"
                                                        onChange={e => setGameConfig(p => p ? { ...p, items: p.items.map((x, i) => i === idx ? { ...x, weight: Number(e.target.value) || 0 } : x) } : p)}
                                                        style={{ width: "100%", padding: "0.55rem 0.75rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "white", outline: "none", fontSize: "0.85rem", fontFamily: "inherit" }} />
                                                    <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.3)" }}>ağırlık</span>
                                                </div>
                                                <button onClick={() => setGameConfig(p => p ? { ...p, items: p.items.filter((_, i) => i !== idx) } : p)} title="Sil"
                                                    style={{ width: "36px", height: "36px", borderRadius: "10px", border: "none", background: "rgba(239,68,68,0.1)", color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                    <Trash2 style={{ width: "0.85rem" }} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Ödül eşikleri */}
                                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", padding: "1.5rem" }}>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                                        <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800 }}>Ödül Eşikleri</h3>
                                        <button onClick={() => setGameConfig(p => p ? { ...p, tiers: [...p.tiers, { minScore: 999, label: "Yeni", prize: "Yeni Ödül" }] } : p)} style={{ padding: "0.5rem 1rem", borderRadius: "10px", border: "1px solid rgba(120,134,199,0.4)", background: "rgba(120,134,199,0.1)", color: "#7886C7", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer" }}>
                                            + Ödül Ekle
                                        </button>
                                    </div>
                                    <p style={{ margin: "0 0 1rem", fontSize: "0.72rem", color: "rgba(255,255,255,0.35)" }}>
                                        Ödül, EN İYİ skora göre verilir. Eşiği yükselttikçe o ödülü kazanmak zorlaşır — büyük ödülleri (barkod okuyucu, yüksek indirim) en üst eşiklere koyun. İlk satırın eşiği 0 olmalı (herkes en az onu kazanır). Kaydedince eşiğe göre otomatik sıralanır.
                                    </p>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                        {gameConfig.tiers.map((t, idx) => (
                                            <div key={idx} style={{ display: "grid", gridTemplateColumns: "110px 110px 1fr 36px", gap: "0.6rem", alignItems: "center" }}>
                                                <div>
                                                    <input type="number" value={t.minScore} title="Minimum skor"
                                                        onChange={e => setGameConfig(p => p ? { ...p, tiers: p.tiers.map((x, i) => i === idx ? { ...x, minScore: Number(e.target.value) || 0 } : x) } : p)}
                                                        style={{ width: "100%", padding: "0.55rem 0.75rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "white", outline: "none", fontSize: "0.85rem", fontFamily: "inherit" }} />
                                                    <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.3)" }}>min. skor</span>
                                                </div>
                                                <input type="text" value={t.label} placeholder="Etiket"
                                                    onChange={e => setGameConfig(p => p ? { ...p, tiers: p.tiers.map((x, i) => i === idx ? { ...x, label: e.target.value } : x) } : p)}
                                                    style={{ padding: "0.55rem 0.75rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "white", outline: "none", fontSize: "0.85rem", fontFamily: "inherit" }} />
                                                <input type="text" value={t.prize} placeholder="Ödül adı"
                                                    onChange={e => setGameConfig(p => p ? { ...p, tiers: p.tiers.map((x, i) => i === idx ? { ...x, prize: e.target.value } : x) } : p)}
                                                    style={{ padding: "0.55rem 0.75rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "white", outline: "none", fontSize: "0.85rem", fontFamily: "inherit" }} />
                                                <button onClick={() => setGameConfig(p => p ? { ...p, tiers: p.tiers.filter((_, i) => i !== idx) } : p)} title="Sil"
                                                    style={{ width: "36px", height: "36px", borderRadius: "10px", border: "none", background: "rgba(239,68,68,0.1)", color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                    <Trash2 style={{ width: "0.85rem" }} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {activeTab === "about" && (
                    <>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                            <div>
                                <h2 style={{ fontSize: "1.5rem", fontWeight: 900, marginBottom: "0.25rem" }}>Hakkımızda Yönetimi</h2>
                                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.875rem" }}>Site içeriğini buradan düzenleyin</p>
                            </div>
                            <a href="/hakkimizda" target="_blank" style={{ padding: "0.6rem 1rem", borderRadius: "0.6rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", textDecoration: "none", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                <Globe style={{ width: "0.85rem" }} /> Sayfayı Gör
                            </a>
                        </div>

                        {["hero", "story"].map(section => {
                            const data = aboutContent[section] ?? {};
                            return (
                                <div key={section} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "1rem", padding: "1.5rem", marginBottom: "1rem" }}>
                                    <h3 style={{ fontWeight: 800, color: "white", marginBottom: "1rem", textTransform: "capitalize" }}>{section === "hero" ? "🏠 Hero Bölümü" : "📖 Hikaye Bölümü"}</h3>
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
                                        }} disabled={savingAbout} style={{ alignSelf: "flex-start", padding: "0.5rem 1.25rem", borderRadius: "0.5rem", background: "#7886C7", border: "none", color: "white", fontWeight: 700, cursor: "pointer", fontSize: "0.85rem" }}>
                                            {savingAbout ? "Kaydediliyor..." : "Kaydet"}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}

                        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "1rem", padding: "1.5rem" }}>
                            <h3 style={{ fontWeight: 800, color: "white", marginBottom: "0.75rem" }}>📊 İstatistikler</h3>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.75rem" }}>
                                {((aboutContent.stats ?? {}).items ?? []).map((item: any, i: number) => (
                                    <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "0.75rem", padding: "0.875rem" }}>
                                        <input defaultValue={item.value} id={`stat-val-${i}`} placeholder="Değer" style={{ width: "100%", padding: "0.375rem 0.5rem", background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.1)", color: "white", fontWeight: 800, fontSize: "1.1rem", marginBottom: "0.375rem", fontFamily: "inherit" }} />
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
                            }} disabled={savingAbout} style={{ marginTop: "1rem", padding: "0.5rem 1.25rem", borderRadius: "0.5rem", background: "#7886C7", border: "none", color: "white", fontWeight: 700, cursor: "pointer", fontSize: "0.85rem" }}>
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
