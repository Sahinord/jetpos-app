"use client";

import { useState, useEffect } from "react";
import { Lock, Key, ShieldCheck, AlertCircle, Loader2, User, UserPlus, LogIn, ChevronRight, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import AdminPortal from "../Admin/AdminPortal";

type AuthState = "CHECKING" | "LICENSE_GATE" | "REGISTER" | "LOGIN" | "AUTHORIZED" | "ADMIN_PORTAL";
type Notification = { message: string; type: 'success' | 'error' } | null;

export default function LicenseGate({ children }: { children: React.ReactNode }) {
    const [authState, setAuthState] = useState<AuthState>("CHECKING");
    const [licenseData, setLicenseData] = useState<any>(null);
    const [licenseKey, setLicenseKey] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [notification, setNotification] = useState<Notification>(null);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 4000);
    };

    const getHWID = async () => {
        try {
            if (typeof window !== 'undefined' && (window as any).require) {
                const machineId = (window as any).require('node-machine-id');
                return await machineId.machineId();
            }
            return "browser-demo-id";
        } catch (e) {
            return "unknown-device";
        }
    };

    useEffect(() => {
        initAuth();
    }, []);

    const initAuth = async () => {
        console.log("Başlatılıyor: Lisans ve Oturum Kontrolü...");
        const savedKey = localStorage.getItem("app_license_key");
        const session = localStorage.getItem("app_session");

        if (savedKey) {
            const result = await verifyLicense(savedKey, true);

            if (result) {
                if (session) {
                    try {
                        const { expiry } = JSON.parse(session);
                        if (new Date(expiry) > new Date()) {
                            setAuthState("AUTHORIZED");
                            return;
                        }
                    } catch (e) {
                        localStorage.removeItem("app_session");
                    }
                }

                if (!result.username) {
                    setAuthState("REGISTER");
                } else {
                    setUsername(result.username);
                    setAuthState("LOGIN");
                }
            } else {
                setAuthState("LICENSE_GATE");
            }
        } else {
            setAuthState("LICENSE_GATE");
        }
    };

    const verifyLicense = async (key: string, silent = false) => {
        if (!silent) setVerifying(true);
        setNotification(null);

        const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

        // Admin Portal Bypass
        if (adminPassword && key === adminPassword) {
            setAuthState("ADMIN_PORTAL");
            setVerifying(false);
            return null;
        }

        try {
            const hwid = await getHWID();
            const { data, error: fetchError } = await supabase
                .from('licenses')
                .select('*')
                .eq('license_key', key)
                .single();

            if (fetchError || !data) throw new Error("Geçersiz lisans anahtarı.");
            if (!data.is_active) throw new Error("Bu lisans askıya alınmış.");
            if (data.expires_at && new Date(data.expires_at) < new Date()) throw new Error("Lisans süresi dolmuş.");

            if (!data.hwid) {
                const { error: updateError } = await supabase.from('licenses').update({ hwid }).eq('id', data.id);
                if (updateError) throw updateError;
            } else if (data.hwid !== hwid) {
                throw new Error("Bu lisans başka bir bilgisayara tanımlanmış.");
            }

            setLicenseData(data);
            localStorage.setItem("app_license_key", key);

            if (!silent) {
                if (!data.username) {
                    setAuthState("REGISTER");
                } else {
                    setUsername(data.username);
                    setAuthState("LOGIN");
                }
            }
            return data;
        } catch (err: any) {
            if (!silent) showToast(err.message, "error");
            localStorage.removeItem("app_license_key");
            return null;
        } finally {
            if (!silent) setVerifying(false);
        }
    };

    const handleRegister = async () => {
        if (!username || !password) {
            showToast("Kullanıcı adı ve şifre gereklidir.", "error");
            return;
        }
        setVerifying(true);
        try {
            const { error: updateError } = await supabase
                .from('licenses')
                .update({ username, password })
                .eq('id', licenseData.id);

            if (updateError) throw updateError;

            createSession();
            setAuthState("AUTHORIZED");
        } catch (err: any) {
            showToast(err.message, "error");
        } finally {
            setVerifying(false);
        }
    };

    const handleLogin = async () => {
        if (!password) {
            showToast("Şifre gereklidir.", "error");
            return;
        }
        setVerifying(true);
        try {
            const { data, error: fetchError } = await supabase
                .from('licenses')
                .select('password, username')
                .eq('id', licenseData.id)
                .single();

            if (fetchError) throw fetchError;

            if (data.password === password) {
                createSession();
                setAuthState("AUTHORIZED");
            } else {
                showToast("Hatalı şifre! Lütfen kontrol edin.", "error");
            }
        } catch (err: any) {
            showToast(err.message, "error");
        } finally {
            setVerifying(false);
        }
    };

    const createSession = () => {
        if (rememberMe) {
            const expiry = new Date();
            expiry.setDate(expiry.getDate() + 10);
            localStorage.setItem("app_session", JSON.stringify({ username, expiry: expiry.toISOString() }));
        } else {
            localStorage.removeItem("app_session");
        }
    };

    if (authState === "CHECKING") {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
                <div className="text-center space-y-4">
                    <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
                    <p className="text-secondary font-bold text-sm tracking-widest animate-pulse font-poppins">GÜVENLİK KONTROLÜ...</p>
                </div>
            </div>
        );
    }

    if (authState === "AUTHORIZED") return <>{children}</>;

    if (authState === "ADMIN_PORTAL") {
        return (
            <div className="min-h-screen bg-[#0f172a] p-8 lg:p-12 overflow-y-auto">
                <div className="max-w-7xl mx-auto space-y-8">
                    <button
                        onClick={() => {
                            setAuthState("LICENSE_GATE");
                            setLicenseKey("");
                        }}
                        className="bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-3 rounded-xl text-secondary hover:text-white transition-all flex items-center space-x-3 font-bold text-xs tracking-wider"
                    >
                        <ChevronRight className="w-4 h-4 rotate-180" />
                        <span>GİRİŞ EKRANINA DÖN</span>
                    </button>
                    <AdminPortal showToast={showToast} />
                </div>

                {/* Global Toast for Admin Portal */}
                <AnimatePresence>
                    {notification && (
                        <motion.div
                            initial={{ opacity: 0, y: 50, x: "-50%" }}
                            animate={{ opacity: 1, y: 0, x: "-50%" }}
                            exit={{ opacity: 0, y: 50, x: "-50%" }}
                            className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 border backdrop-blur-xl ${notification.type === 'success'
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                                }`}
                        >
                            {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                            <span className="font-bold text-sm tracking-wide">{notification.message}</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 font-sans overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 100 }}
                className="w-full max-w-md relative"
            >
                <div className="glass-card !p-10 border-white/10 shadow-3xl bg-slate-900/40 backdrop-blur-3xl relative z-10">
                    <div className="text-center mb-10">
                        <div className="w-20 h-20 bg-gradient-to-tr from-primary/20 to-purple-500/20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-white/10 shadow-2xl">
                            <AnimatePresence mode="wait">
                                {authState === "LICENSE_GATE" && (
                                    <motion.div key="lic" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                                        <ShieldCheck className="w-10 h-10 text-primary" />
                                    </motion.div>
                                )}
                                {authState === "REGISTER" && (
                                    <motion.div key="reg" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                                        <UserPlus className="w-10 h-10 text-emerald-400" />
                                    </motion.div>
                                )}
                                {authState === "LOGIN" && (
                                    <motion.div key="log" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                                        <LogIn className="w-10 h-10 text-blue-400" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight text-white mb-2 font-poppins">
                            {authState === "LICENSE_GATE" && "LİSANS AKTİVASYONU"}
                            {authState === "REGISTER" && "KAYIT OL"}
                            {authState === "LOGIN" && "HOŞ GELDİNİZ"}
                        </h2>
                        <p className="text-secondary text-sm font-medium opacity-80">
                            {authState === "LICENSE_GATE" && "Lütfen geçerli lisans anahtarınızı girin."}
                            {authState === "REGISTER" && "Uygulama için giriş bilgilerinizi belirleyin."}
                            {authState === "LOGIN" && `${username} olarak sisteme giriş yapın.`}
                        </p>
                    </div>

                    <div className="space-y-6">
                        {authState === "LICENSE_GATE" && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-secondary uppercase tracking-widest ml-1">Lisans Anahtarı</label>
                                    <div className="relative">
                                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary/40" />
                                        <input
                                            type="text"
                                            placeholder="XXXX-XXXX-XXXX"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-primary/50 transition-all font-bold tracking-widest text-primary uppercase"
                                            value={licenseKey}
                                            onChange={(e) => setLicenseKey(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && verifyLicense(licenseKey)}
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={() => verifyLicense(licenseKey)}
                                    disabled={verifying || !licenseKey}
                                    className="w-full bg-primary hover:bg-primary/90 text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-primary/30 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-3"
                                >
                                    {verifying ? <Loader2 className="w-6 h-6 animate-spin" /> : <ChevronRight className="w-6 h-6" />}
                                    <span>LİSANSI DOĞRULA</span>
                                </button>
                            </div>
                        )}

                        {authState === "REGISTER" && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-secondary uppercase tracking-widest ml-1">Kullanıcı Adı</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary/40" />
                                        <input
                                            type="text"
                                            placeholder="Örn: kardesler"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-bold text-white placeholder:text-white/10"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-secondary uppercase tracking-widest ml-1">Şifre</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary/40" />
                                        <input
                                            type="password"
                                            placeholder="••••••••"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-bold text-white placeholder:text-white/10"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={handleRegister}
                                    disabled={verifying}
                                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-emerald-500/30 transition-all active:scale-95"
                                >
                                    KAYDI TAMAMLA
                                </button>
                            </div>
                        )}

                        {authState === "LOGIN" && (
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-secondary uppercase tracking-widest ml-1 opacity-70">Aktif Kullanıcı</label>
                                    <div className="flex items-center space-x-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                                        <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 font-bold text-xl border border-blue-500/20">
                                            {username ? username[0]?.toUpperCase() : '?'}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-white text-lg leading-none">{username}</p>
                                            <p className="text-[10px] text-secondary font-bold uppercase tracking-wider mt-1">Yetkili Cihaz</p>
                                        </div>
                                        <button
                                            onClick={() => { localStorage.removeItem("app_license_key"); setAuthState("LICENSE_GATE"); }}
                                            className="text-[10px] font-bold text-primary hover:text-white transition-colors uppercase border border-primary/20 px-3 py-1.5 rounded-lg bg-primary/5"
                                        >
                                            DEĞİŞTİR
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-secondary uppercase tracking-widest ml-1">Giriş Şifresi</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary/40" />
                                        <input
                                            type="password"
                                            autoFocus
                                            placeholder="Şifrenizi girin"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold text-white tracking-[2px] placeholder:text-white/10 placeholder:tracking-normal"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center space-x-3 ml-1">
                                    <input
                                        type="checkbox"
                                        id="rem"
                                        className="w-5 h-5 rounded-md bg-white/5 border border-white/10 checked:bg-primary accent-primary cursor-pointer transition-all"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                    />
                                    <label htmlFor="rem" className="text-xs font-bold text-secondary uppercase tracking-tight cursor-pointer select-none">Beni 10 gün hatırla</label>
                                </div>

                                <button
                                    onClick={handleLogin}
                                    disabled={verifying}
                                    className="w-full bg-blue-500 hover:bg-blue-600 text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-blue-500/30 transition-all active:scale-95 flex items-center justify-center space-x-3"
                                >
                                    {verifying ? <Loader2 className="w-6 h-6 animate-spin" /> : <ShieldCheck className="w-6 h-6" />}
                                    <span>UYGULAMAYI AÇ</span>
                                </button>
                            </div>
                        )}

                        <AnimatePresence>
                            {notification && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className={`rounded-2xl p-4 flex items-center space-x-3 border ${notification.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'
                                        }`}
                                >
                                    {notification.type === 'success' ? (
                                        <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                                    ) : (
                                        <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
                                    )}
                                    <p className={`text-[10px] font-bold uppercase tracking-tight ${notification.type === 'success' ? 'text-emerald-500' : 'text-rose-500'
                                        }`}>{notification.message}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="mt-10 pt-6 border-t border-white/5 text-center">
                        <p className="text-[10px] text-secondary/20 font-bold uppercase tracking-[5px]">
                            PROTECTED BY KARDEŞLER
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
