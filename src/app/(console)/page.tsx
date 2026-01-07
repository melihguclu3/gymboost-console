'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, Button } from '@/components/ui';
import {
    Users,
    Building2,
    TrendingUp,
    ArrowUpRight,
    Search,
    Activity,
    Clock,
    Database,
    Globe,
    Server,
    Package,
    HeartPulse,
    AlertCircle,
    Bell,
    X,
    ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function SuperAdminPage() {
    const router = useRouter();
    const [gyms, setGyms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentTime, setCurrentTime] = useState(new Date());
    const [lastLoginTime, setLastLoginTime] = useState<string>('Yükleniyor...');
    const [realtimeLogs, setRealtimeLogs] = useState<any[]>([]);
    const [currentLatency, setRealLatency] = useState<number>(0);
    const [coords, setCoords] = useState({ lat: '0.0000', lon: '0.0000' });
    const [uptime, setUptime] = useState(100);
    const [sysMetrics, setSysMetrics] = useState({ ram: 0 });
    const [vercelInfo, setVercelInfo] = useState({
        region: 'Yükleniyor...',
        version: 'Yükleniyor...',
        env: 'production'
    });

    const [isAnnouncementOpen, setIsAnnouncementOpen] = useState(false);
    const [announcementMsg, setAnnouncementMsg] = useState('');
    const [announcementLoading, setAnnouncementLoading] = useState(false);

    const [stats, setStats] = useState({
        totalGyms: 0,
        activeMembers: 0,
        totalRevenue: 0,
        todayCheckIns: 0,
        lowStockAlerts: 0,
        healthWarnings: 0,
        revenueChange: 0,
        last10DaysCheckIns: [] as number[],
        todayCheckInGoal: 100
    });

    const [gymUptimes, setGymUptimes] = useState<Record<string, number>>({});

    const supabase = createClient();

    const fetchLocation = useCallback(async () => {
        try {
            const res = await fetch('https://ipapi.co/json/');
            if (!res.ok) throw new Error('Fetch failed');
            const data = await res.json();
            if (data.latitude) {
                setCoords({ lat: data.latitude.toFixed(4), lon: data.longitude.toFixed(4) });
            }
        } catch {
            setCoords({ lat: '41.0082', lon: '28.9784' });
        }
    }, []);

    const loadVercelInfo = useCallback(() => {
        const isDev = process.env.NODE_ENV === 'development';
        const version = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA
            ? `v${process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA.slice(0, 7)}`
            : 'v2.4.0';

        setVercelInfo({
            region: isDev ? 'Local' : (process.env.NEXT_PUBLIC_VERCEL_REGION || 'fra1'),
            version: version,
            env: process.env.NODE_ENV || 'production'
        });
    }, []);

    const calculateUptime = useCallback(async () => {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { count: errorCount } = await supabase
            .from('system_logs')
            .select('*', { count: 'exact', head: true })
            .eq('event_type', 'error')
            .gt('created_at', sevenDaysAgo);

        const { count: totalCount } = await supabase
            .from('system_logs')
            .select('*', { count: 'exact', head: true })
            .gt('created_at', sevenDaysAgo);

        if (totalCount && totalCount > 0) {
            const ratio = ((totalCount - (errorCount || 0)) / totalCount) * 100;
            setUptime(Number(ratio.toFixed(2)));
        }
    }, [supabase]);

    const updateSysMetrics = useCallback(() => {
        if (typeof window !== 'undefined' && (performance as any).memory) {
            const m = (performance as any).memory;
            const ramUsage = Math.round((m.usedJSHeapSize / m.jsHeapSizeLimit) * 100);
            setSysMetrics({
                ram: ramUsage
            });
        }
    }, []);

    const measureLatency = useCallback(async () => {
        const start = performance.now();
        await supabase.from('gyms').select('id', { count: 'exact', head: true }).limit(1);
        const end = performance.now();
        setRealLatency(Math.round(end - start));
    }, [supabase]);

    const loadLastLogin = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from('system_logs')
                .select('created_at')
                .eq('user_email', user.email)
                .eq('event_type', 'LOGIN')
                .order('created_at', { ascending: false })
                .limit(2);

            if (data && data.length > 1) {
                const lastDate = new Date(data[1].created_at);
                setLastLoginTime(lastDate.toLocaleString('tr-TR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }));
            } else {
                setLastLoginTime('İlk Oturum');
            }
        } catch (error) {
            console.error(error);
            setLastLoginTime('Bilinmiyor');
        }
    }, [supabase]);

    const calculateGymUptimes = useCallback(async (gymIds: string[]) => {
        const uptimes: Record<string, number> = {};
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        for (const gymId of gymIds) {
            const { count: errorCount } = await supabase
                .from('system_logs')
                .select('*', { count: 'exact', head: true })
                .eq('event_type', 'error')
                .eq('gym_id', gymId)
                .gt('created_at', sevenDaysAgo);

            const { count: totalCount } = await supabase
                .from('system_logs')
                .select('*', { count: 'exact', head: true })
                .eq('gym_id', gymId)
                .gt('created_at', sevenDaysAgo);

            if (totalCount && totalCount > 0) {
                const ratio = ((totalCount - (errorCount || 0)) / totalCount) * 100;
                uptimes[gymId] = Number(ratio.toFixed(1));
            } else {
                uptimes[gymId] = 100;
            }
        }

        setGymUptimes(uptimes);
    }, [supabase]);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const now = new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

            const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
            const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();
            const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

            const { data: gymsData } = await supabase.from('gyms').select('*').order('created_at', { ascending: false });
            const { count: memberCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'member');

            const { data: thisMonthPayments } = await supabase.from('payments')
                .select('amount')
                .eq('status', 'completed')
                .gte('created_at', thisMonthStart);

            const { data: lastMonthPayments } = await supabase.from('payments')
                .select('amount')
                .eq('status', 'completed')
                .gte('created_at', lastMonthStart)
                .lte('created_at', lastMonthEnd);

            const thisMonthRevenue = thisMonthPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;
            const lastMonthRevenue = lastMonthPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;

            let revenueChange = 0;
            if (lastMonthRevenue > 0) {
                revenueChange = Number((((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1));
            } else if (thisMonthRevenue > 0) {
                revenueChange = 100;
            }

            const { count: checkInCount } = await supabase.from('check_ins').select('*', { count: 'exact', head: true }).gt('checked_in_at', todayStart);
            const { count: lowStockCount } = await supabase.from('products').select('*', { count: 'exact', head: true }).lt('current_stock', 5);
            const { count: healthWarningCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).not('health_issues', 'is', null);

            const last10DaysCheckIns: number[] = [];
            for (let i = 9; i >= 0; i--) {
                const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i).toISOString();
                const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i + 1).toISOString();

                const { count } = await supabase.from('check_ins')
                    .select('*', { count: 'exact', head: true })
                    .gte('checked_in_at', dayStart)
                    .lt('checked_in_at', dayEnd);

                last10DaysCheckIns.push(count || 0);
            }

            if (gymsData) {
                const activeGyms = gymsData.filter(gym => gym.settings?.status !== 'archived');
                setGyms(activeGyms);

                calculateGymUptimes(activeGyms.map(g => g.id));

                setStats({
                    totalGyms: activeGyms.length,
                    activeMembers: memberCount || 0,
                    totalRevenue: thisMonthRevenue,
                    todayCheckIns: checkInCount || 0,
                    lowStockAlerts: lowStockCount || 0,
                    healthWarnings: healthWarningCount || 0,
                    revenueChange: revenueChange,
                    last10DaysCheckIns: last10DaysCheckIns,
                    todayCheckInGoal: 100
                });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [supabase, calculateGymUptimes]);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        const latencyTimer = setInterval(measureLatency, 5000);
        const metricsTimer = setInterval(updateSysMetrics, 3000);

        loadData();
        loadLastLogin();
        measureLatency();
        fetchLocation();
        calculateUptime();
        updateSysMetrics();
        loadVercelInfo();

        const channel = supabase
            .channel('global_telemetry')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'system_logs' }, (payload) => {
                setRealtimeLogs(prev => [payload.new, ...prev].slice(0, 5));
                if (payload.new.event_type === 'error') calculateUptime();
            })
            .subscribe();

        return () => {
            clearInterval(timer);
            clearInterval(latencyTimer);
            clearInterval(metricsTimer);
            supabase.removeChannel(channel);
        };
    }, [loadData, loadLastLogin, measureLatency, fetchLocation, calculateUptime, updateSysMetrics, loadVercelInfo, supabase]);

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
        gym.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        gym.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="w-8 h-8 border-2 border-zinc-600 border-t-blue-500 rounded-full animate-spin" />
                <p className="text-sm text-zinc-300">Yükleniyor...</p>
            </div>
        );
    }

    const todayProgressPercent = Math.min((stats.todayCheckIns / stats.todayCheckInGoal) * 100, 100);

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100">
                            Kontrol Paneli
                        </h1>
                        <p className="text-sm text-zinc-400 mt-1">
                            Tüm salonların merkezi yönetimi
                        </p>
                    </div>
                    <Button
                        onClick={() => setIsAnnouncementOpen(true)}
                        variant="primary"
                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium"
                    >
                        <Bell className="w-4 h-4 mr-2" />
                        Duyuru Gönder
                    </Button>
                </div>

                {/* System Info Bar */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span>Sistem Aktif</span>
                    </div>
                    <span className="text-zinc-600">•</span>
                    <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{currentTime.toLocaleTimeString('tr-TR')}</span>
                    </div>
                    <span className="text-zinc-600">•</span>
                    <div className="flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5" />
                        <span>{coords.lat}°N, {coords.lon}°E</span>
                    </div>
                    <span className="text-zinc-600 hidden sm:inline">•</span>
                    <div className="hidden sm:flex items-center gap-1.5">
                        <span>Gecikme: {currentLatency}ms</span>
                    </div>
                    <span className="text-zinc-600 hidden sm:inline">•</span>
                    <div className="hidden sm:flex items-center gap-1.5">
                        <span>Uptime: {uptime}%</span>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Revenue */}
                <Card className="p-5 bg-zinc-800/50 border-zinc-700/50">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-green-600 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                        <div className={cn(
                            "text-xs font-semibold px-2 py-1 rounded",
                            stats.revenueChange >= 0
                                ? "bg-green-600 text-white"
                                : "bg-red-600 text-white"
                        )}>
                            {stats.revenueChange >= 0 ? '+' : ''}{stats.revenueChange}%
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-zinc-100">
                        {stats.totalRevenue.toLocaleString()} ₺
                    </p>
                    <p className="text-sm text-zinc-400 mt-1">Bu Ay Gelir</p>
                </Card>

                {/* Gyms */}
                <Card className="p-5 bg-zinc-800/50 border-zinc-700/50">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-blue-600 rounded-lg">
                            <Building2 className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-zinc-100">
                        {stats.totalGyms}
                    </p>
                    <p className="text-sm text-zinc-400 mt-1">Aktif Salon</p>
                </Card>

                {/* Members */}
                <Card className="p-5 bg-zinc-800/50 border-zinc-700/50">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-purple-600 rounded-lg">
                            <Users className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-zinc-100">
                        {stats.activeMembers.toLocaleString()}
                    </p>
                    <p className="text-sm text-zinc-400 mt-1">Toplam Üye</p>
                    {/* Mini Chart */}
                    <div className="flex items-end gap-1 h-8 mt-3">
                        {stats.last10DaysCheckIns.map((count, i) => {
                            const maxCount = Math.max(...stats.last10DaysCheckIns, 1);
                            const height = (count / maxCount) * 100;
                            return (
                                <div
                                    key={i}
                                    style={{ height: `${height}%` }}
                                    className="flex-1 bg-purple-500 rounded-sm min-h-[2px]"
                                />
                            );
                        })}
                    </div>
                </Card>

                {/* Check-ins */}
                <Card className="p-5 bg-zinc-800/50 border-zinc-700/50">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-cyan-600 rounded-lg">
                            <Activity className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-zinc-100">
                        {stats.todayCheckIns}
                    </p>
                    <p className="text-sm text-zinc-400 mt-1">Bugünkü Giriş</p>
                    {/* Progress Bar */}
                    <div className="mt-3 h-2 bg-zinc-700 rounded-full overflow-hidden">
                        <div
                            style={{ width: `${todayProgressPercent}%` }}
                            className="h-full bg-cyan-500 transition-all duration-500"
                        />
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">Hedef: {stats.todayCheckInGoal}</p>
                </Card>
            </div>

            {/* Alerts */}
            {(stats.lowStockAlerts > 0 || stats.healthWarnings > 0) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {stats.lowStockAlerts > 0 && (
                        <Card className="p-4 border-orange-600/50 bg-orange-600/10">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-600 rounded-lg">
                                    <Package className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="font-semibold text-zinc-100">
                                        {stats.lowStockAlerts} Stok Uyarısı
                                    </p>
                                    <p className="text-sm text-zinc-300">
                                        Kritik stok seviyesi
                                    </p>
                                </div>
                            </div>
                        </Card>
                    )}

                    {stats.healthWarnings > 0 && (
                        <Card className="p-4 border-red-600/50 bg-red-600/10">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-600 rounded-lg">
                                    <HeartPulse className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="font-semibold text-zinc-100">
                                        {stats.healthWarnings} Sağlık Notu
                                    </p>
                                    <p className="text-sm text-zinc-300">
                                        Dikkat gerektiren üyeler
                                    </p>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            )}

            {/* System Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="p-4 bg-zinc-800/50 border-zinc-700/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-zinc-400 mb-1">Bölge</p>
                            <p className="font-semibold text-zinc-100">
                                {vercelInfo.region}
                            </p>
                        </div>
                        <Server className="w-5 h-5 text-zinc-500" />
                    </div>
                </Card>

                <Card className="p-4 bg-zinc-800/50 border-zinc-700/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-zinc-400 mb-1">Sürüm</p>
                            <p className="font-semibold text-zinc-100 font-mono text-sm">
                                {vercelInfo.version}
                            </p>
                        </div>
                        <Database className="w-5 h-5 text-zinc-500" />
                    </div>
                </Card>

                <Card className="p-4 bg-zinc-800/50 border-zinc-700/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-zinc-400 mb-1">RAM Kullanımı</p>
                            <p className="font-semibold text-zinc-100">
                                {sysMetrics.ram}%
                            </p>
                        </div>
                        <Activity className="w-5 h-5 text-zinc-500" />
                    </div>
                </Card>
            </div>

            {/* Live Logs */}
            {realtimeLogs.length > 0 && (
                <Card className="p-5 bg-zinc-800/50 border-zinc-700/50">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <h3 className="font-semibold text-zinc-100">
                            Canlı Sistem Logları
                        </h3>
                    </div>
                    <div className="space-y-2 font-mono text-xs">
                        {realtimeLogs.map((log, i) => (
                            <div key={i} className="flex items-start gap-3 text-zinc-300">
                                <span className="text-zinc-500 shrink-0">
                                    {new Date(log.created_at).toLocaleTimeString('tr-TR')}
                                </span>
                                <span className={cn(
                                    "font-semibold shrink-0",
                                    log.event_type?.includes('error') ? 'text-red-400' : 'text-green-400'
                                )}>
                                    [{log.event_type?.toUpperCase()}]
                                </span>
                                <span className="truncate">{log.message}</span>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Gyms List */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-xl font-bold text-zinc-100">
                        Salonlar ({filteredGyms.length})
                    </h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input
                            type="text"
                            placeholder="Salon ara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full sm:w-64 pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    {filteredGyms.map((gym) => {
                        const gymUptime = gymUptimes[gym.id] || 0;
                        const isActive = gym.settings?.is_activated;

                        return (
                            <Card
                                key={gym.id}
                                onClick={() => router.push(`/gyms/${gym.id}`)}
                                className="p-4 bg-zinc-800/50 border-zinc-700/50 hover:border-blue-500 hover:bg-zinc-800 transition-colors cursor-pointer"
                            >
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className="p-2 bg-blue-600 rounded-lg shrink-0">
                                            <Building2 className="w-5 h-5 text-white" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-semibold text-zinc-100 truncate">
                                                {gym.name}
                                            </h3>
                                            <div className="flex items-center gap-3 mt-1 text-xs text-zinc-400">
                                                <span className="font-mono">
                                                    {gym.id.slice(0, 8)}
                                                </span>
                                                <span className="hidden sm:inline">•</span>
                                                <span className="hidden sm:inline">
                                                    Uptime: {gymUptime.toFixed(1)}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-zinc-500 shrink-0" />
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </div>

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
                                <div>
                                    <label className="text-sm font-medium text-zinc-300 mb-2 block">
                                        Mesaj
                                    </label>
                                    <textarea
                                        autoFocus
                                        value={announcementMsg}
                                        onChange={(e) => setAnnouncementMsg(e.target.value)}
                                        placeholder="Tüm salonlara gönderilecek mesajı yazın..."
                                        className="w-full h-32 px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                                    />
                                </div>

                                <div className="p-3 bg-blue-600/10 border border-blue-600/30 rounded-lg">
                                    <p className="text-xs text-zinc-300">
                                        Bu mesaj tüm salon yöneticilerine bildirim olarak gönderilecektir.
                                    </p>
                                </div>

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