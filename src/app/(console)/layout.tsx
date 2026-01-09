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
    Package,
    MessageSquare
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SystemHeartbeatSplash } from '@/components/SystemHeartbeatSplash';
import { CommandPalette } from '@/components/CommandPalette';

export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [adminName, setAdminName] = useState('');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
        { title: 'Kontrol Paneli', icon: LayoutDashboard, href: '/' },
        { title: 'Salonlar', icon: Building2, href: '/gyms' },
        { title: 'Üyeler', icon: Users, href: '/users' },
        { title: 'Envanter', icon: Package, href: '/inventory' },
        { title: 'Gelir', icon: CreditCard, href: '/revenue' },
        { title: 'Geri Bildirimler', icon: MessageSquare, href: '/feedback' },
        { title: 'Sistem Sağlığı', icon: Activity, href: '/health' },
        { title: 'Ayarlar', icon: Settings, href: '/settings' },
    ];

    if (isLoading) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-zinc-700 border-t-blue-600 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 flex">
            {/* Sidebar - Desktop */}
            <aside className="w-64 border-r border-zinc-800 flex-col shrink-0 bg-zinc-900 hidden lg:flex h-screen sticky top-0">
                {/* Logo */}
                <div className="p-6 border-b border-zinc-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600 rounded-lg">
                            <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <Logo className="h-5" />
                            <p className="text-xs text-zinc-500 mt-0.5">Konsol v0.1.3</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium text-sm",
                                    isActive
                                        ? "bg-blue-600 text-white"
                                        : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                                )}
                            >
                                <item.icon className="w-5 h-5" />
                                <span>{item.title}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* User Info */}
                <div className="p-4 border-t border-zinc-800">
                    <div className="flex items-center gap-3 px-3 py-3 bg-zinc-800 rounded-lg mb-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                            {adminName.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-zinc-100 truncate">{adminName}</p>
                            <p className="text-xs text-zinc-500">Super Admin</p>
                        </div>
                    </div>
                    <button
                        onClick={async () => {
                            const supabase = createClient();
                            await supabase.auth.signOut();
                            router.push('/login');
                        }}
                        className="flex items-center gap-2 w-full px-4 py-2.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-600/10 transition-all text-sm font-medium"
                    >
                        <LogOut className="w-4 h-4" />
                        Çıkış Yap
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0 flex flex-col h-screen overflow-y-auto">
                {/* Header - Mobile */}
                <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-4 lg:px-8 bg-zinc-900 sticky top-0 z-40 lg:hidden">
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <Logo className="h-5" />
                    <div className="w-10" /> {/* Spacer */}
                </header>

                {/* Content */}
                <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
                    {children}
                </div>
                <SystemHeartbeatSplash />
                <CommandPalette />
            </main>

            {/* Mobile Sidebar */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] lg:hidden"
                        />
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 left-0 w-72 bg-zinc-900 border-r border-zinc-800 z-[101] lg:hidden flex flex-col"
                        >
                            {/* Mobile Header */}
                            <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                                <Logo className="h-5" />
                                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-zinc-400 hover:text-white">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Mobile Navigation */}
                            <nav className="flex-1 p-4 space-y-1">
                                {menuItems.map((item) => {
                                    const isActive = pathname === item.href;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className={cn(
                                                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium text-sm",
                                                isActive
                                                    ? "bg-blue-600 text-white"
                                                    : "text-zinc-400 hover:bg-zinc-800"
                                            )}
                                        >
                                            <item.icon className="w-5 h-5" />
                                            <span>{item.title}</span>
                                        </Link>
                                    );
                                })}
                            </nav>

                            {/* Mobile User Info */}
                            <div className="p-4 border-t border-zinc-800">
                                <button
                                    onClick={async () => {
                                        const supabase = createClient();
                                        await supabase.auth.signOut();
                                        router.push('/login');
                                    }}
                                    className="flex items-center gap-2 w-full px-4 py-3 rounded-lg text-red-400 hover:bg-red-600/10 transition-all text-sm font-medium"
                                >
                                    <LogOut className="w-5 h-5" />
                                    Çıkış Yap
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
