"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import {
    Package, RefreshCcw, Truck, Tag, CheckCircle2, AlertCircle,
    ShoppingCart, Clock, Smartphone, ExternalLink, X
} from "lucide-react";
import { HepsiburadaClient, HepsiburadaPackage } from "@/lib/hepsiburada-client";
import { useTenant } from "@/lib/tenant-context";

interface CargoModalState {
    packageNumber: string;
    companies: any[];
    loading: boolean;
    selecting: boolean;
}

const hbClient = new HepsiburadaClient();

export default function HepsiburadaWidget({ activeSubTab = 'overview' }: { activeSubTab?: string }) {
    const { currentTenant } = useTenant();
    const [packages, setPackages] = useState<HepsiburadaPackage[]>([]);
    const [loading, setLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [cargoModal, setCargoModal] = useState<CargoModalState | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const refreshInterval = useRef<NodeJS.Timeout | null>(null);

    const fetchPackages = async (showLoader = true) => {
        if (showLoader) setLoading(true);
        try {
            const endDate = new Date();
            const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
            const data = await hbClient.getPackages({ beginDate: startDate, endDate, size: 100 });
            setPackages(data);
            setLastUpdated(new Date());
        } catch (e) {
            console.error('Hepsiburada paket çekme hatası:', e);
        } finally {
            if (showLoader) setLoading(false);
        }
    };

    useEffect(() => {
        fetchPackages(true);
        refreshInterval.current = setInterval(() => fetchPackages(false), 30000);
        return () => { if (refreshInterval.current) clearInterval(refreshInterval.current); };
    }, []);

    const stats = useMemo(() => {
        const total = packages.length;
        const delivered = packages.filter(p => (p.status || '').toLowerCase().includes('deliver')).length;
        const pending = total - delivered;
        const revenue = packages.reduce((sum, p) => {
            const itemsTotal = (p.items || []).reduce((s: number, it: any) => s + (it.totalPrice?.amount || it.merchantTotalPrice?.amount || 0), 0);
            return sum + itemsTotal;
        }, 0);
        return { total, delivered, pending, revenue };
    }, [packages]);

    const openCargoModal = async (packageNumber: string) => {
        setCargoModal({ packageNumber, companies: [], loading: true, selecting: false });
        try {
            const companies = await hbClient.getChangeableCargoCompanies(packageNumber);
            setCargoModal({ packageNumber, companies, loading: false, selecting: false });
        } catch (e: any) {
            alert(e.message || 'Kargo firmaları alınamadı');
            setCargoModal(null);
        }
    };

    const confirmCargoCompany = async (code: string) => {
        if (!cargoModal) return;
        setCargoModal({ ...cargoModal, selecting: true });
        try {
            await hbClient.changeCargoCompany(cargoModal.packageNumber, code);
            setCargoModal(null);
            fetchPackages(true);
        } catch (e: any) {
            alert(e.message || 'Kargo firması değiştirilemedi');
            setCargoModal({ ...cargoModal, selecting: false });
        }
    };

    const handleGetLabel = async (packageNumber: string) => {
        setActionLoading(`label-${packageNumber}`);
        try {
            const data: any = await hbClient.getCargoLabel(packageNumber);
            const url = typeof data === 'string' ? data : (data?.labelUrl || data?.url || data?.data || data?.documentUrl);
            if (typeof url === 'string' && url.startsWith('http')) {
                window.open(url, '_blank');
            } else {
                console.log('Hepsiburada etiket yanıtı:', data);
                alert('Etiket verisi alındı (konsola yazıldı), görüntülenebilir link bulunamadı');
            }
        } catch (e: any) {
            alert(e.message || 'Etiket alınamadı');
        } finally {
            setActionLoading(null);
        }
    };

    const handleMarkDelivered = async (packageNumber: string) => {
        if (!confirm('Bu paket teslim edildi olarak işaretlensin mi?')) return;
        setActionLoading(`deliver-${packageNumber}`);
        try {
            await hbClient.markDelivered(packageNumber);
            fetchPackages(true);
        } catch (e: any) {
            alert(e.message || 'İşlem başarısız');
        } finally {
            setActionLoading(null);
        }
    };

    if (activeSubTab === 'mapping') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[40vh] text-center space-y-4">
                <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center">
                    <Smartphone className="w-10 h-10 text-amber-500/60" />
                </div>
                <div>
                    <h3 className="text-xl font-black mb-2">Ürün Eşleştirme: JetPos Mobile'da</h3>
                    <p className="text-secondary font-medium max-w-md mx-auto text-sm">
                        Hepsiburada kategori/özellik eşleştirme ve katalog ürün gönderme akışı şu anda JetPos Mobile uygulamasındaki
                        <b> JetEntegre → Hepsiburada → Ürün Kataloğu</b> sekmesinden yönetiliyor.
                    </p>
                </div>
            </div>
        );
    }

    if (activeSubTab === 'settings') {
        const hb = currentTenant?.settings?.hepsiburada || {};
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${hb.merchantId ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <p className="font-black text-sm">{hb.merchantId ? 'Bağlı' : 'Yapılandırılmamış'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                            <p className="text-secondary/60 font-bold uppercase tracking-widest text-[10px] mb-1">Merchant ID</p>
                            <p className="font-mono text-foreground">{hb.merchantId || '-'}</p>
                        </div>
                        <div>
                            <p className="text-secondary/60 font-bold uppercase tracking-widest text-[10px] mb-1">Ortam</p>
                            <p className="font-bold text-foreground">{hb.stage ? 'Test (SIT)' : 'Canlı'}</p>
                        </div>
                    </div>
                    <p className="text-[11px] text-secondary/60 leading-relaxed pt-2 border-t border-white/5">
                        Merchant ID, kullanıcı adı/şifre ve webhook kimlik bilgileri güvenlik nedeniyle yalnızca <b>Süper Admin</b> panelinden düzenlenebilir.
                    </p>
                </div>
            </div>
        );
    }

    if (activeSubTab === 'orders') {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <PackagesList
                    packages={packages}
                    loading={loading}
                    onRefresh={() => fetchPackages(true)}
                    onCargo={openCargoModal}
                    onLabel={handleGetLabel}
                    onDeliver={handleMarkDelivered}
                    actionLoading={actionLoading}
                />
                <CargoModal modal={cargoModal} onClose={() => setCargoModal(null)} onSelect={confirmCargoCompany} />
            </div>
        );
    }

    if (activeSubTab === 'finance') {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard label="Toplam Ciro (Son 30 Gün)" value={`₺${stats.revenue.toLocaleString('tr-TR')}`} icon={ShoppingCart} color="amber" />
                    <StatCard label="Teslim Edilen Paket" value={stats.delivered} icon={CheckCircle2} color="emerald" />
                    <StatCard label="Bekleyen Paket" value={stats.pending} icon={Clock} color="orange" />
                </div>
                <p className="text-xs text-secondary/60">
                    Detaylı komisyon/kâr analizi için ürün maliyet eşleştirmesi gerekiyor — bu görünüm ham sipariş tutarlarını gösterir.
                </p>
            </div>
        );
    }

    // overview (default)
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Toplam Paket" value={stats.total} icon={Package} color="amber" sub="Son 30 gün" />
                <StatCard label="Bekleyen" value={stats.pending} icon={Clock} color="orange" sub="İşlem bekliyor" />
                <StatCard label="Toplam Ciro" value={`₺${stats.revenue.toLocaleString('tr-TR')}`} icon={ShoppingCart} color="emerald" sub="Brüt gelir" />
                <StatCard label="Teslim Edildi" value={stats.delivered} icon={CheckCircle2} color="blue" sub={`${stats.pending} bekleyen`} />
            </div>

            <div className="flex items-center justify-between">
                <p className="text-xs text-secondary/60">
                    {lastUpdated ? `Son güncelleme: ${lastUpdated.toLocaleTimeString('tr-TR')}` : 'Henüz çekilmedi'}
                </p>
                <button
                    onClick={() => fetchPackages(true)}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black transition-all disabled:opacity-50"
                >
                    <RefreshCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    Paketleri Çek
                </button>
            </div>

            <PackagesList
                packages={packages.slice(0, 5)}
                loading={loading}
                onRefresh={() => fetchPackages(true)}
                onCargo={openCargoModal}
                onLabel={handleGetLabel}
                onDeliver={handleMarkDelivered}
                actionLoading={actionLoading}
                compact
            />
            <CargoModal modal={cargoModal} onClose={() => setCargoModal(null)} onSelect={confirmCargoCompany} />
        </div>
    );
}

