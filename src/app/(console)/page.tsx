'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, Button } from '@/components/ui';
import {
    Users,
    Building2,
    TrendingUp,
    TrendingDown,
    Search,
    Activity,
    Package,
    Bell,
    X,
    ChevronRight,
    Sparkles,
    DollarSign,
    UserCheck,
    ArrowUpRight,
    CreditCard,
    Dumbbell,
    RefreshCcw,
    AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import Link from 'next/link';

export default function SuperAdminPage() {
    const router = useRouter();
    const [gyms, setGyms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [recentActivity, setRecentActivity] = useState<any[]>([]);

    const [isAnnouncementOpen, setIsAnnouncementOpen] = useState(false);
    const [announcementMsg, setAnnouncementMsg] = useState('');
    const [announcementLoading, setAnnouncementLoading] = useState(false);

    const [stats, setStats] = useState({
        totalGyms: 0,
        activeMembers: 0,
        totalRevenue: 0,
        revenueChange: 0,
        todayCheckIns: 0,
        todayPayments: 0,
        lowStockAlerts: 0,
        pendingMembers: 0,
        expiringMemberships: 0,
        totalTrainers: 0
    });

    const [gymStats, setGymStats] = useState<Record<string, {
        memberCount: number;
        monthlyRevenue: number;
        todayCheckIns: number;
    }>>({});

    const supabase = createClient();

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const now = new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
            const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
            const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();
            const sevenDaysLater = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7).toISOString();

            const [
                gymsResult,
                membersResult,
                trainersResult,
                thisMonthPayments,
                lastMonthPayments,
                todayPaymentsResult,
                checkInsResult,
                lowStockResult,
                pendingMembersResult,
                expiringResult,
                recentLogsResult
            ] = await Promise.all([
                supabase.from('gyms').select('*').order('created_at', { ascending: false }),
                supabase.from('users').select('id, gym_id', { count: 'exact' }).eq('role', 'member'),
                supabase.from('users').select('id', { count: 'exact' }).eq('role', 'trainer'),
                supabase.from('payments').select('amount, gym_id').eq('status', 'completed').gte('created_at', thisMonthStart),
                supabase.from('payments').select('amount').eq('status', 'completed').gte('created_at', lastMonthStart).lte('created_at', lastMonthEnd),
                supabase.from('payments').select('amount', { count: 'exact' }).eq('status', 'completed').gte('created_at', todayStart),
                supabase.from('check_ins').select('id, gym_id', { count: 'exact' }).gt('checked_in_at', todayStart),
                supabase.from('products').select('id', { count: 'exact' }).lt('current_stock', 5),
                supabase.from('users').select('id', { count: 'exact' }).eq('role', 'member').eq('status', 'pending'),
                supabase.from('memberships').select('id', { count: 'exact' }).eq('status', 'active').gte('end_date', todayStart).lte('end_date', sevenDaysLater),
                supabase.from('system_logs').select('*, gyms(name)').order('created_at', { ascending: false }).limit(8)
            ]);

            const gymsData = gymsResult.data;
            const membersData = membersResult.data;
            const thisMonthData = thisMonthPayments.data;
            const lastMonthData = lastMonthPayments.data;
            const checkInsData = checkInsResult.data;

            const thisMonthRevenue = thisMonthData?.reduce((sum, p) => sum + p.amount, 0) || 0;
            const lastMonthRevenue = lastMonthData?.reduce((sum, p) => sum + p.amount, 0) || 0;
            const todayPaymentsTotal = todayPaymentsResult.data?.reduce((sum, p) => sum + p.amount, 0) || 0;

            let revenueChange = 0;
            if (lastMonthRevenue > 0) {
                revenueChange = Number((((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1));
            } else if (thisMonthRevenue > 0) {
                revenueChange = 100;
            }

            if (gymsData) {
                const activeGyms = gymsData.filter(gym => gym.settings?.status !== 'archived');
                setGyms(activeGyms);

                const gymStatsMap: Record<string, { memberCount: number; monthlyRevenue: number; todayCheckIns: number }> = {};

                for (const gym of activeGyms) {
                    const memberCount = membersData?.filter(m => m.gym_id === gym.id).length || 0;
                    const monthlyRevenue = thisMonthData?.filter(p => p.gym_id === gym.id).reduce((sum, p) => sum + p.amount, 0) || 0;
                    const todayCheckIns = checkInsData?.filter(c => c.gym_id === gym.id).length || 0;

                    gymStatsMap[gym.id] = { memberCount, monthlyRevenue, todayCheckIns };
                }

                setGymStats(gymStatsMap);

                setStats({
                    totalGyms: activeGyms.length,
                    activeMembers: membersResult.count || 0,
                    totalRevenue: thisMonthRevenue,
                    revenueChange: revenueChange,
                    todayCheckIns: checkInsResult.count || 0,
                    todayPayments: todayPaymentsTotal,
                    lowStockAlerts: lowStockResult.count || 0,
                    pendingMembers: pendingMembersResult.count || 0,
                    expiringMemberships: expiringResult.count || 0,
                    totalTrainers: trainersResult.count || 0
                });
            }

            if (recentLogsResult.data) {
                setRecentActivity(recentLogsResult.data);
            }

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        loadData();

        const channel = supabase
            .channel('dashboard_activity')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'system_logs' }, (payload) => {
                setRecentActivity(prev => [payload.new, ...prev].slice(0, 8));
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [loadData, supabase]);

    async function handleSendAnnouncement(e: React.FormEvent) {
        e.preventDefault();
        if (!announcementMsg.trim()) return;
        setAnnouncementLoading(true);
        try {
            const { data: admins } = await supabase
                .from('users')
                .select('id')
                .eq('role', 'admin');

            if (admins && admins.length > 0) {
                const notifications = admins.map(admin => ({
                    user_id: admin.id,
                    title: 'Sistem Duyurusu',
                    body: announcementMsg,
                    type: 'system',
                    read: false
                }));

                const { error } = await supabase.from('notifications').insert(notifications);
                if (error) throw error;
            }

            await supabase.from('system_logs').insert({
                event_type: 'success',
                entity_type: 'system_settings',
                message: `Küresel duyuru yayınlandı (${admins?.length || 0} admin): ${announcementMsg.slice(0, 30)}...`,
                actor_role: 'super_admin'
            });

            toast.success('Duyuru başarıyla gönderildi');
            setAnnouncementMsg('');
            setIsAnnouncementOpen(false);
        } catch (error: any) {
            toast.error('Hata: ' + error.message);
        } finally {
            setAnnouncementLoading(false);
        }
    }

    const filteredGyms = gyms.filter(gym =>
        gym.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const alertCount = stats.lowStockAlerts + stats.expiringMemberships + stats.pendingMembers;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="w-8 h-8 border-2 border-zinc-600 border-t-blue-500 rounded-full animate-spin" />
                <p className="text-sm text-zinc-300">Yükleniyor...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100">
                        Kontrol Paneli
                    </h1>
                    <p className="text-sm text-zinc-500 mt-1">
                        {format(new Date(), 'd MMMM yyyy, EEEE', { locale: tr })}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={loadData}
                        variant="secondary"
                        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 h-9 w-9 p-0"
                    >
                        <RefreshCcw className="w-4 h-4" />
                    </Button>
                    <Button
                        onClick={() => setIsAnnouncementOpen(true)}
                        variant="primary"
                        className="bg-blue-600 hover:bg-blue-700 text-white h-9"
                    >
                        <Bell className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">Duyuru</span>
                    </Button>
                </div>
            </div>

            {/* Overview Section */}
            <section>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Revenue */}
                    <Card className="p-4 bg-zinc-800/50 border-zinc-700/50">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs text-zinc-500 uppercase tracking-wide">Bu Ay Gelir</p>
                                <p className="text-2xl font-bold text-zinc-100 mt-1">
                                    {(stats.totalRevenue / 1000).toFixed(0)}k ₺
                                </p>
                            </div>
                            <div className="p-2 bg-emerald-600/10 rounded-lg">
                                <DollarSign className="w-5 h-5 text-emerald-500" />
                            </div>
                        </div>
                        {stats.revenueChange !== 0 && (
                            <div className={cn(
                                "flex items-center gap-1 mt-3 text-xs font-medium",
                                stats.revenueChange >= 0 ? "text-emerald-500" : "text-red-500"
                            )}>
                                {stats.revenueChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                {stats.revenueChange >= 0 ? '+' : ''}{stats.revenueChange}% geçen aya göre
                            </div>
                        )}
                    </Card>

                    {/* Members */}
                    <Card className="p-4 bg-zinc-800/50 border-zinc-700/50">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs text-zinc-500 uppercase tracking-wide">Toplam Üye</p>
                                <p className="text-2xl font-bold text-zinc-100 mt-1">
                                    {stats.activeMembers.toLocaleString()}
                                </p>
                            </div>
                            <div className="p-2 bg-purple-600/10 rounded-lg">
                                <Users className="w-5 h-5 text-purple-500" />
                            </div>
                        </div>
                        <div className="flex items-center gap-3 mt-3 text-xs text-zinc-500">
                            <span>{stats.totalGyms} salon</span>
                            <span>•</span>
                            <span>{stats.totalTrainers} eğitmen</span>
                        </div>
                    </Card>

                    {/* Today Check-ins */}
                    <Card className="p-4 bg-zinc-800/50 border-zinc-700/50">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs text-zinc-500 uppercase tracking-wide">Bugün Giriş</p>
                                <p className="text-2xl font-bold text-zinc-100 mt-1">
                                    {stats.todayCheckIns}
                                </p>
                            </div>
                            <div className="p-2 bg-cyan-600/10 rounded-lg">
                                <Activity className="w-5 h-5 text-cyan-500" />
                            </div>
                        </div>
                        <div className="flex items-center gap-1 mt-3 text-xs text-zinc-500">
                            <CreditCard className="w-3 h-3" />
                            <span>{stats.todayPayments.toLocaleString('tr-TR')} ₺ ödeme</span>
                        </div>
                    </Card>

                    {/* Alerts */}
                    <Card className={cn(
                        "p-4 border-zinc-700/50",
                        alertCount > 0 ? "bg-amber-600/5 border-amber-600/30" : "bg-zinc-800/50"
                    )}>
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs text-zinc-500 uppercase tracking-wide">Dikkat</p>
                                <p className="text-2xl font-bold text-zinc-100 mt-1">
                                    {alertCount}
                                </p>
                            </div>
                            <div className={cn(
                                "p-2 rounded-lg",
                                alertCount > 0 ? "bg-amber-600/10" : "bg-zinc-700/50"
                            )}>
                                <AlertTriangle className={cn(
                                    "w-5 h-5",
                                    alertCount > 0 ? "text-amber-500" : "text-zinc-500"
                                )} />
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                            {stats.lowStockAlerts > 0 && (
                                <span className="text-xs bg-orange-600/10 text-orange-400 px-2 py-0.5 rounded">
                                    {stats.lowStockAlerts} stok
                                </span>
                            )}
                            {stats.expiringMemberships > 0 && (
                                <span className="text-xs bg-amber-600/10 text-amber-400 px-2 py-0.5 rounded">
                                    {stats.expiringMemberships} üyelik
                                </span>
                            )}
                            {stats.pendingMembers > 0 && (
                                <span className="text-xs bg-blue-600/10 text-blue-400 px-2 py-0.5 rounded">
                                    {stats.pendingMembers} onay
                                </span>
                            )}
                            {alertCount === 0 && (
                                <span className="text-xs text-zinc-500">Sorun yok</span>
                            )}
                        </div>
                    </Card>
                </div>
            </section>

            {/* Gyms Section */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-zinc-100">Salonlar</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Ara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-40 sm:w-52 pl-9 pr-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-600"
                        />
                    </div>
                </div>

                <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-zinc-700/50">
                                <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wide px-4 py-3">Salon</th>
                                <th className="text-center text-xs font-medium text-zinc-500 uppercase tracking-wide px-4 py-3 hidden sm:table-cell">Üye</th>
                                <th className="text-center text-xs font-medium text-zinc-500 uppercase tracking-wide px-4 py-3 hidden md:table-cell">Gelir/Ay</th>
                                <th className="text-center text-xs font-medium text-zinc-500 uppercase tracking-wide px-4 py-3 hidden lg:table-cell">Bugün</th>
                                <th className="w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-700/30">
                            {filteredGyms.map((gym) => {
                                const gStats = gymStats[gym.id] || { memberCount: 0, monthlyRevenue: 0, todayCheckIns: 0 };
                                const hasProModel = gym.settings?.pro_model_enabled;

                                return (
                                    <tr
                                        key={gym.id}
                                        onClick={() => router.push(`/gyms/${gym.id}`)}
                                        className="hover:bg-zinc-700/20 cursor-pointer transition-colors group"
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
                                                    <Building2 className="w-4 h-4 text-white" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-zinc-100 truncate">{gym.name}</span>
                                                        {hasProModel && <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                                                    </div>
                                                    <span className="text-xs text-zinc-500 sm:hidden">{gStats.memberCount} üye</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center hidden sm:table-cell">
                                            <span className="text-sm font-medium text-zinc-300">{gStats.memberCount}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center hidden md:table-cell">
                                            <span className="text-sm font-medium text-emerald-500">{(gStats.monthlyRevenue / 1000).toFixed(1)}k ₺</span>
                                        </td>
                                        <td className="px-4 py-3 text-center hidden lg:table-cell">
                                            <span className="text-sm font-medium text-cyan-500">{gStats.todayCheckIns}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {filteredGyms.length === 0 && (
                        <div className="text-center py-12 text-zinc-500">
                            <Building2 className="w-10 h-10 mx-auto mb-2 opacity-20" />
                            <p className="text-sm">Salon bulunamadı</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Activity Log Section */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <h2 className="text-lg font-semibold text-zinc-100">Aktivite Akışı</h2>
                    </div>
                    <Link href="/health/logs" className="text-xs text-blue-500 hover:text-blue-400 flex items-center gap-1">
                        Tümünü Gör
                        <ArrowUpRight className="w-3 h-3" />
                    </Link>
                </div>

                <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-zinc-700/50">
                                <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wide px-4 py-3 w-20">Saat</th>
                                <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wide px-4 py-3 w-32">Salon</th>
                                <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wide px-4 py-3">Aktivite</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-700/30">
                            {recentActivity.map((log, i) => (
                                <tr key={log.id || i} className="hover:bg-zinc-700/10">
                                    <td className="px-4 py-2.5 text-xs text-zinc-500 font-mono">
                                        {format(new Date(log.created_at), 'HH:mm')}
                                    </td>
                                    <td className="px-4 py-2.5">
                                        {log.gyms?.name ? (
                                            <span className="text-xs text-blue-400 truncate block max-w-[100px]">{log.gyms.name}</span>
                                        ) : (
                                            <span className="text-xs text-zinc-600">—</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-2.5 text-sm text-zinc-300 truncate max-w-md">
                                        {log.message}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {recentActivity.length === 0 && (
                        <div className="text-center py-8 text-zinc-500 text-sm">
                            Henüz aktivite yok
                        </div>
                    )}
                </div>
            </section>

            {/* Announcement Modal */}
            <AnimatePresence>
                {isAnnouncementOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAnnouncementOpen(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="w-full max-w-md bg-zinc-800 border border-zinc-700 rounded-2xl p-6 relative z-10 shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-600 rounded-lg">
                                        <Bell className="w-5 h-5 text-white" />
                                    </div>
                                    <h2 className="text-lg font-bold text-zinc-100">
                                        Duyuru Gönder
                                    </h2>
                                </div>
                                <button
                                    onClick={() => setIsAnnouncementOpen(false)}
                                    className="p-1 hover:bg-zinc-700 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-zinc-400" />
                                </button>
                            </div>

                            <form onSubmit={handleSendAnnouncement} className="space-y-4">
                                <textarea
                                    autoFocus
                                    value={announcementMsg}
                                    onChange={(e) => setAnnouncementMsg(e.target.value)}
                                    placeholder="Tüm salonlara gönderilecek mesajı yazın..."
                                    className="w-full h-32 px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                                />

                                <div className="flex gap-3">
                                    <Button
                                        type="button"
                                        onClick={() => setIsAnnouncementOpen(false)}
                                        variant="secondary"
                                        className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-100"
                                    >
                                        İptal
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        isLoading={announcementLoading}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        Gönder
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
