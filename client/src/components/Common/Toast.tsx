"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, XCircle, Info } from "lucide-react";
import { useEffect } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

interface ToastProps {
    message: string;
    type: ToastType;
    isVisible: boolean;
    onClose: () => void;
}

const icons = {
    success: <CheckCircle2 className="w-6 h-6 text-emerald-400" />,
    error: <XCircle className="w-6 h-6 text-rose-400" />,
    warning: <AlertCircle className="w-6 h-6 text-amber-400" />,
    info: <Info className="w-6 h-6 text-blue-400" />,
};

const styles = {
    success: "border-emerald-500/20 bg-emerald-500/10",
    error: "border-rose-500/20 bg-rose-500/10",
    warning: "border-amber-500/20 bg-amber-500/10",
    info: "border-blue-500/20 bg-blue-500/10",
};

export default function Toast({ message, type, isVisible, onClose }: ToastProps) {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                onClose();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isVisible, onClose]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                    className={`fixed bottom-8 right-8 z-[100] flex items-center space-x-4 p-4 pr-6 rounded-2xl border backdrop-blur-xl shadow-2xl shadow-black/50 ${styles[type]}`}
                >
                    <div className="flex-shrink-0">{icons[type]}</div>
                    <div className="flex-1">
                        <p className="font-bold text-white tracking-tight">{message}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-white/10 rounded-lg transition-colors ml-2"
                    >
                        <XCircle className="w-4 h-4 text-white/30" />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
