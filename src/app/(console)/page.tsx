'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, Button } from '@/components/ui';
import {
    Users,
    Building2,
    TrendingUp,
    Zap,
    ArrowUpRight,
    Search,
    ChevronRight,
    Activity,
    Clock,
    Database,
    Globe,
    Server,
    ShieldCheck,
    Terminal,
    Cpu,
    Wifi,
    Package,
    HeartPulse,
    AlertCircle,
    Bell,
    X
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
        trialGyms: 0,
        todayCheckIns: 0,
        lowStockAlerts: 0,
        healthWarnings: 0,
        revenueChange: 0, // Yeni: gelir değişim yüzdesi
        last10DaysCheckIns: [] as number[], // Yeni: son 10 günün check-in verileri
        todayCheckInGoal: 100 // Hedef check-in sayısı
    });

    // Her salon için uptime metriği
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
        // Gerçek Vercel SHA veya package version
        const version = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA
            ? `SÜRÜM::${process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA.slice(0, 7).toUpperCase()}`
            : 'v2.4.0';

        setVercelInfo({
            region: isDev ? 'Yerel Sunucu' : (process.env.NEXT_PUBLIC_VERCEL_REGION || 'fra1 (Frankfurt)'),
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

    // Her salon için uptime hesaplama
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

            // Önceki ayın başlangıcı ve bitişi
            const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
            const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

            // Bu ayın başlangıcı
            const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

            // Tüm veriler
            const { data: gymsData } = await supabase.from('gyms').select('*').order('created_at', { ascending: false });
            const { count: memberCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'member');

            // Bu ay ve geçen ayın geliri
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

            // Gelir değişim yüzdesi hesaplama
            let revenueChange = 0;
            if (lastMonthRevenue > 0) {
                revenueChange = Number((((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1));
            } else if (thisMonthRevenue > 0) {
                revenueChange = 100; // Geçen ay 0, bu ay gelir var
            }

            const { count: checkInCount } = await supabase.from('check_ins').select('*', { count: 'exact', head: true }).gt('checked_in_at', todayStart);
            const { count: lowStockCount } = await supabase.from('products').select('*', { count: 'exact', head: true }).lt('current_stock', 5);
            const { count: healthWarningCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).not('health_issues', 'is', null);

            // Son 10 günün check-in verileri
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

                // Salon uptime'larını hesapla
                calculateGymUptimes(activeGyms.map(g => g.id));

                setStats({
                    totalGyms: activeGyms.length,
                    activeMembers: memberCount || 0,
                    totalRevenue: thisMonthRevenue,
                    trialGyms: activeGyms.filter(g => !g.settings?.is_activated).length,
                    todayCheckIns: checkInCount || 0,
                    lowStockAlerts: lowStockCount || 0,
                    healthWarnings: healthWarningCount || 0,
                    revenueChange: revenueChange,
                    last10DaysCheckIns: last10DaysCheckIns,
                    todayCheckInGoal: 100 // Bu değer ayarlanabilir veya DB'den çekilebilir
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
                    title: 'KRİTİK SİSTEM DUYURUSU',
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
                message: `Küresel duyuru yayınlandı (Admins: ${admins?.length || 0}): ${announcementMsg.slice(0, 30)}...`,
                actor_role: 'super_admin'
            });

            toast.success('Küresel duyuru başarıyla yayınlandı.');
            setAnnouncementMsg('');
            setIsAnnouncementOpen(false);
        } catch (error: any) {
            toast.error('Duyuru hatası: ' + error.message);
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
                <div className="w-10 h-10 border-[3px] border-zinc-800 border-t-orange-500 rounded-full animate-spin shadow-lg shadow-orange-500/10" />
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Veri Akışı Senkronize Ediliyor...</p>
            </div>
        );
    }

    // Progress yüzdesi hesaplama
    const todayProgressPercent = Math.min((stats.todayCheckIns / stats.todayCheckInGoal) * 100, 100);

    return (
        <div className="space-y-12 pb-20 text-left">
            {/* --- HEADER HUD --- */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 border-b border-white/[0.04] pb-12">
                <div className="flex items-start gap-8">
                    <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-[1.5rem] shadow-lg shadow-orange-500/5 relative overflow-hidden group">
                        <Activity className="w-10 h-10 text-orange-500 relative z-10 group-hover:scale-110 transition-transform" />
                        <div className="absolute inset-0 bg-orange-500/5 animate-pulse" />
                    </div>
                    <div>
                        <div className="flex items-center gap-4 mb-3">
                            <h1 className="text-4xl font-black text-white tracking-tighter uppercase">
                                KÜRESEL <span className="text-orange-500">SALON</span> OPERASYONLARI
                            </h1>
                        </div>
                        <div className="flex items-center gap-6 text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">
                            <div className="flex items-center gap-2 px-2 py-0.5 bg-emerald-500/5 border border-emerald-500/20 rounded text-emerald-500">
                                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                <span>Sistem Nabzı: Kararlı</span>
                            </div>
                            <div className="flex items-center gap-2 font-mono">
                                <Clock className="w-3.5 h-3.5 text-zinc-700" />
                                {currentTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </div>
                            <div className="flex items-center gap-2 font-mono">
                                <Globe className="w-3.5 h-3.5 text-zinc-700" /> {coords.lat}° N | {coords.lon}° E
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        onClick={() => setIsAnnouncementOpen(true)}
                        variant="secondary"
                        className="px-6 h-14 bg-orange-500/10 border-orange-500/20 text-orange-500 hover:bg-orange-500 hover:text-white rounded-xl transition-all font-black text-[10px] tracking-widest uppercase"
                    >
                        <Bell className="w-4 h-4 mr-3" /> KÜRESEL DUYURU
                    </Button>
                    <div className="px-6 py-4 bg-zinc-950/40 border border-white/[0.04] rounded-2xl text-right group hover:border-orange-500/30 transition-all shadow-2xl relative overflow-hidden">
                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1 group-hover:text-orange-500 transition-colors">Gecikme</p>
                        <p className="text-2xl font-black text-white tabular-nums font-mono">{currentLatency}<span className="text-[10px] text-zinc-800 ml-1 font-mono uppercase">MS</span></p>
                    </div>
                    <div className="px-6 py-4 bg-zinc-950/40 border border-white/[0.04] rounded-2xl text-right group hover:border-blue-500/30 transition-all shadow-2xl relative overflow-hidden">
                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1 group-hover:text-blue-500 transition-colors">Çalışma Süresi</p>
                        <p className="text-2xl font-black text-white tabular-nums font-mono">{uptime}<span className="text-[10px] text-zinc-800 ml-1 font-mono uppercase">%</span></p>
                    </div>
                </div>
            </div>

            {/* --- BENTO METRICS GRID --- */}
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6">
                <Card className="md:col-span-2 lg:col-span-3 p-10 bg-zinc-950/20 border-white/[0.04] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-1/2 h-full bg-emerald-500/5 blur-[100px] pointer-events-none group-hover:bg-emerald-500/10 transition-colors duration-1000" />
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-12">
                            <div className="flex items-center gap-4">
                                <div className="p-3.5 bg-emerald-500/10 rounded-2xl text-emerald-500 border border-emerald-500/20">
                                    <TrendingUp className="w-6 h-6" />
                                </div>
                                <div>
                                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Ağ İşlem Hacmi</span>
                                    <p className="text-[9px] text-zinc-600 font-mono mt-0.5 uppercase tracking-widest">Bu Ay Toplam</p>
                                </div>
                            </div>
                        </div>
                        <h2 className="text-7xl font-black text-white tracking-tighter tabular-nums mb-4">
                            {stats.totalRevenue.toLocaleString()} <span className="text-2xl text-zinc-800 font-mono">TL</span>
                        </h2>
                        <div className="flex items-center gap-3">
                            <div className={`flex items-center gap-1.5 px-3 py-1 ${stats.revenueChange >= 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'} border rounded-lg`}>
                                <ArrowUpRight className={`w-3.5 h-3.5 ${stats.revenueChange >= 0 ? 'text-emerald-500' : 'text-red-500 rotate-90'}`} />
                                <span className={`text-[10px] font-black ${stats.revenueChange >= 0 ? 'text-emerald-500' : 'text-red-500'} uppercase tracking-widest`}>
                                    {stats.revenueChange >= 0 ? '+' : ''}{stats.revenueChange}%
                                </span>
                            </div>
                            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Geçen Aya Göre</span>
                        </div>
                    </div>
                </Card>

                <Card className="md:col-span-2 lg:col-span-3 p-10 bg-zinc-950/20 border-white/[0.04] relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-orange-500/20 to-transparent" />
                    <div className="flex items-center justify-between mb-12 relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="p-3.5 bg-orange-500/10 rounded-2xl text-orange-500 border border-orange-500/20">
                                <Building2 className="w-6 h-6" />
                            </div>
                            <div>
                                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Sistem Salonları</span>
                                <p className="text-[9px] text-zinc-600 font-mono mt-0.5 uppercase tracking-widest">Aktif Örnekler</p>
                            </div>
                        </div>
                        <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-mono text-zinc-400">SENK: TAMAM</div>
                    </div>
                    <div className="grid grid-cols-2 gap-10 relative z-10">
                        <div className="space-y-1">
                            <p className="text-6xl font-black text-white tracking-tighter tabular-nums">{stats.totalGyms}</p>
                            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Yayındaki</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-6xl font-black text-orange-500 tracking-tighter tabular-nums">{stats.trialGyms}</p>
                            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Beklemede</p>
                        </div>
                    </div>
                </Card>

                <Card className="md:col-span-4 lg:col-span-4 p-10 bg-zinc-950/20 border-white/[0.04] group relative overflow-hidden">
                    <div className="absolute inset-0 bg-blue-500/[0.02] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    <div className="flex items-center justify-between mb-10 relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="p-3.5 bg-blue-500/10 rounded-2xl text-blue-500 border border-blue-500/20">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Üye Portföyü</span>
                                <p className="text-[9px] text-zinc-600 font-mono mt-0.5 uppercase tracking-widest">Toplam Kayıtlı Üyeler</p>
                            </div>
                        </div>
                        <button onClick={() => router.push('/users')} className="p-2 text-zinc-500 hover:text-white transition-colors cursor-pointer">
                            <ArrowUpRight className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="flex items-end justify-between relative z-10">
                        <div className="space-y-1">
                            <p className="text-6xl font-black text-white tracking-tighter tabular-nums">{stats.activeMembers.toLocaleString()}</p>
                            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Tüm salonlardaki aktif sporcular</p>
                        </div>
                        <div className="flex items-end gap-1.5 h-20 mb-1">
                            {stats.last10DaysCheckIns.map((count, i) => {
                                const maxCount = Math.max(...stats.last10DaysCheckIns, 1);
                                const height = (count / maxCount) * 100;
                                return (
                                    <motion.div
                                        key={i}
                                        animate={{ height: `${height}%` }}
                                        className="w-1.5 bg-blue-500/20 rounded-full group-hover:bg-blue-500 transition-all duration-500"
                                    />
                                );
                            })}
                        </div>
                    </div>
                </Card>

                <Card className="md:col-span-2 lg:col-span-2 p-10 bg-zinc-950/20 border-white/[0.04]">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="p-3.5 bg-zinc-900 border border-white/5 rounded-2xl text-zinc-500">
                            <Server className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Altyapı Kümesi</span>
                            <p className="text-[9px] text-zinc-600 font-mono mt-0.5 uppercase tracking-widest">Vercel Dağıtım Servisi</p>
                        </div>
                    </div>
                    <div className="space-y-8">
                        <div className="space-y-3">
                            <div className="flex justify-between text-[10px] font-black text-zinc-500 uppercase tracking-widest font-mono">
                                <span>DAĞITIM BÖLGESİ</span>
                                <span className="text-orange-500">{vercelInfo.region}</span>
                            </div>
                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                <motion.div animate={{ width: '100%' }} className="h-full bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.5)] opacity-40" />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between text-[10px] font-black text-zinc-500 uppercase tracking-widest font-mono">
                                <span>YAZILIM SÜRÜMÜ</span>
                                <span className="text-blue-500">{vercelInfo.version}</span>
                            </div>
                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                <motion.div animate={{ width: '100%' }} className="h-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.5)] opacity-40" />
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* --- SYSTEM INTELLIGENCE LAYER --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-8 bg-[#050505] border-white/[0.04] relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-6">
                        <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
                            <Zap className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-mono text-zinc-700 uppercase tracking-widest">CANLI TRAFİK</span>
                    </div>
                    <p className="text-4xl font-black text-white tabular-nums">{stats.todayCheckIns}</p>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-2">Bugünkü Toplam Giriş</p>
                    <div className="mt-6 h-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            animate={{ width: `${todayProgressPercent}%` }}
                            className="h-full bg-blue-500 shadow-[0_0_10px_#3b82f6]"
                        />
                    </div>
                    <p className="text-[9px] text-zinc-600 font-mono mt-2">Hedef: {stats.todayCheckInGoal}</p>
                </Card>

                <Card className="p-8 bg-[#050505] border-white/[0.04] relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-6">
                        <div className="p-3 bg-orange-500/10 rounded-2xl text-orange-500">
                            <Package className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-mono text-zinc-700 uppercase tracking-widest">STOK UYARISI</span>
                    </div>
                    <p className="text-4xl font-black text-white tabular-nums">{stats.lowStockAlerts}</p>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-2">Kritik Stok Uyarıları</p>
                    <div className="mt-6 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                        <span className="text-[9px] font-bold text-orange-500/70 uppercase">Acil İkmal Gerekiyor</span>
                    </div>
                </Card>

                <Card className="p-8 bg-[#050505] border-white/[0.04] relative overflow-hidden group border-red-500/10">
                    <div className="flex items-center justify-between mb-6">
                        <div className="p-3 bg-red-500/10 rounded-2xl text-red-500">
                            <HeartPulse className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-mono text-zinc-700 uppercase tracking-widest">RİSK ANALİZİ</span>
                    </div>
                    <p className="text-4xl font-black text-white tabular-nums">{stats.healthWarnings}</p>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-2">Kritik Sağlık Notları</p>
                    <div className="mt-6 flex items-center gap-2">
                        <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                        <span className="text-[9px] font-bold text-red-500/70 uppercase tracking-tight">Yüksek Riskli Üye Tespit Edildi</span>
                    </div>
                </Card>
            </div>

            {/* --- LIVE SYSTEM STREAM --- */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-orange-500/10 rounded-xl border border-orange-500/20">
                            <Terminal className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Canlı Sistem Akışı</h3>
                            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em] mt-1">Küresel Telemetri :: Akış Aktif</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="px-3 py-1.5 bg-zinc-900 border border-white/5 rounded-lg flex items-center gap-3">
                            <div className="flex gap-1">
                                <div className="w-1 h-1 rounded-full bg-orange-500 animate-pulse" />
                                <div className="w-1 h-1 rounded-full bg-orange-500 animate-pulse delay-75" />
                                <div className="w-1 h-1 rounded-full bg-orange-500 animate-pulse delay-150" />
                            </div>
                            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">GELEN VERİ</span>
                        </div>
                    </div>
                </div>

                <Card className="bg-[#020202] border-white/[0.04] rounded-[1.5rem] overflow-hidden shadow-2xl">
                    <div className="p-6 font-mono text-[11px] space-y-2.5 min-h-[180px] relative">
                        {realtimeLogs.length > 0 ? realtimeLogs.map((log, i) => (
                            <div key={i} className="flex items-center gap-4 text-zinc-500 animate-in fade-in slide-in-from-left-2 duration-500">
                                <span className="text-zinc-800 shrink-0">{new Date(log.created_at).toLocaleTimeString('tr-TR', { hour12: false })}</span>
                                <span className={cn(
                                    "font-bold shrink-0 w-16",
                                    log.event_type?.includes('error') ? 'text-red-500' : 'text-emerald-500'
                                )}>[{log.event_type?.toUpperCase() || 'INFO'}]</span>
                                <span className="text-zinc-400 truncate">{log.message}</span>
                            </div>
                        )) : (
                            <div className="flex items-center gap-4 text-zinc-500 italic">
                                <span className="text-zinc-800">--:--:--</span>
                                <span className="text-zinc-600">--</span>
                                <span className="text-zinc-500">Global telemetri akışı bekleniyor...</span>
                            </div>
                        )}
                        <div className="absolute bottom-6 right-8">
                            <div className="w-2 h-4 bg-orange-500 animate-pulse shadow-[0_0_10px_rgba(249,115,22,0.8)]" />
                        </div>
                    </div>
                </Card>
            </div>

            {/* --- NODE INFRASTRUCTURE LIST --- */}
            <div className="space-y-8">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                            <Database className="w-6 h-6 text-zinc-400" />
                        </div>
                        <h2 className="text-2xl font-black text-white tracking-tight uppercase">Sistem Salonları</h2>
                    </div>
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-orange-500 transition-colors" />
                        <input
                            placeholder="Evrensel Arama..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-zinc-950/50 border border-white/5 rounded-2xl pl-12 pr-6 h-14 text-sm font-bold focus:outline-none focus:border-orange-500/50 transition-all w-80 focus:w-[400px]"
                        />
                    </div>
                </div>

                <div className="grid gap-4">
                    {filteredGyms.map((gym) => {
                        const gymUptime = gymUptimes[gym.id] || 0;
                        const uptimeBars = Math.round(gymUptime / 20); // 0-5 bar

                        return (
                            <div
                                key={gym.id}
                                onClick={() => router.push(`/gyms/${gym.id}`)}
                                className="bg-[#050505] border border-white/[0.04] rounded-[1.5rem] hover:border-orange-500/30 hover:bg-zinc-900/10 transition-all group cursor-pointer overflow-hidden relative"
                            >
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center p-7">
                                    <div className="lg:col-span-4 flex items-center gap-6">
                                        <div className="w-14 h-14 bg-zinc-950 border border-white/5 rounded-xl flex items-center justify-center text-zinc-700 group-hover:text-orange-500 group-hover:border-orange-500/20 transition-all shadow-inner relative">
                                            <Wifi className="w-6 h-6 relative z-10" />
                                            <div className="absolute inset-0 bg-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-base font-black text-white truncate group-hover:text-orange-500 transition-colors uppercase tracking-tight">{gym.name}</h3>
                                                {!gym.settings?.is_activated && (
                                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-mono text-zinc-700 uppercase tracking-widest bg-white/[0.02] px-2 py-0.5 rounded border border-white/[0.05]">
                                                    SALON::{gym.id.slice(0, 8)}
                                                </span>
                                                <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-tighter">{vercelInfo.version}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="lg:col-span-5 grid grid-cols-2 gap-12 border-x border-white/[0.04] px-12">
                                        <div className="space-y-1.5">
                                            <p className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.2em]">Kararlılık</p>
                                            <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                                                <div className="flex gap-0.5">
                                                    {[1, 2, 3, 4, 5].map(i => (
                                                        <div
                                                            key={i}
                                                            className={`w-1 h-3 rounded-sm ${i <= uptimeBars ? 'bg-emerald-500/80' : 'bg-zinc-800'}`}
                                                        />
                                                    ))}
                                                </div>
                                                {gymUptime.toFixed(1)}%
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <p className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.2em]">Son Dağıtım</p>
                                            <p className="text-[10px] font-mono text-zinc-400 uppercase">{new Date(gym.created_at).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                                        </div>
                                    </div>

                                    <div className="lg:col-span-3 flex items-center justify-end gap-8">
                                        <div className="text-right">
                                            <p className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.2em] mb-1">Bellek Kullanımı</p>
                                            <p className="text-[11px] font-black text-white tabular-nums font-mono uppercase bg-white/5 px-2 py-0.5 rounded">{sysMetrics.ram}%</p>
                                        </div>
                                        <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-white/[0.02] border border-white/[0.05] text-zinc-700 group-hover:text-white group-hover:bg-orange-500 transition-all shadow-lg group-hover:shadow-orange-500/20">
                                            <ArrowUpRight className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* --- GLOBAL ANNOUNCEMENT MODAL --- */}
            <AnimatePresence>
                {isAnnouncementOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAnnouncementOpen(false)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
                        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="w-full max-w-xl bg-[#050505] border border-white/10 rounded-[2.5rem] p-10 relative z-10 shadow-2xl overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />

                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-orange-500/10 rounded-2xl text-orange-500 border border-orange-500/20 shadow-lg">
                                        <Bell className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-white uppercase tracking-tight">Küresel Duyuru</h2>
                                        <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-1">Yayın :: Tüm Salonlar Aktif</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsAnnouncementOpen(false)} className="p-2 text-zinc-500 hover:text-white transition-colors cursor-pointer"><X className="w-6 h-6" /></button>
                            </div>

                            <form onSubmit={handleSendAnnouncement} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Mesaj İçeriği</label>
                                    <textarea
                                        autoFocus
                                        value={announcementMsg}
                                        onChange={(e) => setAnnouncementMsg(e.target.value)}
                                        placeholder="Tüm salonlara iletilecek mesajı girin..."
                                        className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-5 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-all resize-none font-medium"
                                    />
                                </div>

                                <div className="p-5 bg-orange-500/5 border border-orange-500/10 rounded-2xl">
                                    <p className="text-[11px] text-zinc-400 leading-relaxed italic uppercase tracking-tight">Bu işlem geri alınamaz. Mesaj, sistemdeki tüm salonların bildirim paneline anlık olarak düşecektir.</p>
                                </div>

                                <div className="flex gap-4">
                                    <Button type="button" onClick={() => setIsAnnouncementOpen(false)} className="flex-1 h-14 bg-white/5 border border-white/5 rounded-2xl font-black text-[10px] tracking-widest uppercase">İPTAL</Button>
                                    <Button
                                        type="submit"
                                        isLoading={announcementLoading}
                                        variant="primary"
                                        className="flex-[2] h-14 rounded-2xl font-black text-[10px] tracking-widest uppercase shadow-2xl shadow-orange-500/20"
                                    >
                                        DUYURUYU YAYINLA
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