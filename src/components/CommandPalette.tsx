'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Command, 
    Search, 
    Building2, 
    Users, 
    Activity, 
    Settings, 
    CreditCard,
    Terminal,
    Hash,
    ChevronRight,
    Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

export function CommandPalette() {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [gyms, setGyms] = useState<any[]>([]);
    const router = useRouter();
    const supabase = createClient();

    // -- KEYBOARD & CUSTOM EVENT LISTENER --
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setIsOpen((open) => !open);
            }
            if (e.key === 'Escape') setIsOpen(false);
        };

        const handleOpenEvent = () => setIsOpen(true);

        document.addEventListener('keydown', down);
        window.addEventListener('open-command-palette', handleOpenEvent);
        
        return () => {
            document.removeEventListener('keydown', down);
            window.removeEventListener('open-command-palette', handleOpenEvent);
        };
    }, []);

    // -- LOAD DATA --
    useEffect(() => {
        if (isOpen) {
            const loadGyms = async () => {
                const { data } = await supabase.from('gyms').select('id, name').limit(10);
                if (data) setGyms(data);
            };
            loadGyms();
        }
    }, [isOpen, supabase]);

    const navigation = [
        { title: 'DASHBOARD', icon: Activity, href: '/' },
        { title: 'SALON AĞI', icon: Building2, href: '/gyms' },
        { title: 'ÜYE AĞI', icon: Users, href: '/users' },
        { title: 'GELİR AKIŞI', icon: CreditCard, href: '/revenue' },
        { title: 'SİSTEM SAĞLIĞI', icon: Terminal, href: '/health' },
        { title: 'ANA AYARLAR', icon: Settings, href: '/settings' },
    ];

    const filteredGyms = gyms.filter(g => g.name.toLowerCase().includes(search.toLowerCase()));
    const filteredNav = navigation.filter(n => n.title.toLowerCase().includes(search.toLowerCase()));

    const handleAction = (href: string) => {
        router.push(href);
        setIsOpen(false);
        setSearch('');
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] p-4">
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    onClick={() => setIsOpen(false)} 
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
                />
                
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0, y: -20 }} 
                    animate={{ scale: 1, opacity: 1, y: 0 }} 
                    exit={{ scale: 0.95, opacity: 0, y: -20 }}
                    className="w-full max-w-2xl bg-[#050505] border border-white/10 rounded-[1.5rem] shadow-[0_0_100px_rgba(0,0,0,1)] overflow-hidden relative z-10"
                >
                    {/* Search Input */}
                    <div className="flex items-center px-6 py-5 border-b border-white/[0.05]">
                        <Search className="w-5 h-5 text-zinc-500 mr-4" />
                        <input 
                            autoFocus
                            placeholder="Komut veya düğüm ara... (örn: /gyms)"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="flex-1 bg-transparent border-none outline-none text-base text-white placeholder-zinc-700 font-medium"
                        />
                        <div className="flex items-center gap-1 px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] font-black text-zinc-500">
                            ESC
                        </div>
                    </div>

                    {/* Results */}
                    <div className="max-h-[60vh] overflow-y-auto p-3 space-y-6 hide-scrollbar">
                        {/* Navigation Section */}
                        {filteredNav.length > 0 && (
                            <div className="space-y-1">
                                <p className="px-4 py-2 text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em]">Sistem Navigasyonu</p>
                                {filteredNav.map((item) => (
                                    <button
                                        key={item.href}
                                        onClick={() => handleAction(item.href)}
                                        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/[0.03] rounded-xl transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-zinc-900 border border-white/5 rounded-lg text-zinc-500 group-hover:text-orange-500 transition-colors">
                                                <item.icon className="w-4 h-4" />
                                            </div>
                                            <span className="text-sm font-bold text-zinc-300 group-hover:text-white uppercase tracking-tight">{item.title}</span>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-zinc-800 opacity-0 group-hover:opacity-100 transition-all" />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Salon Section */}
                        {filteredGyms.length > 0 && (
                            <div className="space-y-1">
                                <p className="px-4 py-2 text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em]">Aktif Salonlar</p>
                                {filteredGyms.map((gym) => (
                                    <button
                                        key={gym.id}
                                        onClick={() => handleAction(`/gyms/${gym.id}`)}
                                        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/[0.03] rounded-xl transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-zinc-900 border border-white/5 rounded-lg text-zinc-500 group-hover:text-orange-500 transition-colors">
                                                <Building2 className="w-4 h-4" />
                                            </div>
                                            <div className="text-left">
                                                <span className="text-sm font-bold text-zinc-300 group-hover:text-white uppercase tracking-tight">{gym.name}</span>
                                                <p className="text-[9px] font-mono text-zinc-700 uppercase mt-0.5">UUID::{gym.id.slice(0, 12)}</p>
                                            </div>
                                        </div>
                                        <Zap className="w-4 h-4 text-orange-500/30 opacity-0 group-hover:opacity-100 transition-all" />
                                    </button>
                                ))}
                            </div>
                        )}

                        {filteredNav.length === 0 && filteredGyms.length === 0 && (
                            <div className="py-20 text-center space-y-4 opacity-20">
                                <Terminal className="w-12 h-12 mx-auto" />
                                <p className="text-[10px] font-black uppercase tracking-[0.4em]">Sonuç bulunamadı</p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="bg-white/[0.02] px-6 py-3 border-t border-white/[0.05] flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">Seç:</span>
                                <div className="px-1.5 py-0.5 bg-zinc-900 border border-white/10 rounded text-[9px] font-mono text-zinc-500">ENTER</div>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">Navigasyon:</span>
                                <div className="px-1.5 py-0.5 bg-zinc-900 border border-white/10 rounded text-[9px] font-mono text-zinc-500">↑↓</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black text-zinc-800 uppercase tracking-[0.3em]">GB_CONSOLE v2.0</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