function StatCard({ label, value, icon: Icon, color, sub }: { label: string; value: string | number; icon: any; color: string; sub?: string }) {
    const colorMap: Record<string, string> = {
        amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
        orange: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
        emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
        blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    };
    return (
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${colorMap[color]}`}>
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <p className="text-2xl font-black text-foreground">{value}</p>
                <p className="text-[10px] font-bold text-secondary/60 uppercase tracking-widest mt-0.5">{label}</p>
                {sub && <p className="text-[10px] text-secondary/40 mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

function PackagesList({ packages, loading, onRefresh, onCargo, onLabel, onDeliver, actionLoading, compact }: any) {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-black uppercase tracking-widest text-secondary/60">Paketler & Kargo</h3>
                {!compact && (
                    <button onClick={onRefresh} className="text-xs text-amber-500 hover:underline font-bold flex items-center gap-1.5">
                        <RefreshCcw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Yenile
                    </button>
                )}
            </div>

            {loading ? (
                <div className="py-12 flex justify-center"><RefreshCcw className="w-7 h-7 text-amber-500 animate-spin" /></div>
            ) : packages.length === 0 ? (
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-12 text-center text-secondary/50 text-sm">
                    Paket bulunamadı.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {packages.map((pkg: HepsiburadaPackage) => (
                        <div key={pkg.packageNumber} className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-4">
                            <div className="flex items-start justify-between">
                                <div className="min-w-0">
                                    <p className="font-black text-sm truncate">#{pkg.packageNumber}</p>
                                    {pkg.orderNumber && <p className="text-[10px] text-secondary/50">Sipariş: {pkg.orderNumber}</p>}
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    {pkg.status && <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">{pkg.status}</span>}
                                    {pkg.cargoCompany && <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20">{pkg.cargoCompany}</span>}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                                <button onClick={() => onCargo(pkg.packageNumber)} className="flex-1 py-2 bg-white/5 hover:bg-amber-500/10 text-secondary hover:text-amber-500 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-1.5">
                                    <Truck className="w-3 h-3" /> Kargo
                                </button>
                                <button onClick={() => onLabel(pkg.packageNumber)} disabled={actionLoading === `label-${pkg.packageNumber}`} className="flex-1 py-2 bg-white/5 hover:bg-blue-500/10 text-secondary hover:text-blue-400 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-1.5 disabled:opacity-50">
                                    <Tag className="w-3 h-3" /> Etiket
                                </button>
                                <button onClick={() => onDeliver(pkg.packageNumber)} disabled={actionLoading === `deliver-${pkg.packageNumber}`} className="flex-1 py-2 bg-white/5 hover:bg-emerald-500/10 text-secondary hover:text-emerald-400 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-1.5 disabled:opacity-50">
                                    <CheckCircle2 className="w-3 h-3" /> Teslim
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function CargoModal({ modal, onClose, onSelect }: { modal: CargoModalState | null; onClose: () => void; onSelect: (code: string) => void }) {
    if (!modal) return null;
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="bg-[#0B1328] border border-white/10 rounded-2xl max-w-md w-full shadow-2xl max-h-[80vh] overflow-y-auto">
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                    <div>
                        <h3 className="font-black text-white">Kargo Firması Seç</h3>
                        <p className="text-[10px] text-secondary/50 mt-1">Paket #{modal.packageNumber}</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-secondary/60">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="p-6 space-y-2">
                    {modal.loading ? (
                        <div className="py-8 flex justify-center"><RefreshCcw className="w-6 h-6 text-amber-500 animate-spin" /></div>
                    ) : modal.companies.length === 0 ? (
                        <p className="text-xs text-secondary/50 text-center py-8">Değiştirilebilir kargo firması bulunamadı.</p>
                    ) : (
                        modal.companies.map((c: any, idx: number) => {
                            const label = typeof c === 'string' ? c : (c.cargoCompanyName || c.name || c.cargoCompanyShortCode || c.shortCode || JSON.stringify(c));
                            const code = typeof c === 'string' ? c : (c.cargoCompanyShortCode || c.shortCode || c.code || label);
                            const isHepsiJet = String(label).toLowerCase().includes('hepsi');
                            return (
                                <button
                                    key={idx}
                                    disabled={modal.selecting}
                                    onClick={() => onSelect(code)}
                                    className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-amber-500/10 border border-white/5 hover:border-amber-500/30 rounded-xl transition-all disabled:opacity-50"
                                >
                                    <div className="flex items-center gap-2">
                                        <Truck className="w-4 h-4 text-amber-500" />
                                        <span className="text-sm font-bold text-white">{label}</span>
                                    </div>
                                    {isHepsiJet && <span className="text-[8px] font-black uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">Önerilen</span>}
                                </button>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
