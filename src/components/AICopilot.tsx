'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { 
    Brain, Send, Loader2, Sparkles, X,
    ChevronRight, ArrowUpRight, Zap, RefreshCw,
    BarChart3, Users, Wallet, Dumbbell
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    type?: 'text' | 'data_list' | 'kpi_card';
    data?: any;
}

interface CopilotResponse {
    type: 'text' | 'data_list' | 'kpi_card';
    message: string;
    data?: any;
    suggestedPrompts: string[];
}

export function AICopilot() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showTip, setShowTip] = useState(false);
    const [tipText, setTipText] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Otomatik kaydır
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isLoading]);

    // Sayfa değiştiğinde reset ve İpucu Göster
    useEffect(() => {
        setMessages([]); 
        setSuggestions([]);
        setIsLoading(false);
        setInput('');
        
        const isAdmin = pathname?.startsWith('/admin');
        const isTrainer = pathname?.startsWith('/trainer');
        const isMember = !isAdmin && !isTrainer;

        // Role-based and context-aware tips
        const tips = {
            admin: {
                members: [
                    "Riskli üyeleri görelim mi? 🧐",
                    "Yeni kayıtları incele 📈",
                    "Devamsızlık yapanlar var ⚠️",
                    "Üye analizi yapabilirim 🧠"
                ],
                inventory: [
                    "Stokları kontrol et 📦",
                    "Eksik ürün var mı? 📉",
                    "Envanter raporu hazır 📝"
                ],
                payments: [
                    "Gelir raporuna bakalım mı? 💰",
                    "Bekleyen ödemeler var ⌛",
                    "Finansal analiz yapabilirim 📊"
                ],
                default: [
                    "Salon yönetimi için hazırım 👋",
                    "Verilere göz atalım mı? 🔎",
                    "Sana nasıl yardım edebilirim? 🤖",
                    "İşlem geçmişini inceleyelim mi? 📜"
                ]
            },
            trainer: {
                clients: [
                    "Danışanların ne durumda? 💪",
                    "Performans analizi yapalım 🔥",
                    "Gelişimi duran üyeler var 📉"
                ],
                workouts: [
                    "Program verimliliği nasıl? 🏋️",
                    "Yeni şablonlar oluşturalım mı? ✨",
                    "En çok tercih edilen egzersizler 🧠"
                ],
                default: [
                    "PT asistanın burada! 👋",
                    "Bugünkü seanslara bakalım mı? 📅",
                    "Danışan özetini çıkarabilirim 📝"
                ]
            },
            member: {
                workouts: [
                    "Antrenman performansın artıyor! 🔥",
                    "Sıradaki hareketine bakalım mı? 🏋️",
                    "Bugün hangi bölgeyi çalışıyoruz? 💪"
                ],
                measurements: [
                    "Değişimi grafiklerle gör 📊",
                    "Hedefine ne kadar kaldı? 🎯",
                    "Ölçümlerini analiz edelim 📏"
                ],
                history: [
                    "Bu ayki salon devamlılığın 📅",
                    "En aktif olduğun saatler ⏰",
                    "Ziyaret özetini ister misin? ⚡"
                ],
                default: [
                    "Spora hazır mısın? 👋",
                    "Gelişimini takip ediyorum 📈",
                    "Sana nasıl destek olabilirim? 🤖",
                    "Bugün harika görünüyorsun! ✨"
                ]
            }
        };

        let pool = [];
        
        if (isAdmin) {
            if (pathname?.includes('members')) pool = tips.admin.members;
            else if (pathname?.includes('inventory')) pool = tips.admin.inventory;
            else if (pathname?.includes('payments')) pool = tips.admin.payments;
            else pool = tips.admin.default;
        } else if (isTrainer) {
            if (pathname?.includes('clients')) pool = tips.trainer.clients;
            else if (pathname?.includes('workouts')) pool = tips.trainer.workouts;
            else pool = tips.trainer.default;
        } else {
            if (pathname?.includes('workouts')) pool = tips.member.workouts;
            else if (pathname?.includes('measurements')) pool = tips.member.measurements;
            else if (pathname?.includes('history')) pool = tips.member.history;
            else pool = tips.member.default;
        }

        // Rastgele seçim
        const randomTip = pool[Math.floor(Math.random() * pool.length)];
        setTipText(randomTip);
        
        // 1 saniye sonra göster, 5 saniye sonra gizle
        const showTimer = setTimeout(() => setShowTip(true), 1500);
        const hideTimer = setTimeout(() => setShowTip(false), 6000);

        return () => {
            clearTimeout(showTimer);
            clearTimeout(hideTimer);
        };
    }, [pathname]);

    // Açıldığında input'a odaklan
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    async function handleSendMessage(text?: string) {
        const messageText = text || input.trim();
        if ((isLoading && !text) || !messageText) return;

        // UI'ı tazelemek için kullanıcı mesajını ekle (son 3 mesajı tutalım)
        setMessages(prev => [...prev.slice(-4), { role: 'user', content: messageText }]);
        setInput('');
        setIsLoading(true);

        try {
            const role = pathname?.startsWith('/admin') ? 'admin' : 
                         pathname?.startsWith('/trainer') ? 'trainer' : 'member';

            const response = await fetch('/api/ai/copilot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: messageText,
                    context: { role, page: pathname },
                    history: messages.slice(-6).map(m => ({ 
                        role: m.role === 'user' ? 'user' : 'model', 
                        parts: [{ text: m.content }] 
                    }))
                })
            });

            const data: CopilotResponse = await response.json();
            
            if (data.message) {
                setMessages(prev => [...prev, { 
                    role: 'assistant', 
                    content: data.message,
                    type: data.type,
                    data: data.data
                }]);
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: 'Anlaşılamadı, tekrar dener misin?' }]);
            }
            
            setSuggestions(data.suggestedPrompts || []);
            // Input'a tekrar odaklan (Follow-up için)
            setTimeout(() => inputRef.current?.focus(), 100);

        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Bağlantı hatası oluştu.' }]);
        } finally {
            setIsLoading(false);
        }
    }

    if (pathname === '/admin/ai') return null;

    return (
        <>
            {/* Proactive Context Tip Bubble */}
            <AnimatePresence>
                {showTip && !isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, x: '-50%', scale: 0.5 }}
                        animate={{ opacity: 1, y: 0, x: '-50%', scale: 1 }}
                        exit={{ opacity: 0, y: 10, x: '-50%', scale: 0.5 }}
                        transition={{ type: "spring", damping: 15, stiffness: 400 }}
                        className="fixed bottom-20 left-1/2 z-[90] px-4 py-2 bg-zinc-900/95 backdrop-blur-md border border-orange-500/30 rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.5)] pointer-events-none"
                    >
                        <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-zinc-900 border-r border-b border-orange-500/30 rotate-45 transform" />
                        <div className="flex items-center gap-2 overflow-hidden">
                            <Sparkles className="w-3 h-3 text-orange-500 shrink-0" />
                            <div className="text-[10px] md:text-xs font-bold text-white whitespace-nowrap flex">
                                {Array.from(tipText).map((char, index) => (
                                    <motion.span
                                        key={index}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ 
                                            duration: 0.1, 
                                            delay: index * 0.04 + 0.5 
                                        }}
                                    >
                                        {char === " " ? "\u00A0" : char}
                                    </motion.span>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Trigger Button (The Neural Pill) */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 group ${isOpen ? 'translate-y-20 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}
            >
                <div className="relative flex items-center gap-2.5 px-3.5 py-2 md:px-5 md:py-2.5 bg-zinc-950/90 backdrop-blur-xl border border-white/10 rounded-full shadow-[0_0_30px_rgba(0,0,0,0.5)] hover:scale-105 active:scale-95 transition-all">
                    {/* RGB Glow Border */}
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 via-fuchsia-500 to-cyan-500 rounded-full opacity-30 group-hover:opacity-60 blur-sm transition-opacity duration-1000 animate-pulse" />
                    
                    {/* Content */}
                    <div className="relative z-10 flex items-center gap-2.5">
                        <Brain className="w-4 h-4 md:w-5 md:h-5 text-orange-500" />
                        <span className="hidden md:inline text-xs font-black text-white tracking-[0.1em] bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
                            AI&apos;a SOR
                        </span>
                        <div className="w-1 md:w-1.5 h-1 md:h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                    </div>
                </div>
            </button>

            {/* Backdrop (Click to close) */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]"
                    />
                )}
            </AnimatePresence>

            {/* Floating Intelligence Interface */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ y: 20, opacity: 0, scale: 0.95 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 20, opacity: 0, scale: 0.95 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed bottom-24 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-[600px] z-[100] flex flex-col items-center gap-4"
                    >
                        {/* Main Glass Card - Fluid & Organic */}
                        <div className="w-full bg-black/60 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-2xl shadow-black/80 overflow-hidden flex flex-col max-h-[60vh] relative">
                            {/* Ambient Background Glow */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-orange-500/10 blur-[80px] pointer-events-none" />
                            
                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 hide-scrollbar min-h-[250px] relative z-10">
                                {messages.length === 0 && !isLoading && (
                                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                                        <div className="text-center mb-8">
                                            <div className="relative w-20 h-20 mx-auto mb-6">
                                                <div className="absolute inset-0 bg-orange-500 blur-2xl opacity-20 animate-pulse" />
                                                <div className="relative w-full h-full bg-gradient-to-br from-zinc-900 to-black rounded-full border border-white/10 flex items-center justify-center shadow-inner">
                                                    <Brain className="w-8 h-8 text-white" />
                                                </div>
                                            </div>
                                            <h3 className="text-2xl font-black text-white mb-2 tracking-tight">GymBoost AI</h3>
                                            <p className="text-zinc-400 text-sm font-medium">Size nasıl yardımcı olabilirim?</p>
                                        </div>

                                        <button 
                                            onClick={() => handleSendMessage("Bu sayfayı analiz et ve özetle.")}
                                            className="w-full p-1 rounded-[1.5rem] bg-gradient-to-r from-white/5 to-white/0 hover:from-orange-500/20 hover:to-purple-500/20 transition-all duration-500 group"
                                        >
                                            <div className="flex items-center gap-4 p-4 bg-black/40 backdrop-blur-md rounded-[1.3rem] border border-white/5 group-hover:border-white/10 transition-all">
                                                <div className="p-3 bg-zinc-900 rounded-full group-hover:scale-110 transition-transform shadow-lg shadow-black/50">
                                                    <Sparkles className="w-5 h-5 text-orange-500" />
                                                </div>
                                                <div className="text-left">
                                                    <h4 className="text-sm font-bold text-white mb-0.5">Hızlı Analiz Başlat</h4>
                                                    <p className="text-[10px] text-zinc-500 font-medium">Mevcut sayfanın özet raporunu oluştur.</p>
                                                </div>
                                                <div className="ml-auto w-8 h-8 bg-white/5 rounded-full flex items-center justify-center group-hover:bg-white/10 transition-colors">
                                                    <ChevronRight className="w-4 h-4 text-zinc-400" />
                                                </div>
                                            </div>
                                        </button>
                                    </div>
                                )}

                                {messages.map((msg, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                                    >
                                        {msg.role === 'assistant' && (
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-800 to-black border border-white/10 flex items-center justify-center shrink-0 shadow-lg">
                                                <Brain className="w-4 h-4 text-orange-500" />
                                            </div>
                                        )}
                                        
                                        <div className={`flex-1 p-5 rounded-[1.5rem] shadow-lg ${
                                            msg.role === 'user' 
                                            ? 'bg-gradient-to-br from-orange-600 to-red-600 text-white rounded-tr-sm' 
                                            : 'bg-zinc-900/80 border border-white/5 text-zinc-200 rounded-tl-sm'
                                        }`}>
                                            <div className="prose prose-invert prose-sm max-w-none">
                                                <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                            </div>
                                            {/* Data Cards */}
                                            {msg.type === 'data_list' && msg.data && (
                                                <div className="mt-4 grid gap-2">
                                                    {msg.data.map((item: any, idx: number) => (
                                                        <div key={idx} className="flex items-center justify-between p-3.5 bg-black/30 rounded-2xl border border-white/5 hover:bg-black/50 transition-colors">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-2 h-2 rounded-full ${item.status === 'danger' ? 'bg-red-500 shadow-[0_0_8px_red]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]'}`} />
                                                                <span className="text-sm font-bold text-white">{item.name}</span>
                                                            </div>
                                                            <span className="text-[10px] font-mono text-zinc-400 bg-white/5 px-2 py-1 rounded-lg">{item.info || item.date}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                                
                                {isLoading && (
                                    <div className="flex gap-4">
                                        <div className="w-8 h-8 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center shrink-0">
                                            <Brain className="w-4 h-4 text-zinc-600 animate-pulse" />
                                        </div>
                                        <div className="p-4 bg-zinc-900/50 rounded-[1.5rem] rounded-tl-sm flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                            <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                            <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" />
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        {/* Detached Floating Input Bar */}
                        <div className="w-full relative group px-1 pb-1">
                            {/* Ambient Glow */}
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500/30 via-purple-500/30 to-cyan-500/30 rounded-full opacity-0 group-hover:opacity-100 blur-xl transition duration-1000" />
                            
                            <div className="relative flex items-center bg-black/80 backdrop-blur-xl rounded-full border border-white/10 focus-within:border-orange-500/50 focus-within:ring-1 focus-within:ring-orange-500/20 transition-all shadow-xl">
                                <div className="pl-5 pr-3 text-orange-500">
                                    <Sparkles className="w-5 h-5 animate-pulse" />
                                </div>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Bir soru sor..."
                                    className="flex-1 bg-transparent border-none outline-none ring-0 py-4 text-sm text-white placeholder-zinc-500"
                                />
                                
                                {/* Quick Suggestions (Inside Input Bar) */}
                                {suggestions.length > 0 && !isLoading && (
                                    <div className="hidden md:flex gap-1.5 mr-2">
                                        {suggestions.slice(0, 2).map((s, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handleSendMessage(s)}
                                                className="px-3 py-1.5 bg-white/5 hover:bg-white/15 rounded-full text-[10px] font-bold text-zinc-400 hover:text-white transition-all border border-white/5 whitespace-nowrap"
                                            >
                                                {s.length > 15 ? s.substring(0, 15) + '...' : s}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <div className="pr-2">
                                    <button
                                        onClick={() => handleSendMessage()}
                                        disabled={!input.trim() || isLoading}
                                        className="p-2.5 bg-zinc-800 hover:bg-white text-zinc-400 hover:text-black rounded-full transition-all disabled:opacity-50 disabled:hover:bg-zinc-800 disabled:hover:text-zinc-400"
                                    >
                                        <ArrowUpRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}