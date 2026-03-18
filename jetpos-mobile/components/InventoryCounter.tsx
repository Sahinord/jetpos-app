"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { Camera, X, Flashlight, ScanLine, Check, Save, ArrowLeft, ClipboardCheck, Trash2, Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface InventoryCounterProps {
    countId: string;
    warehouseId: string;
    onClose: () => void;
}

export default function InventoryCounter({ countId, warehouseId, onClose }: InventoryCounterProps) {
    const [scanning, setScanning] = useState(false);
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [torchOn, setTorchOn] = useState(false);
    const [fetching, setFetching] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const readerRef = useRef<BrowserMultiFormatReader | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const controlsRef = useRef<any>(null);

    const isProcessing = useRef(false);
    const scannerActive = useRef(false);

    useEffect(() => {
        const tenantId = localStorage.getItem('tenantId');
        if (tenantId) {
            supabase.rpc('set_current_tenant', { tenant_id: tenantId }).then(() => {
                fetchCountItems();
            });
        }
    }, [countId]);

    useEffect(() => {
        if (scanning) {
            isProcessing.current = false;
            scannerActive.current = true;
            startScanner();
        } else {
            stopScanner();
        }
        return () => stopScanner();
    }, [scanning]);

    const fetchCountItems = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('inventory_count_items')
                .select('*, products(name, barcode, unit)')
                .eq('count_id', countId);
            
            if (data) {
                setItems(data.map(item => ({
                    id: item.id,
                    product_id: item.product_id,
                    name: item.products.name,
                    barcode: item.products.barcode,
                    unit: item.products.unit,
                    counted_quantity: item.counted_quantity,
                    system_quantity: item.system_quantity
                })));
            }
        } catch (error) {
            console.error('Fetch items error:', error);
        } finally {
            setLoading(false);
        }
    };

    const startScanner = async () => {
        try {
            if (controlsRef.current) {
                try { controlsRef.current.stop(); } catch (e) { }
                controlsRef.current = null;
            }

            let videoEl = videoRef.current;
            if (!videoEl) {
                for (let i = 0; i < 20; i++) {
                    await new Promise(r => setTimeout(r, 100));
                    videoEl = videoRef.current;
                    if (videoEl) break;
                }
            }
            if (!videoEl) {
                toast.error('Kamera başlatılamadı.');
                setScanning(false);
                return;
            }

            const reader = new BrowserMultiFormatReader();
            readerRef.current = reader;

            const controls = await reader.decodeFromVideoDevice(
                undefined,
                videoEl,
                (result) => {
                    if (!scannerActive.current || isProcessing.current) return;
                    if (!result) return;

                    const barcode = result.getText();
                    if (!barcode || barcode.length < 3) return;

                    handleBarcodeDetected(barcode);
                }
            );
            controlsRef.current = controls;

            if (videoEl.srcObject) {
                streamRef.current = videoEl.srcObject as MediaStream;
            }
        } catch (error) {
            console.error('Camera error:', error);
            toast.error('Kamera açılamadı.');
            setScanning(false);
        }
    };

    const stopScanner = () => {
        scannerActive.current = false;
        if (controlsRef.current) {
            try { controlsRef.current.stop(); } catch (e) { }
            controlsRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

    const handleBarcodeDetected = async (barcode: string) => {
        isProcessing.current = true;
        playBeep();
        if (navigator.vibrate) navigator.vibrate(50);

        try {
            setFetching(true);
            const tenantId = localStorage.getItem('tenantId');
            
            // 1. Find product
            const { data: product, error: pError } = await supabase
                .from('products')
                .select('id, name, barcode, unit, warehouse_stock(quantity)')
                .eq('barcode', barcode)
                .eq('tenant_id', tenantId)
                .eq('warehouse_stock.warehouse_id', warehouseId)
                .single();

            if (product) {
                const system_qty = product.warehouse_stock?.[0]?.quantity || 0;
                await updateCountItem(product.id, 1, system_qty, product.name, product.barcode, product.unit);
            } else {
                toast.error('Ürün bulunamadı: ' + barcode);
            }
        } catch (error) {
            console.error('Scan error:', error);
        } finally {
            setFetching(false);
            // Resume scanning after 1 second delay
            setTimeout(() => {
                isProcessing.current = false;
            }, 1000);
        }
    };

    const updateCountItem = async (productId: string, delta: number, systemQty: number, name: string, barcode: string, unit: string) => {
        const existingIdx = items.findIndex(i => i.product_id === productId);
        let newQty = delta;
        let itemId = null;

        if (existingIdx > -1) {
            newQty = items[existingIdx].counted_quantity + delta;
            itemId = items[existingIdx].id;
        }

        try {
            const difference = newQty - systemQty;
            const { data, error } = await supabase
                .from('inventory_count_items')
                .upsert({
                    count_id: countId,
                    product_id: productId,
                    system_quantity: systemQty,
                    counted_quantity: newQty,
                    difference: difference
                }, { onConflict: 'count_id,product_id' })
                .select()
                .single();
            
            if (error) throw error;

            if (existingIdx > -1) {
                const newItems = [...items];
                newItems[existingIdx].counted_quantity = newQty;
                setItems(newItems);
            } else {
                setItems([{
                    id: data.id,
                    product_id: productId,
                    name,
                    barcode,
                    unit,
                    counted_quantity: newQty,
                    system_quantity: systemQty
                }, ...items]);
            }
            
            toast.success(`${name}: ${newQty} ${unit}`);
        } catch (err) {
            console.error('Update item error:', err);
            toast.error('Güncellenemedi.');
        }
    };

    const removeItem = async (productId: string) => {
        if (!confirm('Çıkarmak istediğinize emin misiniz?')) return;
        try {
            const { error } = await supabase
                .from('inventory_count_items')
                .delete()
                .eq('count_id', countId)
                .eq('product_id', productId);
            
            if (!error) {
                setItems(items.filter(i => i.product_id !== productId));
                toast.success('Ürün çıkarıldı.');
            }
        } catch (err) { }
    };

    const playBeep = () => {
        try {
            const context = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = context.createOscillator();
            const gain = context.createGain();
            osc.connect(gain);
            gain.connect(context.destination);
            osc.frequency.value = 1000;
            gain.gain.value = 0.1;
            osc.start();
            setTimeout(() => {
                osc.stop();
                context.close();
            }, 100);
        } catch (e) { }
    };

    const toggleTorch = async () => {
        if (streamRef.current) {
            const track = streamRef.current.getVideoTracks()[0];
            try {
                await track.applyConstraints({ advanced: [{ torch: !torchOn } as any] });
                setTorchOn(!torchOn);
            } catch (e) { toast.error('Flaş açılmadı.'); }
        }
    };

    const handleComplete = async () => {
        if (!confirm('Sayımı tamamlamak ve stokları güncellemek istediğinize emin misiniz?')) return;
        
        try {
            // Update counts status
            const { error } = await supabase
                .from('inventory_counts')
                .update({ status: 'completed', completed_at: new Date().toISOString() })
                .eq('id', countId);
            
            if (error) throw error;

            // Trigger actual stock update (Same logic as desktop)
            for (const item of items) {
                await supabase
                    .from('warehouse_stock')
                    .upsert([{
                        tenant_id: localStorage.getItem('tenantId'),
                        warehouse_id: warehouseId,
                        product_id: item.product_id,
                        quantity: item.counted_quantity,
                        updated_at: new Date().toISOString()
                    }], { onConflict: 'warehouse_id,product_id' });
            }

            toast.success('Sayım başarıyla tamamlandı!');
            onClose();
        } catch (err: any) {
            toast.error('Hata: ' + err.message);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] bg-slate-900 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="glass border-b border-white/5 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={onClose} className="p-2 glass-dark rounded-xl">
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <p className="text-[10px] font-black tracking-widest text-blue-400 uppercase">Envanter Sayımı</p>
                        <h2 className="text-white font-black">CANLI SAYIM MODU</h2>
                    </div>
                </div>
                <button 
                    onClick={handleComplete}
                    className="bg-emerald-500 px-4 py-2 rounded-xl text-[10px] font-black text-white shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                >
                    BİTİR VE AKTAR
                </button>
            </div>

            <div className="flex-1 flex flex-col">
                {/* Camera / Controls View */}
                <div className="relative aspect-video max-h-[30vh] bg-black">
                    {scanning ? (
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-4 opacity-50">
                            <Camera className="w-12 h-12" />
                            <p className="text-xs font-bold uppercase tracking-widest">Kamera Kapalı</p>
                        </div>
                    )}
                    
                    {/* Scanner Buttons */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                         {scanning && <div className="w-2/3 h-0.5 bg-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,1)] animate-pulse" />}
                    </div>

                    <div className="absolute right-4 bottom-4 flex gap-2">
                        <button onClick={toggleTorch} className={`w-12 h-12 rounded-xl glass flex items-center justify-center ${torchOn ? 'bg-amber-500 text-white' : 'text-white'}`}>
                            <Flashlight size={20} />
                        </button>
                        <button 
                            onClick={() => setScanning(!scanning)}
                            className={`w-12 h-12 rounded-xl glass flex items-center justify-center ${scanning ? 'bg-rose-500 text-white' : 'bg-blue-500 text-white'}`}
                        >
                            {scanning ? <X size={20} /> : <Camera size={20} />}
                        </button>
                    </div>
                </div>

                {/* Items List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#020617]">
                    <AnimatePresence initial={false}>
                        {items.map((item, idx) => (
                            <motion.div 
                                key={item.product_id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="glass-dark p-4 rounded-2xl border border-white/5 flex items-center justify-between gap-4"
                            >
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-black text-white truncate uppercase">{item.name}</h3>
                                    <p className="text-[10px] text-secondary font-mono">{item.barcode}</p>
                                    <p className="text-[10px] mt-1 flex items-center gap-2">
                                        <span className="text-secondary">Sistem: {item.system_quantity}</span>
                                        <span className={`font-black ${item.counted_quantity - item.system_quantity >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            Fark: {item.counted_quantity - item.system_quantity > 0 ? '+' : ''}{item.counted_quantity - item.system_quantity}
                                        </span>
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={() => updateCountItem(item.product_id, -1, item.system_quantity, item.name, item.barcode, item.unit)}
                                        className="w-10 h-10 rounded-lg glass flex items-center justify-center text-rose-400 active:bg-rose-500/20"
                                    >
                                        <Minus size={18} />
                                    </button>
                                    <div className="text-xl font-black text-white min-w-[3ch] text-center">
                                        {item.counted_quantity}
                                    </div>
                                    <button 
                                        onClick={() => updateCountItem(item.product_id, 1, item.system_quantity, item.name, item.barcode, item.unit)}
                                        className="w-10 h-10 rounded-lg glass flex items-center justify-center text-emerald-400 active:bg-emerald-500/20"
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {items.length === 0 && !loading && (
                        <div className="h-full flex flex-col items-center justify-center opacity-20 py-20">
                            <ScanLine size={48} className="mb-4" />
                            <p className="text-xs font-black uppercase tracking-[4px]">Barkod Okutun</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
