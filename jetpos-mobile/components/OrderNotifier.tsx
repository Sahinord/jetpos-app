"use client";

import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

// Global yeni sipariş bildirimi (mobil). Getir Çarşı + TGO Yemek sipariş tablolarına
// realtime abone olur; yeni sipariş düşünce ses + toast + tarayıcı bildirimi verir.
// layout'ta mount edilir → hangi sayfada olursan ol çalışır.

function beep() {
    try {
        const Ctx = (window.AudioContext || (window as any).webkitAudioContext);
        if (!Ctx) return;
        const c = new Ctx();
        const o = c.createOscillator();
        const g = c.createGain();
        o.connect(g); g.connect(c.destination);
        o.type = "sine"; o.frequency.value = 880;
        g.gain.setValueAtTime(0.001, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.3, c.currentTime + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.5);
        o.start(); o.stop(c.currentTime + 0.5);
    } catch { /* sessiz geç */ }
}

const money = (n: number) => (Number(n) || 0).toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export default function OrderNotifier() {
    const seen = useRef<Set<string>>(new Set());

    const notify = useCallback((title: string, body: string) => {
        beep();
        toast.success(title, { description: body, duration: 8000 });
        try {
            if (typeof Notification !== "undefined" && Notification.permission === "granted") {
                new Notification(title, { body });
            }
        } catch { /* yoksay */ }
    }, []);

    useEffect(() => {
        const tenantId = typeof window !== "undefined" ? localStorage.getItem("tenantId") : null;
        if (!tenantId) return;
        try {
            if (typeof Notification !== "undefined" && Notification.permission === "default") Notification.requestPermission();
        } catch { /* yoksay */ }

        const onInsert = (kind: "getir" | "tgo") => (payload: any) => {
            const r = payload?.new || {};
            const id = String(r.id || r.tgo_order_id || r.getir_order_id || "");
            if (!id || seen.current.has(id)) return;
            seen.current.add(id);
            const brand = kind === "getir" ? "Getir Çarşı" : (r.store_name || "Yemek");
            notify(`🔔 Yeni ${brand} siparişi`, `${r.customer_name || "Müşteri"} · ${money(r.total_price)} ₺`);
        };

        const ch = supabase
            .channel(`order_notifier_${tenantId}`)
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "getir_carsi_orders", filter: `tenant_id=eq.${tenantId}` }, onInsert("getir"))
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "tgo_yemek_orders", filter: `tenant_id=eq.${tenantId}` }, onInsert("tgo"))
            .subscribe();

        return () => { supabase.removeChannel(ch); };
    }, [notify]);

    return null;
}
