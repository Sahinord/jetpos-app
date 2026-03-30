"use client";

import { useState, useEffect } from "react";
import { 
    QrCode, Settings, Palette, Layout, Image as ImageIcon, 
    Plus, Trash2, ArrowRight, ArrowLeft, Save, Globe,
    Type, Moon, Sun, Monitor, RefreshCw, Search, Edit3, CheckCircle2, X, Utensils, 
    Upload, ChevronUp, ChevronDown, ImageIcon as ImageIconIcon,
    Instagram, Phone, Wifi, Lock, Clock, AlertCircle, Tag
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useTenant } from "@/lib/tenant-context";

interface QRMenuManagerProps {
    products: any[];
    categories: any[];
    showToast: (message: string, type?: any) => void;
    onRefresh: () => void;
}

export default function QRMenuManager({ products, categories, showToast, onRefresh }: QRMenuManagerProps) {
    useEffect(() => {
        // Add custom keyframes for marquee
        if (typeof document !== 'undefined') {
            const styleId = 'marquee-animation-style';
            if (!document.getElementById(styleId)) {
                const style = document.createElement('style');
                style.id = styleId;
                style.innerHTML = `
                    @keyframes marquee {
                        0% { transform: translateX(0); }
                        100% { transform: translateX(-33.33%); }
                    }
                    .animate-marquee {
                        display: flex !important;
                        animation: marquee 20s linear infinite !important;
                        width: max-content !important;
                    }
                `;
                document.head.appendChild(style);
            }
        }
    }, []);
    const { currentTenant } = useTenant();
    const [activeTab, setActiveTab] = useState<"content" | "design" | "settings">("content");
    const [loading, setLoading] = useState(false);
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null); // For product management
    const [isAddingProduct, setIsAddingProduct] = useState(false);
    const [isCreatingNewProduct, setIsCreatingNewProduct] = useState(false);
    const [productSearch, setProductSearch] = useState("");
    const [selectedElement, setSelectedElement] = useState<string | null>(null);
    
    // New Product Form State
    const [newProduct, setNewProduct] = useState({
        name: "",
        sale_price: 0,
        image_url: ""
    });
    
    // QR Settings State
    const [qrSettings, setQrSettings] = useState<any>({
        slug: "",
        primary_color: "#3b82f6",
        secondary_color: "#1e293b",
        font_family: "Inter",
        layout_type: "grid",
        banner_url: "",
        logo_url: "",
        welcome_text: "Hoş Geldiniz!",
        about_text: "",
        fixed_header_text: "",
        marquee_text: "",
        marquee_bg_color: "#ef4444",
        marquee_text_color: "#ffffff",
        header_bg_color: "#000000",
        header_text_color: "#ffffff",
        element_order: ["header", "logo", "marquee", "banner"],
        is_active: true,
        dark_mode_enabled: false
    });

    useEffect(() => {
        if (currentTenant) {
            fetchQRSettings();
        }
    }, [currentTenant]);

    const fetchQRSettings = async () => {
        if (!currentTenant?.id) return;
        try {
            const { data, error } = await supabase
                .from('qr_menu_settings')
                .select('*')
                .eq('tenant_id', currentTenant.id)
                .maybeSingle();

            if (error) throw error;
            if (data) {
                setQrSettings(data);
            } else {
                // Initialize if not exists
                const defaultSlug = currentTenant.company_name
                    .toLowerCase()
                    .replace(/[^a-z0-9]/g, '-')
                    .replace(/-+/g, '-')
                    .replace(/^-|-$/g, '');
                setQrSettings({ ...qrSettings, slug: defaultSlug });
            }
        } catch (error: any) {
            showToast("Ayarlar yüklenemedi: " + error.message, "error");
        }
    };

    const saveSettings = async () => {
        if (!currentTenant?.id) return;
        setLoading(true);
        try {
            const payload = {
                ...qrSettings,
                tenant_id: currentTenant.id
            };
            
            // Remove ID if it's a new record
            if (!payload.id) delete payload.id;

            const { error } = await supabase
                .from('qr_menu_settings')
                .upsert(payload);

            if (error) throw error;
            showToast("QR Menü ayarları kaydedildi");
            fetchQRSettings();
        } catch (error: any) {
            showToast("Hata: " + error.message, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleLogoUpload = async (file: File) => {
        try {
            setLoading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${currentTenant?.id}-${Math.random()}.${fileExt}`;
            const filePath = `logos/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('qr-content')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('qr-content')
                .getPublicUrl(filePath);

            setQrSettings({ ...qrSettings, logo_url: publicUrl });
            showToast("Logo başarıyla yüklendi!");
        } catch (error: any) {
            console.error('Error uploading logo:', error);
            showToast("Logo yüklenirken bir hata oluştu: " + error.message, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleBannerUpload = async (file: File) => {
        try {
            setLoading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${currentTenant?.id}-banner-${Math.random()}.${fileExt}`;
            const filePath = `banners/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('qr-content')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('qr-content')
                .getPublicUrl(filePath);

            setQrSettings({ ...qrSettings, banner_url: publicUrl });
            showToast("Banner görseli başarıyla yüklendi!");
        } catch (error: any) {
            console.error('Error uploading banner:', error);
            showToast("Banner yüklenirken hata oluştu: " + error.message, "error");
        } finally {
            setLoading(false);
        }
    };

    const moveElement = (index: number, direction: 'up' | 'down') => {
        const order = [...(qrSettings.element_order || ["header", "logo", "marquee", "banner"])];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        
        if (newIndex >= 0 && newIndex < order.length) {
            const temp = order[index];
            order[index] = order[newIndex];
            order[newIndex] = temp;
            setQrSettings({ ...qrSettings, element_order: order });
        }
    };

    const toggleQRCategory = async (categoryId: string, status: boolean) => {
        if (!currentTenant?.id) return;
        try {
            const { error } = await supabase
                .from('categories')
                .update({ is_qr_only: status })
                .eq('id', categoryId)
                .eq('tenant_id', currentTenant.id);

            if (error) throw error;
            onRefresh();
            showToast(status ? "Kategori QR menüye eklendi" : "Kategori QR menüden çıkarıldı");
        } catch (error: any) {
            showToast("Hata: " + error.message, "error");
        }
    };

    const addQRCategory = async () => {
        if (!newCategoryName.trim() || !currentTenant?.id) return;
        setLoading(true);
        try {
            const { error } = await supabase
                .from('categories')
                .insert({
                    name: newCategoryName,
                    tenant_id: currentTenant.id,
                    is_qr_only: true
                });

            if (error) throw error;
            setNewCategoryName("");
            setIsAddingCategory(false);
            onRefresh();
            showToast("Yeni QR kategorisi oluşturuldu");
        } catch (error: any) {
            showToast("Hata: " + error.message, "error");
        } finally {
            setLoading(true); // Wait, loading false
            setLoading(false);
        }
    };

    const linkProductToCategory = async (productId: string, categoryId: string | null) => {
        if (!currentTenant?.id) return;
        try {
            const { error } = await supabase
                .from('products')
                .update({ category_id: categoryId })
                .eq('id', productId)
                .eq('tenant_id', currentTenant.id);

            if (error) throw error;
            onRefresh();
            showToast(categoryId ? "Ürün kategoriye atandı" : "Ürün kategoriden çıkarıldı");
        } catch (error: any) {
            showToast("Hata: " + error.message, "error");
        }
    };

    const createNewProduct = async () => {
        if (!newProduct.name.trim() || !selectedCategoryId || !currentTenant?.id) return;
        setLoading(true);
        try {
            const { error } = await supabase
                .from('products')
                .insert({
                    ...newProduct,
                    tenant_id: currentTenant.id,
                    category_id: selectedCategoryId,
                    status: 'active',
                    barcode: `QR-${Math.random().toString(36).substring(7).toUpperCase()}`
                });

            if (error) throw error;
            setNewProduct({ name: "", sale_price: 0, image_url: "" });
            setIsCreatingNewProduct(false);
            onRefresh();
            showToast("Yeni ürün oluşturuldu ve menüye eklendi");
        } catch (error: any) {
            showToast("Hata: " + error.message, "error");
        } finally {
            setLoading(false);
        }
    };

    const qrUrl = `https://${qrSettings.slug}.jetpos.shop`;
    const qrCodeApi = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}`;

    return (
        <div className="flex flex-col gap-6 h-full">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/40 backdrop-blur-xl p-6 rounded-2xl border border-border/50 shadow-xl">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 shadow-inner">
                        <QrCode className="text-primary w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-foreground uppercase">QR Menü Yönetimi</h1>
                        <p className="text-secondary text-sm font-medium">Dijital menünüzü özelleştirin ve yayınlayın</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${qrSettings.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                            {qrSettings.is_active ? 'YAYINDA' : 'PASİF'}
                        </span>
                    </div>
                    <button 
                        onClick={saveSettings}
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        DEĞİŞİKLİKLERİ KAYDET
                    </button>
                </div>
            </div>

            {/* Main Content Layout */}
            <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
                
                {/* Left: Navigation & Settings */}
                <div className="w-full lg:w-80 flex flex-col gap-4">
                    <div className="bg-card/40 backdrop-blur-xl rounded-2xl border border-border/50 p-2 shadow-lg">
                        {[
                            { id: "content", label: "Menü İçeriği", icon: Layout },
                            { id: "design", label: "Görünüm & Tema", icon: Palette },
                            { id: "settings", label: "Genel Ayarlar", icon: Settings }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${
                                    activeTab === tab.id 
                                    ? 'bg-primary text-white shadow-md' 
                                    : 'text-secondary hover:bg-primary/5 hover:text-primary'
                                }`}
                            >
                                <tab.icon className="w-5 h-5" />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* QR Code Preview Card */}
                    <div className="bg-white p-6 rounded-2xl shadow-xl border border-border/50 flex flex-col items-center gap-4">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Canlı Menü QR Kodu</div>
                        <img src={qrCodeApi} alt="QR Code" className="w-40 h-40 bg-slate-50 rounded-lg p-2" />
                        <div className="text-center">
                            <p className="text-xs font-bold text-slate-800 break-all">{qrUrl}</p>
                            <button 
                                onClick={() => window.open(qrUrl, '_blank')}
                                className="mt-2 text-[10px] font-black text-primary hover:underline uppercase tracking-wider flex items-center justify-center gap-1 w-full"
                            >
                                <Globe className="w-3 h-3" /> SİTEYİ AÇ
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right: Tab Content Area */}
                <div className="flex-1 min-h-0 flex flex-col">
                    <AnimatePresence mode="wait">
                        {activeTab === "content" && (
                            <motion.div 
                                key="content"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full"
                            >
                                {/* All Categories Panel */}
                                <div className="bg-card/40 backdrop-blur-xl rounded-2xl border border-border/50 flex flex-col min-h-[500px] shadow-xl">
                                    <div className="p-5 border-b border-border/50 flex items-center justify-between">
                                        <div>
                                            <h3 className="font-black text-sm uppercase tracking-widest text-foreground">SİSTEM KATEGORİLERİ</h3>
                                            <p className="text-[10px] text-secondary font-medium">Tüm kayıtlı kategoriler</p>
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                        {categories.filter(c => !c.is_qr_only).map(cat => (
                                            <div key={cat.id} className="flex items-center justify-between p-4 bg-primary/5 border border-primary/10 rounded-xl group hover:border-primary/30 transition-all">
                                                <span className="font-bold text-sm text-foreground">{cat.name}</span>
                                                <button 
                                                    onClick={() => toggleQRCategory(cat.id, true)}
                                                    className="p-2 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-lg transition-all"
                                                    title="QR Menüye Ekle"
                                                >
                                                    <ArrowRight className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* QR Only Categories Panel */}
                                <div className="bg-emerald-500/5 backdrop-blur-xl rounded-2xl border-2 border-emerald-500/20 flex flex-col min-h-[500px] shadow-xl shadow-emerald-500/5">
                                    <div className="p-5 border-b border-emerald-500/20 flex items-center justify-between">
                                        <div>
                                            <h3 className="font-black text-sm uppercase tracking-widest text-emerald-600">QR MENÜ KATEGORİLERİ</h3>
                                            <p className="text-[10px] text-emerald-600/60 font-medium">Müşterilerin göreceği kategoriler</p>
                                        </div>
                                        <button 
                                            onClick={() => setIsAddingCategory(true)}
                                            className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                                            title="Yeni Kategori Ekle"
                                        >
                                            <Plus className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Category Add Input (Inline) */}
                                    <AnimatePresence>
                                        {isAddingCategory && (
                                            <motion.div 
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="px-4 py-3 bg-emerald-500/10 border-b border-emerald-500/20 flex gap-2"
                                            >
                                                <input 
                                                    type="text" 
                                                    placeholder="Kategori Adı..."
                                                    value={newCategoryName}
                                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                                    className="flex-1 bg-white border border-emerald-500/30 rounded-lg px-3 py-2 text-xs font-bold outline-none"
                                                    onKeyDown={(e) => e.key === 'Enter' && addQRCategory()}
                                                    autoFocus
                                                />
                                                <button 
                                                    onClick={addQRCategory}
                                                    className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-[10px] font-black"
                                                >
                                                    EKLE
                                                </button>
                                                <button 
                                                    onClick={() => setIsAddingCategory(false)}
                                                    className="p-2 text-emerald-600"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                        {categories.filter(c => c.is_qr_only).map(cat => (
                                            <div key={cat.id} className="flex flex-col gap-2 p-1 bg-white border border-emerald-500/30 rounded-2xl group shadow-sm transition-all hover:shadow-md">
                                                <div className="flex items-center justify-between p-3 border-b border-slate-50">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                                                            <Layout className="w-4 h-4 text-emerald-600" />
                                                        </div>
                                                        <span className="font-bold text-sm text-slate-800">{cat.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <button 
                                                            onClick={() => setSelectedCategoryId(selectedCategoryId === cat.id ? null : cat.id)}
                                                            className={`p-2 rounded-lg transition-all ${selectedCategoryId === cat.id ? 'bg-primary text-white' : 'bg-slate-50 text-slate-400 hover:text-primary'}`}
                                                            title="Ürünleri Yönet"
                                                        >
                                                            <Plus className="w-4 h-4" />
                                                        </button>
                                                        <button 
                                                            onClick={() => toggleQRCategory(cat.id, false)}
                                                            className="p-2 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-lg transition-all"
                                                            title="Kategoriyi Kaldır"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Selected Category Product Management */}
                                                <AnimatePresence>
                                                    {selectedCategoryId === cat.id && (
                                                        <motion.div 
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: "auto", opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="p-3 bg-slate-50/50 rounded-b-xl space-y-3"
                                                        >
                                                            {/* Current Products in this Category */}
                                                            <div className="space-y-1">
                                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">BU KATEGORİDEKİ ÜRÜNLER</span>
                                                                {products.filter(p => p.category_id === cat.id).map(prod => (
                                                                    <div key={prod.id} className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-100 shadow-sm">
                                                                        <div className="flex items-center gap-2">
                                                                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                                                            <span className="text-[11px] font-bold text-slate-700">{prod.name}</span>
                                                                        </div>
                                                                        <button 
                                                                            onClick={() => linkProductToCategory(prod.id, null)}
                                                                            className="p-1 text-slate-300 hover:text-rose-500 transition-colors"
                                                                        >
                                                                            <X className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>

                                                            {/* Add Product Interface */}
                                                            <div className="pt-2 border-t border-slate-100">
                                                                <button 
                                                                    onClick={() => setIsAddingProduct(true)}
                                                                    className="w-full py-2 bg-white border-2 border-dashed border-emerald-500/20 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/5 transition-all flex items-center justify-center gap-2"
                                                                >
                                                                    <Search className="w-3 h-3" /> ÜRÜN EKLE / SEÇ
                                                                </button>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        ))}
                                        {categories.filter(c => c.is_qr_only).length === 0 && (
                                            <div className="h-full flex flex-col items-center justify-center text-emerald-500/20 p-10 text-center">
                                                <Layout size={60} strokeWidth={1} />
                                                <p className="mt-4 font-black uppercase tracking-widest text-xs">QR MENÜ HENÜZ BOŞ</p>
                                                <p className="text-[10px] mt-2 italic">Soldaki kategorileri buraya aktarın</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === "design" && (
                            <motion.div 
                                key="design"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex flex-col xl:flex-row gap-6 h-full"
                            >
                                {/* Left: Editor Controls */}
                                <div className="flex-1 bg-card/40 backdrop-blur-xl rounded-2xl border border-border/50 p-6 shadow-xl space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Colors */}
                                        <div className="space-y-4">
                                            <h4 className="flex items-center gap-2 font-black text-xs uppercase tracking-widest text-foreground">
                                                <Palette className="w-4 h-4 text-primary" /> Marka Renkleri
                                            </h4>
                                            <div className="grid grid-cols-1 gap-4">
                                                <div className={`space-y-2 p-3 bg-primary/5 rounded-xl border-2 transition-all ${selectedElement === 'colors' ? 'border-primary ring-2 ring-primary/20 bg-primary/10' : 'border-primary/10'}`}>
                                                    <label className="text-[10px] font-bold text-secondary uppercase">Birincil Renk (Butonlar & Başlıklar)</label>
                                                    <div className="flex items-center gap-2">
                                                        <input 
                                                            type="color" 
                                                            value={qrSettings.primary_color}
                                                            onChange={(e) => setQrSettings({...qrSettings, primary_color: e.target.value})}
                                                            className="w-10 h-10 rounded-lg cursor-pointer border-none bg-transparent" 
                                                        />
                                                        <input 
                                                            type="text" 
                                                            value={qrSettings.primary_color}
                                                            onChange={(e) => setQrSettings({...qrSettings, primary_color: e.target.value})}
                                                            className="flex-1 bg-white border border-border rounded-lg px-3 py-2 text-xs font-mono" 
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2 p-3 bg-primary/5 rounded-xl border border-primary/10">
                                                    <label className="text-[10px] font-bold text-secondary uppercase">İkincil Renk (Arka Plan Detayları)</label>
                                                    <div className="flex items-center gap-2">
                                                        <input 
                                                            type="color" 
                                                            value={qrSettings.secondary_color}
                                                            onChange={(e) => setQrSettings({...qrSettings, secondary_color: e.target.value})}
                                                            className="w-10 h-10 rounded-lg cursor-pointer border-none bg-transparent" 
                                                        />
                                                        <input 
                                                            type="text" 
                                                            value={qrSettings.secondary_color}
                                                            onChange={(e) => setQrSettings({...qrSettings, secondary_color: e.target.value})}
                                                            className="flex-1 bg-white border border-border rounded-lg px-3 py-2 text-xs font-mono" 
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Typography & Layout */}
                                        <div className="space-y-4">
                                            <h4 className="flex items-center gap-2 font-black text-xs uppercase tracking-widest text-foreground">
                                                <Type className="w-4 h-4 text-primary" /> Tipografi ve Düzen
                                            </h4>
                                            <div className="grid grid-cols-1 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold text-secondary uppercase">Yazı Tipi</label>
                                                    <select 
                                                        value={qrSettings.font_family}
                                                        onChange={(e) => setQrSettings({...qrSettings, font_family: e.target.value})}
                                                        className="w-full bg-white border border-border rounded-xl px-4 py-3 text-xs font-bold shadow-sm"
                                                    >
                                                        <option value="Inter">Inter (Modern & Sade)</option>
                                                        <option value="Poppins">Poppins (Geometrik)</option>
                                                        <option value="Roboto">Roboto (Klasik)</option>
                                                        <option value="Montserrat">Montserrat (Şık)</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold text-secondary uppercase">Menü Görünümü</label>
                                                    <div className="flex gap-2">
                                                        <button 
                                                            onClick={() => setQrSettings({...qrSettings, layout_type: 'grid'})}
                                                            className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${qrSettings.layout_type === 'grid' ? 'bg-primary text-white border-primary shadow-lg' : 'bg-white text-slate-400 border-slate-100 hover:border-primary/30'}`}
                                                        >
                                                            IZGARA (GRID)
                                                        </button>
                                                        <button 
                                                            onClick={() => setQrSettings({...qrSettings, layout_type: 'list'})}
                                                            className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${qrSettings.layout_type === 'list' ? 'bg-primary text-white border-primary shadow-lg' : 'bg-white text-slate-400 border-slate-100 hover:border-primary/30'}`}
                                                        >
                                                            LİSTE (LIST)
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Brand Identity & Header Controls */}
                                    <div className="space-y-4 pt-6 border-t border-border/50">
                                        <h4 className="flex items-center gap-2 font-black text-xs uppercase tracking-widest text-foreground">
                                            <Monitor className="w-4 h-4 text-primary" /> Marka Kimliği ve Görünüm Sırası
                                        </h4>
                                        <div className="grid grid-cols-1 gap-4">
                                            {/* Order Controls */}
                                            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-border/50">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Eleman Sıralaması (Yukarı/Aşağı)</label>
                                                <div className="space-y-2">
                                                    {(qrSettings.element_order || ["header", "logo", "marquee", "banner"]).map((item: string, idx: number) => (
                                                        <div key={item} className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 rounded-xl border border-border/50 shadow-sm">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 flex items-center justify-center bg-primary/10 text-primary rounded-lg text-[10px] font-black">{idx + 1}</div>
                                                                <span className="text-xs font-bold uppercase tracking-tight">
                                                                    {item === 'header' && 'Sabit Üst Yazı'}
                                                                    {item === 'logo' && 'Logo ve Başlık'}
                                                                    {item === 'marquee' && 'Kayan Duyuru'}
                                                                    {item === 'banner' && 'Banner (Afiş)'}
                                                                </span>
                                                            </div>
                                                            <div className="flex gap-1">
                                                                <button onClick={() => moveElement(idx, 'up')} disabled={idx === 0} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg disabled:opacity-20 transition-all"><ChevronUp size={14} /></button>
                                                                <button onClick={() => moveElement(idx, 'down')} disabled={idx === (qrSettings.element_order?.length || 4) - 1} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg disabled:opacity-20 transition-all"><ChevronDown size={14} /></button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className={`space-y-4 p-3 rounded-2xl border-2 transition-all ${selectedElement === 'logo' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                                                    <label className="text-[10px] font-bold text-secondary uppercase">Restoran Logosu</label>
                                                    <div className="relative group overflow-hidden rounded-xl border-2 border-dashed border-border p-4 text-center hover:border-primary/50 transition-all bg-white dark:bg-slate-800">
                                                        {qrSettings.logo_url ? (
                                                            <div className="relative inline-block">
                                                                <img src={qrSettings.logo_url} className="object-contain" style={{ height: `${(qrSettings.logo_size || 80) / 2}px` }} />
                                                                <button onClick={() => setQrSettings({...qrSettings, logo_url: ''})} className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"><X size={10}/></button>
                                                            </div>
                                                        ) : (
                                                            <div className="py-2 cursor-pointer" onClick={() => document.getElementById('logo-upload')?.click()}>
                                                                <Upload className="mx-auto text-slate-300 mb-2" />
                                                                <p className="text-[10px] font-black text-slate-400 uppercase">Bilgisayardan Yükle</p>
                                                            </div>
                                                        )}
                                                        <input id="logo-upload" type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])} className="hidden" />
                                                    </div>

                                                    <div className="space-y-4 pt-2">
                                                        <div className="flex items-center justify-between">
                                                            <label className="text-[10px] font-bold text-secondary uppercase">Logo Boyutu ({qrSettings.logo_size || 80}px)</label>
                                                            <span className="text-[8px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-black uppercase tracking-widest">
                                                                {qrSettings.logo_size < 50 ? 'MİNİK' : qrSettings.logo_size > 150 ? 'DEVASA' : 'İDEAL'}
                                                            </span>
                                                        </div>
                                                        <input 
                                                            type="range" 
                                                            min="30" 
                                                            max="250" 
                                                            value={qrSettings.logo_size || 80}
                                                            onChange={(e) => setQrSettings({...qrSettings, logo_size: parseInt(e.target.value)})}
                                                            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                                                        />
                                                    </div>
                                                </div>
                                                <div className={`space-y-2 p-3 rounded-2xl border-2 transition-all ${selectedElement === 'fixed_header' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                                                    <label className="text-[10px] font-bold text-secondary uppercase">Sabit Üst Yazı</label>
                                                    <textarea 
                                                        rows={3}
                                                        placeholder="Örn: TATLI YANINDA KAHVE BİZDEN!"
                                                        value={qrSettings.fixed_header_text || ""}
                                                        onChange={(e) => setQrSettings({...qrSettings, fixed_header_text: e.target.value})}
                                                        onFocus={() => setSelectedElement('fixed_header')}
                                                        className="w-full bg-white border border-border rounded-xl px-4 py-3 text-xs font-bold focus:border-primary outline-none transition-all resize-none" 
                                                    />
                                                </div>
                                            </div>

                                            {/* Banner Upload Section */}
                                            <div className="pt-2">
                                                <div className={`space-y-4 p-4 rounded-3xl border-2 transition-all ${selectedElement === 'banner' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/20">
                                                                <ImageIconIcon size={18} />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black text-secondary uppercase">Kampanya / Reklam Bannerı</label>
                                                                <p className="text-[10px] text-slate-400 font-medium tracking-tight">Menüde en üstte görünecek kampanya görseli</p>
                                                            </div>
                                                        </div>
                                                        <button 
                                                            onClick={() => document.getElementById('banner-upload')?.click()}
                                                            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl transition-all shadow-md active:scale-95"
                                                        >
                                                            Görsel Seç
                                                        </button>
                                                        <input id="banner-upload" type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleBannerUpload(e.target.files[0])} className="hidden" />
                                                    </div>

                                                    {qrSettings.banner_url && (
                                                        <div className="relative group rounded-2xl overflow-hidden border border-border shadow-inner bg-slate-50">
                                                            <img src={qrSettings.banner_url} className="w-full h-32 object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                                                                <button 
                                                                    onClick={() => setQrSettings({...qrSettings, banner_url: ''})}
                                                                    className="bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-xl active:scale-90"
                                                                >
                                                                    <X size={16} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Marquee & Customization */}
                                    <div className="space-y-4 pt-6 border-t border-border/50">
                                        <h4 className="flex items-center gap-2 font-black text-xs uppercase tracking-widest text-foreground">
                                            <ArrowRight className="w-4 h-4 text-primary" /> Duyurular ve Renkler
                                        </h4>
                                        <div className="grid grid-cols-1 gap-4">
                                            <div className={`space-y-4 p-4 rounded-2xl border-2 transition-all ${selectedElement === 'marquee' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold text-secondary uppercase">Kayan Duyuru Metni</label>
                                                    <input 
                                                        type="text" 
                                                        placeholder="Örn: PAKET SERVİSTE %10 İNDİRİM!"
                                                        value={qrSettings.marquee_text || ""}
                                                        onChange={(e) => setQrSettings({...qrSettings, marquee_text: e.target.value})}
                                                        onFocus={() => setSelectedElement('marquee')}
                                                        className="w-full bg-white border border-border rounded-xl px-4 py-3 text-xs font-bold focus:border-primary outline-none" 
                                                    />
                                                </div>
                                                
                                                    <div className="space-y-3 pt-2">
                                                        <div className="flex items-center justify-between">
                                                            <label className="text-[10px] font-bold text-secondary uppercase">Dönüş Hızı ({qrSettings.marquee_speed || 20}s)</label>
                                                            <span className="text-[8px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-black uppercase tracking-widest">
                                                                {qrSettings.marquee_speed < 12 ? 'ÇOK HIZLI' : qrSettings.marquee_speed > 35 ? 'YAVAŞ' : 'NORMAL'}
                                                            </span>
                                                        </div>
                                                        <input 
                                                            type="range" 
                                                            min="5" 
                                                            max="60" 
                                                            value={qrSettings.marquee_speed || 20}
                                                            onChange={(e) => setQrSettings({...qrSettings, marquee_speed: parseInt(e.target.value)})}
                                                            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                                                        />
                                                    </div>

                                                    <div className="space-y-3 pt-2">
                                                        <div className="flex items-center justify-between">
                                                            <label className="text-[10px] font-bold text-secondary uppercase">Yazı Arası Boşluk ({qrSettings.marquee_spacing || 80}px)</label>
                                                            <span className="text-[8px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">
                                                                {qrSettings.marquee_spacing < 40 ? 'DAR' : qrSettings.marquee_spacing > 150 ? 'Geniş' : 'DENGELİ'}
                                                            </span>
                                                        </div>
                                                        <input 
                                                            type="range" 
                                                            min="20" 
                                                            max="300" 
                                                            value={qrSettings.marquee_spacing || 80}
                                                            onChange={(e) => setQrSettings({...qrSettings, marquee_spacing: parseInt(e.target.value)})}
                                                            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                                        />
                                                    </div>
                                            </div>
                                            {/* Banner Upload Section */}
                                            <div className="pt-2">
                                                <div className={`space-y-4 p-4 rounded-3xl border-2 transition-all ${selectedElement === 'banner' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/20">
                                                                <ImageIconIcon size={18} />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black text-secondary uppercase">Kampanya / Reklam Bannerı</label>
                                                                <p className="text-[10px] text-slate-400 font-medium tracking-tight">Menüde en üstte görünecek kampanya görseli</p>
                                                            </div>
                                                        </div>
                                                        <button 
                                                            onClick={() => document.getElementById('banner-upload')?.click()}
                                                            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl transition-all shadow-md active:scale-95"
                                                        >
                                                            Görsel Seç
                                                        </button>
                                                        <input id="banner-upload" type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleBannerUpload(e.target.files[0])} className="hidden" />
                                                    </div>

                                                    {qrSettings.banner_url && (
                                                        <div className="relative group rounded-2xl overflow-hidden border border-border shadow-inner bg-slate-50">
                                                            <img src={qrSettings.banner_url} className="w-full h-32 object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                                                                <button 
                                                                    onClick={() => setQrSettings({...qrSettings, banner_url: ''})}
                                                                    className="bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-xl active:scale-90"
                                                                >
                                                                    <X size={16} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                <div className={`space-y-4 p-3 rounded-2xl border-2 transition-all ${selectedElement === 'social_bar' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Instagram className="w-4 h-4 text-pink-500" />
                                                        <label className="text-[10px] font-bold text-secondary uppercase">Instagram</label>
                                                    </div>
                                                    <input 
                                                        type="text" 
                                                        placeholder="@kullanici_adi"
                                                        value={qrSettings.instagram_url || ''}
                                                        onChange={(e) => setQrSettings({...qrSettings, instagram_url: e.target.value})}
                                                        className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-white outline-none focus:ring-2 focus:ring-primary/20"
                                                    />
                                                </div>

                                                <div className={`space-y-4 p-3 rounded-2xl border-2 transition-all ${selectedElement === 'social_bar' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Phone className="w-4 h-4 text-emerald-500" />
                                                        <label className="text-[10px] font-bold text-secondary uppercase">WhatsApp No</label>
                                                    </div>
                                                    <input 
                                                        type="text" 
                                                        placeholder="05XX XXX XX XX"
                                                        value={qrSettings.whatsapp_number || ''}
                                                        onChange={(e) => setQrSettings({...qrSettings, whatsapp_number: e.target.value})}
                                                        className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-white outline-none focus:ring-2 focus:ring-primary/20"
                                                    />
                                                </div>

                                                <div className={`space-y-4 p-3 rounded-2xl border-2 transition-all ${selectedElement === 'wifi_info' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Wifi className="w-4 h-4 text-blue-500" />
                                                        <label className="text-[10px] font-bold text-secondary uppercase">Wi-Fi Adı</label>
                                                    </div>
                                                    <input 
                                                        type="text" 
                                                        placeholder="Restoran Wi-Fi"
                                                        value={qrSettings.wifi_name || ''}
                                                        onChange={(e) => setQrSettings({...qrSettings, wifi_name: e.target.value})}
                                                        className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-white outline-none focus:ring-2 focus:ring-primary/20"
                                                    />
                                                </div>

                                                <div className={`space-y-4 p-3 rounded-2xl border-2 transition-all ${selectedElement === 'wifi_info' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Lock className="w-4 h-4 text-slate-400" />
                                                        <label className="text-[10px] font-bold text-secondary uppercase">Wi-Fi Şifresi</label>
                                                    </div>
                                                    <input 
                                                        type="text" 
                                                        placeholder="Şifre"
                                                        value={qrSettings.wifi_password || ''}
                                                        onChange={(e) => setQrSettings({...qrSettings, wifi_password: e.target.value})}
                                                        className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-white outline-none focus:ring-2 focus:ring-primary/20"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className={`space-y-4 p-4 rounded-3xl border-2 transition-all ${qrSettings.is_closed_manual ? 'border-amber-500 bg-amber-500/5' : 'border-border'}`}>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`p-2 rounded-xl ${qrSettings.is_closed_manual ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                                <Moon size={18} />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-bold text-secondary uppercase">Dükkan Durumu</label>
                                                                <p className="text-[10px] text-slate-400 font-medium">Manuel olarak dükkanı kapat</p>
                                                            </div>
                                                        </div>
                                                        <button 
                                                            onClick={() => setQrSettings({...qrSettings, is_closed_manual: !qrSettings.is_closed_manual})}
                                                            className={`w-12 h-6 rounded-full transition-all relative ${qrSettings.is_closed_manual ? 'bg-amber-500' : 'bg-slate-200'}`}
                                                        >
                                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${qrSettings.is_closed_manual ? 'left-7' : 'left-1'}`} />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="p-4 rounded-3xl border-2 border-border space-y-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/20">
                                                            <Clock size={18} />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-bold text-secondary uppercase">Çalışma Takvimi</label>
                                                            <p className="text-[10px] text-slate-400 font-medium">Otomatik kapalı modu aktif</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold text-secondary uppercase">Kayan Yazı Zemini</label>
                                                    <input type="color" value={qrSettings.marquee_bg_color || "#ef4444"} onChange={(e) => setQrSettings({...qrSettings, marquee_bg_color: e.target.value})} className="w-full h-8 rounded-lg cursor-pointer" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold text-secondary uppercase">Üst Bant Zemini</label>
                                                    <input type="color" value={qrSettings.header_bg_color || "#000000"} onChange={(e) => setQrSettings({...qrSettings, header_bg_color: e.target.value})} className="w-full h-8 rounded-lg cursor-pointer" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold text-secondary uppercase">Karanlık Mod</label>
                                                    <button 
                                                        onClick={() => setQrSettings({...qrSettings, dark_mode_enabled: !qrSettings.dark_mode_enabled})}
                                                        className={`w-full h-8 rounded-lg border transition-all flex items-center justify-center gap-2 ${qrSettings.dark_mode_enabled ? 'bg-slate-900 text-amber-400 border-slate-700' : 'bg-white text-slate-400 border-slate-200'}`}
                                                    >
                                                        {qrSettings.dark_mode_enabled ? <Moon className="w-3 h-3" /> : <Sun className="w-3 h-3" />}
                                                        <span className="text-[9px] font-bold uppercase tracking-widest">MOD</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Real-time Live Preview (Mobile Frame) */}
                                <div className="w-full xl:w-[450px] shrink-0 flex flex-col items-center">
                                    <div className="sticky top-6">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 text-center flex items-center justify-center gap-2">
                                            <Monitor className="w-3 h-3 text-primary" /> İNTERAKTİF EDİTÖR (CANLI)
                                        </div>
                                        
                                        <div className="relative w-[340px] h-[680px] bg-[#111] rounded-[60px] p-4 shadow-2xl border-[10px] border-[#222] ring-1 ring-white/10 group/phone">
                                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-[#222] rounded-b-3xl z-50 flex items-center justify-center">
                                                <div className="w-12 h-1 bg-[#111] rounded-full" />
                                            </div>

                                            <div 
                                                className={`w-full h-full rounded-[45px] overflow-hidden overflow-y-auto scrollbar-none shadow-inner relative ${qrSettings.dark_mode_enabled ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}
                                                style={{ fontFamily: qrSettings.font_family }}
                                            >
                                                {/* Re-orderable branding elements */}
                                                {(qrSettings.element_order || ["header", "logo", "marquee", "banner"]).map((el: string) => {
                                                    if (el === 'header' && qrSettings.fixed_header_text) {
                                                        return (
                                                            <div 
                                                                key="header"
                                                                className={`py-2 px-4 transition-all cursor-pointer text-center border-b-2 ${selectedElement === 'fixed_header' ? 'border-primary' : 'border-transparent'}`}
                                                                style={{ backgroundColor: qrSettings.header_bg_color || '#000', color: qrSettings.header_text_color || '#fff' }}
                                                                onClick={(e) => { e.stopPropagation(); setSelectedElement('fixed_header'); }}
                                                            >
                                                                <span className="text-[8px] font-black uppercase tracking-widest">{qrSettings.fixed_header_text}</span>
                                                            </div>
                                                        );
                                                    }
                                                    if (el === 'logo') {
                                                        return (
                                                            <div 
                                                                key="logo"
                                                                className={`p-4 flex flex-col items-center gap-3 transition-all cursor-pointer border-2 ${selectedElement === 'logo' ? 'border-primary bg-primary/5' : 'border-transparent hover:border-primary/20'}`}
                                                                onClick={() => setSelectedElement('logo')}
                                                            >
                                                                {qrSettings.logo_url ? (
                                                                    <img src={qrSettings.logo_url} className="object-contain" style={{ height: `${(qrSettings.logo_size || 80) / 2}px` }} />
                                                                ) : (
                                                                    <div className="flex items-center gap-2 opacity-30 grayscale" style={{ height: `${(qrSettings.logo_size || 80) / 2}px` }}>
                                                                        <Utensils className="w-6 h-6" />
                                                                        <span className="font-black text-xs uppercase tracking-tight">LOGONUZ</span>
                                                                    </div>
                                                                )}
                                                                
                                                                <div className="flex flex-col items-center">
                                                                    <h4 
                                                                        className={`text-xs font-black uppercase tracking-tighter truncate transition-all p-1 rounded ${qrSettings.dark_mode_enabled ? 'text-white' : 'text-slate-900'} ${selectedElement === 'title' ? 'bg-primary/20 text-primary ring-2 ring-primary' : 'hover:bg-primary/5'}`}
                                                                        onClick={(e) => { e.stopPropagation(); setSelectedElement('title'); }}
                                                                    >
                                                                        {currentTenant?.company_name || 'Restoran Adı'}
                                                                    </h4>
                                                                    <p 
                                                                        className={`text-[7px] font-bold px-3 py-1 rounded-full mt-1 border transition-all ${selectedElement === 'welcome' ? 'bg-primary/20 text-primary border-primary ring-2 ring-primary' : 'bg-primary/5 border-primary/20 hover:bg-primary/10'}`}
                                                                        onClick={(e) => { e.stopPropagation(); setSelectedElement('welcome'); }}
                                                                        style={{ color: qrSettings.primary_color }}
                                                                    >
                                                                        {qrSettings.welcome_text}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        );
                                                    }
                                                    if (el === 'marquee' && qrSettings.marquee_text) {
                                                        return (
                                                            <div 
                                                                key="marquee"
                                                                className={`relative overflow-hidden py-2.5 transition-all cursor-pointer border-y-2 ${selectedElement === 'marquee' ? 'border-primary shadow-inner bg-primary/5' : 'border-transparent hover:border-primary/30'}`}
                                                                style={{ backgroundColor: qrSettings.marquee_bg_color || '#ef4444' }}
                                                                onClick={(e) => { e.stopPropagation(); setSelectedElement('marquee'); }}
                                                            >
                                                                <div 
                                                                    className="flex whitespace-nowrap" 
                                                                    style={{ 
                                                                        animationDuration: `${qrSettings.marquee_speed || 20}s`,
                                                                        animationName: 'marquee',
                                                                        animationTimingFunction: 'linear',
                                                                        animationIterationCount: 'infinite',
                                                                        width: 'max-content'
                                                                    }}
                                                                >
                                                                    {Array.from({ length: 20 }).map((_, i) => (
                                                                        <span 
                                                                            key={i} 
                                                                            className="text-[9px] font-black uppercase text-white"
                                                                            style={{ paddingLeft: `${(qrSettings.marquee_spacing || 80) / 2}px`, paddingRight: `${(qrSettings.marquee_spacing || 80) / 2}px` }}
                                                                        >
                                                                            {qrSettings.marquee_text}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        );
                                                    }
                                                    if (el === 'banner') {
                                                        return (
                                                            <div 
                                                                key="banner"
                                                                className={`relative h-28 overflow-hidden cursor-pointer transition-all border-2 mx-4 mt-2 rounded-2xl ${selectedElement === 'banner' ? 'border-primary' : 'border-transparent hover:border-primary/50'}`}
                                                                onClick={() => setSelectedElement('banner')}
                                                            >
                                                                {qrSettings.banner_url ? (
                                                                    <img src={qrSettings.banner_url} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full bg-slate-100 dark:bg-slate-800" />
                                                                )}
                                                                <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                                                                    <ImageIcon size={20} className="text-white/40" />
                                                                </div>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                })}

                                                {/* Real Category List */}
                                                <div 
                                                    className={`p-4 flex gap-2 overflow-x-auto scrollbar-none border-b border-black/5 transition-all border-2 ${selectedElement === 'colors' ? 'border-primary bg-primary/5' : 'border-transparent hover:border-primary/30'}`}
                                                    onClick={() => setSelectedElement('colors')}
                                                >
                                                    <div className="px-4 py-1.5 text-white text-[9px] font-black rounded-xl shadow-md whitespace-nowrap" style={{ backgroundColor: qrSettings.primary_color }}>TÜMÜ</div>
                                                    {categories.filter(c => c.is_qr_only || c.is_active !== false).slice(0, 5).map(cat => (
                                                        <div 
                                                            key={cat.id} 
                                                            className={`px-4 py-1.5 border text-[9px] font-black rounded-xl opacity-60 whitespace-nowrap ${qrSettings.dark_mode_enabled ? 'bg-slate-900 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                                                        >
                                                            {cat.name.toUpperCase()}
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Real Product List */}
                                                <div className="p-4 space-y-2">
                                                    {products.length > 0 ? (
                                                        products.slice(0, 8).map(product => (
                                                            <div 
                                                                key={product.id} 
                                                                className={`p-2 rounded-[18px] border-2 transition-all cursor-pointer relative ${selectedElement === 'layout' ? 'border-primary ring-2 ring-primary/10 bg-primary/5' : 'border-transparent'} ${qrSettings.dark_mode_enabled ? 'bg-slate-900 shadow-lg' : 'bg-white shadow-sm border border-slate-100 hover:shadow-md'}`}
                                                                onClick={() => setSelectedElement('layout')}
                                                            >
                                                                <div className="flex gap-2">
                                                                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl shrink-0 overflow-hidden">
                                                                        {product.image_url ? (
                                                                            <img src={product.image_url} className="w-full h-full object-cover" />
                                                                        ) : (
                                                                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                                                <ImageIcon size={14} />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className={`text-[9px] font-black truncate pr-6 ${qrSettings.dark_mode_enabled ? 'text-white' : 'text-slate-900'}`}>{product.name}</div>
                                                                        <div className={`text-[7px] line-clamp-1 ${qrSettings.dark_mode_enabled ? 'text-slate-400' : 'text-slate-500'}`}>Ürün detaylarını müşterilerle paylaşın</div>
                                                                        <div className="flex justify-between items-center mt-1">
                                                                            <div className="text-[9px] font-bold" style={{ color: qrSettings.primary_color }}>{product.sale_price.toFixed(2)} ₺</div>
                                                                            <div className="w-5 h-5 rounded-lg bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20" style={{ backgroundColor: qrSettings.primary_color }}>
                                                                                <Plus size={10} />
                                                                            </div>
                                                                        </div>

                                                                        {/* Elite Badge Editor */}
                                                                        <div className="flex items-center gap-2 mt-2 pt-1 border-t border-slate-100 dark:border-white/5 opacity-0 group-hover/phone:opacity-100 transition-opacity">
                                                                            <Tag size={10} className="text-slate-300" />
                                                                            <input 
                                                                                type="text" 
                                                                                placeholder="Rozet..."
                                                                                className="bg-transparent text-[8px] font-black uppercase outline-none focus:text-primary w-14"
                                                                                defaultValue={product.badge_text || ''}
                                                                                onClick={(e) => e.stopPropagation()}
                                                                                onBlur={async (e) => {
                                                                                    const val = e.target.value.toUpperCase();
                                                                                    if (val !== (product.badge_text || '')) {
                                                                                        await supabase.from('products').update({ badge_text: val }).eq('id', product.id);
                                                                                        showToast('Rozet Güncellendi');
                                                                                    }
                                                                                }}
                                                                            />
                                                                            <div className="flex gap-1 ml-auto">
                                                                                {['#ef4444', '#3b82f6', '#10b981', '#f59e0b'].map(color => (
                                                                                    <button 
                                                                                        key={color}
                                                                                        onClick={async (e) => {
                                                                                            e.stopPropagation();
                                                                                            await supabase.from('products').update({ badge_color: color }).eq('id', product.id);
                                                                                            showToast('Renk Güncellendi');
                                                                                        }}
                                                                                        className={`w-2 h-2 rounded-full ${product.badge_color === color ? 'ring-2 ring-offset-2 ring-slate-400' : ''}`}
                                                                                        style={{ backgroundColor: color }}
                                                                                    />
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="py-10 text-center opacity-30 flex flex-col items-center">
                                                            <Plus size={24} className="mb-2" />
                                                            <p className="text-[9px] font-black uppercase tracking-widest">Henüz Ürün Eklenmemiş</p>
                                                        </div>
                                                    )}
                                                </div>

                                                <AnimatePresence>
                                                    {selectedElement && (
                                                        <motion.div 
                                                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                                            className="absolute bottom-4 left-4 right-4 bg-slate-900/90 text-white p-2.5 rounded-2xl shadow-2xl flex items-center justify-between z-50 border border-white/10 backdrop-blur-md"
                                                        >
                                                            <div className="flex items-center gap-2 px-1">
                                                                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ backgroundColor: qrSettings.primary_color }} />
                                                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">
                                                                    DÜZENLENİYOR: <span className="text-white ml-1">
                                                                        {selectedElement === 'banner' && 'BANNER'}
                                                                        {selectedElement === 'title' && 'BAŞLIK'}
                                                                        {selectedElement === 'welcome' && 'KARŞILAMA'}
                                                                        {selectedElement === 'colors' && 'RENKLER'}
                                                                        {selectedElement === 'layout' && 'DÜZEN'}
                                                                        {selectedElement === 'fixed_header' && 'SABİT ÜST YAZI'}
                                                                        {selectedElement === 'logo' && 'LOGO'}
                                                                        {selectedElement === 'marquee' && 'KAYAN YAZI'}
                                                                    </span>
                                                                </span>
                                                            </div>
                                                            <button onClick={(e) => { e.stopPropagation(); setSelectedElement(null); }} className="p-1.5 hover:bg-white/10 rounded-xl transition-colors">
                                                                <X size={12} className="text-slate-400" />
                                                            </button>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === "settings" && (
                            <motion.div 
                                key="settings"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="bg-card/40 backdrop-blur-xl rounded-2xl border border-border/50 p-8 shadow-xl space-y-8"
                            >
                                <div className="max-w-md space-y-6">
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-xs font-black uppercase text-foreground">
                                            <Globe className="w-4 h-4 text-primary" /> Menü Adresi (Slug)
                                        </label>
                                        <div className="flex items-center">
                                            <div className="bg-primary/10 border border-r-0 border-border rounded-l-xl px-4 py-3 text-xs font-bold text-primary">
                                                https://
                                            </div>
                                            <input 
                                                type="text" 
                                                value={qrSettings.slug}
                                                onChange={(e) => setQrSettings({...qrSettings, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})}
                                                className="flex-1 bg-card border border-border px-4 py-3 text-sm font-black text-foreground outline-none focus:border-primary transition-all"
                                                placeholder="restoran-adi"
                                            />
                                            <div className="bg-primary/10 border border-l-0 border-border rounded-r-xl px-4 py-3 text-xs font-bold text-primary">
                                                .jetpos.shop
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-secondary font-medium italic">* Bu adresi değiştirmek mevcut QR kodlarını geçersiz kılabilir.</p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hakkımızda Yazısı</label>
                                            <textarea 
                                                value={qrSettings.about_text || ""}
                                                onChange={(e) => setQrSettings({...qrSettings, about_text: e.target.value})}
                                                placeholder="Restoranınız hakkında kısa bir bilgi..."
                                                className="w-full bg-primary/5 border border-border rounded-2xl px-5 py-4 text-xs font-bold outline-none focus:border-primary transition-all min-h-[120px] resize-none"
                                            />
                                        </div>

                                        <div className="flex items-center justify-between p-6 bg-primary/5 rounded-2xl border border-primary/10">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-primary/20 rounded-xl text-primary">
                                                    <Monitor className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h5 className="font-black text-sm uppercase text-foreground">Menü Aktiflik Durumu</h5>
                                                    <p className="text-xs text-secondary">Müşteri erişimini anında açın veya kapatın</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => setQrSettings({...qrSettings, is_active: !qrSettings.is_active})}
                                                className={`relative w-14 h-7 rounded-full transition-colors ${qrSettings.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`}
                                            >
                                                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all ${qrSettings.is_active ? 'left-8' : 'left-1'}`} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Product Selector Modal */}
            <AnimatePresence>
                {isAddingProduct && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                            onClick={() => setIsAddingProduct(false)}
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white w-full max-w-lg rounded-3xl shadow-2xl relative z-10 flex flex-col max-h-[80vh] overflow-hidden"
                        >
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Ürün Seç / Ekle</h3>
                                    <p className="text-xs text-slate-500 font-medium font-mono lowercase">Kategori: {categories.find(c => c.id === selectedCategoryId)?.name}</p>
                                </div>
                                <button onClick={() => setIsAddingProduct(false)} className="p-2 bg-slate-100 rounded-xl text-slate-400 hover:text-rose-500 transition-all">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="p-4 bg-slate-50 border-b border-slate-100">
                                <div className="flex gap-2 mb-4">
                                    <button 
                                        onClick={() => setIsCreatingNewProduct(false)}
                                        className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${!isCreatingNewProduct ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'}`}
                                    >
                                        MEVCUTTAN SEÇ
                                    </button>
                                    <button 
                                        onClick={() => setIsCreatingNewProduct(true)}
                                        className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${isCreatingNewProduct ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'}`}
                                    >
                                        YENİ OLUŞTUR
                                    </button>
                                </div>

                                {!isCreatingNewProduct ? (
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                        <input 
                                            type="text" 
                                            placeholder="Mevcut ürünlerde ara..."
                                            value={productSearch}
                                            onChange={(e) => setProductSearch(e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-xs font-bold outline-none focus:border-primary transition-all"
                                        />
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <input 
                                            type="text" 
                                            placeholder="Ürün Adı..."
                                            value={newProduct.name}
                                            onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-emerald-500 transition-all"
                                        />
                                        <div className="flex gap-3">
                                            <div className="flex-1 relative">
                                                <input 
                                                    type="number" 
                                                    placeholder="Fiyat..."
                                                    value={newProduct.sale_price || ""}
                                                    onChange={(e) => setNewProduct({...newProduct, sale_price: parseFloat(e.target.value)})}
                                                    className="w-full bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-3 text-xs font-bold outline-none focus:border-emerald-500 transition-all"
                                                />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₺</span>
                                            </div>
                                            <input 
                                                type="text" 
                                                placeholder="Görsel URL (Opsiyonel)"
                                                value={newProduct.image_url}
                                                onChange={(e) => setNewProduct({...newProduct, image_url: e.target.value})}
                                                className="flex-[2] bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-emerald-500 transition-all"
                                            />
                                        </div>
                                        <button 
                                            onClick={createNewProduct}
                                            disabled={loading || !newProduct.name}
                                            className="w-full py-4 bg-emerald-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-50"
                                        >
                                            {loading ? 'EKLENİYOR...' : 'ÜRÜNÜ SİSTEME VE MENÜYE EKLE'}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {!isCreatingNewProduct && (
                                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                    {products
                                        .filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))
                                        .slice(0, 50)
                                        .map(product => {
                                            const isAlreadyInCat = product.category_id === selectedCategoryId;
                                            return (
                                                <div 
                                                    key={product.id} 
                                                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${isAlreadyInCat ? 'bg-emerald-50 border-emerald-500/20' : 'bg-white border-slate-100 hover:border-primary/30'}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                                                            {product.image_url ? <img src={product.image_url} className="w-full h-full object-cover rounded-lg" /> : <ImageIcon className="w-5 h-5 text-slate-300" />}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[11px] font-black text-slate-800 uppercase truncate max-w-[200px]">{product.name}</span>
                                                            <span className="text-[9px] text-slate-400 font-bold">{product.sale_price} ₺</span>
                                                        </div>
                                                    </div>
                                                    <button 
                                                        onClick={() => selectedCategoryId && linkProductToCategory(product.id, isAlreadyInCat ? null : selectedCategoryId)}
                                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${isAlreadyInCat ? 'bg-emerald-500 text-white shadow-lg' : 'bg-primary/5 text-primary hover:bg-primary hover:text-white'}`}
                                                    >
                                                        {isAlreadyInCat ? 'EKLENDİ' : 'EKLE'}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                </div>
                            )}

                            <div className="p-4 border-t border-slate-100 bg-slate-50/30 text-center">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">JetPos QR Menu Infrastructure v1.0</p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
