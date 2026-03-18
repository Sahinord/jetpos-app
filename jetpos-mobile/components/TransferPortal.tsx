"use client";

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Camera, X, Flashlight, ScanLine, ArrowLeft, Trash2, Plus, Minus, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { BrowserMultiFormatReader } from '@zxing/browser';

interface TransferPortalProps {
    transferId: string;
    fromWarehouseId: string;
    toWarehouseId: string;
    onClose: () => void;
}

export default function TransferPortal({ transferId, fromWarehouseId, toWarehouseId, onClose }: TransferPortalProps) {
    const [scanning, setScanning] = useState(false);
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [torchOn, setTorchOn] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const readerRef = useRef<BrowserMultiFormatReader | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const controlsRef = useRef<any>(null);

    useEffect(() => {
        const tenantId = localStorage.getItem('tenantId');
        if (tenantId) {
            supabase.rpc('set_current_tenant', { tenant_id: tenantId }).then(fetchTransferItems);
        }
    }, [transferId]);

    useEffect(() => {
        if (scanning) {
            startScanner();
        } else {
            stopScanner();
        }
        return () => stopScanner();
    }, [scanning]);

    const fetchTransferItems = async () => {
        try {
            const { data, error } = await supabase
                .from('warehouse_transfer_items')
                .select('*, products(name, barcode, unit)')
                .eq('transfer_id', transferId);
            
            if (data) {
                setItems(data.map(item => ({
                    id: item.id,
                    product_id: item.product_id,
                    name: item.products.name,
                    barcode: item.products.barcode,
                    unit: item.products.unit,
                    quantity: item.quantity
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
            const reader = new BrowserMultiFormatReader();
            readerRef.current = reader;

            const controls = await reader.decodeFromVideoDevice(
                undefined,
                videoRef.current!,
                (result) => {
                    if (isProcessing || !result) return;
                    handleBarcodeDetected(result.getText());
                }
            );
            controlsRef.current = controls;
            if (videoRef.current?.srcObject) {
                streamRef.current = videoRef.current.srcObject as MediaStream;
            }
        } catch (error) {
            toast.error('Kamera başlatılamadı.');
            setScanning(false);
        }
    };

    const stopScanner = () => {
        if (controlsRef.current) controlsRef.current.stop();
        if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };

    const handleBarcodeDetected = async (barcode: string) => {
        setIsProcessing(true);
        if (navigator.vibrate) navigator.vibrate(50);

        try {
            const tenantId = localStorage.getItem('tenantId');
            const { data: product } = await supabase
                .from('products')
                .select('id, name, barcode, unit')
                .eq('barcode', barcode)
                .eq('tenant_id', tenantId)
                .single();

            if (product) {
                await updateTransferItem(product.id, 1, product.name, product.barcode, product.unit);
            } else {
                toast.error('Ürün bulunamadı: ' + barcode);
            }
        } catch (err) {}
        
        setTimeout(() => setIsProcessing(false), 1000);
    };

    const updateTransferItem = async (productId: string, delta: number, name: string, barcode: string, unit: string) => {
        const existingIdx = items.findIndex(i => i.product_id === productId);
        let newQty = delta;

        if (existingIdx > -1) {
            newQty = items[existingIdx].quantity + delta;
            if (newQty <= 0) return removeItem(productId);
        }

        try {
            const { data, error } = await supabase
                .from('warehouse_transfer_items')
                .upsert({
                    transfer_id: transferId,
                    product_id: productId,
                    quantity: newQty,
                    unit: unit
                }, { onConflict: 'transfer_id,product_id' })
                .select()
                .single();
            
            if (error) throw error;

            if (existingIdx > -1) {
                const newItems = [...items];
                newItems[existingIdx].quantity = newQty;
                setItems(newItems);
            } else {
                setItems([{
                    id: data.id,
                    product_id: productId,
                    name,
                    barcode,
                    unit,
                    quantity: newQty
                }, ...items]);
            }
            toast.success(`${name}: ${newQty} ${unit}`);
        } catch (err) {
            toast.error('Güncellenemedi.');
        }
    };

    const removeItem = async (productId: string) => {
        try {
            await supabase
                .from('warehouse_transfer_items')
                .delete()
                .eq('transfer_id', transferId)
                .eq('product_id', productId);
            setItems(items.filter(i => i.product_id !== productId));
        } catch (err) {}
    };

    const handleCompleteTransfer = async () => {
        if (!confirm('Transferi tamamlamak istiyor musunuz? Stoklar anında güncellenecektir.')) return;
        try {
            const { error } = await supabase
                .from('warehouse_transfers')
                .update({ status: 'completed', updated_at: new Date().toISOString() })
                .eq('id', transferId);
            
            if (error) throw error;
            toast.success('Transfer başarıyla tamamlandı!');
            onClose();
        } catch (err: any) {
            toast.error('Hata: ' + err.message);
        }
    };

    return (
        <div className="fixed inset-0 z-[250] bg-slate-950 flex flex-col">
            <header className="p-4 glass border-b border-white/5 flex items-center justify-between">
                <button onClick={onClose} className="p-2 glass-dark rounded-xl"><ArrowLeft size={18} /></button>
                <div className="text-center">
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Canlı Transfer</p>
                    <h2 className="text-white font-black text-sm">BARKOD MODU</h2>
                </div>
                <button onClick={handleCompleteTransfer} className="bg-emerald-500 px-4 py-2 rounded-xl text-[10px] font-black text-white shadow-lg">TAMAMLA</button>
            </header>

            <div className="relative aspect-video bg-black">
                {scanning && <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-4/5 h-0.5 bg-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,1)] animate-pulse" />
                </div>
                <div className="absolute bottom-4 right-4 flex gap-2">
                    <button onClick={() => setScanning(!scanning)} className={`w-12 h-12 rounded-xl glass flex items-center justify-center ${scanning ? 'bg-rose-500' : 'bg-emerald-500'} text-white`}>
                        {scanning ? <X size={20} /> : <Camera size={20} />}
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#020617]">
                {items.map(item => (
                    <div key={item.product_id} className="glass-dark p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-black text-white truncate">{item.name}</h3>
                            <p className="text-[10px] text-secondary font-mono">{item.barcode}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => updateTransferItem(item.product_id, -1, item.name, item.barcode, item.unit)} className="w-8 h-8 rounded-lg glass flex items-center justify-center text-rose-400"><Minus size={14} /></button>
                            <span className="text-lg font-black text-white min-w-[2ch] text-center">{item.quantity}</span>
                            <button onClick={() => updateTransferItem(item.product_id, 1, item.name, item.barcode, item.unit)} className="w-8 h-8 rounded-lg glass flex items-center justify-center text-emerald-400"><Plus size={14} /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
