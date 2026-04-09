"use client";

import { useState, useEffect } from "react";
import { 
    Tag, 
    Calendar, 
    Plus, 
    Trash2, 
    Edit, 
    CheckCircle, 
    XCircle,
    RefreshCw,
    Percent,
    Zap
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTenant } from "@/lib/tenant-context";
import { motion, AnimatePresence } from "framer-motion";

interface Campaign {
    id: string;
    name: string;
    description: string;
    start_date: string;
    end_date: string;
    campaign_type: string;
    discount_rate: number;
    point_multiplier: number;
    is_active: boolean;
    created_at: string;
}

export default function Campaigns({ showToast }: { showToast?: any }) {
    const { currentTenant } = useTenant();
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState<Partial<Campaign>>({
        name: "",
        description: "",
        campaign_type: "Discount",
        discount_rate: 0,
        point_multiplier: 1,
        is_active: true
    });

    const fetchCampaigns = async () => {
        if (!currentTenant) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('marketing_campaigns')
                .select('*')
                .eq('tenant_id', currentTenant.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.warn('Marketing campaigns fetch error:', error);
                setCampaigns([]);
                return;
            }
            setCampaigns(data || []);
        } catch (err: any) {
            console.error('Fetch campaigns error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCampaigns();

        if (currentTenant) {
            const channel = supabase
                .channel(`campaigns_realtime_${currentTenant.id}`)
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'marketing_campaigns',
                    filter: `tenant_id=eq.${currentTenant.id}`
                }, () => fetchCampaigns())
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [currentTenant]);

    const handleSave = async () => {
        if (!currentTenant || !formData.name) return;

        try {
            const { error } = await supabase
                .from('marketing_campaigns')
                .insert([{
                    ...formData,
                    tenant_id: currentTenant.id
                }]);

            if (error) throw error;
            showToast?.("Kampanya başarıyla oluşturuldu.", "success");
            setIsModalOpen(false);
            setFormData({
                name: "",
                description: "",
                campaign_type: "Discount",
                discount_rate: 0,
                point_multiplier: 1,
                is_active: true
            });
        } catch (err: any) {
            showToast?.(err.message, "error");
        }
    };

    const toggleActive = async (id: string, currentVal: boolean) => {
        await supabase
            .from('marketing_campaigns')
            .update({ is_active: !currentVal })
            .eq('id', id);
    };

    const deleteCampaign = async (id: string) => {
        if (!confirm("Bu kampanyayı silmek istediğinize emin misiniz?")) return;
        await supabase
            .from('marketing_campaigns')
            .delete()
            .eq('id', id);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Kampanya Yönetimi</h2>
                    <p className="text-secondary text-sm">Müşterilerinize özel teklifler ve sadakat programları oluşturun.</p>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-pink-600/20"
                >
                    <Plus className="w-5 h-5" />
                    Yeni Kampanya
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {campaigns.length > 0 ? (
                    campaigns.map((camp) => (
                        <motion.div 
                            key={camp.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-card p-5 group relative border-white/5 hover:border-pink-500/30 transition-all overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-3 flex gap-2">
                                <button 
                                    onClick={() => deleteCampaign(camp.id)}
                                    className="p-1.5 bg-white/5 hover:bg-rose-500/20 text-secondary hover:text-rose-400 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-2xl ${camp.is_active ? 'bg-pink-500/10 text-pink-400' : 'bg-white/5 text-slate-500'}`}>
                                    {camp.campaign_type === 'Discount' ? <Percent className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-bold text-white truncate">{camp.name}</h3>
                                    <p className="text-sm text-secondary line-clamp-2 mt-1">{camp.description}</p>
                                </div>
                            </div>

                            <div className="mt-6 flex flex-wrap gap-4 text-xs font-medium">
                                <div className="flex items-center gap-1.5 text-secondary">
                                    <Calendar className="w-4 h-4" />
                                    {camp.start_date ? new Date(camp.start_date).toLocaleDateString('tr-TR') : 'Süresiz'}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <button 
                                        onClick={() => toggleActive(camp.id, camp.is_active)}
                                        className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full transition-all ${camp.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-slate-500'}`}
                                    >
                                        {camp.is_active ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                                        {camp.is_active ? 'Aktif' : 'Pasif'}
                                    </button>
                                </div>
                            </div>

                            <div className="mt-5 pt-5 border-t border-white/5 flex items-center justify-between">
                                <div className="text-2xl font-black text-white">
                                    {camp.campaign_type === 'Discount' ? `%${camp.discount_rate}` : `${camp.point_multiplier}x Puan`}
                                </div>
                                <button className="text-xs font-bold text-pink-400 hover:text-pink-300 flex items-center gap-1">
                                    Düzenle <Edit className="w-3 h-3" />
                                </button>
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center space-y-4 glass-card border-dashed border-white/10">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                            <Tag className="w-8 h-8 text-slate-600" />
                        </div>
                        <div>
                            <p className="text-white font-bold text-lg">Henüz kampanya yok</p>
                            <p className="text-secondary text-sm">İlk kampanyanı oluşturarak satışlarını artırmaya başla.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Simple Modal Shim */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl"
                    >
                        <h3 className="text-xl font-bold text-white mb-4">Yeni Kampanya Ekle</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-secondary uppercase mb-1 block">Kampanya Adı</label>
                                <input 
                                    type="text" 
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-pink-500/50 outline-none transition-all"
                                    placeholder="Örn: Hafta Sonu İndirimi"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-secondary uppercase mb-1 block">Açıklama</label>
                                <textarea 
                                    value={formData.description}
                                    onChange={e => setFormData({...formData, description: e.target.value})}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-pink-500/50 outline-none transition-all h-20 resize-none"
                                    placeholder="Kampanya detayları..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-secondary uppercase mb-1 block">Tür</label>
                                    <select 
                                        value={formData.campaign_type}
                                        onChange={e => setFormData({...formData, campaign_type: e.target.value})}
                                        className="w-full bg-[#1e293b] border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none"
                                    >
                                        <option value="Discount">İndirim</option>
                                        <option value="PointMultiplier">Puan Çarpanı</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-secondary uppercase mb-1 block">
                                        {formData.campaign_type === 'Discount' ? 'İndirim Oranı (%)' : 'Puan Çarpanı'}
                                    </label>
                                    <input 
                                        type="number" 
                                        value={formData.campaign_type === 'Discount' ? formData.discount_rate : formData.point_multiplier}
                                        onChange={e => {
                                            const val = parseFloat(e.target.value);
                                            if (formData.campaign_type === 'Discount') setFormData({...formData, discount_rate: val});
                                            else setFormData({...formData, point_multiplier: val});
                                        }}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-pink-500/50 outline-none transition-all"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button 
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all"
                                >
                                    İptal
                                </button>
                                <button 
                                    onClick={handleSave}
                                    className="flex-1 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-bold transition-all"
                                >
                                    Oluştur
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
