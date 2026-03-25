"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
    LayoutDashboard,
    Plus,
    Users,
    Clock,
    ChevronRight,
    Utensils,
    Trash2,
    Save,
    CreditCard,
    Banknote,
    Coffee,
    Pizza,
    GlassWater,
    Search,
    X,
    Grid3X3,
    ArrowRight,
    Edit2,
    Gift,
    ArrowRightLeft,
    CheckSquare,
    Square,
    SplitSquareHorizontal,
    Eraser,
    CalendarClock,
    UserCheck,
    AlertTriangle,
    ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useTenant } from "@/lib/tenant-context";

interface Table {
    id: string;
    name: string;
    section: string;
    status: 'empty' | 'occupied' | 'dirty' | 'reserved';
    capacity: number;
    current_total?: number;
    reservation_name?: string;
    reservation_time?: string;
}

interface OrderItem {
    id?: string;
    product_id: string;
    name: string;
    quantity: number;
    unit_price: number;
}

export default function Adisyon({ products = [], categories = [], onCheckout, showToast, isAdisyonStoreSpecificEnabled = true, isAdisyonAutoOpenReservationEnabled = true }: any) {
    const { currentTenant, activeWarehouse } = useTenant();
    const [tables, setTables] = useState<Table[]>([]);
    const [selectedTable, setSelectedTable] = useState<Table | null>(null);
    const [tableOrders, setTableOrders] = useState<OrderItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [visibleCount, setVisibleCount] = useState(40); // Performans için sınırlı başlat
    const [sections, setSections] = useState<string[]>(["Genel"]);
    const [activeSection, setActiveSection] = useState("Genel");
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isSettling, setIsSettling] = useState(false);
    const [editingTable, setEditingTable] = useState<any>(null);
    const [newTableName, setNewTableName] = useState("");
    const [newTableSection, setNewTableSection] = useState("Genel");
    const [newTableCapacity, setNewTableCapacity] = useState(4);

    // Yeni Eklenen Gelişmiş Restaurant Özellikleri
    const [isSplitMode, setIsSplitMode] = useState(false);
    const [selectedItemsForPayment, setSelectedItemsForPayment] = useState<number[]>([]);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [transferTargetId, setTransferTargetId] = useState("");

    // Custom Popups & Rezervasyon
    const [confirmState, setConfirmState] = useState({ isOpen: false, title: "", message: "", onConfirm: () => { } });
    const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);
    const [reserveName, setReserveName] = useState("");
    const [reserveTime, setReserveTime] = useState("");
    const [reserveTableId, setReserveTableId] = useState("");

    // Canlı geri sayım ve otomatik rezervasyon açma kontrolü
    const [currentTime, setCurrentTime] = useState(new Date());
    const tablesRef = useRef(tables);
    const autoOpenRef = useRef(isAdisyonAutoOpenReservationEnabled);

    useEffect(() => {
        tablesRef.current = tables;
    }, [tables]);

    useEffect(() => {
        autoOpenRef.current = isAdisyonAutoOpenReservationEnabled;
    }, [isAdisyonAutoOpenReservationEnabled]);

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            setCurrentTime(now);

            tablesRef.current.forEach(async (table) => {
                if (autoOpenRef.current && table.status === 'reserved' && table.reservation_time) {
                    const diff = new Date(table.reservation_time).getTime() - now.getTime();
                    // Süre sıfırlandıysa veya en fazla 1 dakika geçtiyse otomatiğe bağla
                    if (diff <= 0 && diff > -60000) {
                        try {
                            const { error } = await supabase.from('restaurant_tables')
                                .update({ status: 'occupied', reservation_name: null, reservation_time: null })
                                .eq('id', table.id);

                            if (!error) {
                                showToast(`🔔 ${table.reservation_name} müşterisi geldi! Masa (${table.name}) otomatik olarak 'Dolu' yapıldı.`, "success");
                                fetchTables();
                            }
                        } catch (error) { }
                    }
                }
            });
        }, 30000); // 30 saniyede bir kontrol et (daha seri açsın)
        return () => clearInterval(timer);
    }, []);

    const getLocalDateTimeString = () => {
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000;
        return (new Date(now.getTime() - offset)).toISOString().slice(0, 16);
    };

    useEffect(() => {
        if (currentTenant) {
            fetchTables();
            setSelectedTable(null); // Şube değişince seçili masayı temizle
            setIsSplitMode(false);
            setSelectedItemsForPayment([]);

            // TABLE REALTIME: Tüm masaların durumunu canlı takip et
            const tablesChannel = supabase
                .channel(`adisyon_tables_${currentTenant.id}`)
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'restaurant_tables',
                    filter: `tenant_id=eq.${currentTenant.id}`
                }, () => {
                    fetchTables();
                })
                .subscribe();

            return () => {
                supabase.removeChannel(tablesChannel);
            };
        }
    }, [currentTenant, activeWarehouse]);

    // ORDER REALTIME: Seçili masanın siparişlerini canlı takip et
    useEffect(() => {
        if (currentTenant && selectedTable) {
            const ordersChannel = supabase
                .channel(`adisyon_orders_${selectedTable.id}`)
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'table_orders',
                    filter: `table_id=eq.${selectedTable.id}`
                }, () => {
                    fetchTableOrder(selectedTable.id);
                })
                .subscribe();

            return () => {
                supabase.removeChannel(ordersChannel);
            };
        }
    }, [selectedTable?.id, currentTenant?.id]);

    const fetchTables = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('restaurant_tables')
                .select('*')
                .eq('tenant_id', currentTenant?.id)
                .eq('is_active', true);

            if (activeWarehouse?.id && isAdisyonStoreSpecificEnabled) {
                query = query.eq('warehouse_id', activeWarehouse.id);
            }

            const { data, error } = await query.order('name');

            if (error) throw error;

            setTables(data || []);

            // Extract unique sections
            if (data && data.length > 0) {
                const uniqueSections = Array.from(new Set(data.map((t: any) => t.section)));
                if (uniqueSections.length > 0) {
                    setSections(uniqueSections as string[]);
                }
            }
        } catch (error: any) {
            showToast(error.message, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveTable = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTableName) return;

        setLoading(true);
        try {
            if (editingTable) {
                const { error } = await supabase
                    .from('restaurant_tables')
                    .update({
                        name: newTableName,
                        section: newTableSection,
                        capacity: newTableCapacity
                    })
                    .eq('id', editingTable.id);
                if (error) throw error;
                showToast("Masa güncellendi", "success");
            } else {
                const { error } = await supabase
                    .from('restaurant_tables')
                    .insert([{
                        tenant_id: currentTenant?.id,
                        warehouse_id: activeWarehouse?.id || null,
                        name: newTableName,
                        section: newTableSection,
                        capacity: newTableCapacity,
                        status: 'empty'
                    }]);
                if (error) throw error;
                showToast("Yeni masa eklendi", "success");
            }

            setEditingTable(null);
            setNewTableName("");
            setIsSettingsOpen(false);
            fetchTables();
        } catch (error: any) {
            showToast(error.message, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTable = (id: string) => {
        setConfirmState({
            isOpen: true,
            title: "Masayı Sil",
            message: "Bu masayı sistemden tamamen silmek istediğinize emin misiniz?",
            onConfirm: async () => {
                setConfirmState(prev => ({ ...prev, isOpen: false }));
                try {
                    const { error } = await supabase
                        .from('restaurant_tables')
                        .update({ is_active: false })
                        .eq('id', id);

                    if (error) throw error;
                    showToast("Masa silindi", "success");
                    setSelectedTable(null);
                    fetchTables();
                } catch (error: any) {
                    showToast(error.message, "error");
                }
            }
        });
    };

    const fetchTableOrder = async (tableId: string) => {
        try {
            const { data, error } = await supabase
                .from('table_orders')
                .select('*, products(name)')
                .eq('table_id', tableId)
                .eq('tenant_id', currentTenant?.id);

            if (error) throw error;

            setTableOrders(data.map((item: any) => ({
                id: item.id,
                product_id: item.product_id,
                name: item.products.name,
                quantity: item.quantity,
                unit_price: item.unit_price
            })));
        } catch (error: any) {
            showToast(error.message, "error");
        }
    };

    const handleTableSelect = async (table: Table) => {
        setSelectedTable(table);
        if (table.status === 'occupied') {
            await fetchTableOrder(table.id);
        } else {
            setTableOrders([]);
        }
    };

    const addToOrder = (product: any) => {
        if (!selectedTable) return;

        const existing = tableOrders.find(item => item.product_id === product.id);
        if (existing) {
            setTableOrders(tableOrders.map(item =>
                item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            ));
        } else {
            setTableOrders([...tableOrders, {
                product_id: product.id,
                name: product.name,
                quantity: 1,
                unit_price: product.sale_price
            }]);
        }
    };

    const saveOrder = async () => {
        if (!selectedTable || tableOrders.length === 0) return;

        try {
            // 1. Delete existing orders for this table to overwrite (simple approach for now)
            await supabase.from('table_orders').delete().eq('table_id', selectedTable.id).eq('tenant_id', currentTenant?.id);

            // 2. Insert new orders
            const payload = tableOrders.map(item => ({
                table_id: selectedTable.id,
                tenant_id: currentTenant?.id,
                product_id: item.product_id,
                quantity: item.quantity,
                unit_price: item.unit_price
            }));

            const { error: orderError } = await supabase.from('table_orders').insert(payload);
            if (orderError) throw orderError;

            // 3. Update table status and remove reservation_name if reserved
            const { error: tableError } = await supabase
                .from('restaurant_tables')
                .update({ status: 'occupied', reservation_name: null })
                .eq('id', selectedTable.id);

            if (tableError) throw tableError;

            showToast("Adisyon kaydedildi", "success");
            setSelectedTable(null);
            fetchTables();
        } catch (error: any) {
            showToast(error.message, "error");
        }
    };

    const handleTransferTable = async () => {
        if (!selectedTable || !transferTargetId) return;
        setLoading(true);
        try {
            await supabase.from('table_orders')
                .update({ table_id: transferTargetId })
                .eq('table_id', selectedTable.id)
                .eq('tenant_id', currentTenant?.id);

            await supabase.from('restaurant_tables')
                .update({ status: 'occupied' })
                .eq('id', transferTargetId);

            await supabase.from('restaurant_tables')
                .update({ status: 'empty' })
                .eq('id', selectedTable.id);

            showToast("Masa başarıyla taşındı", "success");
            setIsTransferModalOpen(false);
            setTransferTargetId("");
            setSelectedTable(null);
            fetchTables();
        } catch (error: any) {
            showToast(error.message, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleClearTable = () => {
        if (!selectedTable) return;
        setConfirmState({
            isOpen: true,
            title: "Masayı Boşalt",
            message: "Masadaki tüm siparişler iptal edilecek ve masa tamamen boşaltılacaktır. Emin misiniz?",
            onConfirm: async () => {
                setConfirmState(prev => ({ ...prev, isOpen: false }));
                setLoading(true);
                try {
                    const { error: orderError } = await supabase.from('table_orders').delete().eq('table_id', selectedTable.id);
                    if (orderError) throw orderError;

                    const { error: tableError } = await supabase.from('restaurant_tables').update({ status: 'empty', reservation_name: null, reservation_time: null }).eq('id', selectedTable.id);
                    if (tableError) throw tableError;

                    showToast("Masa başarıyla boşaltıldı", "success");
                    setTableOrders([]);
                    setSelectedTable(null);
                    setIsSplitMode(false);
                    setSelectedItemsForPayment([]);
                    fetchTables();
                } catch (error: any) {
                    showToast(error.message, "error");
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    const handleReserveSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reserveName || !reserveTableId || !reserveTime) return;
        setLoading(true);
        try {
            const { error } = await supabase.from('restaurant_tables').update({
                status: 'reserved',
                reservation_name: reserveName,
                reservation_time: new Date(reserveTime).toISOString()
            }).eq('id', reserveTableId);
            if (error) throw error;

            showToast(`Masa rezerve edildi`, "success");
            setIsReserveModalOpen(false);
            setReserveName("");
            setReserveTime("");
            fetchTables();
            setSelectedTable(null);
        } catch (error: any) {
            showToast(error.message, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleCancelReservation = () => {
        if (!selectedTable) return;
        setConfirmState({
            isOpen: true,
            title: "Rezervasyonu İptal Et",
            message: `"${selectedTable.reservation_name}" adına yapılan rezervasyon iptal edilecek. Masa tekrar BOŞ duruma geçirilecek. Emin misiniz?`,
            onConfirm: async () => {
                setConfirmState(prev => ({ ...prev, isOpen: false }));
                setLoading(true);
                try {
                    const { error } = await supabase.from('restaurant_tables').update({
                        status: 'empty',
                        reservation_name: null,
                        reservation_time: null
                    }).eq('id', selectedTable.id);
                    if (error) throw error;

                    showToast("Rezervasyon iptal edildi", "success");
                    setSelectedTable(null);
                    fetchTables();
                } catch (error: any) {
                    showToast(error.message, "error");
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    const getReservationCountdown = (timeStr?: string) => {
        if (!timeStr) return null;
        const target = new Date(timeStr).getTime();
        const now = currentTime.getTime();
        const diff = target - now;

        if (diff < 0) return "SÜRESİ DOLDU";

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (hours > 0) return `${hours}sa ${mins}dk Kaldı`;
        return `${mins}dk Kaldı`;
    };

    const handleSettle = async (method: 'NAKİT' | 'KREDİ KARTI') => {
        if (!selectedTable || tableOrders.length === 0) return;
        if (isSplitMode && selectedItemsForPayment.length === 0) {
            showToast("Ödenecek ürün seçilmedi!", "error");
            return;
        }

        setIsSettling(true);
        try {
            const itemsToProcess = isSplitMode
                ? tableOrders.filter((_, idx) => selectedItemsForPayment.includes(idx))
                : tableOrders;
            const remainingItems = isSplitMode
                ? tableOrders.filter((_, idx) => !selectedItemsForPayment.includes(idx))
                : [];

            const posItems = itemsToProcess.map(item => {
                const fullProduct = products.find((p: any) => p.id === item.product_id);
                return {
                    ...fullProduct,
                    quantity: item.quantity,
                    sale_price: item.unit_price,
                    name: item.name // İkram edildiyse ismi değişmiş olabilir
                };
            });

            await onCheckout(posItems, method);

            if (remainingItems.length === 0) {
                // Tamamı ödendi 
                await supabase.from('table_orders').delete().eq('table_id', selectedTable.id);
                await supabase.from('restaurant_tables').update({ status: 'empty' }).eq('id', selectedTable.id);
                setSelectedTable(null);
                setIsSplitMode(false);
            } else {
                // Parçalı ödeme - kalanı kaydet
                await supabase.from('table_orders').delete().eq('table_id', selectedTable.id);
                const payload = remainingItems.map(item => ({
                    table_id: selectedTable.id,
                    tenant_id: currentTenant?.id,
                    product_id: item.product_id,
                    quantity: item.quantity,
                    unit_price: item.unit_price
                }));
                await supabase.from('table_orders').insert(payload);
                setTableOrders(remainingItems);
                setSelectedItemsForPayment([]);
            }

            if (method === 'NAKİT' && typeof window !== 'undefined' && (window as any).require) {
                try {
                    const { ipcRenderer } = (window as any).require('electron');
                    ipcRenderer.send('open-cash-drawer', { printerName: currentTenant?.settings?.cashDrawerPrinterName });
                } catch (err) { }
            }

            showToast(`Ödeme Alındı (${method})`, "success");
            fetchTables();
        } catch (error: any) {
            showToast(error.message, "error");
        } finally {
            setIsSettling(false);
        }
    };

    // --- OPTİMİZASYON: Ürün Listeleme & Filtreleme ---
    const filteredProducts = useMemo(() => {
        return products.filter((p: any) => {
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.barcode?.includes(searchQuery);
            const matchesCategory = selectedCategory === "all" || p.category_id === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [products, searchQuery, selectedCategory]);

    // DOM yükünü azaltmak için sadece görünür olanları al
    const displayedProducts = useMemo(() => {
        return filteredProducts.slice(0, visibleCount);
    }, [filteredProducts, visibleCount]);

    // Arama veya kategori değişince listeyi başa sar
    useEffect(() => {
        setVisibleCount(40);
    }, [searchQuery, selectedCategory]);

    const subtotal = isSplitMode
        ? tableOrders.filter((_, idx) => selectedItemsForPayment.includes(idx)).reduce((sum, item) => sum + (item.unit_price * item.quantity), 0)
        : tableOrders.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);


    return (
        <div className="flex flex-col h-[calc(100vh-100px)] gap-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between bg-card/40 backdrop-blur-xl border border-border/40 p-4 rounded-2xl shadow-xl">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
                        <Utensils className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-white uppercase tracking-wider">Adisyon Yönetimi</h1>
                        <p className="text-xs text-secondary font-bold">Masa ve Sipariş Takibi</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {sections.map(section => (
                        <button
                            key={section}
                            onClick={() => setActiveSection(section)}
                            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${activeSection === section
                                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                    : 'bg-white/5 text-secondary hover:bg-white/10'
                                }`}
                        >
                            {section.toUpperCase()}
                        </button>
                    ))}
                    <button
                        onClick={() => {
                            setEditingTable(null);
                            setNewTableName("");
                            setNewTableSection("Genel");
                            setNewTableCapacity(4);
                            setIsSettingsOpen(true);
                        }}
                        className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/20 hover:bg-emerald-500/20 transition-all font-black text-xs flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        MASA EKLE
                    </button>
                </div>
            </div>

            <div className="flex-1 flex gap-4 min-h-0">
                {/* Tables Grid */}
                <div className={`flex-1 overflow-y-auto px-2 pb-6 custom-scrollbar ${selectedTable ? 'hidden lg:block' : 'block'}`}>
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 mt-2">
                        {tables.filter(t => t.section === activeSection).map(table => (
                            <motion.button
                                key={table.id}
                                onClick={() => handleTableSelect(table)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`relative p-6 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-3 ${table.status === 'reserved' ? 'h-48' : 'h-40'
                                    } ${table.status === 'occupied'
                                        ? 'bg-rose-500/10 border-rose-500/40 shadow-lg shadow-rose-500/5'
                                        : table.status === 'reserved'
                                            ? 'bg-purple-500/10 border-purple-500/40 shadow-lg shadow-purple-500/5'
                                            : table.status === 'dirty'
                                                ? 'bg-amber-500/10 border-amber-500/40'
                                                : 'bg-card/40 border-border/40 hover:border-primary/40'
                                    }`}
                            >
                                <div className={`p-3 rounded-xl ${table.status === 'occupied' ? 'bg-rose-500/20 text-rose-500'
                                        : table.status === 'reserved' ? 'bg-purple-500/20 text-purple-400'
                                            : 'bg-primary/10 text-primary'
                                    }`}>
                                    <Grid3X3 className="w-6 h-6" />
                                </div>
                                <span className={`text-sm font-black uppercase ${table.status === 'occupied' ? 'text-rose-500'
                                        : table.status === 'reserved' ? 'text-purple-400'
                                            : 'text-foreground'
                                    }`}>{table.name}</span>

                                {table.status === 'occupied' && (
                                    <div className="absolute top-2 right-2 px-2 py-0.5 bg-rose-500 text-[10px] font-black text-white rounded-md animate-pulse">
                                        DOLU
                                    </div>
                                )}
                                {table.status === 'reserved' && (
                                    <div className="absolute top-2 right-2 px-2 py-0.5 bg-purple-500 text-[10px] font-black text-white rounded-md animate-pulse flex items-center gap-1">
                                        <UserCheck className="w-3 h-3" />
                                        REZERVE
                                    </div>
                                )}
                                {table.status === 'reserved' && table.reservation_name && (
                                    <div className="absolute bottom-2 left-0 w-full px-2 flex flex-col items-center gap-1">
                                        <div className="text-[10px] font-bold text-purple-400/80 bg-purple-500/10 px-2 py-0.5 rounded-full max-w-full truncate">
                                            {table.reservation_name}
                                        </div>
                                        {table.reservation_time && (
                                            <div className={`text-[9px] font-black px-1.5 py-0.5 rounded string ${new Date(table.reservation_time).getTime() < currentTime.getTime()
                                                    ? "bg-rose-500/20 text-rose-500 animate-pulse"
                                                    : "bg-purple-500/20 text-purple-300"
                                                }`}>
                                                {getReservationCountdown(table.reservation_time)}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </motion.button>
                        ))}
                    </div>
                </div>

                {/* Selected Table Order Panel */}
                <AnimatePresence>
                    {selectedTable && (
                        <motion.div
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 20, opacity: 0 }}
                            className="w-full lg:w-[450px] bg-card/40 backdrop-blur-2xl border border-border/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                        >
                            {/* Panel Header */}
                            <div className="p-4 border-b border-border/40 flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
                                <div>
                                    <h3 className="font-black text-sm uppercase text-white">{selectedTable.name}</h3>
                                    <p className="text-[10px] text-secondary font-bold uppercase tracking-widest">{selectedTable.section}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            setEditingTable(selectedTable);
                                            setNewTableName(selectedTable.name);
                                            setNewTableSection(selectedTable.section);
                                            setNewTableCapacity(selectedTable.capacity);
                                            setIsSettingsOpen(true);
                                        }}
                                        className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-all"
                                        title="Düzenle"
                                    >
                                        <Edit2 className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => setIsTransferModalOpen(true)}
                                        className="p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all"
                                        title="Masayı Taşı / Birleştir"
                                    >
                                        <ArrowRightLeft className="w-5 h-5" />
                                    </button>

                                    {selectedTable.status === 'empty' && (
                                        <button
                                            onClick={() => {
                                                setReserveTableId(selectedTable.id);
                                                setReserveTime(getLocalDateTimeString());
                                                setIsReserveModalOpen(true);
                                            }}
                                            className="p-2 text-purple-400 hover:bg-purple-500/10 rounded-lg transition-all"
                                            title="Masayı Rezerve Et"
                                        >
                                            <CalendarClock className="w-5 h-5" />
                                        </button>
                                    )}

                                    {selectedTable.status === 'occupied' && (
                                        <button
                                            onClick={handleClearTable}
                                            className="p-2 text-amber-500 hover:bg-amber-500/10 rounded-lg transition-all"
                                            title="Masayı Boşalt (Sıfırla)"
                                        >
                                            <Eraser className="w-5 h-5" />
                                        </button>
                                    )}
                                    {selectedTable.status === 'reserved' && (
                                        <button
                                            onClick={handleCancelReservation}
                                            className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                                            title="Rezervasyonu İptal Et"
                                        >
                                            <AlertTriangle className="w-5 h-5" />
                                        </button>
                                    )}

                                    <button
                                        onClick={() => handleDeleteTable(selectedTable.id)}
                                        className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                                        title="Masayı Sil"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                    <div className="w-px h-6 bg-border/20 mx-1" />
                                    <button
                                        onClick={() => {
                                            setSelectedTable(null);
                                            setIsSplitMode(false);
                                            setSelectedItemsForPayment([]);
                                        }}
                                        className="p-2 hover:bg-white/5 rounded-lg text-secondary hover:text-white transition-all bg-white/5"
                                        title="Kapat"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>

                                </div>
                            </div>

                            {/* Order Search/Categories */}
                            <div className="p-4 space-y-3 border-b border-border/10 bg-black/10">
                                <div className="flex items-center gap-2">
                                    <div className="relative flex-1 group">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="text"
                                            placeholder="Ürün veya Barkod ara..."
                                            className="w-full bg-white/5 border border-border/40 rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none focus:border-primary/40 transition-all font-bold"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    // Enter basıldığında ilk sonuca odaklanabilir veya sadece titreşim verebiliriz
                                                }
                                            }}
                                        />
                                    </div>
                                    <button
                                        onClick={() => {
                                            // Arama tetikleyici - live arama olduğu için şimdilik sadece görsel geri bildirim
                                            showToast(`${searchQuery || 'Tüm'} ürünler listeleniyor`, "info");
                                        }}
                                        className="px-4 py-2.5 bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary rounded-xl text-[10px] font-black transition-all flex items-center gap-2 active:scale-95 whitespace-nowrap"
                                    >
                                        <Search className="w-4 h-4" />
                                        ARA
                                    </button>
                                </div>
                                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                                    <button
                                        onClick={() => setSelectedCategory("all")}
                                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase whitespace-nowrap transition-all border ${selectedCategory === "all" ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 border-border/40 text-secondary hover:bg-white/10'
                                            }`}
                                    >
                                        Hepsi
                                    </button>
                                    {categories.map((cat: any) => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setSelectedCategory(cat.id)}
                                            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase whitespace-nowrap transition-all border ${selectedCategory === cat.id ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 border-border/40 text-secondary hover:bg-white/10'
                                                }`}
                                        >
                                            {cat.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Main Content: Current Order (Upper) & Product Catalog (Lower) */}
                            <div className="flex-1 flex flex-col min-h-0 bg-black/5">

                                {/* 1. Current Order Items List (Scrollable, limited initial height) */}
                                <div className="h-[280px] overflow-y-auto p-4 space-y-2 custom-scrollbar border-b border-border/10 shadow-inner">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] opacity-60">Mevcut Siparişler</span>
                                        <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md">{tableOrders.length} Kalem</span>
                                    </div>
                                    {tableOrders.length > 0 ? (
                                        tableOrders.map((item, idx) => (
                                            <div key={idx} className={`flex items-center justify-between p-3 border rounded-xl group transition-all ${isSplitMode && selectedItemsForPayment.includes(idx) ? 'bg-primary/20 border-primary shadow-lg shadow-primary/10' : 'bg-white/5 border-border/10 hover:bg-white/10'}`}>
                                                <div className="flex items-center gap-3">
                                                    {isSplitMode && (
                                                        <button
                                                            onClick={() => {
                                                                if (selectedItemsForPayment.includes(idx)) {
                                                                    setSelectedItemsForPayment(prev => prev.filter(i => i !== idx));
                                                                } else {
                                                                    setSelectedItemsForPayment(prev => [...prev, idx]);
                                                                }
                                                            }}
                                                            className="text-primary transition-all active:scale-90"
                                                        >
                                                            {selectedItemsForPayment.includes(idx) ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-secondary" />}
                                                        </button>
                                                    )}
                                                    <div className="flex flex-col">
                                                        <span className={`text-[11px] font-black uppercase ${item.unit_price === 0 ? 'text-amber-400' : 'text-white'}`}>{item.name}</span>
                                                        <span className="text-[10px] text-secondary font-bold">₺{item.unit_price} x {item.quantity}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {item.unit_price > 0 && (
                                                        <button
                                                            onClick={() => {
                                                                setConfirmState({
                                                                    isOpen: true,
                                                                    title: "Ürünü İkram Et",
                                                                    message: `"${item.name}" ürününü ikram olarak kaydetmek istediğinize emin misiniz? (Fiyat 0₺ olarak güncellenecek)`,
                                                                    onConfirm: () => {
                                                                        setTableOrders(tableOrders.map((o, i) => i === idx ? { ...o, unit_price: 0, name: `(İKRAM) ${o.name}` } : o));
                                                                        setConfirmState(prev => ({ ...prev, isOpen: false }));
                                                                    }
                                                                });
                                                            }}
                                                            className="p-1.5 text-secondary hover:text-amber-400 hover:bg-amber-400/10 rounded-lg transition-all focus:outline-none"
                                                            title="İkram Et"
                                                        >
                                                            <Gift className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <div className="flex items-center gap-2 bg-background/50 rounded-lg border border-border/20 p-1">
                                                        <button
                                                            onClick={() => setTableOrders(tableOrders.map((o, i) => i === idx ? { ...o, quantity: Math.max(0.5, o.quantity - 1) } : o))}
                                                            className="w-6 h-6 flex items-center justify-center hover:bg-white/5 rounded text-secondary"
                                                        >-</button>
                                                        <span className="text-xs font-black text-primary w-6 text-center">{item.quantity}</span>
                                                        <button
                                                            onClick={() => setTableOrders(tableOrders.map((o, i) => i === idx ? { ...o, quantity: o.quantity + 1 } : o))}
                                                            className="w-6 h-6 flex items-center justify-center hover:bg-white/5 rounded text-secondary"
                                                        >+</button>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            setConfirmState({
                                                                isOpen: true,
                                                                title: "Ürünü İptal Et",
                                                                message: `"${item.name}" adlı ürünü adisyondan tamamen çıkarmak istediğinize emin misiniz?`,
                                                                onConfirm: () => {
                                                                    setTableOrders(tableOrders.filter((_, i) => i !== idx));
                                                                    setConfirmState(prev => ({ ...prev, isOpen: false }));
                                                                }
                                                            });
                                                        }}
                                                        className="p-1.5 text-secondary hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all focus:outline-none"
                                                        title="İptal Et"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="h-24 flex flex-col items-center justify-center text-secondary/10 border-2 border-dashed border-white/5 rounded-2xl">
                                            <Coffee className="w-6 h-6 mb-2" />
                                            <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Adisyon Boş</p>
                                        </div>
                                    )}
                                </div>

                                {/* 2. Product Catalog / Selection Grid (Bottom Flex) */}
                                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-black/20">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] opacity-60">Ürün Seçimi</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-[10px] font-bold text-emerald-400">{filteredProducts.length} Mevcut Ürün</span>
                                        </div>
                                    </div>

                                    {displayedProducts.length > 0 ? (
                                        <div className="flex flex-col gap-2 pb-10">
                                            <div className="grid grid-cols-2 gap-2">
                                                {displayedProducts.map((p: any) => (
                                                    <motion.button
                                                        key={p.id}
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => addToOrder(p)}
                                                        className="p-3 bg-white/[0.03] border border-white/[0.07] rounded-xl text-left hover:bg-primary/20 hover:border-primary/40 transition-all group flex flex-col gap-2 relative overflow-hidden"
                                                    >
                                                        <div className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Plus className="w-4 h-4 text-primary" />
                                                        </div>
                                                        <div className="text-[10px] font-black text-white truncate uppercase leading-tight pr-4 whitespace-normal break-words h-7 overflow-hidden line-clamp-2">
                                                            {p.name}
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs font-black text-primary">₺{p.sale_price}</span>
                                                            <span className="text-[8px] bg-white/5 px-1.5 py-0.5 rounded font-bold text-secondary uppercase whitespace-nowrap">Seç</span>
                                                        </div>
                                                    </motion.button>
                                                ))}
                                            </div>

                                            {filteredProducts.length > visibleCount && (
                                                <button
                                                    onClick={() => setVisibleCount(prev => prev + 40)}
                                                    className="w-full py-3 mt-2 bg-white/5 hover:bg-white/10 border border-border/20 rounded-xl text-[10px] font-black text-secondary hover:text-white transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
                                                >
                                                    <ChevronDown className="w-4 h-4" />
                                                    Daha Fazla Ürün Göster ({filteredProducts.length - visibleCount} ürün daha var)
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center p-10 text-center opacity-20">
                                            <Search className="w-12 h-12 mb-3" />
                                            <p className="text-xs font-black uppercase tracking-widest">Ürün Bulunamadı</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Panel Footer */}
                            <div className="p-4 bg-background/50 border-t border-border/40 space-y-4">
                                <div className="flex justify-between items-center px-2">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-black text-secondary uppercase tracking-widest">{isSplitMode ? 'Seçilen Tutar' : 'Toplam Tutar'}</span>
                                        {isSplitMode && <span className="text-[9px] text-primary mt-1 font-bold bg-primary/10 px-2 py-0.5 rounded-md w-fit hover:bg-primary/20 cursor-pointer transition-colors" onClick={() => { setIsSplitMode(false); setSelectedItemsForPayment([]) }}>PARÇALI ÖDEMEYİ İPTAL ET</span>}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {!isSplitMode && tableOrders.length > 0 && (
                                            <button onClick={() => setIsSplitMode(true)} className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-lg border border-border/40 text-[10px] font-black hover:bg-white/10 transition-all text-secondary">
                                                <SplitSquareHorizontal className="w-3.5 h-3.5" />
                                                PARÇALI ÖDE
                                            </button>
                                        )}
                                        <span className="text-2xl font-black text-primary">₺{subtotal.toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        onClick={saveOrder}
                                        disabled={isSettling}
                                        className="flex flex-col items-center justify-center gap-1 py-3 bg-white/5 hover:bg-white/10 border border-border/40 rounded-xl text-[10px] font-black text-white transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        <Save size={16} />
                                        KAYDET
                                    </button>
                                    <button
                                        onClick={() => handleSettle('NAKİT')}
                                        disabled={isSettling || tableOrders.length === 0}
                                        className="flex flex-col items-center justify-center gap-1 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/40 text-emerald-500 rounded-xl text-[10px] font-black transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        <Banknote size={16} />
                                        NAKİT
                                    </button>
                                    <button
                                        onClick={() => handleSettle('KREDİ KARTI')}
                                        disabled={isSettling || tableOrders.length === 0}
                                        className="flex flex-col items-center justify-center gap-1 py-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/40 text-blue-500 rounded-xl text-[10px] font-black transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        <CreditCard size={16} />
                                        KART
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Table Settings Modal */}
                <AnimatePresence>
                    {isSettingsOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="bg-card border border-border/40 w-full max-w-md rounded-3xl p-8 shadow-2xl"
                            >
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-xl font-black text-white uppercase tracking-widest">
                                        {editingTable ? "Masayı Düzenle" : "Yeni Masa Ekle"}
                                    </h2>
                                    <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-white/5 rounded-xl transition-all">
                                        <X className="w-6 h-6 text-secondary" />
                                    </button>
                                </div>

                                <form onSubmit={handleSaveTable} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-secondary ml-1">Masa Adı</label>
                                        <input
                                            type="text"
                                            value={newTableName}
                                            onChange={(e) => setNewTableName(e.target.value)}
                                            placeholder="Örn: Masa 12"
                                            className="w-full bg-black/20 border border-border/40 rounded-2xl p-4 text-white outline-none focus:border-primary/40 transition-all font-bold"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-secondary ml-1">Bölüm</label>
                                        <select
                                            value={newTableSection}
                                            onChange={(e) => setNewTableSection(e.target.value)}
                                            className="w-full bg-black/20 border border-border/40 rounded-2xl p-4 text-white outline-none focus:border-primary/40 transition-all font-bold appearance-none"
                                        >
                                            <option value="Genel">Genel</option>
                                            <option value="Bahçe">Bahçe</option>
                                            <option value="Teras">Teras</option>
                                            <option value="VIP">VIP</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-secondary ml-1">Kapasite</label>
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="range"
                                                min="1"
                                                max="20"
                                                value={newTableCapacity}
                                                onChange={(e) => setNewTableCapacity(parseInt(e.target.value))}
                                                className="flex-1 accent-primary"
                                            />
                                            <span className="w-10 text-center font-black text-primary text-xl">{newTableCapacity}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setIsSettingsOpen(false)}
                                            className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-secondary font-black rounded-2xl transition-all uppercase tracking-widest text-xs"
                                        >
                                            İptal
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="flex-1 py-4 bg-primary hover:bg-primary/90 text-white font-black rounded-2xl shadow-xl shadow-primary/20 transition-all uppercase tracking-widest text-xs"
                                        >
                                            {loading ? "Kaydediliyor..." : "Kaydet"}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Masa Taşıma Modal */}
                <AnimatePresence>
                    {isTransferModalOpen && (
                        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="bg-card border border-border/40 w-full max-w-md rounded-3xl p-8 shadow-2xl"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-2">
                                        <ArrowRightLeft className="w-5 h-5 text-indigo-400" />
                                        Masa Taşı / Birleştir
                                    </h2>
                                    <button onClick={() => { setIsTransferModalOpen(false); setTransferTargetId(""); }} className="p-2 hover:bg-white/5 rounded-xl transition-all">
                                        <X className="w-6 h-6 text-secondary" />
                                    </button>
                                </div>
                                <p className="text-xs text-secondary font-bold mb-4 uppercase">Aktarılacak Masayı Seçin:</p>

                                <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar grid grid-cols-2 gap-3 mb-6">
                                    {tables.filter(t => t.id !== selectedTable?.id).map(t => (
                                        <button
                                            key={t.id}
                                            onClick={() => setTransferTargetId(t.id)}
                                            className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${transferTargetId === t.id ? 'bg-indigo-500/20 border-indigo-500 shadow-lg shadow-indigo-500/20' : t.status === 'occupied' ? 'bg-rose-500/10 border-rose-500/20 opacity-70' : 'bg-white/5 border-border/20 hover:border-border/60'}`}
                                        >
                                            <span className={`text-xs font-black uppercase ${transferTargetId === t.id ? 'text-indigo-400' : 'text-white'}`}>{t.name}</span>
                                            <span className="text-[9px] font-bold text-secondary uppercase tracking-widest">{t.section} {t.status === 'occupied' && '(Dolu)'}</span>
                                        </button>
                                    ))}
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => { setIsTransferModalOpen(false); setTransferTargetId(""); }}
                                        className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-secondary font-black rounded-2xl transition-all uppercase tracking-widest text-xs"
                                    >
                                        İptal
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleTransferTable}
                                        disabled={!transferTargetId || loading}
                                        className="flex-1 py-4 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-black rounded-2xl shadow-xl shadow-indigo-500/20 transition-all uppercase tracking-widest text-xs"
                                    >
                                        {loading ? "Taşınıyor..." : "Aktarımı Başlat"}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Rezervasyon Ekleme Modal */}
                <AnimatePresence>
                    {isReserveModalOpen && (
                        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="bg-card border border-border/40 w-full max-w-md rounded-3xl p-8 shadow-2xl"
                            >
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-2">
                                        <CalendarClock className="w-5 h-5 text-purple-400" />
                                        Masa Rezervasyonu
                                    </h2>
                                    <button onClick={() => { setIsReserveModalOpen(false); setReserveName(""); }} className="p-2 hover:bg-white/5 rounded-xl transition-all">
                                        <X className="w-6 h-6 text-secondary" />
                                    </button>
                                </div>
                                <form onSubmit={handleReserveSubmit} className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-secondary ml-1">İsim Soyisim</label>
                                            <input
                                                type="text"
                                                value={reserveName}
                                                onChange={(e) => setReserveName(e.target.value)}
                                                placeholder="Örn: Ahmet Yılmaz"
                                                className="w-full bg-black/20 border border-border/40 rounded-2xl p-4 text-white outline-none focus:border-purple-500/40 transition-all font-bold"
                                                required
                                                autoFocus
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-secondary ml-1">Tarih ve Saat</label>
                                            <input
                                                type="datetime-local"
                                                value={reserveTime}
                                                onChange={(e) => setReserveTime(e.target.value)}
                                                className="w-full bg-black/20 border border-border/40 rounded-2xl p-4 text-white outline-none focus:border-purple-500/40 transition-all font-bold"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-4 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => { setIsReserveModalOpen(false); setReserveName(""); setReserveTime(""); }}
                                            className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-secondary font-black rounded-2xl transition-all uppercase tracking-widest text-xs"
                                        >
                                            İptal
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={!reserveName || !reserveTime || loading}
                                            className="flex-1 py-4 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white font-black rounded-2xl shadow-xl shadow-purple-500/20 transition-all uppercase tracking-widest text-xs"
                                        >
                                            {loading ? "Rezerve Ediliyor..." : "Rezerve Et"}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Confirm Action Modal */}
                <AnimatePresence>
                    {confirmState.isOpen && (
                        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="bg-card border border-border/40 w-full max-w-sm rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center"
                            >
                                <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mb-4">
                                    <AlertTriangle className="w-8 h-8" />
                                </div>
                                <h2 className="text-lg font-black text-white uppercase tracking-widest mb-2">
                                    {confirmState.title}
                                </h2>
                                <p className="text-sm text-secondary font-bold mb-8">
                                    {confirmState.message}
                                </p>
                                <div className="flex w-full gap-3">
                                    <button
                                        onClick={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
                                        className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-secondary font-black rounded-xl transition-all uppercase tracking-widest text-xs"
                                    >
                                        Vazgeç
                                    </button>
                                    <button
                                        onClick={confirmState.onConfirm}
                                        className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white font-black rounded-xl shadow-lg shadow-rose-500/20 transition-all uppercase tracking-widest text-xs"
                                    >
                                        Onayla
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>

        </div>
    );
}
