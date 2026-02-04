"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Clipboard, Scissors, Trash2, CheckCircle2 } from 'lucide-react';

interface ContextMenuState {
    visible: boolean;
    x: number;
    y: number;
    target: HTMLElement | null;
    selectedText: string;
}

export default function ContextMenu() {
    const [menu, setMenu] = useState<ContextMenuState>({
        visible: false,
        x: 0,
        y: 0,
        target: null,
        selectedText: ''
    });

    const [feedback, setFeedback] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const handleContextMenu = useCallback((e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const selection = window.getSelection()?.toString() || '';

        e.preventDefault();

        // Calculate position to prevent menu going off-screen
        let x = e.clientX;
        let y = e.clientY;
        const menuWidth = 180;
        const menuHeight = 200;

        if (x + menuWidth > window.innerWidth) x = x - menuWidth;
        if (y + menuHeight > window.innerHeight) y = y - menuHeight;

        setMenu({
            visible: true,
            x: x,
            y: y,
            target,
            selectedText: selection
        });
    }, []);

    const closeMenu = useCallback(() => {
        setMenu(prev => ({ ...prev, visible: false }));
        setTimeout(() => setFeedback(null), 200);
    }, []);

    useEffect(() => {
        window.addEventListener('contextmenu', handleContextMenu);
        window.addEventListener('click', closeMenu);
        window.addEventListener('scroll', closeMenu);
        return () => {
            window.removeEventListener('contextmenu', handleContextMenu);
            window.removeEventListener('click', closeMenu);
            window.removeEventListener('scroll', closeMenu);
        };
    }, [handleContextMenu, closeMenu]);

    const handleAction = async (action: string) => {
        if (!menu.target) return;

        try {
            switch (action) {
                case 'copy':
                    const textToCopy = menu.selectedText ||
                        (menu.target as HTMLInputElement).value ||
                        menu.target.innerText;
                    if (textToCopy) {
                        await navigator.clipboard.writeText(textToCopy);
                        setFeedback('Kopyalandı!');
                    }
                    break;
                case 'paste':
                    const pastedText = await navigator.clipboard.readText();
                    if ('value' in menu.target) {
                        const input = menu.target as HTMLInputElement;
                        const start = input.selectionStart || 0;
                        const end = input.selectionEnd || 0;
                        const currentVal = input.value;
                        input.value = currentVal.substring(0, start) + pastedText + currentVal.substring(end);
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                        setFeedback('Yapıştırıldı!');
                    }
                    break;
                case 'cut':
                    if ('value' in menu.target) {
                        const input = menu.target as HTMLInputElement;
                        const selection = input.value.substring(input.selectionStart || 0, input.selectionEnd || 0);
                        if (selection) {
                            await navigator.clipboard.writeText(selection);
                            input.value = input.value.substring(0, input.selectionStart || 0) +
                                input.value.substring(input.selectionEnd || 0);
                            input.dispatchEvent(new Event('input', { bubbles: true }));
                            setFeedback('Kesildi!');
                        }
                    }
                    break;
                case 'clear':
                    if ('value' in menu.target) {
                        (menu.target as HTMLInputElement).value = '';
                        menu.target.dispatchEvent(new Event('input', { bubbles: true }));
                        setFeedback('Temizlendi!');
                    }
                    break;
            }

            if (feedback || true) { // Always close with delay if action performed
                setTimeout(closeMenu, 600);
            }
        } catch (err) {
            console.error('Context menu action error:', err);
            closeMenu();
        }
    };

    const isInput = menu.target ? (menu.target.tagName === 'INPUT' || menu.target.tagName === 'TEXTAREA') : false;
    const hasSelection = menu.selectedText.length > 0;
    const hasValue = isInput && (menu.target as HTMLInputElement).value?.length > 0;

    return (
        <AnimatePresence>
            {menu.visible && (
                <motion.div
                    ref={menuRef}
                    initial={{ opacity: 0, scale: 0.95, y: 5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="fixed z-[9999] min-w-[180px] bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-1.5 overflow-hidden"
                    style={{ left: menu.x, top: menu.y }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Copy / Cut */}
                    {(hasSelection || isInput || menu.target?.innerText) && (
                        <>
                            <button
                                onClick={() => handleAction('copy')}
                                className="w-full flex items-center justify-between px-3 py-2.5 text-xs text-secondary hover:text-white hover:bg-white/5 rounded-xl transition-all group"
                            >
                                <div className="flex items-center gap-2.5">
                                    <Copy className="w-4 h-4" />
                                    <span className="font-medium">Kopyala</span>
                                </div>
                                <span className="text-[10px] opacity-20 group-hover:opacity-40 font-mono">Ctrl+C</span>
                            </button>
                            {isInput && hasSelection && (
                                <button
                                    onClick={() => handleAction('cut')}
                                    className="w-full flex items-center justify-between px-3 py-2.5 text-xs text-secondary hover:text-white hover:bg-white/5 rounded-xl transition-all group"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <Scissors className="w-4 h-4" />
                                        <span className="font-medium">Kes</span>
                                    </div>
                                    <span className="text-[10px] opacity-20 group-hover:opacity-40 font-mono">Ctrl+X</span>
                                </button>
                            )}
                            <div className="my-1 border-t border-white/5" />
                        </>
                    )}

                    {/* Paste */}
                    {isInput && (
                        <button
                            onClick={() => handleAction('paste')}
                            className="w-full flex items-center justify-between px-3 py-2.5 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-xl transition-all group"
                        >
                            <div className="flex items-center gap-2.5">
                                <Clipboard className="w-4 h-4" />
                                <span className="font-medium">Yapıştır</span>
                            </div>
                            <span className="text-[10px] opacity-20 group-hover:opacity-40 font-mono">Ctrl+V</span>
                        </button>
                    )}

                    {/* Clear */}
                    {isInput && hasValue && (
                        <button
                            onClick={() => handleAction('clear')}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-all mt-1"
                        >
                            <Trash2 className="w-4 h-4" />
                            <span className="font-medium">Temizle</span>
                        </button>
                    )}

                    {/* Info */}
                    {!isInput && !hasSelection && !menu.target?.innerText && (
                        <div className="px-3 py-3 text-center">
                            <p className="text-[10px] text-secondary/40 font-bold uppercase tracking-widest">JetPos Actions</p>
                        </div>
                    )}

                    {/* Feedback Overlay */}
                    <AnimatePresence>
                        {feedback && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-emerald-500 flex flex-col items-center justify-center z-10"
                            >
                                <motion.div
                                    initial={{ scale: 0.5 }}
                                    animate={{ scale: 1 }}
                                    className="flex flex-col items-center gap-2"
                                >
                                    <CheckCircle2 className="w-6 h-6 text-white" />
                                    <span className="text-white font-black text-[10px] uppercase tracking-tighter">{feedback}</span>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
