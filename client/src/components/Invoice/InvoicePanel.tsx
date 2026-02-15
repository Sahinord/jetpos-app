"use client";

import { useState, useEffect } from 'react';
import {
    FileText, Send, Search, Check, AlertCircle, Loader2,
    Edit3, X, Save, Calculator, MapPin, User, Building,
    Plus, Trash2, Printer, ChevronDown, Globe, Phone, Mail,
    ShoppingBag
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/lib/tenant-context';
import { TURKEY_LOCATIONS } from '@/lib/turkey-locations';

export default function InvoicePanel() {
    const { currentTenant } = useTenant();
    const [sales, setSales] = useState<any[]>([]);
    const [trendyolOrders, setTrendyolOrders] = useState<any[]>([]);
    const [view, setView] = useState<'sales' | 'trendyol'>('sales');
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);
    const [qnbConfig, setQnbConfig] = useState<any>(null);
    const [mounted, setMounted] = useState(false);

    const [editModal, setEditModal] = useState<any>(null);
    const [zoom, setZoom] = useState(1);

    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            if (e.ctrlKey) {
                e.preventDefault();
                setZoom(prev => {
                    const next = prev + (e.deltaY < 0 ? 0.05 : -0.05);
                    return Math.min(Math.max(next, 0.6), 1.5);
                });
            }
        };
        window.addEventListener('wheel', handleWheel, { passive: false });
        return () => window.removeEventListener('wheel', handleWheel);
    }, []);

    // Güvenli Formatlayıcılar
    const formatDate = (date: any) => date ? new Date(date).toLocaleDateString('tr-TR') : '-';
    const formatCurrency = (val: any) => Number(val || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + " ₺";

    // Ürün adından otomatik KDV oranı belirle
    const getVatRateFromProductName = (productName: string): number => {
        const name = (productName || '').toLowerCase();

        // %20 - Temizlik, Züccaciye, Kozmetik
        const vat20Patterns = [
            'temizlik', 'deterjan', 'çamaşır', 'bulaşık', 'sabun', 'şampuan',
            'züccaciye', 'mutfak', 'kova', 'fırça', 'paspas',
            'kozmetik', 'parfüm', 'deodorant', 'krem', 'makyaj', 'ruj',
            'kırtasiye', 'kalem', 'defter', 'elektronik', 'pil', 'şarj',
            'kağıt havlu', 'peçete', 'tuvalet kağıdı', 'havlu', 'mendil'
        ];

        // %10 - Şarküteri (süt ürünleri)
        const vat10Patterns = [
            'süt', 'peynir', 'yoğurt', 'ayran', 'kefir', 'tereyağ', 'margarin',
            'şarküteri', 'salam', 'sosis', 'sucuk', 'pastırma', 'jambon',
            'kaşar', 'beyaz peynir', 'lor', 'tulum', 'ezine',
            'dondurma', 'krema'
        ];

        // %1 - Temel gıda
        const vat1Patterns = [
            'gıda', 'et', 'tavuk', 'balık', 'köfte', 'kıyma', 'kuşbaşı', 'biftek',
            'meyve', 'elma', 'portakal', 'muz', 'çilek', 'üzüm', 'armut', 'karpuz',
            'sebze', 'domates', 'salatalık', 'biber', 'patlıcan', 'kabak', 'patates', 'soğan', 'sarımsak',
            'bakliyat', 'fasulye', 'nohut', 'mercimek', 'pilav', 'pirinç', 'bulgur',
            'un', 'şeker', 'tuz', 'makarna', 'erişte',
            'ekmek', 'simit', 'poğaça', 'börek',
            'yumurta', 'bal', 'reçel', 'pekmez', 'tahin', 'helva',
            'zeytin', 'zeytinyağ', 'ayçiçek yağ', 'soya yağ',
            'çay', 'kahve', 'maden suyu', 'su'
        ];

        // Önce %20 kontrol et
        for (const pattern of vat20Patterns) {
            if (name.includes(pattern)) return 20;
        }

        // Sonra %10 kontrol et
        for (const pattern of vat10Patterns) {
            if (name.includes(pattern)) return 10;
        }

        // %1 kontrol et (gıda varsayılan)
        for (const pattern of vat1Patterns) {
            if (name.includes(pattern)) return 1;
        }

        // Varsayılan: %1 (gıda)
        return 1;
    };

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        if (mounted && currentTenant) fetchData();
    }, [mounted, currentTenant]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [salesRes, trendyolRes, qnbRes] = await Promise.all([
                supabase.from('sales').select('*').order('created_at', { ascending: false }).limit(50),
                supabase.from('trendyol_go_orders').select('*').order('created_at', { ascending: false }).limit(50),
                supabase.rpc('get_integration_settings', { p_tenant_id: currentTenant?.id, p_type: 'qnb_efinans' })
            ]);
            setSales(salesRes.data || []);
            setTrendyolOrders(trendyolRes.data || []);
            if (qnbRes.data) setQnbConfig(qnbRes.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    // --- QNB PORTAL MATEMATİĞİ ---
    const calculate = (state: any) => {
        const items = state.items.map((item: any) => {
            const qty = Number(item.quantity) || 0;
            const price = Number(item.price) || 0;
            const vatRate = Number(item.vatRate) || 0;

            const rawLineTotal = qty * price;
            const lineTotal = Math.round(rawLineTotal * 100) / 100;
            const vatAmount = Math.round((lineTotal * (vatRate / 100)) * 100) / 100;
            const fullTotal = lineTotal + vatAmount;

            return { ...item, lineTotal, vatAmount, fullTotal };
        });

        const totalLineAmount = items.reduce((s: number, i: any) => s + i.lineTotal, 0);
        const totalVatAmount = items.reduce((s: number, i: any) => s + i.vatAmount, 0);
        const roundAmount = Number(state.roundAmount) || 0;
        const grandTotal = totalLineAmount + totalVatAmount + roundAmount;

        return { ...state, items, totalLineAmount, totalVatAmount, grandTotal };
    };

    const openInvoice = (source: any, type: 'sale' | 'trendyol' | 'manual') => {
        if (type === 'manual') {
            const draft = {
                id: 'M-' + Date.now().toString().slice(-6),
                isManual: true,
                vkn: '11111111111', unvan: '', ad: '', soyad: '',
                sehir: 'İSTANBUL', ilce: 'ESENYURT', mahalle: '', bulvar: '',
                binaNo: '', kapiNo: '', adres: '', postaKodu: '', vergiDairesi: '',
                roundAmount: 0,
                items: [{ name: 'Muhtelif Gıda', quantity: 1, unit: 'KG', price: 0, vatRate: 1, lineTotal: 0, vatAmount: 0, fullTotal: 0 }]
            };
            setEditModal(calculate(draft));
            return;
        }

        const isTrendyol = type === 'trendyol';
        const details = isTrendyol ? (source.raw_data?.invoiceAddress || source.raw_data?.address || {}) : (source.metadata || {});

        // Trendyol'dan gelen ürünleri al - lines veya items
        let sourceItems = source.items || [];
        if (isTrendyol && source.raw_data?.lines && source.raw_data.lines.length > 0) {
            sourceItems = source.raw_data.lines.map((line: any) => ({
                name: line.product?.productSaleName || line.product?.name || 'Ürün',
                quantity: line.amount || line.quantity || 1,
                price: line.price || 0,
                unit: line.product?.weight?.typeName === 'KG' ? 'KG' : 'ADET',
                vatRate: null // otomatik belirlenecek
            }));
        }

        const draft = {
            id: source.id,
            isManual: false,
            platform: isTrendyol ? 'Trendyol' : 'JetPos',
            vkn: source.raw_data?.tcIdentityNumber || source.raw_data?.taxNumber || details.vkn || details.tckn || '11111111111',
            unvan: details.companyTitle || source.customer_name || '',
            ad: details.firstName || source.customer_name?.split(' ')[0] || '',
            soyad: details.lastName || source.customer_name?.split(' ').slice(1).join(' ') || '',
            sehir: (details.city || 'İSTANBUL').toUpperCase(),
            ilce: (details.district || 'ESENYURT').toUpperCase(),
            mahalle: details.neighborhood || '',
            bulvar: details.street || '',
            binaNo: details.building_no || '',
            kapiNo: details.door_no || '',
            adres: details.fullAddress || details.address || source.customer_address || '',
            postaKodu: details.postalCode || details.postal_code || '',
            vergiDairesi: details.taxOffice || details.tax_office || '',
            roundAmount: 0,
            items: sourceItems.map((i: any) => {
                const productName = i.name || i.productName || i.product?.name || i.product?.productSaleName || 'Muhtelif Gıda';
                const autoVatRate = i.vatRate || getVatRateFromProductName(productName);
                return {
                    name: productName,
                    quantity: i.quantity || i.amount || 1,
                    unit: i.unit || 'KG',
                    price: i.price || i.unit_price || 0,
                    vatRate: autoVatRate,
                    lineTotal: 0, vatAmount: 0, fullTotal: 0
                };
            })
        };

        if (draft.items.length === 0) {
            draft.items = [{ name: 'İşlem Bedeli', quantity: 1, unit: 'ADET', price: source.total_price || 0, vatRate: 1, lineTotal: 0, vatAmount: 0, fullTotal: 0 }];
        }

        setEditModal(calculate(draft));
    };

    const handleSend = async () => {
        // if (!qnbConfig) return alert("Hata: QNB yapılandırması eksik (.env kontrol edin)."); 
        // Backend .env'den okuyacak, o yüzden client-side config check'i esnetilebilir.

        setProcessing(editModal.id);
        try {
            // Fatura Tipi Belirleme (Basit Mantık)
            // 10 hane = VKN (Şirket) -> Genelde e-Fatura (Mükellef ise)
            // 11 hane = TCKN (Şahıs) -> Genelde e-Arşiv (Nihai Tüketici)
            // TODO: İleride checkUser servisi ile mükellef kontrolü yapılmalı.
            const vknLen = editModal.vkn?.length || 0;
            const docType = vknLen === 10 ? 'EFATURA' : 'EARSIV';

            // API'ye gönderilecek veri yapısı
            const invoicePayload = {
                invoiceNumber: editModal.isManual ? undefined : editModal.id.slice(0, 16), // Fatura No (yoksa taslak)
                note: `Platform: ${editModal.platform}`,

                supplier: {
                    vkn: (currentTenant as any)?.tax_number || '1111111111',
                    name: (currentTenant as any)?.company_name || 'Demo Şirket A.Ş.',
                    city: (currentTenant as any)?.city || 'İstanbul'
                },

                customer: {
                    vkn: editModal.vkn,
                    name: editModal.unvan || `${editModal.ad} ${editModal.soyad}`,
                    city: editModal.sehir || 'İstanbul',
                    address: editModal.adres,
                    district: editModal.ilce
                },

                lines: editModal.items.map((item: any) => ({
                    name: item.name,
                    quantity: Number(item.quantity),
                    unit: item.unit || 'ADET',
                    price: Number(item.price),
                    vatRate: Number(item.vatRate)
                })),

                subtotal: editModal.totalLineAmount,
                totalVat: editModal.totalVatAmount,
                grandTotal: editModal.grandTotal,
                docType // EFATURA veya EARSIV
            };

            const response = await fetch('/api/invoices/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(invoicePayload)
            });

            const result = await response.json();

            if (result.success) {
                if (editModal.platform === 'JetPos') {
                    await supabase.from('sales').update({ status: 'invoiced' }).eq('id', editModal.id);
                } else if (editModal.platform === 'Trendyol') {
                    await supabase.from('trendyol_go_orders').update({ status: 'Picking' }).eq('id', editModal.id);
                }

                alert(`✅ E-Arşiv Fatura Başarıyla İletildi!\nBelge OID: ${result.listId}`);
                setEditModal(null);
                fetchData();
            } else {
                throw new Error(result.error || 'Bilinmeyen hata');
            }
        } catch (err: any) {
            console.error(err);
            alert("Gönderim Hatası: " + err.message);
        } finally {
            setProcessing(null);
        }
    };

    if (!mounted) return null;

    return (
        <div className="space-y-4 max-w-[1440px] mx-auto p-2">
            {/* Header / Actions */}
            <div className="flex items-center justify-end gap-2">
                <button onClick={() => openInvoice(null, 'manual')} className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95">
                    <Plus className="w-4 h-4" /> YENİ FATURA OLUŞTUR
                </button>
                <button onClick={fetchData} className="glass-card p-2 text-secondary hover:text-primary transition-all">
                    <Search className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* View Switcher */}
            <div className="flex gap-2 bg-white/5 p-1 rounded-xl w-fit">
                <button
                    onClick={() => setView('sales')}
                    className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${view === 'sales' ? 'bg-primary text-white shadow-lg' : 'text-secondary hover:text-foreground'}`}
                >
                    MAĞAZA SATIŞLARI
                </button>
                <button
                    onClick={() => setView('trendyol')}
                    className={`px-6 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${view === 'trendyol' ? 'bg-orange-500 text-white shadow-lg' : 'text-secondary hover:text-foreground'}`}
                >
                    <ShoppingBag className="w-3.5 h-3.5" /> TRENDYOL SİPARİŞLERİ
                </button>
            </div>

            {/* Liste */}
            <div className="glass-card overflow-hidden !rounded-2xl border-border/50 bg-primary/5">
                <table className="w-full text-left text-xs">
                    <thead className="bg-primary/5 text-[9px] font-bold uppercase tracking-widest text-secondary border-b border-border">
                        <tr>
                            <th className="px-4 py-3">Tarih</th>
                            <th className="px-4 py-3">Referans / Platform</th>
                            <th className="px-4 py-3">Müşteri Detayı</th>
                            <th className="px-4 py-3">Tutar</th>
                            <th className="px-4 py-3">Durum</th>
                            <th className="px-4 py-3 text-right">Aksiyon</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                        {(view === 'sales' ? sales : trendyolOrders).map(item => (
                            <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                                <td className="px-4 py-2.5 text-slate-400 font-mono italic">{formatDate(item.created_at)}</td>
                                <td className="px-4 py-2.5">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-foreground">#{item.order_number || item.id.slice(0, 8)}</span>
                                        {view === 'trendyol' && <span className="text-[8px] bg-orange-500/20 text-orange-500 px-1.5 py-0.5 rounded border border-orange-500/20 font-black">TRENDYOL</span>}
                                        {view === 'sales' && <span className="text-[8px] bg-primary/20 text-primary px-1.5 py-0.5 rounded border border-primary/20 font-black">MAĞAZA</span>}
                                    </div>
                                </td>
                                <td className="px-4 py-2.5 font-bold text-foreground">{item.customer_name || 'Nihai Tüketici'}</td>
                                <td className="px-4 py-2.5 font-black text-emerald-500 font-mono tracking-tighter">{formatCurrency(item.total_price)}</td>
                                <td className="px-4 py-2.5">
                                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold border ${item.status === 'invoiced' || item.status === 'Picking' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-slate-500/10 text-slate-500 border-slate-500/20'}`}>
                                        {item.status === 'invoiced' || item.status === 'Picking' ? 'FATURALANDI' : 'BEKLEMEDE'}
                                    </span>
                                </td>
                                <td className="px-4 py-2.5 text-right">
                                    <button onClick={() => openInvoice(item, view === 'sales' ? 'sale' : 'trendyol')} className="bg-primary/5 hover:bg-primary text-secondary hover:text-white px-3 py-1 rounded-lg text-[10px] font-bold transition-all border border-border">DÜZENLE VE KES</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ----- MODAL (Aynı Kalıyor) ----- */}
            {editModal && (
                <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-md flex items-center justify-center overflow-y-auto p-4 md:p-10">
                    <div className="glass-card w-full max-w-7xl h-[90vh] my-auto !bg-card shadow-2xl overflow-hidden flex flex-col border border-border animate-in fade-in zoom-in duration-200">

                        <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-white/[0.02] shrink-0">
                            <h2 className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-tighter">
                                <Calculator className="text-primary w-4 h-4" /> {editModal.platform || 'MANUEL'} FATURA DÜZENLEME
                            </h2>
                            <button onClick={() => setEditModal(null)} className="text-slate-500 hover:text-white transition-all"> <X className="w-5 h-5" /> </button>
                        </div>

                        <div
                            className="p-4 flex-1 flex flex-col space-y-4 overflow-y-auto"
                            style={{
                                transform: `scale(${zoom})`,
                                transformOrigin: 'top center',
                                transition: 'transform 0.1s ease-out'
                            }}
                        >
                            <div className="bg-primary/5 p-4 rounded-xl border border-border space-y-3 shrink-0">
                                <h3 className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-2"> <MapPin className="w-3 h-3" /> Alıcı Bilgileri</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                                    <div className="space-y-1"><label className="text-[9px] text-secondary font-bold uppercase">VKN / TCKN</label><input value={editModal.vkn} onChange={e => setEditModal(calculate({ ...editModal, vkn: e.target.value }))} className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-foreground outline-none focus:border-primary font-mono" /></div>
                                    <div className="sm:col-span-1 lg:col-span-2 space-y-1"><label className="text-[9px] text-secondary font-bold uppercase">Ünvan / Ad Soyad</label><input value={editModal.unvan || (`${editModal.ad} ${editModal.soyad}`).trim()} onChange={e => setEditModal(calculate({ ...editModal, unvan: e.target.value }))} className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-foreground outline-none focus:border-primary" /></div>
                                    <div className="space-y-1"><label className="text-[9px] text-secondary font-bold uppercase">Vergi Dairesi</label><input value={editModal.vergiDairesi} onChange={e => setEditModal(calculate({ ...editModal, vergiDairesi: e.target.value }))} className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-foreground outline-none focus:border-primary" /></div>

                                    <div className="space-y-1"><label className="text-[9px] text-primary font-bold uppercase">Şehir</label><select value={editModal.sehir} onChange={e => {
                                        const nC = e.target.value; setEditModal(calculate({ ...editModal, sehir: nC, ilce: TURKEY_LOCATIONS[nC]?.[0] || '' }));
                                    }} className="w-full bg-background border border-primary/20 rounded-md px-2 py-1.5 text-foreground outline-none font-bold">{Object.keys(TURKEY_LOCATIONS).map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                                    <div className="space-y-1"><label className="text-[9px] text-primary font-bold uppercase">İlçe</label><select value={editModal.ilce} onChange={e => setEditModal(calculate({ ...editModal, ilce: e.target.value }))} className="w-full bg-background border border-primary/20 rounded-md px-2 py-1.5 text-foreground outline-none font-bold">{(TURKEY_LOCATIONS[editModal.sehir] || []).map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                                    <div className="sm:col-span-1 lg:col-span-2 space-y-1"><label className="text-[9px] text-secondary font-bold uppercase">Adres Detayı</label><input value={editModal.adres} onChange={e => setEditModal(calculate({ ...editModal, adres: e.target.value }))} className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-foreground outline-none focus:border-primary" /></div>
                                </div>
                            </div>

                            <div className="space-y-2 flex-1 flex flex-col min-h-0">
                                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                    <h3 className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-2"> <Building className="w-3 h-3" /> Kalem Bilgileri</h3>
                                    <button onClick={() => {
                                        const newItems = [...editModal.items, { name: 'Muhtelif Gıda', quantity: 1, unit: 'KG', price: 0, vatRate: 1 }];
                                        setEditModal(calculate({ ...editModal, items: newItems }));
                                    }} className="text-emerald-500 hover:text-emerald-400 text-[10px] font-bold flex items-center gap-1 transition-all"> <Plus className="w-3 h-3" /> SATIR EKLE</button>
                                </div>
                                <div className="border border-border rounded-xl overflow-hidden bg-primary/5 flex-1 overflow-y-auto">
                                    <table className="w-full text-xs text-left border-collapse">
                                        <thead className="bg-primary/5 text-secondary font-bold border-b border-border">
                                            <tr>
                                                <th className="px-4 py-3">Ürün Adı</th>
                                                <th className="px-4 py-3 w-32 text-center text-primary">Miktar</th>
                                                <th className="px-4 py-3 w-28 text-center">Birim</th>
                                                <th className="px-4 py-3 w-32 text-center">Birim Fiyat</th>
                                                <th className="px-4 py-3 w-20 text-center">KDV %</th>
                                                <th className="px-4 py-3 w-40 text-right bg-primary/10 text-primary">Toplam</th>
                                                <th className="px-4 py-3 w-10"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/50">
                                            {editModal.items.map((item: any, idx: number) => (
                                                <tr key={idx} className="hover:bg-white/[0.01]">
                                                    <td className="p-2 px-4"><input value={item.name} onChange={e => {
                                                        const newA = [...editModal.items]; newA[idx].name = e.target.value; setEditModal(calculate({ ...editModal, items: newA }));
                                                    }} className="w-full bg-transparent border-none text-foreground font-bold outline-none" /></td>
                                                    <td className="p-2"><input type="number" step="0.001" value={item.quantity} onChange={e => {
                                                        const newA = [...editModal.items]; newA[idx].quantity = e.target.value; setEditModal(calculate({ ...editModal, items: newA }));
                                                    }} className="w-full bg-primary/20 border border-primary/20 rounded-lg px-2 py-1.5 text-primary font-black text-center outline-none focus:border-primary" /></td>
                                                    <td className="p-2">
                                                        <select value={item.unit} onChange={e => {
                                                            const newA = [...editModal.items]; newA[idx].unit = e.target.value; setEditModal(calculate({ ...editModal, items: newA }));
                                                        }} className="w-full bg-background border border-border rounded-lg px-1 py-1.5 text-foreground text-center"><option>KG</option><option>ADET</option></select>
                                                    </td>
                                                    <td className="p-2"><input type="number" step="0.01" value={item.price} onChange={e => {
                                                        const newA = [...editModal.items]; newA[idx].price = e.target.value; setEditModal(calculate({ ...editModal, items: newA }));
                                                    }} className="w-full bg-background border border-border rounded-lg px-2 py-1.5 text-foreground font-mono text-center outline-none focus:border-primary" /></td>
                                                    <td className="p-2">
                                                        <select value={item.vatRate} onChange={e => {
                                                            const newA = [...editModal.items]; newA[idx].vatRate = e.target.value; setEditModal(calculate({ ...editModal, items: newA }));
                                                        }} className="w-full bg-background border border-border rounded-lg px-1 py-1.5 text-foreground text-center"><option value="1">%1</option><option value="10">%10</option><option value="20">%20</option></select>
                                                    </td>
                                                    <td className="py-2 px-6 text-right font-black text-foreground bg-primary/10 font-mono italic">{formatCurrency(item.fullTotal)}</td>
                                                    <td className="p-1 text-center">
                                                        {editModal.items.length > 1 && (
                                                            <button onClick={() => {
                                                                const newA = [...editModal.items]; newA.splice(idx, 1); setEditModal(calculate({ ...editModal, items: newA }));
                                                            }} className="text-rose-500/50 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center justify-between border-t border-white/5 pt-4 shrink-0">
                                <div className="bg-primary/5 rounded-xl border border-border p-4 flex flex-wrap gap-12 flex-1 shadow-inner">
                                    <div className="space-y-1">
                                        <div className="text-[9px] font-black text-secondary uppercase tracking-widest">Ara Toplam</div>
                                        <div className="text-sm font-bold text-foreground font-mono tracking-tighter">{formatCurrency(editModal.totalLineAmount)}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-[9px] font-black text-emerald-500/70 uppercase tracking-widest">KDV Toplam</div>
                                        <div className="text-sm font-bold text-emerald-500 font-mono tracking-tighter">+{formatCurrency(editModal.totalVatAmount)}</div>
                                    </div>
                                    <div className="bg-primary/20 rounded-xl border-2 border-primary/20 px-8 py-2 ml-auto text-center shadow-lg shadow-primary/10">
                                        <div className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-1">GENEL TOPLAM</div>
                                        <div className="text-2xl font-black text-primary font-mono tracking-tighter leading-none">{formatCurrency(editModal.grandTotal).replace(' ₺', '')} <span className="text-xs">₺</span></div>
                                    </div>
                                </div>
                                <button
                                    onClick={handleSend}
                                    disabled={!!processing}
                                    className="w-full sm:w-auto px-12 py-5 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-2xl shadow-primary/40 transition-all active:scale-95 disabled:opacity-50 text-xs"
                                >
                                    {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                    ONAYLA VE GÖNDER
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
