'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Card, Button } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import {
    Activity,
    Database,
    Zap,
    ShieldCheck,
    AlertCircle,
    Server,
    Clock,
    CheckCircle2,
    RefreshCcw,
    Lock,
    Globe,
    Cpu,
    Sparkles,
    Terminal,
    ChevronRight,
    Wifi,
    HardDrive,
    HeartPulse,
    Package
} from 'lucide-react';
import Link from 'next/link';
import { cn, maskEmail } from '@/lib/utils';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

interface SystemLog {
    id: string;
    event_type: 'success' | 'error' | 'info';
    message: string;
    created_at: string;
    user_email?: string;
}

export default function SystemHealthPage() {
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState(new Date());
    const [logs, setLogs] = useState<SystemLog[]>([]);
    const [healthMetrics, setHealthMetrics] = useState({
        dbResponseTime: 0,
        dbStatus: 'SCANNING',
        authStatus: 'SCANNING',
        storageStatus: 'SCANNING',
    });
    const [responseHistory, setResponseHistory] = useState<number[]>([]);
    const [stabilityData, setStabilityData] = useState<{ date: string, success: number, error: number }[]>([]);
    const [systemMetrics, setSystemMetrics] = useState({
        heapUsed: 0,
        heapLimit: 0,
        memoryPercent: 0,
    });
    const [networkInfo, setNetworkInfo] = useState({ effectiveType: 'unknown', downlink: 0, rtt: 0 });
    const [realtimeStats, setRealtimeStats] = useState({ activeChannels: 0, status: 'disconnected' });
    const [uptime, setUptime] = useState(100);
    const [externalApis, setExternalApis] = useState({
        gemini: { status: 'STANDBY', responseTime: 0 },
        resend: { status: 'STANDBY', responseTime: 0 },
    });

    const supabase = createClient();

    const loadRecentLogs = useCallback(async () => {
        try {
            const { data } = await supabase.from('system_logs').select('*').order('created_at', { ascending: false }).limit(15);
            if (data) setLogs(data as SystemLog[]);
        } catch (err) { console.error(err); }
    }, [supabase]);

    const loadStabilityData = useCallback(async () => {
        try {
            const days = 7;
            const data = [];
            const now = new Date();

            for (let i = days - 1; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(date.getDate() - i);
                const startOfDay = new Date(date.setHours(0, 0, 0, 0)).toISOString();
                const endOfDay = new Date(date.setHours(23, 59, 59, 999)).toISOString();

                const { count: successCount } = await supabase
                    .from('system_logs')
                    .select('*', { count: 'exact', head: true })
                    .eq('event_type', 'success')
                    .gte('created_at', startOfDay)
                    .lte('created_at', endOfDay);

                const { count: errorCount } = await supabase
                    .from('system_logs')
                    .select('*', { count: 'exact', head: true })
                    .eq('event_type', 'error')
                    .gte('created_at', startOfDay)
                    .lte('created_at', endOfDay);

                data.push({
                    date: date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' }),
                    success: successCount || 0,
                    error: errorCount || 0
                });
            }
            setStabilityData(data);
        } catch (err) { console.error(err); }
    }, [supabase]);

    const calculateUptime = useCallback(async () => {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { count: errorCount } = await supabase.from('system_logs').select('*', { count: 'exact', head: true }).eq('event_type', 'error').gt('created_at', sevenDaysAgo);
        const { count: totalCount } = await supabase.from('system_logs').select('*', { count: 'exact', head: true }).gt('created_at', sevenDaysAgo);
        if (totalCount && totalCount > 0) {
            setUptime(Number((((totalCount - (errorCount || 0)) / totalCount) * 100).toFixed(2)));
        }
    }, [supabase]);

    const checkHealth = useCallback(async () => {
        setLoading(true);
        try {
            const dbStart = performance.now();
            await supabase.from('gyms').select('id').limit(1);
            const dbEnd = performance.now();
            const dbResponseTime = Math.round(dbEnd - dbStart);

            const { data: { session }, error: authError } = await supabase.auth.getSession();
            const { error: storageError } = await supabase.storage.listBuckets();

            setHealthMetrics({
                dbResponseTime,
                dbStatus: dbResponseTime < 150 ? 'OPTIMAL' : 'DEGRADED',
                authStatus: authError ? 'ERROR' : session ? 'AUTHENTICATED' : 'ANONYMOUS',
                storageStatus: storageError ? 'ERROR' : 'OPERATIONAL',
            });

            setResponseHistory(prev => [...prev, dbResponseTime].slice(-20));

            const checkApi = async (url: string) => {
                try {
                    const s = performance.now();
                    const r = await fetch(url);
                    const e = performance.now();
                    return { status: r.ok ? 'ONLINE' : 'ERROR', time: Math.round(e - s) };
                } catch { return { status: 'ERROR', time: 0 }; }
            };

            checkApi('/api/ai/health').then(r => setExternalApis(p => ({ ...p, gemini: { status: r.status, responseTime: r.time } })));
            checkApi('/api/health/resend').then(r => setExternalApis(p => ({ ...p, resend: { status: r.status, responseTime: r.time } })));
            
            calculateUptime();
            loadStabilityData();
            loadRecentLogs();
            setLastRefresh(new Date());
            setLoading(false);
        } catch (err) {
            setLoading(false);
        }
    }, [supabase, calculateUptime, loadStabilityData, loadRecentLogs]);

    useEffect(() => {
        checkHealth();
        const interval = setInterval(checkHealth, 30000);
        const metricsInterval = setInterval(() => {
            if (typeof window !== 'undefined' && (performance as any).memory) {
                const m = (performance as any).memory;
                setSystemMetrics({ 
                    heapUsed: Math.round(m.usedJSHeapSize / 1048576), 
                    heapLimit: Math.round(m.jsHeapSizeLimit / 1048576),
                    memoryPercent: Math.round((m.usedJSHeapSize / m.jsHeapSizeLimit) * 100)
                });
            }
        }, 3000);

        if ('connection' in navigator) {
            const c = (navigator as any).connection;
            setNetworkInfo({ effectiveType: c.effectiveType, downlink: c.downlink, rtt: c.rtt });
        }

        return () => {
            clearInterval(interval);
            clearInterval(metricsInterval);
        };
    }, [checkHealth]);

    return (
        <div className="space-y-12 text-left text-white font-sans pb-20 relative w-full">
            {/* 1. Header HUD */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 border-b border-white/[0.04] pb-12">
                <div className="flex items-start gap-8">
                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-[1.5rem] shadow-lg shadow-blue-500/5 relative overflow-hidden">
                        <Activity className="w-10 h-10 text-blue-500 relative z-10" />
                        <div className="absolute inset-0 bg-blue-500/5 animate-pulse" />
                    </div>
                    <div>
                        <div className="flex items-center gap-4 mb-3">
                            <h1 className="text-4xl font-black text-white tracking-tighter uppercase">
                                SİSTEM <span className="text-blue-500">SAĞLIĞI</span>
                            </h1>
                            <div className="flex items-center gap-2.5 px-3 py-1 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Tüm Sistemler Kararlı</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-6 text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">
                            <div className="flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5" /> SON TARAMA: {lastRefresh.toLocaleTimeString('tr-TR')}
                            </div>
                            <div className="flex items-center gap-2">
                                <Server className="w-3.5 h-3.5" /> SALON_KÜMESİ: EU-WEST-1
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button 
                        onClick={checkHealth} 
                        variant="secondary" 
                        className="bg-zinc-950 border border-white/5 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all rounded-xl h-14 px-8 font-black text-[10px] tracking-[0.3em] uppercase"
                    >
                        <RefreshCcw className={cn("w-4 h-4 mr-3", loading && "animate-spin")} />
                        SİSTEMİ YENİDEN TARA
                    </Button>
                </div>
            </div>

            {/* 2. Status Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                    { label: 'Veritabanı Erişimi', status: healthMetrics.dbStatus, icon: Database, color: 'text-emerald-500', desc: 'Sorgu Performansı' },
                    { label: 'API Yanıt Hızı', status: `${healthMetrics.dbResponseTime}ms`, icon: Zap, color: 'text-amber-500', desc: 'Gidiş-Dönüş Süresi' },
                    { label: 'Güvenlik Geçidi', status: healthMetrics.authStatus, icon: Lock, color: 'text-blue-500', desc: 'Kimlik Doğrulama' },
                    { label: 'Bulut Depolama', status: healthMetrics.storageStatus, icon: HardDrive, color: 'text-purple-500', desc: 'Dosya Erişilebilirliği' },
                ].map((m, i) => (
                    <Card key={i} className="p-8 bg-zinc-950/20 border-white/[0.04] relative overflow-hidden group hover:border-blue-500/20 transition-all rounded-[2rem]">
                         <div className="flex items-center justify-between mb-8">
                            <div className={cn("p-3 bg-white/[0.03] border border-white/5 rounded-2xl group-hover:scale-110 transition-transform shadow-inner", m.color)}>
                                <m.icon className="w-6 h-6" />
                            </div>
                            <div className={cn(
                                "px-3 py-1 rounded-lg text-[10px] font-mono font-black uppercase tracking-widest border shadow-lg",
                                m.status.includes('ERROR') || m.status.includes('CRITICAL') ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            )}>
                                {m.status}
                            </div>
                        </div>
                        <div>
                            <p className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-1">{m.label}</p>
                            <p className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest">{m.desc}</p>
                        </div>
                    </Card>
                ))}
            </div>

            {/* 3. Visual Analytics Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* System Stability Chart */}
                <Card className="bg-zinc-950/20 border-white/[0.04] p-10 relative overflow-hidden rounded-[2.5rem]">
                    <div className="flex items-center justify-between mb-12">
                        <div className="flex items-center gap-5">
                            <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                                <ShieldCheck className="w-6 h-6 text-emerald-500" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white uppercase tracking-tighter">Sistem Kararlılığı</h3>
                                <p className="text-[10px] text-zinc-600 mt-1 uppercase font-bold tracking-[0.3em]">SON 7 GÜN :: HATA DAĞILIMI</p>
                            </div>
                        </div>
                    </div>

                    <div className="h-64 flex items-end gap-4 px-2 relative z-10">
                        {stabilityData.map((day, i) => {
                            const total = day.success + day.error;
                            const successHeight = total > 0 ? (day.success / (total + 5)) * 100 : 5;
                            const errorHeight = total > 0 ? (day.error / (total + 5)) * 100 : 0;
                            
                            return (
                                <div key={i} className="flex-1 flex flex-col justify-end gap-1 group relative">
                                    {day.error > 0 && (
                                        <motion.div 
                                            initial={{ height: 0 }}
                                            animate={{ height: `${errorHeight}%` }}
                                            className="w-full bg-red-500/40 rounded-t-sm"
                                        />
                                    )}
                                    <motion.div 
                                        initial={{ height: 0 }}
                                        animate={{ height: `${successHeight}%` }}
                                        className="w-full bg-emerald-500/20 group-hover:bg-emerald-500/40 transition-colors rounded-t-sm"
                                    />
                                    <p className="text-[8px] font-mono font-black text-zinc-800 uppercase mt-4 text-center">{day.date}</p>
                                </div>
                            );
                        })}
                    </div>
                </Card>

                {/* Latency Telemetry Chart */}
                <Card className="bg-zinc-950/20 border-white/[0.04] p-10 relative overflow-hidden rounded-[2.5rem]">
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
                    
                    <div className="flex items-center justify-between mb-16 relative z-10">
                        <div className="flex items-center gap-5">
                            <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                                <Activity className="w-6 h-6 text-blue-500" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white uppercase tracking-tighter">Gecikme Telemetrisi</h3>
                                <p className="text-[10px] text-zinc-600 mt-1 uppercase font-bold tracking-[0.3em]">VERİTABANI GECİKMESİ :: SON 20 ÖRNEK</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 px-4 py-2 bg-zinc-950 border border-white/5 rounded-xl">
                            <Wifi className="w-4 h-4 text-blue-500 animate-pulse" />
                            <span className="text-[10px] font-mono font-black text-zinc-500 uppercase">Canlı</span>
                        </div>
                    </div>

                    <div className="h-64 flex items-end gap-2 px-2 relative z-10">
                        {responseHistory.map((val, i) => {
                            const max = Math.max(...responseHistory, 200);
                            const height = (val / max) * 100;
                            return (
                                <div key={i} className="flex-1 group relative h-full flex flex-col justify-end">
                                    <motion.div 
                                        initial={{ height: 0 }}
                                        animate={{ height: `${Math.max(height, 5)}%` }}
                                        className={cn(
                                            "w-full rounded-t-lg transition-all duration-500 shadow-lg",
                                            val < 100 
                                                ? 'bg-blue-500/30 group-hover:bg-blue-500 shadow-blue-500/10' 
                                                : 'bg-amber-500/30 group-hover:bg-amber-500 shadow-amber-500/10'
                                        )}
                                    />
                                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 p-2.5 bg-zinc-950 border border-white/10 rounded-xl text-[10px] font-mono font-black text-white opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-50 shadow-2xl">
                                        {val} MS
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-10 pt-6 border-t border-white/[0.04] flex justify-between text-[10px] font-mono font-black text-zinc-800 uppercase tracking-[0.4em]">
                        <span>T-EKSİ 10 DAKİKA</span>
                        <span className="text-blue-500/40">Cerrahi Monitör v4.2</span>
                        <span>BAĞLANTI KARARLI</span>
                    </div>
                </Card>
            </div>

            {/* 4. Sub-Systems & External Services HUD */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
                <Card className="p-10 bg-zinc-950/20 border-white/[0.04] rounded-[2rem] relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
                    <h4 className="text-[11px] font-black text-zinc-700 uppercase tracking-[0.3em] mb-6">Bellek Ataması</h4>
                    <div className="space-y-6">
                         <div className="flex justify-between items-end">
                            <p className="text-4xl font-black text-white tracking-tighter tabular-nums">{systemMetrics.heapUsed || '0'} <span className="text-sm text-zinc-800 font-mono">MB</span></p>
                            <p className="text-[10px] font-mono font-black text-zinc-700">TOPLAM {systemMetrics.heapLimit || '0'} MB</p>
                         </div>
                         <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                            <motion.div 
                                animate={{ width: `${systemMetrics.memoryPercent || 0}%` }}
                                className="h-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.6)]"
                            />
                         </div>
                    </div>
                </Card>

                <Card className="p-10 bg-zinc-950/20 border-white/[0.04] rounded-[2rem] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
                    <h4 className="text-[11px] font-black text-zinc-700 uppercase tracking-[0.3em] mb-6">Ağ Yığını</h4>
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <p className="text-[10px] font-black text-zinc-800 uppercase tracking-widest mb-2">İndirme</p>
                            <p className="text-3xl font-black text-white tracking-tighter tabular-nums">{networkInfo.downlink || '0'} <span className="text-[10px] text-zinc-800 font-mono uppercase">Mb/s</span></p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-zinc-800 uppercase tracking-widest mb-2">Gecikme</p>
                            <p className="text-3xl font-black text-white tracking-tighter tabular-nums">{networkInfo.rtt || '0'} <span className="text-[10px] text-zinc-800 font-mono uppercase">ms</span></p>
                        </div>
                    </div>
                </Card>

                <Card className="p-10 bg-zinc-950/20 border-white/[0.04] rounded-[2rem] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-orange-500/20 to-transparent" />
                    <h4 className="text-[11px] font-black text-zinc-700 uppercase tracking-[0.3em] mb-6">Harici Servisler</h4>
                    <div className="flex gap-4">
                         {[
                            { label: 'GEMINI', status: externalApis.gemini.status, time: `${externalApis.gemini.responseTime}ms` },
                            { label: 'RESEND', status: externalApis.resend.status, time: `${externalApis.resend.responseTime}ms` },
                            { label: 'EDGE', status: 'ONLINE', time: '12ms' },
                         ].map((api, i) => (
                             <div key={i} className="flex-1 bg-white/[0.02] border border-white/[0.04] p-3 rounded-xl group hover:border-orange-500/20 transition-all text-center">
                                <p className="text-[10px] font-mono font-black text-zinc-500 group-hover:text-zinc-300 transition-colors uppercase">{api.label}</p>
                                <p className="text-[9px] font-mono text-zinc-700 uppercase mt-1">{api.time}</p>
                                <div className={cn(
                                    "w-1 h-1 rounded-full mx-auto mt-2",
                                    api.status === 'ONLINE' || api.status === 'ÇEVRİMİÇİ' ? 'bg-emerald-500' : 'bg-zinc-700'
                                )} />
                             </div>
                         ))}
                    </div>
                </Card>
            </div>

            {/* 5. FULL WIDTH TERMINAL OUTPUT (Bottom) */}
            <div className="space-y-6 w-full">
                <div className="flex items-center justify-between px-4">
                    <div className="flex items-center gap-4">
                        <Terminal className="w-5 h-5 text-zinc-700" />
                        <h2 className="text-[11px] font-black text-zinc-600 uppercase tracking-[0.3em]">Sistem Olay Günlükleri</h2>
                    </div>
                    <Link href="/health/logs">
                        <Button className="bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.05] text-zinc-500 hover:text-white text-[10px] font-black uppercase tracking-[0.3em] h-10 px-6 rounded-xl transition-all">
                            TÜM KAYITLARI İNCELE
                        </Button>
                    </Link>
                </div>
                <Card className="bg-[#020202] border-white/[0.04] min-h-[600px] flex flex-col rounded-[2rem] shadow-2xl relative overflow-hidden w-full">
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.005)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.005)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />
                    
                    {/* Terminal Header Row */}
                    <div className="bg-white/[0.02] px-8 py-3 border-b border-white/[0.04] flex items-center text-[10px] font-mono font-black text-zinc-700 uppercase tracking-[0.3em] relative z-10">
                        <div className="w-32">Zaman</div>
                        <div className="w-24">İşlem</div>
                        <div className="flex-1 px-10">Olay Detayı</div>
                        <div className="w-48 text-center">İşlemi Yapan</div>
                        <div className="w-24 text-right">Durum</div>
                    </div>

                    <div className="flex-1 overflow-y-auto divide-y divide-white/[0.02] hide-scrollbar relative z-10">
                        {logs.length > 0 ? logs.map((log, i) => (
                            <div key={i} className="flex items-center px-8 py-3.5 hover:bg-orange-500/[0.02] group transition-all duration-300 cursor-default border-l-2 border-transparent hover:border-orange-500/40">
                                {/* Timestamp */}
                                <div className="w-32 shrink-0 text-[11px] font-mono text-zinc-800 group-hover:text-zinc-500 transition-colors">
                                    {format(new Date(log.created_at), 'HH:mm:ss:SSS')}
                                </div>

                                {/* Event Type */}
                                <div className="w-24 shrink-0">
                                    <span className={cn(
                                        "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border",
                                        log.event_type === 'success' ? 'text-emerald-500/60 border-emerald-500/10' : 'text-blue-500/60 border-blue-500/10'
                                    )}>
                                        {log.event_type === 'success' ? 'BAŞARILI' : 'BİLGİ'}
                                    </span>
                                </div>

                                {/* Message */}
                                <div className="flex-1 px-10 min-w-0">
                                    <p className="text-[12px] font-mono font-medium text-zinc-500 group-hover:text-zinc-200 transition-colors truncate">
                                        <span className="text-orange-500/30 mr-2">»</span>
                                        {log.message}
                                    </p>
                                </div>

                                {/* Actor */}
                                <div className="w-48 shrink-0 text-center">
                                    <span className="text-[10px] font-mono font-bold text-zinc-800 group-hover:text-zinc-600 transition-colors uppercase tracking-tight">
                                        {log.user_email ? maskEmail(log.user_email) : 'SİSTEM_OTOMASYON'}
                                    </span>
                                </div>

                                {/* Status Light */}
                                <div className="w-24 shrink-0 flex justify-end items-center gap-3">
                                    <span className={cn(
                                        "text-[9px] font-black uppercase tracking-widest transition-colors",
                                        log.event_type === 'success' ? 'text-emerald-500/40 group-hover:text-emerald-500' : 
                                        log.event_type === 'error' ? 'text-red-500/40 group-hover:text-red-500' : 
                                        'text-blue-500/40 group-hover:text-blue-500'
                                    )}>
                                        {log.event_type === 'success' ? 'ONAYLANDI' : 
                                         log.event_type === 'error' ? 'BAŞARISIZ' : 'İŞLENDİ'}
                                    </span>
                                    <div className={cn(
                                        "w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor]",
                                        log.event_type === 'success' ? 'text-emerald-500 bg-current' : 
                                        log.event_type === 'error' ? 'text-red-500 bg-current' : 
                                        'text-blue-500 bg-current'
                                    )} />
                                </div>
                            </div>
                        )) : (
                            <div className="h-full flex flex-col items-center justify-center py-40 opacity-5">
                                <Terminal className="w-32 h-32 mb-6" />
                                <p className="text-xl font-black uppercase tracking-[0.5em]">VERİ AKIŞI YOK</p>
                            </div>
                        )}
                    </div>
                    
                    {/* Console Footer */}
                    <div className="bg-white/[0.01] px-8 py-3 border-t border-white/[0.04] flex items-center justify-between text-[10px] font-mono font-black text-zinc-800 uppercase tracking-[0.4em] relative z-10">
                        <div className="flex gap-10">
                            <span className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" /> Bağlantı: Aktif</span>
                            <span>Hafıza: Normal</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-2 h-4 bg-orange-500 animate-pulse shadow-[0_0_15px_orange]" />
                            <span>KÜRESEL TELEMETRİ AKIŞI BEKLENİYOR...</span>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
