"use client";

import { useState, useEffect } from "react";
import { TrendingDown, Plus, Trash2, Calendar, Tag, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

export default function Expenses() {
    const [expenses, setExpenses] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        title: "",
        amount: "",
        category: "Genel",
        expense_date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchExpenses();
    }, []);

    const fetchExpenses = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('expenses')
                .select('*')
                .order('expense_date', { ascending: false });

            if (error) throw error;
            setExpenses(data || []);
        } catch (error: any) {
            console.error("Giderler yüklenirken hata:", error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { error } = await supabase
                .from('expenses')
                .insert([{
                    title: formData.title,
                    amount: parseFloat(formData.amount),
                    category: formData.category,
                    expense_date: formData.expense_date
                }]);

            if (error) throw error;

            setIsModalOpen(false);
            setFormData({ title: "", amount: "", category: "Genel", expense_date: new Date().toISOString().split('T')[0] });
            fetchExpenses();
        } catch (error: any) {
            alert("Kaydedilirken hata oluştu: " + error.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Bu gider kaydını silmek istediğinize emin misiniz?")) return;

        try {
            const { error } = await supabase
                .from('expenses')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchExpenses();
        } catch (error: any) {
            alert("Silinirken hata oluştu: " + error.message);
        }
    };

    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center bg-card/20 p-6 rounded-2xl border border-border">
                <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500 shadow-inner">
                        <TrendingDown className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-rose-500 uppercase tracking-[3px]">Toplam Giderler</p>
                        <p className="text-2xl font-bold text-white tracking-tighter">₺{totalExpenses.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</p>
                    </div>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center space-x-3 bg-rose-500 hover:bg-rose-600 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-xl shadow-rose-500/20 active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    <span>Yeni Gider Ekle</span>
                </button>
            </div>

            <div className="glass-card overflow-hidden !p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 border-b border-border">
                            <tr>
                                <th className="px-8 py-5 text-[10px] font-bold text-secondary uppercase tracking-[2px]">Gider Başlığı</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-secondary uppercase tracking-[2px]">Kategori</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-secondary uppercase tracking-[2px]">Tarih</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-secondary uppercase tracking-[2px]">Tutar</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-secondary uppercase tracking-[2px] text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center text-secondary font-semibold italic">Yükleniyor...</td>
                                </tr>
                            ) : expenses.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center text-secondary font-semibold italic">Henüz gider kaydı bulunmuyor.</td>
                                </tr>
                            ) : expenses.map((expense) => (
                                <tr key={expense.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-8 py-5">
                                        <span className="font-semibold text-white group-hover:text-rose-400 transition-colors uppercase tracking-tight">{expense.title}</span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-secondary group-hover:border-secondary/30 transition-all">
                                            <Tag className="w-3 h-3 mr-2 opacity-50" />
                                            {expense.category}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-sm">
                                        <span className="text-secondary font-medium flex items-center">
                                            <Calendar className="w-4 h-4 mr-2 opacity-30" />
                                            {new Date(expense.expense_date).toLocaleDateString('tr-TR')}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="font-bold text-lg text-rose-500">₺{Number(expense.amount).toLocaleString('tr-TR', { minimumFractionDigits: 1 })}</span>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <button
                                            onClick={() => handleDelete(expense.id)}
                                            className="p-3 bg-white/5 hover:bg-rose-500 text-secondary hover:text-white rounded-xl transition-all active:scale-90"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* New Expense Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-lg glass-card !p-10 shadow-3xl border-white/10"
                        >
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h3 className="text-3xl font-bold tracking-tight uppercase">Yeni Gider</h3>
                                    <p className="text-secondary text-sm mt-1">Gider detaylarını aşağıdaki forma girin.</p>
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-3 hover:bg-white/10 rounded-2xl text-secondary transition-all"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSave} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-secondary uppercase tracking-[2px]">Gider Başlığı</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Örn: Kira, Fatura, Maaş..."
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-rose-500/50 transition-all font-semibold"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-secondary uppercase tracking-[2px]">Tutar (₺)</label>
                                        <input
                                            required
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-rose-500/50 transition-all font-semibold text-rose-500"
                                            value={formData.amount}
                                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-secondary uppercase tracking-[2px]">Kategori</label>
                                        <select
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-rose-500/50 transition-all font-semibold appearance-none"
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        >
                                            <option value="Genel">Genel</option>
                                            <option value="Kira">Kira</option>
                                            <option value="Fatura">Fatura</option>
                                            <option value="Maaş">Maaş</option>
                                            <option value="Mal Alımı">Mal Alımı</option>
                                            <option value="Vergi">Vergi</option>
                                            <option value="Diger">Diğer</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-secondary uppercase tracking-[2px]">Gider Tarihi</label>
                                    <input
                                        required
                                        type="date"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-rose-500/50 transition-all font-semibold"
                                        value={formData.expense_date}
                                        onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-rose-500 hover:bg-rose-600 text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-rose-500/20 transition-all active:scale-[0.98] mt-4"
                                >
                                    GİDERİ KAYDET
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
