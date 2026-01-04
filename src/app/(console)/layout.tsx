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
    Bell
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { motion, AnimatePresence } from 'framer-motion';
import { ServiceWorkerRegistrar } from '@/components/ServiceWorkerRegistrar';

export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [adminName, setAdminName] = useState('');

    const checkAuth = useCallback(async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            router.push('/login');
            return;
        }

        const masterEmails = ['bigfoothdestek@gmail.com', 'guclumelih3@gmail.com'];
        if (user.email && masterEmails.includes(user.email)) {
            setAdminName(user.email === 'guclumelih3@gmail.com' ? 'Melih Güçlü' : 'Melih Güçlü (Master)');
            setIsLoading(false);
            return;
        }

        const { data: userData, error } = await supabase
            .from('users')
            .select('role, full_name, email')
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
        { title: 'Genel Bakış', icon: LayoutDashboard, href: '/' },
        { title: 'Salon Yönetimi', icon: Building2, href: '/gyms' },
        { title: 'Platform Üyeleri', icon: Users, href: '/users' },
        { title: 'Gelir & Ödemeler', icon: CreditCard, href: '/revenue' },
        { title: 'Sistem Sağlığı', icon: Activity, href: '/health' },
        { title: 'Ayarlar', icon: Settings, href: '/settings' },
    ];

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black flex relative overflow-hidden text-left">
            <ServiceWorkerRegistrar />
            
            {/* Desktop Sidebar */}
            <aside className="fixed lg:sticky top-0 left-0 z-50 h-screen w-72 bg-zinc-950 border-r border-white/5 hidden lg:flex flex-col shrink-0">
                <div className="h-full flex flex-col p-6 overflow-y-auto">
                    <div className="mb-10 px-2 text-left">
                        <Logo />
                        <div className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase mt-1 ml-11">Developer Console</div>
                    </div>

                    <nav className="flex-1 space-y-1">
                        {menuItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all group ${isActive
                                            ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg shadow-orange-500/20 font-bold'
                                            : 'text-zinc-500 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'group-hover:text-orange-500 transition-colors'}`} />
                                    <span className="text-sm">{item.title}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="mt-auto pt-6 border-t border-white/5">
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-black shrink-0">
                                    {adminName.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-white truncate">{adminName}</p>
                                    <p className="text-[10px] text-zinc-500 font-medium">Platform Sahibi</p>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={async () => {
                                const supabase = createClient();
                                await supabase.auth.signOut();
                                router.push('/login');
                            }}
                            className="flex items-center gap-3 px-4 py-3.5 w-full rounded-2xl text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-all text-sm font-bold group cursor-pointer"
                        >
                            <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                            Oturumu Kapat
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0 flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black h-screen overflow-y-auto pb-24 lg:pb-0">
                <header className="h-16 lg:h-20 border-b border-white/5 flex items-center justify-between px-4 lg:px-8 bg-black/50 backdrop-blur-xl sticky top-0 z-40">
                    <div className="flex items-center gap-4">
                        <div className="lg:hidden"><Logo className="h-7" /></div>
                        <h2 className="hidden lg:block text-sm font-black text-white uppercase tracking-widest italic">
                            {menuItems.find(m => m.href === pathname)?.title || 'Dashboard'}
                        </h2>
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="relative p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-white/5">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full border-2 border-black" />
                        </button>
                        <div className="lg:hidden w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-xs font-black text-orange-500">
                            {adminName.charAt(0)}
                        </div>
                    </div>
                </header>

                <div className="p-4 lg:p-8 max-w-7xl mx-auto w-full">
                    {children}
                </div>
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[60] bg-zinc-950/80 backdrop-blur-2xl border-t border-white/5 px-6 pb-safe-area-inset-bottom">
                <div className="flex items-center justify-between h-20">
                    {[
                        { icon: LayoutDashboard, href: '/', label: 'Dash' },
                        { icon: Building2, href: '/gyms', label: 'Salonlar' },
                        { icon: Activity, href: '/health', label: 'Sağlık' },
                        { icon: Settings, href: '/settings', label: 'Ayar' },
                    ].map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link key={item.href} href={item.href} className="flex flex-col items-center justify-center gap-1 relative min-w-[60px]">
                                <div className={`p-2.5 rounded-2xl transition-all duration-300 ${
                                    isActive ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/40 scale-110 -translate-y-1' : 'text-zinc-500'
                                }`}>
                                    <item.icon className="w-5 h-5" />
                                </div>
                                <span className={`text-[9px] font-black uppercase tracking-tighter ${isActive ? 'text-white' : 'text-zinc-600'}`}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}
