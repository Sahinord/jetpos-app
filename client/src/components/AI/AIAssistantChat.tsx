"use client";

import { useState, useEffect, useRef } from "react";
import {
    Send, Sparkles, User, Bot, RefreshCw, Key,
    Trash2, MessageSquare, Maximize2, Minimize2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AIClient } from "@/lib/gemini";
import { supabase } from "@/lib/supabase";
import { useTenant } from "@/lib/tenant-context";
import ReactMarkdown from "react-markdown";

interface Message {
    role: 'user' | 'model';
    text: string;
    timestamp: Date;
}

export default function AIAssistantChat() {
    const { currentTenant } = useTenant();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [apiKey, setApiKey] = useState('');
    const [showKeyInput, setShowKeyInput] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchGeminiSettings();
    }, [currentTenant]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchGeminiSettings = async () => {
        if (!currentTenant) return;
        try {
            // 1. Önce lisansa (tenant) ait doğrudan key'e bak (Admin panelden girilen)
            if (currentTenant.openrouter_api_key && currentTenant.openrouter_api_key !== 'undefined') {
                setApiKey(currentTenant.openrouter_api_key);
                setupGreeting();
                setShowKeyInput(false);
                return;
            }

            const { data } = await supabase
                .from('integration_settings')
                .select('settings')
                .eq('tenant_id', currentTenant.id)
                .eq('type', 'gemini_ai')
                .single();

            // 2. Entegrasyon ayarlarından bak
            if (data && data.settings.apiKey && data.settings.apiKey !== 'undefined' && data.settings.apiKey !== '') {
                setApiKey(data.settings.apiKey);
                setupGreeting();
                setShowKeyInput(false);
            }
            // 3. ENV'den bak
            else if (process.env.NEXT_PUBLIC_OPENROUTER_API_KEY && process.env.NEXT_PUBLIC_OPENROUTER_API_KEY !== 'undefined') {
                setApiKey(process.env.NEXT_PUBLIC_OPENROUTER_API_KEY);
                setupGreeting();
                setShowKeyInput(false);
            }
            else {
                setShowKeyInput(true);
            }
        } catch (err) {
            if (process.env.NEXT_PUBLIC_OPENROUTER_API_KEY && process.env.NEXT_PUBLIC_OPENROUTER_API_KEY !== 'undefined') {
                setApiKey(process.env.NEXT_PUBLIC_OPENROUTER_API_KEY);
                setupGreeting();
                setShowKeyInput(false);
            } else {
                setShowKeyInput(true);
            }
        }
    };

    const setupGreeting = () => {
        setMessages([{
            role: 'model',
            text: `Selam! Ben JetPos AI asistanın. İşletmenle ilgili her şeyi bana sorabilirsin. Satışlar, stok durumu veya genel öneriler için buradayım!`,
            timestamp: new Date()
        }]);
    };

    const handleSaveKey = async () => {
        if (!apiKey) return;
        try {
            const { error } = await supabase.rpc('upsert_integration_settings', {
                p_tenant_id: currentTenant?.id,
                p_type: 'gemini_ai',
                p_settings: { apiKey: apiKey },
                p_is_active: true
            });

            if (error) throw error;
            setShowKeyInput(false);
            setMessages([{
                role: 'model',
                text: `API Key kaydedildi! Artık sohbet edebiliriz. Sana nasıl yardımcı olabilirim?`,
                timestamp: new Date()
            }]);
        } catch (err: any) {
            alert("Kaydetme hatası: " + err.message);
        }
    };

    const handleSend = async () => {
        if (!input.trim() || loading || !apiKey) return;

        const userMessage: Message = {
            role: 'user',
            text: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setLoading(true);

        try {
            const client = new AIClient(apiKey);

            // Format history for OpenRouter (OpenAI format)
            const history = messages.map(m => ({
                role: (m.role === 'model' ? 'assistant' : 'user') as 'user' | 'assistant' | 'system',
                content: m.text
            }));

            const systemContext = `
                Sen JetPos isimli bir POS ve stok takip yazılımının akıllı asistanısın. 
                İşletme sahibiyle (esnafla) konuşuyorsun. 
                Samimi, yardımsever ama profesyonel bir üslubun olmalı. 
                Kullanıcı adı: ${currentTenant?.company_name || 'Esnaf'}.
                Vergi numarası, stok detayları veya satış analizleri gibi teknik konularda yardımcı olmaya çalış.
                Cevaplarını Markdown formatında ver.
            `;

            const response = await client.getChatResponse(input, history, systemContext);

            const aiMessage: Message = {
                role: 'model',
                text: response,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, aiMessage]);
        } catch (error: any) {
            console.error("AI Assistant Error:", error);

            let displayError = error.message;
            if (displayError.includes("insufficient_balance") || displayError.includes("invalid_api_key") || displayError.includes("API Key eksik")) {
                displayError = "⚠️ DeepSeek API Anahtarı eksik, hatalı veya bakiye yetersiz. Lütfen sağ üstteki anahtar ikonuna tıklayarak geçerli bir DeepSeek API Key girin.";
                setShowKeyInput(true);
            }

            setMessages(prev => [...prev, {
                role: 'model',
                text: displayError,
                timestamp: new Date()
            }]);
        } finally {
            setLoading(false);
        }
    };

    const clearChat = () => {
        if (confirm("Sohbet geçmişini silmek istediğinize emin misiniz?")) {
            setMessages([]);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] max-w-5xl mx-auto glass-card overflow-hidden shadow-2xl relative">
            {/* Header */}
            <div className="p-6 border-b border-white/5 bg-gradient-to-r from-purple-600/10 to-transparent flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                        <Sparkles className="w-5 h-5 text-white animate-pulse" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-white">JetPos AI Asistan</h2>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">Çevrimiçi</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={clearChat}
                        className="p-2 text-secondary hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                        title="Sohbeti Temizle"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setShowKeyInput(!showKeyInput)}
                        className="p-2 text-secondary hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-all"
                    >
                        <Key className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* API Warning if missing */}
            {showKeyInput && (
                <div className="p-4 bg-purple-600/20 border-b border-purple-500/30">
                    <div className="flex gap-3">
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="DeepSeek API Key (sk-...)"
                            className="flex-1 bg-black/30 border border-purple-500/30 rounded-xl px-4 py-2 text-sm text-white focus:border-purple-500 outline-none transition-all"
                        />
                        <button
                            onClick={handleSaveKey}
                            className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-xs"
                        >
                            Kaydet
                        </button>
                    </div>
                </div>
            )}

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {messages.length === 0 && !loading && (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                        <MessageSquare className="w-12 h-12 text-purple-500" />
                        <p className="text-sm font-medium">Henüz bir mesaj yok.<br />Bana işletmenle ilgili her şeyi sorabilirsin!</p>
                    </div>
                )}

                {messages.map((msg, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-lg ${msg.role === 'user' ? 'bg-primary shadow-primary/20' : 'bg-purple-600 shadow-purple-600/20'
                                }`}>
                                {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
                            </div>
                            <div className={`p-4 rounded-2xl shadow-xl ${msg.role === 'user'
                                ? 'bg-primary text-white rounded-tr-none'
                                : 'bg-white/5 border border-white/5 text-foreground rounded-tl-none'
                                }`}>
                                <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-strong:text-purple-400">
                                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                                </div>
                                <div className={`text-[9px] mt-2 opacity-40 font-bold ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}

                {loading && (
                    <div className="flex justify-start">
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-600/20">
                                <Bot className="w-4 h-4 text-white" />
                            </div>
                            <div className="bg-white/5 border border-white/5 p-4 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 bg-white/[0.02] border-t border-white/5">
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl opacity-10 group-focus-within:opacity-25 transition-opacity blur" />
                    <div className="relative flex gap-3">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Mesajınızı yazın..."
                            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-6 py-4 text-sm text-white focus:border-purple-500/50 outline-none transition-all placeholder:text-secondary/30"
                        />
                        <button
                            onClick={handleSend}
                            disabled={loading || !input.trim() || !apiKey}
                            className="px-6 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:hover:bg-purple-600 text-white font-bold transition-all flex items-center justify-center shadow-lg shadow-purple-600/20"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
