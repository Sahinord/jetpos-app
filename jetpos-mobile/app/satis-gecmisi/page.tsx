"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase, setCurrentTenant } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Receipt, Search, RotateCcw, X, Package, ChevronRight, AlertTriangle, Calendar } from "lucide-react";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";
import RequirePermission from "@/components/RequirePermission";
import { useEmployee } from "@/lib/employee-context";

interface SaleRow {
    id: string;
    invoice_number: string;
    invoice_date: string;
    created_at: string;
    cari_name: string | null;
    grand_total: number;
    payment_status: string;
    status: string;
    notes: string | null;
}

interface SaleItem {
    id: string;
    item_name: string;
    quantity: number;
    unit_price: number;
    line_total: number;
}

function money(n: any) {
    return Number(n || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 });
}

function SatisGecmisiInner() {
    const { can } = useEmployee();
    const canRefund = can("can_delete_sales");

    const [sales, setSales] = useState<SaleRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<SaleRow | null>(null);
    const [items, setItems] = useState<SaleItem[]>([]);
    const [itemsLoading, setItemsLoading] = useState(false);
    const [refunding, setRefunding] = useState(false);
    const [confirmRefund, setConfirmRefund] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const tenantId = localStorage.getItem("tenantId");
            if (!tenantId) return;
            await setCurrentTenant(tenantId);
            // Mobil POS satışları invoice_type='retail'
            const { data, error } = await supabase
                .from("invoices")
                .select("id, invoice_number, invoice_date, created_at, cari_name, grand_total, payment_status, status, notes")
                .eq("tenant_id", tenantId)
                .eq("invoice_type", "retail")
                .order("created_at", { ascending: false })
                .limit(200);
            if (error) throw error;
            setSales(data || []);
        } catch (e: any) {
            toast.error("Satışlar yüklenemedi: " + (e?.message || ""));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const openDetail = async (s: SaleRow) => {
        setSelected(s);
        setConfirmRefund(false);
        setItemsLoading(true);
        try {
            const tenantId = localStorage.getItem("tenantId");
            const { data } = await supabase
                .from("invoice_items")
                .select("id, item_name, quantity, unit_price, line_total")
                .eq("tenant_id", tenantId)
                .eq("invoice_id", s.id);
            setItems(data || []);
        } catch { setItems([]); }
        finally { setItemsLoading(false); }
    };

    const doRefund = async () => {
        if (!selected) return;
        setRefunding(true);
        try {
            const tenantId = localStorage.getItem("tenantId");
            const { data, error } = await supabase.rpc("refund_pos_invoice", {
                p_tenant_id: tenantId,
                p_invoice_id: selected.id,
                p_reason: "Mobil iade",
            });
            if (error) throw error;
            if (!data?.success) { toast.error(data?.message || "İade edilemedi"); setRefunding(false); return; }
            toast.success("Satış iade edildi, stok geri eklendi.");
            setSelected(null);
            setConfirmRefund(false);
            load();
        } catch (e: any) {
            toast.error("İade hatası: " + (e?.message || ""));
        } finally {
            setRefunding(false);
        }
    };

    const filtered = sales.filter(s => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (s.invoice_number || "").toLowerCase().includes(q)
            || (s.cari_name || "").toLowerCase().includes(q)
            || String(s.grand_total).includes(q);
    });

    const isRefunded = (s: SaleRow) => s.status === "cancelled" || s.payment_status === "refunded";

    return (
        <div className="relative min-h-screen bg-background pb-32 overflow-x-hidden container-safe">
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[40%] bg-[#2563FF]/10 rounded-full blur-[120px]" />
            </div>

            <header className="sticky top-0 z-40 glass border-b border-[#2D6BFF]/10 p-4 pt-[env(safe-area-inset-top,1rem)] space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl glass-dark border border-[#2D6BFF]/20 flex items-center justify-center">
                        <Receipt className="w-5 h-5 text-[#6FD3FF]" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-white leading-none">Satış Geçmişi</h1>
                        <p className="text-[10px] font-black tracking-widest uppercase text-[#5B8CFF] mt-1">{filtered.length} Satış</p>
                    </div>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Fiş no, müşteri, tutar..."
                        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white text-base placeholder-slate-600 outline-none focus:border-[#2563FF]/40" />
                </div>
            </header>

            <div className="p-4 space-y-3 relative z-10">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-10 h-10 border-4 border-[#2563FF]/10 border-t-[#2563FF] rounded-full animate-spin" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16 space-y-3">
                        <Receipt className="w-12 h-12 mx-auto text-white/10" />
                        <p className="text-sm font-bold text-white/40">{search ? "Sonuç yok" : "Henüz satış yok"}</p>
                    </div>
                ) : filtered.map(s => (
                    <button key={s.id} onClick={() => openDetail(s)}
                        className="w-full text-left glass-dark border border-[#2D6BFF]/10 rounded-2xl p-4 flex items-center gap-3 active:scale-[0.98] transition-all">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <p className="font-black text-white text-sm truncate">{s.invoice_number}</p>
                                {isRefunded(s) && <span className="text-[9px] font-black uppercase tracking-widest text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md">İADE</span>}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(s.created_at).toLocaleString("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                                {s.cari_name ? ` · ${s.cari_name}` : ""}
                            </p>
                        </div>
                        <div className="text-right shrink-0">
                            <p className={`font-black tracking-tighter ${isRefunded(s) ? "text-slate-500 line-through" : "text-[#6FD3FF]"}`}>₺{money(s.grand_total)}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
                    </button>
                ))}
            </div>

            {/* Detay + iade modalı */}
            <AnimatePresence>
                {selected && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
                        onClick={() => setSelected(null)}>
                        <motion.div initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }}
                            className="w-full sm:max-w-md bg-slate-900 border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl p-6 space-y-4 max-h-[85vh] overflow-y-auto"
                            onClick={e => e.stopPropagation()}>
                            <div className="flex items-start justify-between">
                                <div>
                                    <h2 className="text-lg font-black text-white">{selected.invoice_number}</h2>
                                    <p className="text-xs text-slate-500">{new Date(selected.created_at).toLocaleString("tr-TR")}</p>
                                </div>
                                <button onClick={() => setSelected(null)} className="p-2 hover:bg-white/10 rounded-xl">
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>

                            {itemsLoading ? (
                                <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-[#2563FF]/10 border-t-[#2563FF] rounded-full animate-spin" /></div>
                            ) : (
                                <div className="space-y-2">
                                    {items.map(it => (
                                        <div key={it.id} className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                                            <Package className="w-4 h-4 text-slate-500 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-white truncate">{it.item_name}</p>
                                                <p className="text-[11px] text-slate-500">{it.quantity} × ₺{money(it.unit_price)}</p>
                                            </div>
                                            <p className="text-sm font-black text-[#6FD3FF]">₺{money(it.line_total)}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-2 border-t border-white/10">
                                <span className="text-sm font-bold text-slate-400">Toplam</span>
                                <span className="text-2xl font-black text-white">₺{money(selected.grand_total)}</span>
                            </div>

                            {/* İade bölümü */}
                            {isRefunded(selected) ? (
                                <div className="flex items-center gap-2 px-4 py-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                                    <p className="text-sm font-bold text-rose-300">Bu satış iade edilmiş.</p>
                                </div>
                            ) : canRefund ? (
                                confirmRefund ? (
                                    <div className="space-y-2">
                                        <p className="text-center text-sm font-bold text-rose-300">Bu satışı iade et? Stok geri eklenecek.</p>
                                        <div className="flex gap-2">
                                            <button onClick={() => setConfirmRefund(false)} disabled={refunding}
                                                className="flex-1 py-3 rounded-2xl bg-white/5 border border-white/10 text-slate-300 font-bold active:scale-95 transition-all">Vazgeç</button>
                                            <button onClick={doRefund} disabled={refunding}
                                                className="flex-1 py-3 rounded-2xl bg-rose-600 text-white font-bold flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50">
                                                {refunding ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                                                İade Et
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button onClick={() => setConfirmRefund(true)}
                                        className="w-full py-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 font-bold flex items-center justify-center gap-2 active:scale-95 transition-all">
                                        <RotateCcw className="w-4 h-4" /> Satışı İade Et
                                    </button>
                                )
                            ) : (
                                <p className="text-center text-[11px] text-slate-600">İade yetkisi yok.</p>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <BottomNav />
        </div>
    );
}

export default function SatisGecmisiPage() {
    return (
        <RequirePermission perm="can_access_pos" title="Satış Geçmişi">
            <SatisGecmisiInner />
        </RequirePermission>
    );
}
