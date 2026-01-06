'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
    LayoutDashboard,
    Building2,
    Users,
    CreditCard,
    Settings,
    LogOut,
    Menu,
    X,
    Activity,
    Bell,
    ChevronRight,
    Terminal,
    Search,
    ShieldCheck,
    Command,
    Package
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { CommandPalette } from '@/components/CommandPalette';
import { SystemHeartbeatSplash } from '@/components/SystemHeartbeatSplash';

export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [adminName, setAdminName] = useState('');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [showContent, setShowContent] = useState(false);

    // Animasyon süresiyle senkronize et (SystemHeartbeatSplash 4.5s sürüyor)
    useEffect(() => {
        const hasSeenSplash = sessionStorage.getItem('has_seen_console_splash');
        if (hasSeenSplash) {
            setShowContent(true);
        } else {
            const timer = setTimeout(() => setShowContent(true), 4200);
            return () => clearTimeout(timer);
        }
    }, []);

    const checkAuth = useCallback(async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            router.push('/login');
            return;
        }

        const masterEmails = ['bigfoothdestek@gmail.com', 'guclumelih3@gmail.com'];
        if (user.email && masterEmails.includes(user.email)) {
            setAdminName(user.email === 'guclumelih3@gmail.com' ? 'Melih Güçlü' : 'Melih Güçlü');
            setIsLoading(false);
            return;
        }

        const { data: userData, error } = await supabase
            .from('users')
            .select('role, full_name')
            .eq('id', user.id)
            .single();

        if (error || userData?.role !== 'super_admin') {
            router.push('/login');
            return;
        }

        setAdminName(userData.full_name);
        setIsLoading(false);
    }, [router]);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const menuItems = [
        { title: 'KONTROL PANELİ', icon: LayoutDashboard, href: '/' },
        { title: 'SALON AĞI', icon: Building2, href: '/gyms' },
        { title: 'ÜYE YÖNETİMİ', icon: Users, href: '/users' },
        { title: 'ENVANTER DENETİMİ', icon: Package, href: '/inventory' },
        { title: 'GELİR AKIŞI', icon: CreditCard, href: '/revenue' },
        { title: 'SİSTEM SAĞLIĞI', icon: Activity, href: '/health' },
        { title: 'ANA AYARLAR', icon: Settings, href: '/settings' },
    ];

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-white/10 border-t-orange-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black flex text-zinc-100 font-sans selection:bg-orange-500/20 overflow-hidden">
            {/* --- SIDEBAR --- */}
            <aside className="w-72 border-r border-white/[0.04] flex flex-col shrink-0 bg-[#020202] hidden lg:flex sticky top-0 h-screen">
                <div className="p-10 pb-12">
                    <div className="flex items-center gap-4 group cursor-pointer">
                        <div className="p-2.5 bg-orange-500 rounded-xl shadow-[0_0_20px_rgba(249,115,22,0.3)] group-hover:scale-110 transition-transform duration-500">
                            <Command className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <Logo className="h-5" />
                            <p className="text-[9px] font-mono font-black text-zinc-700 uppercase tracking-[0.3em] mt-1.5">Konsol v2.4.0</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-1.5">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-4 px-5 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden",
                                    isActive 
                                        ? "bg-orange-500/[0.03] text-white" 
                                        : "text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.02]"
                                )}
                            >
                                <item.icon className={cn("w-4 h-4 transition-colors", isActive ? "text-orange-500" : "group-hover:text-zinc-400")} />
                                <span className="text-[11px] font-black tracking-widest uppercase">{item.title}</span>
                                {isActive && (
                                    <>
                                        <div className="absolute left-0 w-[2px] h-5 bg-orange-500 rounded-r-full shadow-[0_0_10px_orange]" />
                                        <div className="absolute right-4 w-1 h-1 rounded-full bg-orange-500 animate-pulse" />
                                    </>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-6 border-t border-white/[0.04] bg-black/20">
                    <div className="flex items-center gap-4 px-4 py-4 bg-white/[0.02] rounded-[1.5rem] border border-white/[0.04] mb-4 group hover:border-orange-500/20 transition-all">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 flex items-center justify-center text-orange-500 font-black shrink-0 shadow-xl group-hover:scale-105 transition-transform font-mono uppercase">
                            {adminName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                            <p className="text-[11px] font-black text-white truncate uppercase tracking-tight">{adminName}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <ShieldCheck className="w-3 h-3 text-emerald-500/70" />
                                <p className="text-[9px] text-zinc-600 font-mono font-black uppercase tracking-widest text-[8px]">TAM YETKİ</p>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={async () => {
                            const supabase = createClient();
                            await supabase.auth.signOut();
                            router.push('/login');
                        }}
                        className="flex items-center gap-3 w-full px-5 py-3.5 rounded-xl text-zinc-700 hover:text-red-400 hover:bg-red-500/[0.03] transition-all text-[9px] font-black uppercase tracking-[0.2em] group"
                    >
                        <LogOut className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                        OTURUMU KAPAT
                    </button>
                </div>
            </aside>

            {/* --- MAIN --- */}
            <main className="flex-1 min-w-0 flex flex-col h-screen overflow-y-auto subtle-grid relative">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />
                
                <header className="h-20 border-b border-white/[0.04] flex items-center justify-between px-6 lg:px-14 bg-black/60 backdrop-blur-xl sticky top-0 z-40">
                    <div className="flex items-center gap-4 lg:gap-8">
                        {/* Mobile Menu Trigger */}
                        <button 
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="lg:hidden p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                        >
                            <Menu className="w-6 h-6" />
                        </button>

                        <div className="lg:hidden"><Logo className="h-5" /></div>
                        <div className="hidden lg:flex items-center gap-6">
                            <div className="p-2.5 bg-white/[0.02] rounded-xl border border-white/[0.05]">
                                <Terminal className="w-4 h-4 text-orange-500" />
                            </div>
                            <nav className="flex items-center gap-4 text-[10px] font-mono font-black text-zinc-600 uppercase tracking-[0.3em]">
                                <span className="hover:text-zinc-400 cursor-pointer transition-colors">SİSTEM</span>
                                <ChevronRight className="w-3 h-3 text-zinc-800" />
                                <span className="text-zinc-200 tracking-[0.2em]">{menuItems.find(m => m.href === pathname)?.title || 'ÇALIŞMA ALANI'}</span>
                            </nav>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div 
                            onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
                            className="relative group hidden md:block cursor-pointer"
                        >
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-hover:text-orange-500 transition-colors" />
                            <div className="bg-white/[0.01] border border-white/[0.05] rounded-2xl pl-12 pr-4 py-2.5 text-[10px] font-black text-zinc-600 w-64 flex items-center justify-between hover:bg-white/[0.03] transition-all">
                                <span>KOMUT ARA</span>
                                <div className="px-1.5 py-0.5 bg-zinc-900 border border-white/10 rounded text-[9px] font-mono text-zinc-700">⌘K</div>
                            </div>
                        </div>
                        
                        <div className="h-6 w-[1px] bg-white/[0.04] mx-2 hidden lg:block" />

                        <button className="relative p-3 text-zinc-600 hover:text-white rounded-xl hover:bg-white/[0.02] transition-all border border-transparent hover:border-white/[0.05] group">
                            <Bell className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            <span className="absolute top-3 right-3 w-1.5 h-1.5 bg-orange-500 rounded-full border-2 border-black shadow-[0_0_8px_orange]" />
                        </button>
                    </div>
                </header>

                <div className="p-6 lg:p-16 max-w-[1600px] mx-auto w-full relative z-10">
                    {children}
                </div>
                <CommandPalette />
                <SystemHeartbeatSplash />
            </main>

            {/* --- MOBILE SIDEBAR OVERLAY --- */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] lg:hidden"
                        />
                        <motion.div 
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 left-0 w-80 bg-[#020202] border-r border-white/10 z-[101] lg:hidden flex flex-col p-6"
                        >
                            <div className="flex items-center justify-between mb-12 px-2">
                                <Logo className="h-5" />
                                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-zinc-500 hover:text-white"><X className="w-6 h-6" /></button>
                            </div>

                            <nav className="flex-1 space-y-2">
                                {menuItems.map((item) => {
                                    const isActive = pathname === item.href;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className={cn(
                                                "flex items-center gap-4 px-5 py-4 rounded-xl transition-all",
                                                isActive ? "bg-orange-500/10 text-white border border-orange-500/20" : "text-zinc-500 hover:bg-white/5"
                                            )}
                                        >
                                            <item.icon className={cn("w-5 h-5", isActive ? "text-orange-500" : "")} />
                                            <span className="text-sm font-bold tracking-widest uppercase">{item.title}</span>
                                        </Link>
                                    );
                                })}
                            </nav>

                            <div className="mt-auto pt-6 border-t border-white/5">
                                <button
                                    onClick={async () => {
                                        const supabase = createClient();
                                        await supabase.auth.signOut();
                                        router.push('/login');
                                    }}
                                    className="flex items-center gap-4 w-full px-5 py-4 rounded-xl text-red-500 hover:bg-red-500/5 transition-all text-xs font-black uppercase tracking-widest"
                                >
                                    <LogOut className="w-5 h-5" />
                                    OTURUMU KAPAT
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
