"use client";

import { useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { useEmployee, EmployeePermissions } from "@/lib/employee-context";
import EmployeePinGate from "./EmployeePinGate";
import { ShieldAlert, LogOut } from "lucide-react";

/**
 * Sayfa koruması. Kullanım:
 *   <RequirePermission perm="can_access_pos"> ...sayfa... </RequirePermission>
 *
 * DAVRANIŞ:
 *  - İşletmede `employee_login` özelliği KAPALI ise → hiç kilitleme, içerik direkt
 *    açılır (küçük işletmeler için geriye uyumlu).
 *  - AÇIK ise:
 *      • Çalışan oturumu yok → PIN ekranı
 *      • Oturum var ama bu yetki yok → "yetkiniz yok" ekranı
 *      • Yetki var → içerik
 *
 * GÜVENLİK NOTU: Bu arayüz kilidi kolaylıktır; asıl veri koruması RLS'tedir.
 */
export default function RequirePermission({ perm, title, children }: {
    perm: keyof EmployeePermissions;
    title?: string;
    children: ReactNode;
}) {
    const { employee, ready, can, logout } = useEmployee();
    const [loginEnabled, setLoginEnabled] = useState<boolean | null>(null);

    useEffect(() => {
        const tenantId = typeof window !== "undefined" ? localStorage.getItem("tenantId") : null;
        if (!tenantId) { setLoginEnabled(false); return; }
        (async () => {
            try {
                const { data } = await supabase.from("tenants").select("features").eq("id", tenantId).single();
                const f: any = data?.features;
                let on = false;
                if (Array.isArray(f)) on = f.includes("employee_login") || f.includes("*");
                else if (typeof f === "string") on = f.includes("employee_login") || f.includes("*");
                else if (f && typeof f === "object") on = f["employee_login"] === true || f["*"] === true;
                setLoginEnabled(on);
            } catch { setLoginEnabled(false); }
        })();
    }, []);

    // Feature durumu ya da oturum henüz okunmadıysa boş bekle (kısa)
    if (loginEnabled === null || !ready) {
        return (
            <div className="min-h-screen min-h-[100dvh] bg-[#020617] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // Çalışan girişi kapalı → serbest
    if (!loginEnabled) return <>{children}</>;

    // Oturum yok → PIN iste
    if (!employee) return <EmployeePinGate title={title} />;

    // Yetki yok → engelle
    if (!can(perm)) {
        return (
            <div className="min-h-screen min-h-[100dvh] bg-[#020617] flex items-center justify-center p-6">
                <div className="glass-dark border border-white/10 rounded-3xl p-8 max-w-sm text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                        <ShieldAlert className="w-8 h-8 text-rose-400" />
                    </div>
                    <h1 className="text-xl font-black text-white">Yetkiniz Yok</h1>
                    <p className="text-sm text-slate-400 leading-relaxed">
                        <span className="text-white font-bold">{employee.name}</span> için bu bölüm kapalı.
                        Yetkili bir personelle giriş yapın.
                    </p>
                    <button onClick={logout}
                        className="w-full py-3 rounded-2xl bg-white/5 border border-white/10 text-slate-300 font-bold flex items-center justify-center gap-2 active:scale-95 transition-all">
                        <LogOut className="w-4 h-4" /> Personel Değiştir
                    </button>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
