"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Utensils, Users, ArrowLeft, Plus, Check, Search, Coffee, Save, X, Minus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import BottomNav from '@/components/BottomNav';

interface Table {
    id: string;
    name: string;
    section: string;
    status: 'empty' | 'occupied' | 'dirty' | 'reserved';
    capacity: number;
}

interface OrderItem {
    product_id: string;
    name: string;
    quantity: number;
    unit_price: number;
    notes?: string;
}

export default function AdisyonMobile() {
    const router = useRouter();
    const [tables, setTables] = useState<Table[]>([]);
    const [sections, setSections] = useState<string[]>(['Genel']);
    const [activeSection, setActiveSection] = useState('Genel');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Table Details
    const [selectedTable, setSelectedTable] = useState<Table | null>(null);
    const [tableOrders, setTableOrders] = useState<OrderItem[]>([]);
    const [editingNoteFor, setEditingNoteFor] = useState<string | null>(null);
    const [noteInput, setNoteInput] = useState("");
    
    // Products & Categories
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [showProductSelector, setShowProductSelector] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchTables = async () => {
        setLoading(true);
        const tenantId = localStorage.getItem('tenantId');
        if (!tenantId) return;

        try {
            const { data, error } = await supabase
                .from('restaurant_tables')
                .select('*')
                .eq('tenant_id', tenantId)
                .eq('is_active', true)
                .order('name');

            if (error) throw error;
            setTables(data || []);
            
            if (data && data.length > 0) {
                const uniqueSections = Array.from(new Set(data.map((t: any) => t.section)));
                if (uniqueSections.length > 0) {
                    setSections(uniqueSections as string[]);
                    setActiveSection((uniqueSections as string[])[0]);
                }
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        const tenantId = localStorage.getItem('tenantId');
        if (!tenantId) return;
        
        // Fetch Categories
        const { data: catData } = await supabase
            .from('categories')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('name');
        if (catData) setCategories(catData);

        // Fetch Products
        const { data } = await supabase
            .from('products')
            .select('id, name, sale_price, stock_quantity, category_id')
            .eq('tenant_id', tenantId)
            .order('name');
        if (data) setProducts(data);
    };

    const fetchTableOrders = async (tableId: string) => {
        const tenantId = localStorage.getItem('tenantId');
        const { data } = await supabase
            .from('table_orders')
            .select('*, products(name)')
            .eq('table_id', tableId)
            .eq('tenant_id', tenantId);
        
        if (data) {
            setTableOrders(data.map((item: any) => ({
                product_id: item.product_id,
                name: item.products?.name || 'Bilinmeyen Ürün',
                quantity: item.quantity,
                unit_price: item.unit_price,
                notes: item.notes || ''
            })));
        }
    };

    useEffect(() => {
        fetchTables();
        fetchProducts();
    }, []);

    useEffect(() => {
        if (selectedTable && selectedTable.status === 'occupied') {
            fetchTableOrders(selectedTable.id);
        } else if (selectedTable) {
            setTableOrders([]);
        }
    }, [selectedTable]);

    const addToOrder = (product: any) => {
        const existing = tableOrders.find(item => item.product_id === product.id);
        if (existing) {
            setTableOrders(tableOrders.map(item => 
                item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            ));
        } else {
            setTableOrders([
                { product_id: product.id, name: product.name, quantity: 1, unit_price: product.sale_price },
                ...tableOrders
            ]);
        }
        toast.success(`${product.name} eklendi`);
    };

    const updateNote = (productId: string) => {
        setTableOrders(tableOrders.map(item => 
            item.product_id === productId ? { ...item, notes: noteInput } : item
        ));
        setEditingNoteFor(null);
        setNoteInput("");
        toast.success("Not eklendi");
    };

    const updateQuantity = (productId: string, delta: number) => {
        setTableOrders(tableOrders.map(item => {
            if (item.product_id === productId) {
                const newQ = item.quantity + delta;
                return newQ > 0 ? { ...item, quantity: newQ } : item;
            }
            return item;
        }));
    };

    const removeItem = (productId: string) => {
        setTableOrders(tableOrders.filter(item => item.product_id !== productId));
    };

    const saveOrder = async () => {
        if (!selectedTable) return;
        setSaving(true);
        const tenantId = localStorage.getItem('tenantId');
        
        try {
            await supabase.from('table_orders').delete().eq('table_id', selectedTable.id).eq('tenant_id', tenantId);
            
            if (tableOrders.length > 0) {
                const payload = tableOrders.map(item => ({
                    table_id: selectedTable.id,
                    tenant_id: tenantId,
                    product_id: item.product_id,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    notes: item.notes || null
                }));
                const { error: insertError } = await supabase.from('table_orders').insert(payload);
                if (insertError) throw insertError;

                await supabase.from('restaurant_tables').update({ status: 'occupied', reservation_name: null }).eq('id', selectedTable.id);
            } else {
                await supabase.from('restaurant_tables').update({ status: 'empty' }).eq('id', selectedTable.id);
            }

            toast.success("Adisyon senkronize edildi!");
            setSelectedTable(null);
            setShowProductSelector(false);
            fetchTables();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    const filteredTables = tables.filter(t => t.section === activeSection);
    const filteredProducts = products.filter(p => {
        const matchesCategory = selectedCategoryId ? p.category_id === selectedCategoryId : true;
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });
    
    const orderTotal = tableOrders.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'empty': return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500';
            case 'occupied': return 'bg-rose-500/10 border-rose-500/30 text-rose-500';
            case 'reserved': return 'bg-amber-500/10 border-amber-500/30 text-amber-500';
            case 'dirty': return 'bg-slate-500/10 border-slate-500/30 text-slate-500';
            default: return 'bg-white/5 border-white/10 text-white';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'empty': return 'Boş';
            case 'occupied': return 'Dolu';
            case 'reserved': return 'Rezerve';
            case 'dirty': return 'Kirli';
            default: return status;
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] text-white pb-24">
            <header className="sticky top-0 z-40 bg-[#020617]/80 backdrop-blur-xl border-b border-white/10 px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition">
                        <ArrowLeft className="w-5 h-5 text-slate-300" />
                    </button>
                    <h1 className="text-xl font-black flex items-center gap-2">
                        <Utensils className="w-5 h-5 text-blue-400" /> Adisyon
                    </h1>
                </div>
            </header>

            <div className="px-4 py-4 overflow-x-auto whitespace-nowrap hide-scrollbar flex gap-2">
                {sections.map(section => (
                    <button
                        key={section}
                        onClick={() => setActiveSection(section)}
                        className={`px-5 py-2.5 rounded-full font-bold text-sm transition-all ${
                            activeSection === section 
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
                            : 'bg-white/5 text-slate-400 border border-white/5'
                        }`}
                    >
                        {section}
                    </button>
                ))}
            </div>

            <div className="px-4">
                {loading && !selectedTable ? (
                    <div className="flex justify-center py-20">
                        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : filteredTables.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {filteredTables.map((table) => (
                            <motion.button
                                key={table.id}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setSelectedTable(table)}
                                className={`flex flex-col items-center justify-center p-4 rounded-3xl border-2 transition-all h-32 ${getStatusColor(table.status)} relative overflow-hidden`}
                            >
                                <Utensils className={`w-8 h-8 mb-2 opacity-80 ${table.status === 'empty' ? 'text-emerald-400' : table.status === 'occupied' ? 'text-rose-400' : 'text-amber-400'}`} />
                                <h3 className="font-black text-lg">{table.name}</h3>
                                <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-full">
                                    <Users className="w-3 h-3" />
                                    <span className="text-[10px] font-bold">{table.capacity}</span>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-70">
                                    {getStatusLabel(table.status)}
                                </span>
                            </motion.button>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 tracking-widest uppercase font-black text-xs opacity-50">
                        Bu bölümde masa yok
                    </div>
                )}
            </div>

            {/* Table Details Modal */}
            <AnimatePresence>
                {selectedTable && !showProductSelector && (
                    <motion.div
                        initial={{ opacity: 0, y: '100%' }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: '100%' }}
                        className="fixed inset-0 z-[110] bg-[#020617] flex flex-col"
                    >
                        <header className="bg-slate-900 border-b border-white/10 px-4 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <button onClick={() => setSelectedTable(null)} className="p-2 bg-white/5 rounded-xl">
                                    <ArrowLeft className="w-5 h-5 text-white" />
                                </button>
                                <div>
                                    <h2 className="text-xl font-black">{selectedTable.name}</h2>
                                    <p className="text-xs text-slate-400 font-bold uppercase">{selectedTable.section}</p>
                                </div>
                            </div>
                            <div className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase ${getStatusColor(selectedTable.status)}`}>
                                {getStatusLabel(selectedTable.status)}
                            </div>
                        </header>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {tableOrders.map((item, index) => (
                                <div key={index} className="flex flex-col bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
                                    <div className="flex items-center justify-between p-4">
                                        <div className="flex-1">
                                            <p className="font-bold text-white">{item.name}</p>
                                            <p className="text-sm font-black text-blue-400">₺{(item.quantity * item.unit_price).toFixed(2)}</p>
                                            {item.notes && <p className="text-xs text-amber-400 mt-1 font-mono flex items-center gap-1"><Check className="w-3 h-3"/> Not: {item.notes}</p>}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => updateQuantity(item.product_id, -1)} className="p-2 bg-white/10 rounded-lg text-white">
                                                <Minus className="w-4 h-4" />
                                            </button>
                                            <span className="font-black text-lg w-6 text-center">{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.product_id, 1)} className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex border-t border-white/5">
                                        <button 
                                            onClick={() => {
                                                setEditingNoteFor(editingNoteFor === item.product_id ? null : item.product_id);
                                                setNoteInput(item.notes || "");
                                            }}
                                            className="flex-1 py-3 text-xs font-bold text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
                                        >
                                            {item.notes ? 'Notu Düzenle' : '+ Sipariş Notu Ekle'}
                                        </button>
                                        <button onClick={() => removeItem(item.product_id)} className="px-4 border-l border-white/5 text-rose-400 hover:bg-rose-500/10">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Note Input Area */}
                                    <AnimatePresence>
                                        {editingNoteFor === item.product_id && (
                                            <motion.div 
                                                initial={{ height: 0, opacity: 0 }} 
                                                animate={{ height: 'auto', opacity: 1 }} 
                                                exit={{ height: 0, opacity: 0 }}
                                                className="px-4 pb-4 overflow-hidden"
                                            >
                                                <div className="flex items-stretch gap-2 pt-2">
                                                    <input 
                                                        type="text" 
                                                        placeholder="Az pişmiş, buzsuz..." 
                                                        value={noteInput}
                                                        onChange={(e) => setNoteInput(e.target.value)}
                                                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                                        autoFocus
                                                    />
                                                    <button 
                                                        onClick={() => updateNote(item.product_id)}
                                                        className="px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs"
                                                    >
                                                        Ekle
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                            {tableOrders.length === 0 && (
                                <div className="text-center py-10 opacity-50">
                                    <Coffee className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm font-bold">Masada ürün yok.</p>
                                </div>
                            )}
                        </div>

                        <div className="bg-slate-900 border-t border-white/10 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">Toplam Tutar</span>
                                <span className="text-2xl font-black text-blue-400">₺{orderTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowProductSelector(true)}
                                    className="flex-[1] flex items-center justify-center gap-2 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black transition-all"
                                >
                                    <Plus className="w-5 h-5" />
                                    Ürün Ekle
                                </button>
                                <button
                                    onClick={saveOrder}
                                    disabled={saving}
                                    className="flex-[2] flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50"
                                >
                                    {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save className="w-5 h-5" /> Kaydet</>}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Product Selector Modal */}
            <AnimatePresence>
                {showProductSelector && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed inset-0 z-[120] bg-[#020617] flex flex-col"
                    >
                        <header className="bg-slate-900 border-b border-white/10 px-4 py-4 flex items-center gap-3">
                            <button onClick={() => setShowProductSelector(false)} className="p-2 bg-white/5 rounded-xl">
                                <X className="w-5 h-5 text-white" />
                            </button>
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="Ürün Ara..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                                    autoFocus
                                />
                            </div>
                        </header>

                        {/* Category Filter Horizontal Scroll */}
                        <div className="px-4 py-2 border-b border-white/5 overflow-x-auto whitespace-nowrap hide-scrollbar flex gap-2">
                            <button
                                onClick={() => setSelectedCategoryId(null)}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                                    selectedCategoryId === null 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                                }`}
                            >
                                Tümü
                            </button>
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategoryId(cat.id)}
                                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                                        selectedCategoryId === cat.id 
                                        ? 'bg-blue-600 text-white' 
                                        : 'bg-white/5 text-slate-400 hover:bg-white/10'
                                    }`}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] space-y-2">
                            {filteredProducts.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => addToOrder(p)}
                                    className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 active:scale-95 transition-all rounded-2xl border border-white/5"
                                >
                                    <div className="text-left">
                                        <p className="font-bold text-white">{p.name}</p>
                                        <p className="text-xs text-slate-400 font-mono mt-0.5">Stok: {p.stock_quantity}</p>
                                    </div>
                                    <span className="font-black text-blue-400">₺{p.sale_price}</span>
                                </button>
                            ))}
                            {filteredProducts.length === 0 && (
                                <div className="text-center py-10 opacity-50 text-sm font-bold">Ürün bulunamadı.</div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <BottomNav />
        </div>
    );
}
