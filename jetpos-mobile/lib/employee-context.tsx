"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";

/**
 * Çalışan oturumu + yetki bağlamı (mobil geneli).
 *
 * İKİ KATMANLI OTURUM:
 *   - Cihaz oturumu: lisans + işletme şifresi (kalıcı) — LicenseGate
 *   - Çalışan oturumu: PIN (vardiya boyu) — burası
 *
 * PIN /api/auth/pin (hız sınırlı) üzerinden doğrulanır. Dönen çalışan
 * kimliği + yetki matrisi burada tutulur; sayfalar useCan() ile kontrol eder.
 *
 * Oturum bitişi: süre (varsayılan 12 saat) VEYA hareketsizlik (30 dk).
 * Uygulama kapanıp açılınca oturum korunur (localStorage), süresi dolmadıysa.
 */

export interface EmployeePermissions {
    can_access_pos?: boolean;
    can_access_adisyon?: boolean;
    can_access_reports?: boolean;
    can_access_settings?: boolean;
    can_access_inventory?: boolean;
    can_access_expenses?: boolean;
    can_access_crm?: boolean;
    can_manage_employees?: boolean;
    can_manage_invoices?: boolean;
    can_apply_discount?: boolean;
    can_delete_sales?: boolean;
    [k: string]: boolean | undefined;
}

export interface ActiveEmployee {
    id: string;
    name: string;
    position?: string;
    role?: string;
    permissions: EmployeePermissions;
}

type PermKey = keyof EmployeePermissions;

interface EmployeeContextType {
    employee: ActiveEmployee | null;
    ready: boolean;              // localStorage okundu mu (hydration)
    loginWithPin: (pin: string) => Promise<{ ok: boolean; error?: string; locked?: boolean }>;
    logout: () => void;
    can: (perm: PermKey) => boolean;
    touch: () => void;          // hareketsizlik sayacını sıfırla
}

const STORAGE_KEY = "jp_active_employee";
const EXPIRY_KEY = "jp_employee_expiry";
const SHIFT_MS = 12 * 60 * 60 * 1000;      // vardiya süresi
const IDLE_MS = 30 * 60 * 1000;            // hareketsizlik

const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined);

export function EmployeeProvider({ children }: { children: ReactNode }) {
    const [employee, setEmployee] = useState<ActiveEmployee | null>(null);
    const [ready, setReady] = useState(false);
    const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const persist = (emp: ActiveEmployee | null) => {
        try {
            if (emp) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(emp));
                localStorage.setItem(EXPIRY_KEY, String(Date.now() + SHIFT_MS));
            } else {
                localStorage.removeItem(STORAGE_KEY);
                localStorage.removeItem(EXPIRY_KEY);
                // Eski adisyon anahtarlarını da temizle (birleşme)
                localStorage.removeItem("activeWaiterId");
                localStorage.removeItem("activeWaiterName");
                localStorage.removeItem("activeWaiterRole");
            }
        } catch { /* yoksay */ }
    };

    const logout = useCallback(() => {
        setEmployee(null);
        persist(null);
    }, []);

    // ── Hareketsizlik sayacı ──
    const armIdle = useCallback(() => {
        if (idleTimer.current) clearTimeout(idleTimer.current);
        idleTimer.current = setTimeout(() => { logout(); }, IDLE_MS);
    }, [logout]);

    const touch = useCallback(() => {
        if (employee) {
            try { localStorage.setItem(EXPIRY_KEY, String(Date.now() + SHIFT_MS)); } catch { /* yoksay */ }
            armIdle();
        }
    }, [employee, armIdle]);

    // ── Açılışta oturum geri yükle (süresi dolmadıysa) ──
    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            const exp = Number(localStorage.getItem(EXPIRY_KEY) || 0);
            if (raw && exp > Date.now()) {
                setEmployee(JSON.parse(raw));
            } else if (raw) {
                persist(null); // süresi dolmuş
            }
        } catch { /* yoksay */ }
        setReady(true);
    }, []);

    // Oturum varken hareketsizlik sayacını başlat + kullanıcı etkileşimini dinle
    useEffect(() => {
        if (!employee) return;
        armIdle();
        const onAct = () => armIdle();
        const evs: (keyof WindowEventMap)[] = ["pointerdown", "keydown", "touchstart"];
        evs.forEach(e => window.addEventListener(e, onAct, { passive: true }));
        return () => {
            if (idleTimer.current) clearTimeout(idleTimer.current);
            evs.forEach(e => window.removeEventListener(e, onAct));
        };
    }, [employee, armIdle]);

    const loginWithPin = useCallback(async (pin: string) => {
        try {
            const tenantId = localStorage.getItem("tenantId");
            const licenseKey = localStorage.getItem("licenseKey");
            const res = await fetch("/api/auth/pin", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(tenantId ? { "x-tenant-id": tenantId } : {}),
                    ...(licenseKey ? { "x-license-key": licenseKey } : {}),
                },
                body: JSON.stringify({ pin }),
            });
            const data = await res.json().catch(() => null);
            if (!res.ok || !data?.success) {
                return { ok: false, error: data?.error || "Geçersiz PIN", locked: data?.locked === true };
            }
            const emp: ActiveEmployee = {
                id: data.employee.id,
                name: data.employee.name,
                position: data.employee.position,
                role: data.employee.role,
                permissions: data.employee.permissions || {},
            };
            setEmployee(emp);
            persist(emp);
            return { ok: true };
        } catch (e: any) {
            return { ok: false, error: e?.message || "Bağlantı hatası" };
        }
    }, []);

    const can = useCallback((perm: PermKey) => {
        if (!employee) return false;
        // Patron/işletme sahibi rolü her şeyi görebilir
        const role = (employee.role || employee.position || "").toLowerCase();
        if (role === "owner" || role === "patron" || role === "işletme sahibi") return true;
        return employee.permissions?.[perm] === true;
    }, [employee]);

    return (
        <EmployeeContext.Provider value={{ employee, ready, loginWithPin, logout, can, touch }}>
            {children}
        </EmployeeContext.Provider>
    );
}

export function useEmployee(): EmployeeContextType {
    const ctx = useContext(EmployeeContext);
    if (!ctx) throw new Error("useEmployee must be used within EmployeeProvider");
    return ctx;
}

/** Kısa yol: tek bir yetkiyi kontrol et. */
export function useCan(perm: PermKey): boolean {
    return useEmployee().can(perm);
}
