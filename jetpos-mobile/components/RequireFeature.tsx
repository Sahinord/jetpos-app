"use client";

import { useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { Lock } from "lucide-react";

/**
 * Tenant ÖZELLİK (lisans) kapısı. Verilen özelliklerden en az biri açık değilse
 * modülü engeller. Sayfa seviyesinde kullanılır — böylece menü gizlense bile
 * (garson/mutfak host yönlendirmesi ya da doğrudan URL) sayfa yine de açılmaz.
 *
 * GÜVENLİK/GERİYE UYUM: tenants.features HİÇ tanımlı değilse (null/boş) kimseyi
 * kilitlemeyiz → serbest. Yalnızca features AÇIKÇA tanımlı ve bu özelliği
 * İÇERMİYORSA engellenir (SuperAdmin'den kapatınca). '*' hepsini açar.
 */
export default function RequireFeature({ features, title, children }: {
    features: string[];
    title?: string;
    children: ReactNode;
}) {
    const [state, setState] = useState<"loading" | "allow" | "deny">("loading");

    useEffect(() => {
        const tenantId = typeof window !== "undefined" ? localStorage.getItem("tenantId") : null;
        if (!tenantId) { setState("allow"); return; } // lisans yoksa zaten LicenseGate durdurur
        (async () => {
            try {
                const { data } = await supabase.from("tenants").select("features").eq("id", tenantId).single();
                const f: any = data?.features;

                // features tanımlı mı? (boş/null → serbest)
                const configured =
                    (Array.isArray(f) && f.length > 0) ||
                    (typeof f === "object" && f !== null && !Array.isArray(f) && Object.keys(f).length > 0) ||
                    (typeof f === "string" && f.trim().length > 0);
                if (!configured) { setState("allow"); return; }

                const has = (k: string): boolean => {
                    if (Array.isArray(f)) return f.includes(k) || f.includes("*");
                    if (typeof f === "string") {
                        try { const a = JSON.parse(f); return Array.isArray(a) ? (a.includes(k) || a.includes("*")) : f.includes(k); }
                        catch { return f.includes(k); }
                    }
                    if (typeof f === "object") return f[k] === true || f["*"] === true;
                    return false;
                };
                setState(features.some(has) ? "allow" : "deny");
            } catch {
                // Ağ/okuma hatasında kilitleme — kullanıcıyı mağdur etme
                setState("allow");
            }
        })();
    }, []);

    if (state === "loading") {
        return (
            <div className="min-h-screen min-h-[100dvh] bg-[#020617] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (state === "deny") {
        return (
            <div className="min-h-screen min-h-[100dvh] bg-[#020617] flex items-center justify-center p-6">
                <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 max-w-sm text-center space-y-3">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                        <Lock className="w-8 h-8 text-amber-400" />
                    </div>
                    <h1 className="text-xl font-black text-white">{title || "Modül Kapalı"}</h1>
                    <p className="text-sm text-slate-400 leading-relaxed">
                        Bu bölüm lisansınızda etkin değil. Yöneticinizle iletişime geçin.
                    </p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
