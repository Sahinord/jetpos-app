"use client";

import { useState } from "react";
import { Plus, Trash2, Edit2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CategoryManager({ categories, onAdd, onDelete, onClose }: any) {
    const [newName, setNewName] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newName.trim()) {
            onAdd(newName.trim());
            setNewName("");
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card w-full max-w-md max-h-[80vh] flex flex-col"
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">Kategorileri Yönet</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
                    <input
                        type="text"
                        placeholder="Yeni kategori adı..."
                        className="flex-1 bg-white/5 border border-border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-primary/50"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                    />
                    <button
                        type="submit"
                        className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl transition-all"
                    >
                        Ekle
                    </button>
                </form>

                <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                    {categories.map((cat: any) => (
                        <div
                            key={cat.id}
                            className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-border group"
                        >
                            <span className="font-medium text-secondary group-hover:text-white transition-colors">{cat.name}</span>
                            <button
                                onClick={() => onDelete(cat.id)}
                                className="p-1.5 text-rose-500/50 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                    {categories.length === 0 && (
                        <div className="text-center py-8 text-secondary italic">
                            Henüz kategori eklenmemiş.
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
