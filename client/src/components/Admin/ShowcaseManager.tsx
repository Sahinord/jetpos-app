"use client";

import { useState, useEffect } from "react";
import {
    Monitor, Palette, Utensils, LinkIcon, Edit3, Save, Globe, RefreshCw,
    Upload, Plus, Trash2, Phone, Search, CheckCircle2, ArrowLeft, Menu
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useTenant } from "@/lib/tenant-context";

interface ShowcaseManagerProps {
    products: any[];
    categories: any[];
    showToast: (message: string, type?: any) => void;
    onRefresh: () => void;
}

export default function ShowcaseManager({ products, categories, showToast, onRefresh }: ShowcaseManagerProps) {
    const { currentTenant } = useTenant();
    const [activeTab, setActiveTab] = useState<"hero" | "navbar" | "content" | "about" | "design">("hero");
    const [loading, setLoading] = useState(false);
    const [previewDevice, setPreviewDevice] = useState<"mobile" | "desktop">("mobile");
    const [previewPage, setPreviewPage] = useState<"home" | "about">("home");
    const [productSearch, setProductSearch] = useState("");

    const [settings, setSettings] = useState<any>({
        slug: "",
        is_showcase_active: true,
        showcase_hero_title: "",
        showcase_hero_subtitle: "",
        showcase_hero_image_url: "",
        showcase_navbar_links: [
            { label: "Anasayfa", href: "#home" },
            { label: "Ürünler", href: "#products" },
            { label: "Hakkımızda", href: "#about" }
        ],
        showcase_footer_text: "",
        showcase_primary_font: "Inter",
        primary_color: "#ef4444",
        secondary_color: "#0f172a",
        marquee_text: "Premium Vitrin Deneyimi — Hemen Keşfedin — ",
        marquee_speed: 25,
        showcase_use_automatic_products: true,
        showcase_selected_product_ids: [],
        showcase_about_title: "Biz Kimiz?",
        showcase_about_content: "Şirketimiz hakkında kısa bir bilgi buraya gelecek...",
        showcase_about_image_url: ""
    });

    useEffect(() => {
        if (currentTenant) fetchSettings();
    }, [currentTenant]);

    const fetchSettings = async () => {
        const { data } = await supabase.from('qr_menu_settings').select('*').eq('tenant_id', currentTenant?.id).single();
        if (data) setSettings({ ...settings, ...data, showcase_navbar_links: data.showcase_navbar_links || settings.showcase_navbar_links, showcase_selected_product_ids: data.showcase_selected_product_ids || [] });
    };

    const handleSave = async () => {
        setLoading(true);
        const { error } = await supabase.from('qr_menu_settings').upsert({ tenant_id: currentTenant?.id, ...settings, updated_at: new Date().toISOString() });
        setLoading(false);
        if (!error) { showToast("Ayarlar kaydedildi", "success"); onRefresh(); }
    };

    const handleImageUpload = async (e: any) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLoading(true);
        const fileName = `${currentTenant?.id}/showcase-${Date.now()}.${file.name.split('.').pop()}`;
        const { error } = await supabase.storage.from('qr-content').upload(fileName, file);
        if (!error) {
            const { data: { publicUrl } } = supabase.storage.from('qr-content').getPublicUrl(fileName);
            setSettings({ ...settings, [activeTab === 'hero' ? 'showcase_hero_image_url' : 'showcase_about_image_url']: publicUrl });
        }
        setLoading(false);
    };

    const updateNavbarLink = (idx: number, field: string, val: string) => {
        const newLinks = [...settings.showcase_navbar_links];
        newLinks[idx] = { ...newLinks[idx], [field]: val };
        setSettings({ ...settings, showcase_navbar_links: newLinks });
    };

    const toggleProductSelection = (id: string) => {
        const current = settings.showcase_selected_product_ids || [];
        setSettings({ ...settings, showcase_selected_product_ids: current.includes(id) ? current.filter((i: string) => i !== id) : [...current, id] });
    };

    const showcaseUrl = `${window.location.origin}/v/${settings.slug || currentTenant?.id}`;

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] overflow-y-auto pr-2 scrollbar-thin pt-2">
            <div className="flex flex-col gap-10">
                {/* Upper Management Area */}
                <div className="space-y-8">
                    <div className="flex items-center gap-3 bg-white/5 p-1.5 rounded-2xl border border-white/5 sticky top-0 z-[100] backdrop-blur-3xl">
                        <div className="flex-1 flex gap-1">
                            {[
                                { id: "hero", label: "Hero", icon: Monitor },
                                { id: "navbar", label: "Linkler", icon: LinkIcon },
                                { id: "content", label: "Ürünler", icon: Utensils },
                                { id: "about", label: "Biz Kimiz", icon: Edit3 },
                                { id: "design", label: "Tema", icon: Palette },
                            ].map((t) => (
                                <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${activeTab === t.id ? 'bg-primary text-white shadow-xl' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}><t.icon size={12} />{t.label}</button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2 pr-2">
                            <button onClick={() => window.open(showcaseUrl, '_blank')} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-white transition-all"><Globe size={18} /></button>
                            <button onClick={handleSave} disabled={loading} className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-xl font-black text-[10px] flex items-center gap-2 disabled:opacity-50 transition-all">{loading ? <RefreshCw className="animate-spin" size={14} /> : <Save size={14} />} KAYDET</button>
                        </div>
                    </div>

                    <div className="max-w-4xl">
                        <AnimatePresence mode="wait">
                            {activeTab === "hero" && (
                                <motion.div key="hero" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                                    <div className="p-8 bg-card/60 rounded-[32px] border border-border space-y-6 shadow-2xl">
                                        <h3 className="font-black text-white text-lg">Giriş Bölümü (Hero)</h3>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2"><label className="text-[10px] font-black uppercase text-secondary">Başlık</label><input type="text" value={settings.showcase_hero_title} onChange={e => setSettings({ ...settings, showcase_hero_title: e.target.value })} className="w-full bg-slate-900 border border-white/5 rounded-xl p-4 text-white font-bold" /></div>
                                            <div className="space-y-2"><label className="text-[10px] font-black uppercase text-secondary">Slug</label><input type="text" value={settings.slug} onChange={e => setSettings({ ...settings, slug: e.target.value })} className="w-full bg-slate-900 border border-white/5 rounded-xl p-4 text-white font-bold" /></div>
                                        </div>
                                        <div className="space-y-2"><label className="text-[10px] font-black uppercase text-secondary">Açıklama</label><textarea value={settings.showcase_hero_subtitle} onChange={e => setSettings({ ...settings, showcase_hero_subtitle: e.target.value })} rows={3} className="w-full bg-slate-900 border border-white/5 rounded-xl p-4 text-white font-bold" /></div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-secondary">Hero Görseli</label>
                                            <input type="file" onChange={handleImageUpload} className="w-full bg-slate-900 border border-white/5 rounded-xl p-4 text-white font-bold" />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === "navbar" && (
                                <motion.div key="navbar" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-2 gap-6">
                                    {settings.showcase_navbar_links.map((link: any, idx: number) => (
                                        <div key={idx} className="p-6 bg-card/60 rounded-[32px] border border-border space-y-4">
                                            <div className="flex items-center justify-between"><h4 className="text-[10px] font-black uppercase text-secondary">Link {idx + 1}</h4><button onClick={() => setSettings({ ...settings, showcase_navbar_links: settings.showcase_navbar_links.filter((_: any, i: number) => i !== idx) })} className="text-red-500 hover:text-red-400"><Trash2 size={16} /></button></div>
                                            <input type="text" value={link.label} onChange={e => updateNavbarLink(idx, "label", e.target.value)} placeholder="Label" className="w-full bg-slate-900 border border-white/5 rounded-xl p-3 text-white font-bold" />
                                            <input type="text" value={link.href} onChange={e => updateNavbarLink(idx, "href", e.target.value)} placeholder="Href" className="w-full bg-white/5 border border-white/5 rounded-xl p-3 text-white font-mono text-xs" />
                                        </div>
                                    ))}
                                    <button onClick={() => setSettings({ ...settings, showcase_navbar_links: [...settings.showcase_navbar_links, { label: 'Yeni', href: '#' }] })} className="p-8 border border-dashed border-white/10 rounded-[32px] text-slate-500 font-black flex items-center justify-center gap-3 hover:text-white transition-all"><Plus /> LİNK EKLE</button>
                                </motion.div>
                            )}

                            {activeTab === "content" && (
                                <motion.div key="content" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-8 bg-card/60 rounded-[32px] border border-border space-y-8">
                                    <div className="flex items-center justify-between"><h3 className="font-black text-white text-lg">Ürün Kataloğu</h3><div className="flex bg-slate-900 p-1 rounded-xl"><button onClick={() => setSettings({ ...settings, showcase_use_automatic_products: true })} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase ${settings.showcase_use_automatic_products ? 'bg-primary text-white' : 'text-slate-500'}`}>OTO</button><button onClick={() => setSettings({ ...settings, showcase_use_automatic_products: false })} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase ${!settings.showcase_use_automatic_products ? 'bg-primary text-white' : 'text-slate-500'}`}>MANUEL</button></div></div>
                                    {!settings.showcase_use_automatic_products && (
                                        <div className="space-y-6">
                                            <div className="relative"><Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={18} /><input type="text" placeholder="Ürün ara..." value={productSearch} onChange={e => setProductSearch(e.target.value)} className="w-full bg-slate-900 border border-white/5 rounded-2xl pl-16 pr-8 py-5 text-white font-bold" /></div>
                                            <div className="grid grid-cols-3 gap-4 max-h-[300px] overflow-y-auto pr-2">
                                                {products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase())).map(prod => (
                                                    <div key={prod.id} onClick={() => toggleProductSelection(prod.id)} className={`p-4 rounded-2xl border cursor-pointer flex items-center justify-between ${settings.showcase_selected_product_ids?.includes(prod.id) ? 'bg-primary/10 border-primary' : 'bg-slate-900 border-white/5 opacity-60'}`}><span className="text-white text-[10px] font-black uppercase truncate">{prod.name}</span>{settings.showcase_selected_product_ids?.includes(prod.id) && <CheckCircle2 size={16} className="text-primary" />}</div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {activeTab === "about" && (
                                <motion.div key="about" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-8 bg-card/60 rounded-[32px] border border-border space-y-8">
                                    <h3 className="font-black text-white text-lg">Biz Kimiz Sayfası</h3>
                                    <div className="space-y-6">
                                        <div className="space-y-2"><label className="text-[10px] font-black uppercase text-secondary">Sayfa Başlığı</label><input type="text" value={settings.showcase_about_title} onChange={e => setSettings({ ...settings, showcase_about_title: e.target.value })} className="w-full bg-slate-900 border border-white/5 rounded-xl p-4 text-white font-bold" /></div>
                                        <div className="space-y-2"><label className="text-[10px] font-black uppercase text-secondary">İçerik Metni</label><textarea value={settings.showcase_about_content} onChange={e => setSettings({ ...settings, showcase_about_content: e.target.value })} rows={12} className="w-full bg-slate-900 border border-white/5 rounded-xl p-4 text-white font-bold text-sm leading-relaxed" /></div>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === "design" && (
                                <motion.div key="design" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-8 bg-card/60 rounded-[32px] border border-border space-y-8">
                                    <h3 className="font-black text-white text-lg">Tema ve Renkler</h3>
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-3"><label className="text-[10px] font-black uppercase text-secondary">Vurgu Rengi</label><div className="flex gap-4 p-4 bg-slate-900 rounded-2xl border border-white/5 items-center"><input type="color" value={settings.primary_color} onChange={e => setSettings({ ...settings, primary_color: e.target.value })} className="w-12 h-12 bg-transparent" /><input type="text" value={settings.primary_color} readOnly className="bg-transparent text-white font-mono uppercase text-sm" /></div></div>
                                        <div className="space-y-3"><label className="text-[10px] font-black uppercase text-secondary">Arka Plan</label><div className="flex gap-4 p-4 bg-slate-900 rounded-2xl border border-white/5 items-center"><input type="color" value={settings.secondary_color} onChange={e => setSettings({ ...settings, secondary_color: e.target.value })} className="w-12 h-12 bg-transparent" /><input type="text" value={settings.secondary_color} readOnly className="bg-transparent text-white font-mono uppercase text-sm" /></div></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-3"><label className="text-[10px] font-black uppercase text-secondary">Kayan Yazı Metni</label><input type="text" value={settings.marquee_text} onChange={e => setSettings({ ...settings, marquee_text: e.target.value })} className="w-full bg-slate-900 border border-white/5 rounded-xl p-4 text-white font-bold" /></div>
                                        <div className="space-y-3"><label className="text-[10px] font-black uppercase text-secondary">Akış Hızı ({settings.marquee_speed}s)</label><input type="range" min="5" max="60" step="5" value={settings.marquee_speed} onChange={e => setSettings({ ...settings, marquee_speed: parseInt(e.target.value) })} className="w-full h-2 bg-slate-800 rounded-lg accent-primary mt-4 cursor-pointer" /></div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Lower Preview Area */}
                <div className="space-y-8 pt-8 border-t border-white/5">
                    <div className="flex items-center justify-between px-2">
                        <div className="space-y-1">
                            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Canlı Ön İzleme</h3>
                            <p className="text-slate-500 text-xs font-medium">Değişiklikleri anında buradan takip edebilirsin.</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex bg-white/5 p-1 rounded-2xl">
                                <button onClick={() => setPreviewPage('home')} className={`px-6 py-3 rounded-[14px] text-[10px] font-black uppercase transition-all ${previewPage === 'home' ? 'bg-primary text-white shadow-xl' : 'text-slate-500 hover:text-white'}`}>ANA SAYFA</button>
                                <button onClick={() => setPreviewPage('about')} className={`px-6 py-3 rounded-[14px] text-[10px] font-black uppercase transition-all ${previewPage === 'about' ? 'bg-primary text-white shadow-xl' : 'text-slate-500 hover:text-white'}`}>HAKKIMIZDA</button>
                            </div>
                            <div className="flex bg-white/5 p-1 rounded-2xl">
                                <button onClick={() => setPreviewDevice('mobile')} className={`p-3 rounded-[14px] transition-all ${previewDevice === 'mobile' ? 'bg-primary text-white shadow-xl' : 'text-slate-500'}`}><Phone size={18} /></button>
                                <button onClick={() => setPreviewDevice('desktop')} className={`p-3 rounded-[14px] transition-all ${previewDevice === 'desktop' ? 'bg-primary text-white shadow-xl' : 'text-slate-500'}`}><Monitor size={18} /></button>
                            </div>
                        </div>
                    </div>

                    <div className={`relative shadow-2xl transition-all duration-700 mx-auto overflow-hidden flex flex-col ${previewDevice === 'mobile' ? 'max-w-[380px] aspect-[9/19] rounded-[60px] border-[16px] border-slate-900' : 'w-full rounded-[40px] border-[12px] border-slate-900 overflow-hidden'}`} style={{ backgroundColor: settings.secondary_color, ['--marquee-duration' as any]: `${settings.marquee_speed || 25}s` }}>
                        <div className="flex-1 overflow-y-auto scrollbar-none">
                            {/* Preview Navbar */}
                            <div className="px-10 py-6 flex items-center justify-between sticky top-0 z-[60] backdrop-blur-xl border-b border-white/5" style={{ backgroundColor: `${settings.secondary_color}ee` }}>
                                <div className="flex items-center gap-3"><div className="w-10 h-10 bg-white flex items-center justify-center rounded-xl" style={{ backgroundColor: settings.primary_color }}><Utensils size={18} className="text-white" /></div>{previewDevice === 'desktop' && <span className="text-lg font-black text-white uppercase tracking-tighter">{currentTenant?.company_name}</span>}</div>
                                <Menu size={20} className="text-white/40" />
                            </div>

                            {previewPage === 'home' ? (
                                <div className="space-y-0">
                                    <div className={`relative flex flex-col items-center justify-center p-20 text-center ${previewDevice === 'desktop' ? 'min-h-[400px]' : 'min-h-[450px]'}`}>
                                        {settings.showcase_hero_image_url && <img src={settings.showcase_hero_image_url} className="absolute inset-0 w-full h-full object-cover opacity-20" />}
                                        <div className="relative z-10 w-full space-y-6">
                                            <h2 className={`font-black uppercase tracking-tighter text-white ${previewDevice === 'desktop' ? 'text-7xl' : 'text-4xl'}`}>{settings.showcase_hero_title || currentTenant?.company_name}</h2>
                                            <div className="px-12 py-4 rounded-full text-[11px] font-black text-white inline-block shadow-2xl" style={{ backgroundColor: settings.primary_color }}>KEŞFEDİN</div>
                                        </div>
                                    </div>
                                    <div className="py-6 overflow-hidden border-y border-white/5 bg-white/5"><div className="animate-preview-marquee flex gap-12">{Array.from({ length: 6 }).map((_, i) => (<span key={i} className="font-black text-white/20 text-4xl whitespace-nowrap uppercase tracking-tighter">{settings.marquee_text} —</span>))}</div></div>
                                    <div className={`p-10 grid gap-10 ${previewDevice === 'desktop' ? 'grid-cols-4' : 'grid-cols-2'}`}>
                                        {(settings.showcase_use_automatic_products ? products.slice(0, 8) : products.filter(p => settings.showcase_selected_product_ids?.includes(p.id))).map(prod => (
                                            <div key={prod.id} className="space-y-4">
                                                <div className="bg-white/5 rounded-[40px] border border-white/5 overflow-hidden aspect-square flex items-center justify-center shadow-xl">{prod.image_url ? <img src={prod.image_url} className="w-full h-full object-cover opacity-60" /> : <Utensils size={32} className="text-white/5" />}</div>
                                                <div className="text-center"><p className="text-[10px] font-black uppercase text-white truncate px-2">{prod.name}</p><p className="text-[9px] font-bold text-primary" style={{ color: settings.primary_color }}>{prod.sale_price} ₺</p></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="p-20 space-y-12">
                                    <div className="space-y-6">
                                        <div className="w-20 h-1 rounded-full" style={{ backgroundColor: settings.primary_color }} />
                                        <h1 className="text-7xl font-black text-white uppercase tracking-tighter leading-none">{settings.showcase_about_title || "BİZ KİMİZ?"}</h1>
                                    </div>
                                    <p className="text-slate-400 text-lg leading-relaxed whitespace-pre-wrap font-medium">{settings.showcase_about_content || "..."}</p>
                                    <div className="aspect-[16/9] bg-white/5 rounded-[60px] border border-white/5 flex items-center justify-center opacity-10"><Utensils size={150} /></div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <style jsx global>{`@keyframes preview-marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }.animate-preview-marquee { display: flex; animation: preview-marquee var(--marquee-duration, 20s) linear infinite; width: max-content; }`}</style>
        </div>
    );
}
