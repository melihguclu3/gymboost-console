'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, Button } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import {
    Activity,
    Database,
    Zap,
    Lock,
    HardDrive,
    Server,
    Clock,
    RefreshCcw,
    Cpu,
    Network,
    Globe,
    ShieldCheck,
    ChevronRight
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
    const [uptime, setUptime] = useState(100);
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
    const [externalApis, setExternalApis] = useState({
        gemini: { status: 'BEKLEMEDE', responseTime: 0 },
        resend: { status: 'BEKLEMEDE', responseTime: 0 },
        edge: { status: 'AKTİF', responseTime: 12 }
    });

    const supabase = createClient();

    const loadRecentLogs = useCallback(async () => {
        try {
            const { data } = await supabase.from('system_logs').select('*').order('created_at', { ascending: false }).limit(15);
            if (data) setLogs(data as SystemLog[]);
        } catch (err) { console.error(err); }
    }, [supabase]);

    const calculateUptime = useCallback(async () => {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { count: errorCount } = await supabase.from('system_logs').select('*', { count: 'exact', head: true }).eq('event_type', 'error').gt('created_at', sevenDaysAgo);
        const { count: totalCount } = await supabase.from('system_logs').select('*', { count: 'exact', head: true }).gt('created_at', sevenDaysAgo);
        if (totalCount && totalCount > 0) {
            setUptime(Number((((totalCount - (errorCount || 0)) / totalCount) * 100).toFixed(2)));
        } else {
            setUptime(100);
        }
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
                dbStatus: dbResponseTime < 150 ? 'OPTIMAL' : 'YAVAŞ',
                authStatus: authError ? 'HATA' : session ? 'AKTİF' : 'ANONİM',
                storageStatus: storageError ? 'HATA' : 'AKTİF',
            });

            setResponseHistory(prev => [...prev, dbResponseTime].slice(-20));

            // Real External Service Checks
            const checkApi = async (url: string) => {
                try {
                    const s = performance.now();
                    const r = await fetch(url);
                    const e = performance.now();
                    return { status: r.ok ? 'AKTİF' : 'HATA', time: Math.round(e - s) };
                } catch { return { status: 'HATA', time: 0 }; }
            };

            // Edge Network Check (Self Ping)
            const checkEdge = async () => {
                try {
                    const s = performance.now();
                    await fetch('/', { method: 'HEAD', cache: 'no-store' });
                    const e = performance.now();
                    return { status: 'AKTİF', time: Math.round(e - s) };
                } catch { return { status: 'HATA', time: 0 }; }
            };

            const [geminiRes, resendRes, edgeRes] = await Promise.all([
                checkApi('/api/ai/health'),
                checkApi('/api/health/resend'),
                checkEdge()
            ]);

            setExternalApis({
                gemini: { status: geminiRes.status, responseTime: geminiRes.time },
                resend: { status: resendRes.status, responseTime: resendRes.time },
                edge: { status: edgeRes.status, responseTime: edgeRes.time }
            });

            await calculateUptime();
            await loadStabilityData();
            await loadRecentLogs();
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
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100">
                        Sistem Sağlığı
                    </h1>
                    <div className="flex items-center gap-3 mt-1 text-sm text-zinc-400">
                        <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            {lastRefresh.toLocaleTimeString('tr-TR')}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1.5 text-green-500 font-medium">
                            <ShieldCheck className="w-4 h-4" />
                            %{uptime} Uptime
                        </span>
                    </div>
                </div>
                <Button
                    onClick={checkHealth}
                    variant="secondary"
                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100"
                >
                    <RefreshCcw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
                    Yeniden Tara
                </Button>
            </div>

            {/* Status Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4 bg-zinc-800/50 border-zinc-700/50">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-green-600/10 text-green-500 rounded-lg">
                            <Database className="w-5 h-5" />
                        </div>
                        <span className={cn(
                            "text-xs font-medium px-2 py-1 rounded",
                            healthMetrics.dbStatus === 'OPTIMAL' || healthMetrics.dbStatus === 'AKTİF'
                                ? "bg-green-600/10 text-green-500"
                                : "bg-red-600/10 text-red-500"
                        )}>
                            {healthMetrics.dbStatus}
                        </span>
                    </div>
                    <div>
                        <p className="text-sm text-zinc-400">Veritabanı</p>
                        <p className="text-xl font-bold text-zinc-100 mt-1">Bağlı</p>
                    </div>
                </Card>

                <Card className="p-4 bg-zinc-800/50 border-zinc-700/50">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-blue-600/10 text-blue-500 rounded-lg">
                            <Zap className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-medium px-2 py-1 rounded bg-blue-600/10 text-blue-500">
                            {healthMetrics.dbResponseTime}ms
                        </span>
                    </div>
                    <div>
                        <p className="text-sm text-zinc-400">API Yanıt Süresi</p>
                        <p className="text-xl font-bold text-zinc-100 mt-1">Normal</p>
                    </div>
                </Card>

                <Card className="p-4 bg-zinc-800/50 border-zinc-700/50">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-purple-600/10 text-purple-500 rounded-lg">
                            <Lock className="w-5 h-5" />
                        </div>
                        <span className={cn(
                            "text-xs font-medium px-2 py-1 rounded",
                            healthMetrics.authStatus === 'AKTİF' ? "bg-green-600/10 text-green-500" : "bg-zinc-800 text-zinc-400"
                        )}>
                            {healthMetrics.authStatus}
                        </span>
                    </div>
                    <div>
                        <p className="text-sm text-zinc-400">Auth Servisi</p>
                        <p className="text-xl font-bold text-zinc-100 mt-1">Çalışıyor</p>
                    </div>
                </Card>

                <Card className="p-4 bg-zinc-800/50 border-zinc-700/50">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-orange-600/10 text-orange-500 rounded-lg">
                            <HardDrive className="w-5 h-5" />
                        </div>
                        <span className={cn(
                            "text-xs font-medium px-2 py-1 rounded",
                            healthMetrics.storageStatus === 'AKTİF' ? "bg-green-600/10 text-green-500" : "bg-red-600/10 text-red-500"
                        )}>
                            {healthMetrics.storageStatus}
                        </span>
                    </div>
                    <div>
                        <p className="text-sm text-zinc-400">Depolama</p>
                        <p className="text-xl font-bold text-zinc-100 mt-1">Erişilebilir</p>
                    </div>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Latency Chart */}
                <Card className="p-4 bg-zinc-800/50 border-zinc-700/50 flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-blue-500" />
                            <h3 className="font-medium text-zinc-100 text-sm">Gecikme Analizi</h3>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-green-500">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            Canlı
                        </div>
                    </div>

                    <div className="flex-1 flex items-end gap-0.5 min-h-[120px]">
                        {Array.from({ length: 20 }).map((_, i) => {
                            const val = responseHistory[i];
                            const hasData = val !== undefined;
                            const max = Math.max(...responseHistory, 100);
                            const heightPercent = hasData ? Math.max((val / max) * 100, 5) : 0;

                            return (
                                <div key={i} className="flex-1 h-full flex items-end group relative">
                                    <div
                                        style={{ height: hasData ? `${heightPercent}%` : '2px' }}
                                        className={cn(
                                            "w-full rounded-sm transition-all duration-300",
                                            hasData
                                                ? val < 100 ? 'bg-blue-500' : val < 200 ? 'bg-orange-500' : 'bg-red-500'
                                                : 'bg-zinc-700/30'
                                        )}
                                    />
                                    {hasData && (
                                        <div className="opacity-0 group-hover:opacity-100 absolute -top-5 left-1/2 -translate-x-1/2 bg-zinc-900 border border-zinc-700 text-[10px] text-zinc-100 px-1 py-0.5 rounded whitespace-nowrap z-10">
                                            {val}ms
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex justify-between mt-2 text-[10px] text-zinc-500">
                        <span>Eski</span>
                        <span className="text-zinc-400 font-mono">{responseHistory.length > 0 ? `${responseHistory[responseHistory.length - 1]}ms` : '—'}</span>
                        <span>Yeni</span>
                    </div>
                </Card>

                {/* Sub Systems */}
                <div className="grid grid-cols-1 gap-4">
                    <Card className="p-6 bg-zinc-800/50 border-zinc-700/50">
                        <h3 className="font-semibold text-zinc-100 mb-4 flex items-center gap-2">
                            <Cpu className="w-4 h-4 text-zinc-400" />
                            Sistem Kaynakları
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-zinc-400">Bellek Kullanımı</span>
                                    <span className="text-zinc-100">{systemMetrics.heapUsed} / {systemMetrics.heapLimit} MB</span>
                                </div>
                                <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-600 transition-all duration-500"
                                        style={{ width: `${systemMetrics.memoryPercent}%` }}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div className="p-3 bg-zinc-900/50 rounded-lg border border-zinc-700/50">
                                    <p className="text-xs text-zinc-400">İndirme Hızı</p>
                                    <p className="text-lg font-bold text-zinc-100">{networkInfo.downlink} Mbps</p>
                                </div>
                                <div className="p-3 bg-zinc-900/50 rounded-lg border border-zinc-700/50">
                                    <p className="text-xs text-zinc-400">Ağ Gecikmesi</p>
                                    <p className="text-lg font-bold text-zinc-100">{networkInfo.rtt} ms</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 bg-zinc-800/50 border-zinc-700/50">
                        <h3 className="font-semibold text-zinc-100 mb-4 flex items-center gap-2">
                            <Network className="w-4 h-4 text-zinc-400" />
                            Harici Servisler
                        </h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="flex flex-col items-center justify-center p-3 bg-zinc-900/50 rounded-lg border border-zinc-700/50 text-center">
                                <Globe className="w-4 h-4 text-zinc-400 mb-2" />
                                <p className="text-xs font-medium text-zinc-100">Edge Network</p>
                                <div className="flex items-center gap-1 mt-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                    <span className="text-[10px] text-zinc-500">Aktif</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-center justify-center p-3 bg-zinc-900/50 rounded-lg border border-zinc-700/50 text-center">
                                <Cpu className="w-4 h-4 text-zinc-400 mb-2" />
                                <p className="text-xs font-medium text-zinc-100">Gemini AI</p>
                                <div className="flex items-center gap-1 mt-1">
                                    <div className={cn("w-1.5 h-1.5 rounded-full", externalApis.gemini.status === 'AKTİF' ? "bg-green-500" : "bg-orange-500")} />
                                    <span className="text-[10px] text-zinc-500">{externalApis.gemini.responseTime}ms</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-center justify-center p-3 bg-zinc-900/50 rounded-lg border border-zinc-700/50 text-center">
                                <Zap className="w-4 h-4 text-zinc-400 mb-2" />
                                <p className="text-xs font-medium text-zinc-100">Resend</p>
                                <div className="flex items-center gap-1 mt-1">
                                    <div className={cn("w-1.5 h-1.5 rounded-full", externalApis.resend.status === 'AKTİF' ? "bg-green-500" : "bg-orange-500")} />
                                    <span className="text-[10px] text-zinc-500">{externalApis.resend.responseTime}ms</span>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Logs Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-zinc-100">Sistem Günlükleri</h2>
                    <Link href="/health/logs">
                        <Button variant="ghost" className="text-zinc-400 hover:text-zinc-100">
                            Tümünü Gör <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </Link>
                </div>

                <Card className="overflow-hidden bg-zinc-800/50 border-zinc-700/50">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-zinc-900/50 text-zinc-400 border-b border-zinc-700/50">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Zaman</th>
                                    <th className="px-6 py-3 font-medium">Durum</th>
                                    <th className="px-6 py-3 font-medium">Mesaj</th>
                                    <th className="px-6 py-3 font-medium">Kullanıcı</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-700/50">
                                {logs.length > 0 ? logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-zinc-700/10 transition-colors">
                                        <td className="px-6 py-4 text-zinc-400 font-mono text-xs">
                                            {format(new Date(log.created_at), 'HH:mm:ss')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "px-2 py-1 rounded text-xs font-medium",
                                                log.event_type === 'success' ? "bg-green-600/10 text-green-500" :
                                                    log.event_type === 'error' ? "bg-red-600/10 text-red-500" :
                                                        "bg-blue-600/10 text-blue-500"
                                            )}>
                                                {log.event_type === 'success' ? 'Başarılı' :
                                                    log.event_type === 'error' ? 'Hata' : 'Bilgi'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-zinc-200">
                                            {log.message}
                                        </td>
                                        <td className="px-6 py-4 text-zinc-400 text-xs">
                                            {log.user_email ? maskEmail(log.user_email) : 'Sistem'}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">
                                            Kayıt bulunamadı.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
}
