'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, Button, Input } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import {
    Users,
    Building2,
    ShieldCheck,
    TrendingUp,
    Search,
    MoreVertical,
    Settings,
    CreditCard,
    Calendar,
    ArrowUpRight,
    Zap,
    LayoutDashboard,
    Globe,
    CheckCircle2,
    Clock,
    AlertCircle
} from 'lucide-react';

export default function SuperAdminPage() {
    const router = useRouter();
    const [gyms, setGyms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [stats, setStats] = useState({
        totalGyms: 0,
        activeMembers: 0,
        totalRevenue: 0,
        trialGyms: 0
    });

    const supabase = createClient();

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            // Get all gyms
            const { data: gymsData } = await supabase
                .from('gyms')
                .select('*')
                .order('created_at', { ascending: false });

            // Get total user counts (simplified)
            const { count: memberCount } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'member');

            // Get revenue stats
            const { data: payments } = await supabase
                .from('payments')
                .select('amount')
                .eq('status', 'completed');

            const totalRevenue = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;

            if (gymsData) {
                const activeGyms = gymsData.filter(gym => gym.settings?.status !== 'archived');
                setGyms(activeGyms);
                setStats({
                    totalGyms: activeGyms.length,
                    activeMembers: memberCount || 0,
                    totalRevenue: totalRevenue,
                    trialGyms: activeGyms.filter(g => !g.settings?.is_activated).length
                });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    const filteredGyms = gyms.filter(gym =>
        gym.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        gym.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 text-left text-white pb-20">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-white flex items-center gap-4">
                        <div className="p-3.5 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-xl shadow-orange-500/20 text-white shrink-0">
                            <ShieldCheck className="w-8 h-8" />
                        </div>
                        <span className="tracking-tight">Platform Kontrol Merkezi</span>
                    </h1>
                    <p className="text-zinc-400 mt-2 font-medium pl-[4.5rem] text-sm tracking-wide">GymBoost ağındaki tüm salonların global yönetimi</p>
                </div>
                <div className="flex items-center gap-3 pl-[4.5rem] lg:pl-0">
                    <Link href="/settings">
                        <Button variant="secondary" className="bg-zinc-900 border-white/10 text-zinc-300 rounded-xl font-bold h-12 hover:bg-zinc-800 transition-colors px-6">
                            <Settings className="w-4 h-4 mr-2" /> Sistem Ayarları
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Platform Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Kayıtlı Salon', val: stats.totalGyms, sub: 'Toplam İşletme', icon: Building2, color: 'text-orange-500', bg: 'bg-orange-500/10', link: '/gyms' },
                    { label: 'Aktif Sporcu', val: stats.activeMembers, sub: 'Tüm Ağda', icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10', link: '/users' },
                    { label: 'Toplam Ciro', val: `${stats.totalRevenue.toLocaleString()} ₺`, sub: 'Brüt Gelir', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10', link: '/revenue' },
                    { label: 'Aktivasyon Bekleyen', val: stats.trialGyms, sub: 'Yeni Kayıtlar', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/10', link: '/gyms' },
                ].map((s, i) => (
                    <Link key={i} href={s.link} className="block group">
                        <Card className="p-6 bg-zinc-950/50 border-white/5 relative overflow-hidden hover:border-orange-500/30 hover:bg-zinc-900/50 transition-all cursor-pointer h-full">
                            <div className={`absolute -right-6 -top-6 p-8 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-500 ${s.color}`}>
                                <s.icon className="w-24 h-24" />
                            </div>
                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className={`p-2 rounded-lg ${s.bg} bg-opacity-10 w-fit`}>
                                            <s.icon className={`w-5 h-5 ${s.color}`} />
                                        </div>
                                        <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-zinc-300 transition-colors">{s.label}</div>
                                    </div>
                                    <div className={`text-3xl font-black ${s.color} tracking-tighter`}>{s.val}</div>
                                </div>
                                <div className="text-[10px] text-zinc-600 mt-4 font-bold uppercase tracking-wider flex items-center gap-1.5">
                                    <div className={`w-1 h-1 rounded-full ${s.color} bg-current`} />
                                    {s.sub}
                                </div>
                            </div>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Gyms Management */}
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-2">
                    <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-zinc-500" />
                        Salon Listesi
                    </h2>
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <Input
                            placeholder="Salon adı veya e-posta ile ara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-11 bg-zinc-900/50 border-white/5 rounded-xl text-xs focus:bg-zinc-900 transition-colors"
                        />
                    </div>
                </div>

                <div className="grid gap-4">
                    {filteredGyms.map((gym) => (
                        <Card key={gym.id} padding="none" className="bg-zinc-900/20 border-white/5 hover:border-orange-500/20 hover:bg-zinc-900/40 transition-all group overflow-hidden">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center p-5">
                                {/* Icon & Name */}
                                <div className="lg:col-span-4 flex items-center gap-5">
                                    <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center border border-white/5 shrink-0 group-hover:border-orange-500/20 group-hover:text-orange-500 transition-all text-zinc-600 shadow-lg">
                                        <Building2 className="w-6 h-6" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-base font-bold text-white truncate pr-4">{gym.name}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${gym.settings?.is_activated ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                                                {gym.settings?.is_activated ? 'Aktif' : 'Beklemede'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Contact Info */}
                                <div className="lg:col-span-4 flex flex-col gap-1.5 pl-17 lg:pl-0">
                                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                                        <Globe className="w-3.5 h-3.5 text-zinc-600" />
                                        <span className="truncate">{gym.email || 'E-posta yok'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                                        <Clock className="w-3.5 h-3.5 text-zinc-700" />
                                        <span>Kayıt: {new Date(gym.created_at).toLocaleDateString('tr-TR')}</span>
                                    </div>
                                </div>

                                {/* Stats & Actions */}
                                <div className="lg:col-span-4 flex items-center justify-between lg:justify-end gap-8 pl-17 lg:pl-0 border-t lg:border-t-0 border-white/5 pt-4 lg:pt-0 mt-2 lg:mt-0">
                                    <div className="flex items-center gap-8">
                                        <div className="text-right">
                                            <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-0.5">Üye Sayısı</div>
                                            <div className="text-sm font-bold text-white font-mono">-</div>
                                        </div>
                                        <div className="text-right hidden sm:block">
                                            <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-0.5">Durum</div>
                                            <div className="flex items-center justify-end gap-1.5 text-emerald-500 text-xs font-bold uppercase">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                Online
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => router.push(`/gyms/${gym.id}`)}
                                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 hover:text-white text-zinc-500 transition-all cursor-pointer border border-white/5 hover:border-white/10"
                                    >
                                        <MoreVertical className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
