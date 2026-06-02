"use client";

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Utensils, Users, ArrowLeft, Plus, Check, Search, Coffee, Save, X, Minus, Trash2, ChevronDown, Bell, LogIn, Award } from 'lucide-react';
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
    assigned_waiter_id?: string;
    assigned_waiter_name?: string;
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
    const [visibleCount, setVisibleCount] = useState(30);

    // Waiter Session State
    const [employees, setEmployees] = useState<any[]>([]);
    const [activeWaiterId, setActiveWaiterId] = useState<string | null>(null);
    const [activeWaiterName, setActiveWaiterName] = useState<string | null>(null);
    const [activeWaiterRole, setActiveWaiterRole] = useState<string | null>(null);
    const [showWaiterModal, setShowWaiterModal] = useState(false);
    const [waiterPin, setWaiterPin] = useState("");
    const [pinError, setPinError] = useState("");

    const [originalOrders, setOriginalOrders] = useState<OrderItem[]>([]);
    const [showSupervisorModal, setShowSupervisorModal] = useState(false);
    const [supervisorPin, setSupervisorPin] = useState("");
    const [supervisorError, setSupervisorError] = useState("");

    // Calls Drawer & State
    const [activeCalls, setActiveCalls] = useState<any[]>([]);
    const [showCallsDrawer, setShowCallsDrawer] = useState(false);

    // --- OPTİMİZASYON: Ürün Listeleme & Filtreleme ---
    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesCategory = selectedCategoryId ? p.category_id === selectedCategoryId : true;
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [products, searchTerm, selectedCategoryId]);

    const displayedProducts = useMemo(() => {
        return filteredProducts.slice(0, visibleCount);
    }, [filteredProducts, visibleCount]);

    useEffect(() => {
        setVisibleCount(30);
    }, [searchTerm, selectedCategoryId]);

    const fetchTables = async () => {
        setLoading(true);
        const tenantId = localStorage.getItem('tenantId');
        if (!tenantId) return;

        try {
            const activeWarehouseId = localStorage.getItem('activeWarehouseId');
            
            let query = supabase
                .from('restaurant_tables')
                .select('*')
                .eq('tenant_id', tenantId)
                .eq('is_active', true);

            if (activeWarehouseId) {
                query = query.eq('warehouse_id', activeWarehouseId);
            }

            const { data, error } = await query.order('name');

            if (error) throw error;
            setTables(data || []);
            
            if (data && data.length > 0) {
                const uniqueSections = Array.from(new Set(data.map((t: any) => t.section)));
                if (uniqueSections.length > 0) {
                    setSections(uniqueSections as string[]);
                    if (!sections.includes(activeSection)) {
                        setActiveSection((uniqueSections as string[])[0]);
                    }
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
        
        const { data: catData } = await supabase
            .from('categories')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('name');
        if (catData) setCategories(catData);

        const { data } = await supabase
            .from('products')
            .select('id, name, sale_price, stock_quantity, category_id, station_id')
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
            const mapped = data.map((item: any) => ({
                product_id: item.product_id,
                name: item.products?.name || 'Bilinmeyen Ürün',
                quantity: item.quantity,
                unit_price: item.unit_price,
                notes: item.notes || ''
            }));
            setTableOrders(mapped);
            setOriginalOrders(mapped);
        }
    };

    const fetchEmployees = async () => {
        const tenantId = localStorage.getItem('tenantId');
        if (!tenantId) return;
        const { data, error } = await supabase
            .from('employees')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('status', 'active');
        if (!error && data) {
            setEmployees(data);
        }
    };

    const fetchActiveCalls = async () => {
        const tenantId = localStorage.getItem('tenantId');
        if (!tenantId) return;
        const { data, error } = await supabase
            .from('table_calls')
            .select('*')
            .eq('tenant_id', tenantId)
            .or('status.eq.active,status.eq.accepted');
        if (!error && data) {
            setActiveCalls(data);
        }
    };

    // Waiter Login / Session helpers
    const handlePinSubmit = async (enteredPin: string) => {
        const tenantId = localStorage.getItem('tenantId');
        if (!tenantId) return;

        setSaving(true);
        try {
            const { data, error } = await supabase.rpc('verify_employee_pin', {
                p_tenant_id: tenantId,
                p_pin_code: enteredPin
            });

            if (error) throw error;

            if (data.success && data.employee) {
                const emp = data.employee;
                localStorage.setItem('activeWaiterId', emp.id);
                localStorage.setItem('activeWaiterName', emp.name);
                localStorage.setItem('activeWaiterRole', emp.role);
                
                setActiveWaiterId(emp.id);
                setActiveWaiterName(emp.name);
                setActiveWaiterRole(emp.role);
                setWaiterPin("");
                setPinError("");
                setShowWaiterModal(false);
                toast.success(`Hoş geldiniz, ${emp.name}!`);

                const role = emp.role || emp.position;
                if (role === 'Kitchen' || role === 'Mutfak') {
                    router.push('/kds');
                }
            } else {
                setPinError(data.message || "Geçersiz PIN kodu");
                setWaiterPin("");
            }
        } catch (err: any) {
            setPinError(err.message || "Giriş hatası");
            setWaiterPin("");
        } finally {
            setSaving(false);
        }
    };

    const handleSupervisorPinSubmit = async (enteredPin: string) => {
        const tenantId = localStorage.getItem('tenantId');
        if (!tenantId) return;

        setSaving(true);
        try {
            const { data, error } = await supabase.rpc('verify_employee_pin', {
                p_tenant_id: tenantId,
                p_pin_code: enteredPin
            });

            if (error) throw error;

            if (data.success && data.employee) {
                const emp = data.employee;
                const role = emp.role || emp.position;
                if (role === 'Owner' || role === 'Manager' || role === 'SuperAdmin' || role === 'Patron' || role === 'Müdür') {
                    setSupervisorPin("");
                    setSupervisorError("");
                    setShowSupervisorModal(false);
                    toast.success(`Onaylandı: ${emp.name}`);
                    await executeSaveOrder(emp.id);
                } else {
                    setSupervisorError("Bu işlem için yetkiniz bulunmamaktadır (Sadece Yönetici/Patron).");
                    setSupervisorPin("");
                }
            } else {
                setSupervisorError(data.message || "Geçersiz PIN kodu");
                setSupervisorPin("");
            }
        } catch (err: any) {
            setSupervisorError(err.message || "Onay hatası");
            setSupervisorPin("");
        } finally {
            setSaving(false);
        }
    };


    // Heartbeat & initialization
    useEffect(() => {
        const tenantId = localStorage.getItem('tenantId');
        if (!tenantId) return;

        // Set RLS context
        supabase.rpc('set_current_tenant', { tenant_id: tenantId });

        const wId = localStorage.getItem('activeWaiterId');
        const wName = localStorage.getItem('activeWaiterName');
        const wRole = localStorage.getItem('activeWaiterRole');

        if (wRole) {
            setActiveWaiterRole(wRole);
        }

        if (wRole === 'Kitchen' || wRole === 'Mutfak') {
            router.push('/kds');
            return;
        }

        if (wId && wName) {
            setActiveWaiterId(wId);
            setActiveWaiterName(wName);
            // Mark online immediately
            supabase
                .from('employees')
                .update({ is_online: true, last_seen: new Date().toISOString() })
                .eq('id', wId);
        } else {
            setShowWaiterModal(true);
        }

        fetchTables();
        fetchProducts();
        fetchEmployees();
        fetchActiveCalls();

        // 1. TABLE REALTIME
        const activeWarehouseId = localStorage.getItem('activeWarehouseId');
        let filterStr = `tenant_id=eq.${tenantId}`;
        if (activeWarehouseId) {
            filterStr += `,warehouse_id=eq.${activeWarehouseId}`;
        }

        const tablesChannel = supabase
            .channel(`adisyon_mobile_tables_${tenantId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'restaurant_tables',
                filter: filterStr
            }, () => {
                fetchTables();
            })
            .subscribe();

        // 2. CALLS REALTIME
        const callsChannel = supabase
            .channel(`adisyon_mobile_calls_${tenantId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'table_calls',
                filter: `tenant_id=eq.${tenantId}`
            }, () => {
                fetchActiveCalls();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(tablesChannel);
            supabase.removeChannel(callsChannel);
        };
    }, []);

    // Active calls heartbeat timer
    useEffect(() => {
        if (!activeWaiterId) return;

        const heartbeat = setInterval(async () => {
            await supabase
                .from('employees')
                .update({ is_online: true, last_seen: new Date().toISOString() })
                .eq('id', activeWaiterId);
        }, 30000);

        return () => clearInterval(heartbeat);
    }, [activeWaiterId]);

    useEffect(() => {
        if (selectedTable && selectedTable.status === 'occupied') {
            fetchTableOrders(selectedTable.id);

            // ORDER REALTIME (Masa bazlı)
            const ordersChannel = supabase
                .channel(`adisyon_mobile_orders_${selectedTable.id}`)
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'table_orders',
                    filter: `table_id=eq.${selectedTable.id}`
                }, () => {
                    fetchTableOrders(selectedTable.id);
                })
                .subscribe();

            return () => {
                supabase.removeChannel(ordersChannel);
            };
        } else if (selectedTable) {
            setTableOrders([]);
        }
    }, [selectedTable?.id]);

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

    // Split and Save adisyon
    const saveOrder = async () => {
        if (!selectedTable) return;
        if (!activeWaiterId) {
            toast.error("Önce garson girişi yapmalısınız!");
            setShowWaiterModal(true);
            return;
        }

        // Detect cancellations/reductions compared to originalOrders
        const cancelledItems: { product_id: string, name: string, quantity: number }[] = [];
        for (const orig of originalOrders) {
            const current = tableOrders.find(item => item.product_id === orig.product_id);
            const currentQty = current ? current.quantity : 0;
            if (orig.quantity > currentQty) {
                cancelledItems.push({
                    product_id: orig.product_id,
                    name: orig.name,
                    quantity: orig.quantity - currentQty
                });
            }
        }

        if (cancelledItems.length > 0) {
            // Show supervisor validation modal
            setShowSupervisorModal(true);
        } else {
            // No cancellations, save immediately
            await executeSaveOrder(null);
        }
    };

    const executeSaveOrder = async (supervisorId: string | null) => {
        const table = selectedTable;
        if (!table) return;
        setSaving(true);
        const tenantId = localStorage.getItem('tenantId');
        
        try {
            // Calculate cancellations
            const cancelledItems: { product_id: string, name: string, quantity: number }[] = [];
            for (const orig of originalOrders) {
                const current = tableOrders.find(item => item.product_id === orig.product_id);
                const currentQty = current ? current.quantity : 0;
                if (orig.quantity > currentQty) {
                    cancelledItems.push({
                        product_id: orig.product_id,
                        name: orig.name,
                        quantity: orig.quantity - currentQty
                    });
                }
            }

            // Calculate added/increased items
            const addedItems: { product_id: string, name: string, quantity: number, unit_price: number, notes: string }[] = [];
            for (const item of tableOrders) {
                const orig = originalOrders.find(o => o.product_id === item.product_id);
                const origQty = orig ? orig.quantity : 0;
                if (item.quantity > origQty) {
                    addedItems.push({
                        product_id: item.product_id,
                        name: item.name,
                        quantity: item.quantity - origQty,
                        unit_price: item.unit_price,
                        notes: item.notes || ""
                    });
                }
            }

            // 1. Delete and insert standard table orders
            await supabase.from('table_orders').delete().eq('table_id', table.id).eq('tenant_id', tenantId);
            
            if (tableOrders.length > 0) {
                const payload = tableOrders.map(item => ({
                    table_id: table.id,
                    tenant_id: tenantId,
                    product_id: item.product_id,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    notes: item.notes || null
                }));
                const { error: insertError } = await supabase.from('table_orders').insert(payload);
                if (insertError) throw insertError;

                // 2. Set Responsible Waiter and occupied dwell time
                const occupiedAt = table.status === 'empty' ? new Date().toISOString() : null;
                const updatePayload: any = { 
                    status: 'occupied', 
                    reservation_name: null,
                    assigned_waiter_id: activeWaiterId,
                    assigned_waiter_name: activeWaiterName
                };
                if (occupiedAt) {
                    updatePayload.occupied_at = occupiedAt;
                }

                await supabase.from('restaurant_tables')
                    .update(updatePayload)
                    .eq('id', table.id);

                // 3. Get or Create active order group for the table
                let orderGroupId;
                const { data: activeOG } = await supabase
                    .from('order_groups')
                    .select('id')
                    .eq('table_id', table.id)
                    .eq('status', 'active')
                    .order('created_at', { ascending: false })
                    .limit(1);

                if (activeOG && activeOG.length > 0) {
                    orderGroupId = activeOG[0].id;
                } else {
                    const { data: newOG, error: ogError } = await supabase
                        .from('order_groups')
                        .insert([{
                            tenant_id: tenantId,
                            table_id: table.id,
                            waiter_id: activeWaiterId,
                            status: 'active',
                            order_source: 'table'
                        }])
                        .select()
                        .single();

                    if (ogError) throw ogError;
                    orderGroupId = newOG.id;
                }

                // 4. Handle cancellations in KDS
                if (cancelledItems.length > 0 && orderGroupId && supervisorId) {
                    const { data: activeKOrders } = await supabase
                        .from('kitchen_orders')
                        .select('id')
                        .eq('order_group_id', orderGroupId);
                    
                    if (activeKOrders && activeKOrders.length > 0) {
                        const koIds = activeKOrders.map(ko => ko.id);
                        
                        for (const item of cancelledItems) {
                            const { data: kItems } = await supabase
                                .from('kitchen_order_items')
                                .select('*')
                                .in('kitchen_order_id', koIds)
                                .eq('product_id', item.product_id)
                                .is('cancelled_at', null);
                            
                            if (kItems && kItems.length > 0) {
                                const totalKdsQty = kItems.reduce((acc, ki) => acc + ki.quantity, 0);
                                let remainingToCancel = Math.min(item.quantity, totalKdsQty);
                                
                                for (const ki of kItems) {
                                    if (remainingToCancel <= 0) break;
                                    
                                    if (ki.quantity <= remainingToCancel) {
                                        await supabase
                                            .from('kitchen_order_items')
                                            .update({
                                                cancelled_at: new Date().toISOString(),
                                                cancelled_by: supervisorId
                                            })
                                            .eq('id', ki.id);
                                        remainingToCancel -= ki.quantity;
                                    } else {
                                        await supabase
                                            .from('kitchen_order_items')
                                            .update({
                                                quantity: ki.quantity - remainingToCancel
                                            })
                                            .eq('id', ki.id);
                                        
                                        await supabase
                                            .from('kitchen_order_items')
                                            .insert([{
                                                kitchen_order_id: ki.kitchen_order_id,
                                                product_id: ki.product_id,
                                                product_name: ki.product_name,
                                                quantity: remainingToCancel,
                                                notes: ki.notes,
                                                status: 'pending',
                                                station_id: ki.station_id,
                                                cancelled_at: new Date().toISOString(),
                                                cancelled_by: supervisorId
                                            }]);
                                        
                                        remainingToCancel = 0;
                                    }
                                }
                            }
                        }
                    }
                }

                // 5. Split and Save added items to kitchen stations
                if (addedItems.length > 0) {
                    const { data: stations } = await supabase.from('kitchen_stations').select('*').eq('tenant_id', tenantId);
                    const defaultStationId = stations && stations.length > 0 ? stations[0].id : null;
                    const defaultStationName = stations && stations.length > 0 ? stations[0].name : 'Mutfak';

                    // Group items by station
                    const itemsByStation: { [key: string]: { items: typeof addedItems, stationName: string } } = {};
                    
                    addedItems.forEach(item => {
                        const prodInfo = products.find(p => p.id === item.product_id);
                        const sId = prodInfo?.station_id || defaultStationId || 'default-station';
                        const stationName = stations?.find(s => s.id === sId)?.name || defaultStationName;

                        if (!itemsByStation[sId]) {
                            itemsByStation[sId] = { items: [], stationName };
                        }
                        itemsByStation[sId].items.push(item);
                    });

                    // Create sub-orders for KDS per station
                    for (const [sId, group] of Object.entries(itemsByStation)) {
                        const stationIdVal = sId === 'default-station' ? null : sId;
                        
                        const { data: kOrder, error: koError } = await supabase
                            .from('kitchen_orders')
                            .insert([{
                                tenant_id: tenantId,
                                order_group_id: orderGroupId,
                                table_id: table.id,
                                waiter_id: activeWaiterId,
                                station_id: stationIdVal,
                                table_name: table.name,
                                waiter_name: activeWaiterName,
                                station_name: group.stationName,
                                status: 'new',
                                priority: 0
                            }])
                            .select()
                            .single();

                        if (koError) throw koError;

                        const itemPayloads = group.items.map(item => ({
                            kitchen_order_id: kOrder.id,
                            product_id: item.product_id,
                            product_name: item.name,
                            quantity: item.quantity,
                            notes: item.notes || null,
                            status: 'pending',
                            station_id: stationIdVal
                        }));

                        const { error: koiError } = await supabase.from('kitchen_order_items').insert(itemPayloads);
                        if (koiError) throw koiError;

                        // KDS notification alert
                        await supabase.from('notifications').insert([{
                            tenant_id: tenantId,
                            title: 'Yeni KDS Siparişi',
                            message: `${table.name} için ${group.stationName} siparişi alındı.`,
                            type: 'kds',
                            reference_id: kOrder.id
                        }]);
                    }
                }

            } else {
                // Table cleared (all cancelled)
                await supabase.from('restaurant_tables')
                    .update({ status: 'empty', occupied_at: null, assigned_waiter_id: null, assigned_waiter_name: null })
                    .eq('id', table.id);

                // Find active order group
                const { data: activeOG } = await supabase
                    .from('order_groups')
                    .select('id')
                    .eq('table_id', table.id)
                    .eq('status', 'active')
                    .order('created_at', { ascending: false })
                    .limit(1);

                if (activeOG && activeOG.length > 0 && supervisorId) {
                    const orderGroupId = activeOG[0].id;
                    await supabase
                        .from('order_groups')
                        .update({ status: 'cancelled' })
                        .eq('id', orderGroupId);
                    
                    // Mark all active kitchen orders as cancelled
                    await supabase
                        .from('kitchen_orders')
                        .update({ status: 'cancelled', cancelled_at: new Date().toISOString(), cancelled_by: supervisorId })
                        .eq('order_group_id', orderGroupId);
                }
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

    // Active calls management
    const acceptCall = async (call: any) => {
        if (!activeWaiterId) {
            toast.error("Önce giriş yapmalısınız!");
            setShowWaiterModal(true);
            return;
        }
        try {
            const { error } = await supabase
                .from('table_calls')
                .update({
                    status: 'accepted',
                    assigned_to: activeWaiterId,
                    assigned_waiter_name: activeWaiterName,
                    accepted_at: new Date().toISOString()
                })
                .eq('id', call.id);

            if (error) throw error;
            toast.success("Çağrıyı kabul ettiniz!");
            fetchActiveCalls();
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    const resolveCall = async (call: any) => {
        try {
            const { error } = await supabase
                .from('table_calls')
                .update({
                    status: 'resolved',
                    resolved_by: activeWaiterId,
                    resolved_at: new Date().toISOString()
                })
                .eq('id', call.id);

            if (error) throw error;
            toast.success("Çağrı tamamlandı!");
            fetchActiveCalls();
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    // Table state helper
    const getTableCallType = (tableId: string) => {
        const tableCallsList = activeCalls.filter(c => c.table_id === tableId && c.status !== 'resolved');
        if (tableCallsList.length === 0) return null;
        
        const hasBillCall = tableCallsList.some(c => c.call_type === 'bill');
        if (hasBillCall) return 'bill';
        
        return 'calling';
    };

    const getStatusColor = (table: Table) => {
        const callType = getTableCallType(table.id);
        if (callType === 'bill') {
            return 'bg-blue-600/20 border-blue-500/50 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)] animate-pulse';
        }
        if (callType === 'calling') {
            return 'bg-orange-500/20 border-orange-500/50 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.15)] animate-pulse';
        }

        switch (table.status) {
            case 'empty': return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500';
            case 'occupied': return 'bg-rose-500/10 border-rose-500/30 text-rose-500';
            case 'reserved': return 'bg-purple-500/10 border-purple-500/30 text-purple-400';
            case 'dirty': return 'bg-slate-500/10 border-slate-500/30 text-slate-500';
            default: return 'bg-white/5 border-white/10 text-white';
        }
    };

    const getStatusLabel = (table: Table) => {
        const callType = getTableCallType(table.id);
        if (callType === 'bill') return 'Hesap İstiyor';
        if (callType === 'calling') return 'Çağrı Var';

        switch (table.status) {
            case 'empty': return 'Boş';
            case 'occupied': return 'Dolu';
            case 'reserved': return 'Rezerve';
            case 'dirty': return 'Kirli';
            default: return table.status;
        }
    };

    const filteredTables = tables.filter(t => {
        const matchesSection = t.section === activeSection;
        if (!matchesSection) return false;

        const isWaiter = activeWaiterRole === 'Waiter' || activeWaiterRole === 'Garson';
        if (isWaiter && activeWaiterId) {
            return t.assigned_waiter_id === activeWaiterId || !t.assigned_waiter_id;
        }
        return true;
    });
    const orderTotal = tableOrders.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0);

    return (
        <div className="min-h-screen bg-[#020617] text-white pb-24">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-[#020617]/80 backdrop-blur-xl border-b border-white/10 px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition">
                        <ArrowLeft className="w-5 h-5 text-slate-300" />
                    </button>
                    <h1 className="text-xl font-black flex items-center gap-2">
                        <Utensils className="w-5 h-5 text-blue-400" /> Adisyon
                    </h1>
                </div>

                <div className="flex items-center gap-2">
                    {/* Active Calls Bell */}
                    <button 
                        onClick={() => setShowCallsDrawer(true)}
                        className="relative p-2 bg-white/5 hover:bg-white/10 rounded-xl transition flex items-center justify-center border border-white/5"
                    >
                        <Bell className="w-5 h-5 text-orange-400" />
                        {activeCalls.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-black text-white">
                                {activeCalls.length}
                            </span>
                        )}
                    </button>

                    {/* Waiter Profile Button */}
                    <button 
                        onClick={() => setShowWaiterModal(true)} 
                        className="flex items-center gap-1.5 px-3 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl text-xs font-black"
                    >
                        <span>🤵 {activeWaiterName || 'Giriş'}</span>
                        <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                </div>
            </header>

            {/* Sections Tab Bar */}
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

            {/* Tables Grid */}
            <div className="px-4">
                {loading && !selectedTable ? (
                    <div className="flex justify-center py-20">
                        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : filteredTables.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {filteredTables.map((table) => {
                            const callType = getTableCallType(table.id);
                            return (
                                <motion.button
                                    key={table.id}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setSelectedTable(table)}
                                    className={`flex flex-col items-center justify-center p-4 rounded-3xl border-2 transition-all h-32 ${getStatusColor(table)} relative overflow-hidden`}
                                >
                                    <Utensils className={`w-8 h-8 mb-2 opacity-80 ${table.status === 'empty' ? 'text-emerald-400' : table.status === 'occupied' ? 'text-rose-400' : 'text-amber-400'}`} />
                                    <h3 className="font-black text-lg">{table.name}</h3>
                                    
                                    {table.assigned_waiter_name && (
                                        <span className="text-[8px] font-bold text-slate-400 mt-0.5 truncate max-w-full">
                                            🤵 {table.assigned_waiter_name}
                                        </span>
                                    )}

                                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-full">
                                        <Users className="w-3 h-3 text-slate-400" />
                                        <span className="text-[10px] font-bold">{table.capacity}</span>
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-70">
                                        {getStatusLabel(table)}
                                    </span>
                                </motion.button>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-20 tracking-widest uppercase font-black text-xs opacity-50">
                        Bu bölümde masa yok
                    </div>
                )}
            </div>

            {/* Selected Table / Order Detail Drawer */}
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
                            <div className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase ${getStatusColor(selectedTable)}`}>
                                {getStatusLabel(selectedTable)}
                            </div>
                        </header>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {/* Ownership indicator */}
                            {selectedTable.assigned_waiter_name ? (
                                <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl text-xs font-bold text-center">
                                    Masa Sorumlusu: {selectedTable.assigned_waiter_name}
                                </div>
                            ) : (
                                <div className="p-3 bg-slate-500/5 border border-slate-500/10 text-slate-400 rounded-2xl text-xs font-bold text-center">
                                    Bu masanın henüz sorumlusu yok. İlk işlemde siz olacaksınız.
                                </div>
                            )}

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
                            <div className="flex-1 flex items-center gap-2">
                                <div className="relative flex-1">
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
                            </div>
                        </header>

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

                        <div className="flex-1 overflow-y-auto p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] space-y-2 no-scrollbar">
                            {displayedProducts.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => addToOrder(p)}
                                    className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 active:scale-95 transition-all rounded-2xl border border-white/5"
                                >
                                    <div className="text-left">
                                        <p className="font-bold text-white text-sm">{p.name}</p>
                                        <p className="text-[10px] text-slate-400 font-mono mt-0.5 opacity-60">Stok: {p.stock_quantity}</p>
                                    </div>
                                    <span className="font-black text-blue-400">₺{p.sale_price}</span>
                                </button>
                            ))}

                            {filteredProducts.length > visibleCount && (
                                <button 
                                    onClick={() => setVisibleCount(v => v + 30)}
                                    className="w-full py-4 text-[10px] font-black uppercase text-slate-500 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-white/5 rounded-2xl mt-4"
                                >
                                    <ChevronDown className="w-5 h-5" />
                                    Daha Fazla Göster ({filteredProducts.length - visibleCount} ürün daha var)
                                </button>
                            )}

                            {displayedProducts.length === 0 && (
                                <div className="text-center py-20 opacity-30 flex flex-col items-center">
                                    <Search className="w-12 h-12 mb-4" />
                                    <p className="text-xs font-black uppercase tracking-widest">Ürün bulunamadı.</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Waiter Selection Modal — PIN Keypad */}
            <AnimatePresence>
                {showWaiterModal && (
                    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/95 backdrop-blur-md" />
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="relative w-full max-w-sm bg-slate-950 border border-white/10 p-6 rounded-[2.5rem] text-center text-white"
                        >
                            <Award className="w-12 h-12 text-[#2D6BFF] mx-auto mb-3" />
                            <h2 className="text-lg font-black uppercase tracking-tight">Çalışan Girişi</h2>
                            <p className="text-xs text-slate-400 mb-6 font-bold">Lütfen PIN kodunuzu giriniz</p>

                            {pinError && (
                                <p className="text-xs font-bold text-rose-500 mb-4 bg-rose-500/10 py-2 rounded-xl">
                                    {pinError}
                                </p>
                            )}

                            {/* Dot Indicators */}
                            <div className="flex justify-center gap-3 mb-6">
                                {[...Array(4)].map((_, i) => (
                                    <div 
                                        key={i}
                                        className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-300 ${
                                            waiterPin.length > i 
                                            ? 'bg-[#2D6BFF] border-[#2D6BFF] scale-110' 
                                            : 'border-white/20 bg-white/5'
                                        }`}
                                    />
                                ))}
                                <div className="w-px h-3.5 bg-white/10 self-center" />
                                {[...Array(2)].map((_, i) => (
                                    <div 
                                        key={i+4}
                                        className={`w-3 h-3 rounded-full border-2 border-dashed transition-all duration-300 ${
                                            waiterPin.length > i+4 
                                            ? 'bg-[#2D6BFF] border-[#2D6BFF]' 
                                            : 'border-white/10'
                                        }`}
                                    />
                                ))}
                            </div>

                            {/* Mobile Keypad */}
                            <div className="grid grid-cols-3 gap-3">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                    <button
                                        key={num}
                                        onClick={() => {
                                            if (waiterPin.length < 6) {
                                                const nextPin = waiterPin + num;
                                                setWaiterPin(nextPin);
                                                setPinError("");
                                                if (nextPin.length >= 4) {
                                                    handlePinSubmit(nextPin);
                                                }
                                            }
                                        }}
                                        className="h-14 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 active:scale-95 text-lg font-bold transition-all"
                                    >
                                        {num}
                                    </button>
                                ))}
                                <button
                                    onClick={() => {
                                        setWaiterPin("");
                                        setPinError("");
                                    }}
                                    className="h-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold text-xs active:scale-95 transition-all"
                                >
                                    TEMİZLE
                                </button>
                                <button
                                    onClick={() => {
                                        if (waiterPin.length < 6) {
                                            const nextPin = waiterPin + "0";
                                            setWaiterPin(nextPin);
                                            setPinError("");
                                            if (nextPin.length >= 4) {
                                                handlePinSubmit(nextPin);
                                            }
                                        }
                                    }}
                                    className="h-14 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 active:scale-95 text-lg font-bold transition-all"
                                >
                                    0
                                </button>
                                <button
                                    onClick={() => {
                                        setWaiterPin(prev => prev.slice(0, -1));
                                    }}
                                    className="h-14 rounded-2xl bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs active:scale-95 transition-all"
                                >
                                    SİL
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Supervisor PIN Keypad Modal */}
            <AnimatePresence>
                {showSupervisorModal && (
                    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/95 backdrop-blur-md" />
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="relative w-full max-w-sm bg-slate-950 border border-white/10 p-6 rounded-[2.5rem] text-center text-white"
                        >
                            <button 
                                onClick={() => {
                                    setShowSupervisorModal(false);
                                    setSupervisorPin("");
                                    setSupervisorError("");
                                }}
                                className="absolute top-4 right-4 p-2 bg-white/5 rounded-full hover:bg-white/10 transition"
                            >
                                <X className="w-4 h-4 text-slate-300" />
                            </button>
                            <Award className="w-12 h-12 text-rose-500 mx-auto mb-3 animate-pulse" />
                            <h2 className="text-lg font-black uppercase tracking-tight text-rose-500">Müdür Onayı Gerekli</h2>
                            <p className="text-xs text-slate-400 mb-6 font-bold">Sipariş azaltma/iptal işlemi için yetkili PIN giriniz</p>

                            {supervisorError && (
                                <p className="text-xs font-bold text-rose-500 mb-4 bg-rose-500/10 py-2 rounded-xl px-2">
                                    {supervisorError}
                                </p>
                            )}

                            {/* Dot Indicators */}
                            <div className="flex justify-center gap-3 mb-6">
                                {[...Array(4)].map((_, i) => (
                                    <div 
                                        key={i}
                                        className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-300 ${
                                            supervisorPin.length > i 
                                            ? 'bg-rose-500 border-rose-500 scale-110' 
                                            : 'border-white/20 bg-white/5'
                                        }`}
                                    />
                                ))}
                                <div className="w-px h-3.5 bg-white/10 self-center" />
                                {[...Array(2)].map((_, i) => (
                                    <div 
                                        key={i+4}
                                        className={`w-3 h-3 rounded-full border-2 border-dashed transition-all duration-300 ${
                                            supervisorPin.length > i+4 
                                            ? 'bg-rose-500 border-rose-500' 
                                            : 'border-white/10'
                                        }`}
                                    />
                                ))}
                            </div>

                            {/* Mobile Keypad */}
                            <div className="grid grid-cols-3 gap-3">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                    <button
                                        key={num}
                                        onClick={() => {
                                            if (supervisorPin.length < 6) {
                                                const nextPin = supervisorPin + num;
                                                setSupervisorPin(nextPin);
                                                setSupervisorError("");
                                                if (nextPin.length >= 4) {
                                                    handleSupervisorPinSubmit(nextPin);
                                                }
                                            }
                                        }}
                                        className="h-14 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 active:scale-95 text-lg font-bold transition-all"
                                    >
                                        {num}
                                    </button>
                                ))}
                                <button
                                    onClick={() => {
                                        setSupervisorPin("");
                                        setSupervisorError("");
                                    }}
                                    className="h-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold text-xs active:scale-95 transition-all"
                                >
                                    TEMİZLE
                                </button>
                                <button
                                    onClick={() => {
                                        if (supervisorPin.length < 6) {
                                            const nextPin = supervisorPin + "0";
                                            setSupervisorPin(nextPin);
                                            setSupervisorError("");
                                            if (nextPin.length >= 4) {
                                                handleSupervisorPinSubmit(nextPin);
                                            }
                                        }
                                    }}
                                    className="h-14 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 active:scale-95 text-lg font-bold transition-all"
                                >
                                    0
                                </button>
                                <button
                                    onClick={() => {
                                        setSupervisorPin(prev => prev.slice(0, -1));
                                    }}
                                    className="h-14 rounded-2xl bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs active:scale-95 transition-all"
                                >
                                    SİL
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Calls Queue Drawer */}
            <AnimatePresence>
                {showCallsDrawer && (
                    <div className="fixed inset-0 z-[130] flex items-end">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                            onClick={() => setShowCallsDrawer(false)} 
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
                        />
                        <motion.div 
                            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                            className="relative w-full bg-[#0b1329] border-t border-white/10 rounded-t-[2.5rem] p-6 max-h-[80vh] flex flex-col"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-lg font-black uppercase flex items-center gap-2">
                                        <Bell className="w-5 h-5 text-orange-400" /> Çağrı Bildirimleri
                                    </h2>
                                    <p className="text-xs text-slate-400 font-bold">Müşteri istekleri ve masa çağrıları</p>
                                </div>
                                <button onClick={() => setShowCallsDrawer(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-3 pb-6 no-scrollbar">
                                {activeCalls.map(call => {
                                    const isAccepted = call.status === 'accepted';
                                    const isMyCall = call.assigned_to === activeWaiterId;

                                    return (
                                        <div key={call.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col gap-3">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span className="text-xs font-black text-blue-400 uppercase tracking-wider">{call.table_name}</span>
                                                    <p className="text-sm font-bold text-white mt-0.5">
                                                        {call.call_type === 'waiter' ? '🛎️ Garson Çağırıyor' :
                                                         call.call_type === 'bill' ? '🧾 Hesap İstiyor' :
                                                         call.call_type === 'water' ? '💧 Su İstiyor' : '❓ Yardım Çağrısı'}
                                                    </p>
                                                </div>
                                                <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded ${
                                                    isAccepted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/20 text-orange-400 animate-pulse'
                                                }`}>
                                                    {isAccepted ? `${call.assigned_waiter_name}` : 'Bekliyor'}
                                                </span>
                                            </div>

                                            <div className="flex gap-2">
                                                {!isAccepted ? (
                                                    <button
                                                        onClick={() => acceptCall(call)}
                                                        className="flex-1 py-2 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs uppercase rounded-xl transition-all"
                                                    >
                                                        Kabul Et (Accept)
                                                    </button>
                                                ) : isMyCall ? (
                                                    <button
                                                        onClick={() => resolveCall(call)}
                                                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase rounded-xl transition-all"
                                                    >
                                                        Tamamla (Resolve)
                                                    </button>
                                                ) : (
                                                    <span className="text-[10px] text-slate-500 font-bold italic w-full text-center py-2">
                                                        Bu çağrı başka bir garsona atanmıştır.
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                {activeCalls.length === 0 && (
                                    <div className="text-center py-10 opacity-40">
                                        <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm font-bold">Aktif çağrı bulunamadı.</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <BottomNav />
        </div>
    );
}
