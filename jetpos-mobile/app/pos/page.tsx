"use client";

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, ShoppingCart, Trash2, Plus, Minus,
    CreditCard, Banknote, Wallet, Building2,
    X, ChevronUp, ChevronDown, Package, CheckCircle
} from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { toast } from 'sonner';

interface Product {
    id: string;
    name: string;
    barcode: string;
    stock_quantity: number;
    sale_price: number;
    purchase_price: number;
    category_id?: string;
    image_url?: string;
}

interface CartItem extends Product {
    quantity: number;
}

interface Category {
    id: string;
    name: string;
}

const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    show: { y: 0, opacity: 1 }
};

export default function POSPage() {
    // Data State
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    // UI State
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [search, setSearch] = useState("");
    const [showCart, setShowCart] = useState(false);

    // Cart State
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCheckingOut, setIsCheckingOut] = useState(false);

    // Initial Fetch
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const tenantId = localStorage.getItem('tenantId');
            if (!tenantId) return;
            await supabase.rpc('set_current_tenant', { tenant_id: tenantId });

            const [prodRes, catRes] = await Promise.all([
                supabase.from('products').select('*').eq('status', 'active'),
                supabase.from('categories').select('*')
            ]);

            if (prodRes.data) setProducts(prodRes.data);
            if (catRes.data) setCategories(catRes.data);
        } catch (error) {
            console.error('POS Data Error:', error);
            toast.error('Veriler yüklenirken hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    // Filter Logic
    const filteredProducts = useMemo(() => {
        let result = products;

        if (selectedCategory !== "all") {
            result = result.filter(p => p.category_id === selectedCategory);
        }

        if (search) {
            const lower = search.toLowerCase();
            result = result.filter(p =>
                p.name.toLowerCase().includes(lower) ||
                p.barcode?.includes(lower)
            );
        }

        return result;
    }, [products, selectedCategory, search]);

    // Cart Actions
    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(p => p.id === product.id);
            if (existing) {
                return prev.map(p => p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p);
            }
            return [...prev, { ...product, quantity: 1 }];
        });
        toast.success(`${product.name} sepete eklendi`);
    };

    const updateQuantity = (id: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    // Calculations
    const totalAmount = cart.reduce((sum, item) => sum + (item.sale_price * item.quantity), 0);

    // Checkout Logic
    const handleCheckout = async (method: string) => {
        if (cart.length === 0) return;
        setIsCheckingOut(true);

        try {
            const tenantId = localStorage.getItem('tenantId');
            if (tenantId) await supabase.rpc('set_current_tenant', { tenant_id: tenantId });

            const totalCost = cart.reduce((sum, item) => sum + (item.purchase_price * item.quantity), 0);

            // 1. Create Sale
            const { data: sale, error: saleError } = await supabase
                .from('sales')
                .insert([{
                    total_amount: totalAmount,
                    total_profit: totalAmount - totalCost,
                    payment_method: method
                }])
                .select()
                .single();

            if (saleError) throw saleError;

            // 2. Create Sale Items
            const saleItems = cart.map(item => ({
                sale_id: sale.id,
                product_id: item.id,
                quantity: item.quantity,
                unit_price: item.sale_price
            }));

            const { error: itemsError } = await supabase.from('sale_items').insert(saleItems);
            if (itemsError) throw itemsError;

            // 3. Decrement Stock (Manual Update for Reliability)
            for (const item of cart) {
                const { data: currentProduct } = await supabase
                    .from('products')
                    .select('stock_quantity')
                    .eq('id', item.id)
                    .single();

                if (currentProduct) {
                    const newStock = currentProduct.stock_quantity - item.quantity;
                    await supabase
                        .from('products')
                        .update({
                            stock_quantity: newStock,
                            status: newStock <= 0 ? 'passive' : 'active'
                        })
                        .eq('id', item.id);
                }
            }

            toast.success(`Satış Başarılı! (${method})`);
            setCart([]);
            setShowCart(false);
            fetchData(); // Refresh stocks
        } catch (error: any) {
            console.error('Checkout Error:', error);
            toast.error('Satış işlemi başarısız: ' + error.message);
        } finally {
            setIsCheckingOut(false);
        }
    };

    return (
        <div className="relative min-h-screen bg-background pb-32 overflow-hidden">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[40%] bg-purple-500/10 rounded-full blur-[120px]" />
            </div>

            {/* Header */}
            <div className="sticky top-0 z-40 glass border-b border-white/5 p-4 space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                        <ShoppingCart className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-white leading-none">Hızlı Satış</h1>
                        <p className="text-[10px] text-secondary font-bold tracking-widest uppercase mt-1">Mobil POS Terminali</p>
                    </div>
                </div>

                {/* Search & Filter */}
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                            <Search className="w-4 h-4 text-secondary" />
                        </div>
                        <input
                            type="text"
                            placeholder="Ürün ara..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all placeholder:text-secondary/50"
                        />
                    </div>
                </div>

                {/* Categories */}
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    <button
                        onClick={() => setSelectedCategory("all")}
                        className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${selectedCategory === "all" ? 'bg-blue-500 text-white border-blue-500' : 'bg-white/5 text-secondary border-white/10'}`}
                    >
                        TÜMÜ
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${selectedCategory === cat.id ? 'bg-blue-500 text-white border-blue-500' : 'bg-white/5 text-secondary border-white/10'}`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Product Grid */}
            <div className="p-4">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                    </div>
                ) : (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                        className="grid grid-cols-2 gap-3"
                    >
                        {filteredProducts.map(product => (
                            <motion.button
                                key={product.id}
                                variants={itemVariants}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => addToCart(product)}
                                className="relative group text-left h-48 flex flex-col justify-between glass-dark border border-white/5 rounded-2xl p-3 overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />

                                {product.image_url ? (
                                    <img src={product.image_url} alt={product.name} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity" />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center opacity-10">
                                        <Package className="w-20 h-20 text-white" />
                                    </div>
                                )}

                                <div className="relative z-20 flex-1">
                                    <div className="bg-black/30 backdrop-blur-md self-start inline-block px-2 py-1 rounded-lg border border-white/10">
                                        <p className="text-[10px] font-mono text-secondary">{product.stock_quantity} Adet</p>
                                    </div>
                                </div>

                                <div className="relative z-20 space-y-1">
                                    <h3 className="text-sm font-bold text-white leading-tight line-clamp-2">{product.name}</h3>
                                    <p className="text-lg font-black text-blue-400">₺{product.sale_price.toFixed(2)}</p>
                                </div>

                                <div className="absolute top-2 right-2 z-20 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                                    <Plus className="w-5 h-5 text-white" />
                                </div>
                            </motion.button>
                        ))}
                    </motion.div>
                )}
            </div>

            {/* Floating Cart Indicator */}
            <AnimatePresence>
                {cart.length > 0 && !showCart && (
                    <motion.div
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        exit={{ y: 100 }}
                        className="fixed bottom-24 left-4 right-4 z-40"
                    >
                        <button
                            onClick={() => setShowCart(true)}
                            className="w-full bg-blue-600 glass border border-white/20 rounded-2xl p-4 shadow-2xl flex items-center justify-between group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                    <span className="font-black text-white">{cart.reduce((a, b) => a + b.quantity, 0)}</span>
                                </div>
                                <div className="text-left">
                                    <p className="text-[10px] font-bold text-blue-200 uppercase tracking-wider">Sepet Toplamı</p>
                                    <p className="text-xl font-black text-white">₺{totalAmount.toFixed(2)}</p>
                                </div>
                            </div>
                            <ChevronUp className="w-6 h-6 text-white group-hover:-translate-y-1 transition-transform" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Cart Modal / Sheet */}
            <AnimatePresence>
                {showCart && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowCart(false)}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
                        />
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="fixed bottom-0 left-0 right-0 h-[92vh] bg-[#0f172a] rounded-t-[2.5rem] z-50 overflow-hidden flex flex-col border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
                        >
                            {/* Drag Handle */}
                            <div className="w-full h-8 flex items-center justify-center flex-shrink-0" onClick={() => setShowCart(false)}>
                                <div className="w-12 h-1.5 rounded-full bg-white/20" />
                            </div>

                            {/* Cart Header */}
                            <div className="px-6 pb-4 border-b border-white/5 flex items-center justify-between flex-shrink-0">
                                <h2 className="text-2xl font-black text-white">Sepetim</h2>
                                <button
                                    onClick={() => setCart([])}
                                    className="px-4 py-2 bg-red-500/10 text-red-400 rounded-xl text-xs font-bold border border-red-500/20 hover:bg-red-500/20"
                                >
                                    Temizle
                                </button>
                            </div>

                            {/* Cart Items */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {cart.map(item => (
                                    <div key={item.id} className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                                        <div className="w-16 h-16 rounded-xl bg-black/40 overflow-hidden flex-shrink-0">
                                            {item.image_url ? (
                                                <img src={item.image_url} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="flex items-center justify-center h-full">
                                                    <Package className="text-secondary w-6 h-6" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-white text-sm truncate">{item.name}</h3>
                                            <p className="text-[10px] text-secondary font-mono">Birim: ₺{item.sale_price.toFixed(2)}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <div className="font-black text-white">₺{(item.sale_price * item.quantity).toFixed(2)}</div>
                                            <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1">
                                                <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:text-white text-secondary transition-colors">
                                                    {item.quantity === 1 ? <Trash2 size={14} className="text-red-400" /> : <Minus size={14} />}
                                                </button>
                                                <span className="text-xs font-bold text-white w-4 text-center">{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:text-white text-secondary transition-colors">
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Totals & Checkout */}
                            <div className="p-6 bg-black/40 border-t border-white/10 space-y-4 flex-shrink-0 pb-12">
                                <div className="flex items-center justify-between">
                                    <span className="text-secondary font-bold">Toplam Tutar</span>
                                    <span className="text-3xl font-black text-white">₺{totalAmount.toFixed(2)}</span>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    {/* NAKİT */}
                                    <button
                                        onClick={() => handleCheckout("NAKİT")}
                                        disabled={isCheckingOut}
                                        className="py-4 bg-emerald-600 hover:bg-emerald-500 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-lg shadow-emerald-600/20"
                                    >
                                        <Banknote className="w-6 h-6 text-white" />
                                        <span className="text-xs font-black text-white uppercase tracking-wider">NAKİT</span>
                                    </button>

                                    {/* KART */}
                                    <button
                                        onClick={() => handleCheckout("KART")}
                                        disabled={isCheckingOut}
                                        className="py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-lg shadow-blue-600/20"
                                    >
                                        <CreditCard className="w-6 h-6 text-white" />
                                        <span className="text-xs font-black text-white uppercase tracking-wider">KART</span>
                                    </button>

                                    {/* VERESİYE */}
                                    <button
                                        onClick={() => handleCheckout("VERESİYE")}
                                        disabled={isCheckingOut}
                                        className="py-4 bg-amber-600 hover:bg-amber-500 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-lg shadow-amber-600/20"
                                    >
                                        <Wallet className="w-6 h-6 text-white" />
                                        <span className="text-xs font-black text-white uppercase tracking-wider">VERESİYE</span>
                                    </button>

                                    {/* HAVALE/EFT */}
                                    <button
                                        onClick={() => handleCheckout("HAVALE/EFT")}
                                        disabled={isCheckingOut}
                                        className="py-4 bg-purple-600 hover:bg-purple-500 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-lg shadow-purple-600/20"
                                    >
                                        <Building2 className="w-6 h-6 text-white" />
                                        <span className="text-xs font-black text-white uppercase tracking-wider">HAVALE</span>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <BottomNav />
        </div>
    );
}
