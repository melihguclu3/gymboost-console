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
    Sparkles
} from 'lucide-react';
import Link from 'next/link';

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
        dbStatus: 'Kontrol ediliyor...',
        authStatus: 'Kontrol ediliyor...',
        storageStatus: 'Kontrol ediliyor...',
    });
    const [responseHistory, setResponseHistory] = useState<number[]>([]);
    const [systemMetrics, setSystemMetrics] = useState({
        heapUsed: 0,
        heapLimit: 0,
        memoryPercent: 0,
    });
    const [webVitals, setWebVitals] = useState({
        lcp: 0,
        fid: 0,
        cls: 0,
    });
    const [networkInfo, setNetworkInfo] = useState({
        effectiveType: 'unknown',
        downlink: 0,
        rtt: 0,
    });
    const [errorStats, setErrorStats] = useState({
        total: 0,
        lastHour: 0,
        recentErrors: [] as SystemLog[],
    });
    const [realtimeStats, setRealtimeStats] = useState({
        activeChannels: 0,
        status: 'disconnected',
    });
    const [uptime, setUptime] = useState(() => ({
        startTime: Date.now(),
        upSeconds: 0,
    }));
    const [externalApis, setExternalApis] = useState({
        gemini: { status: 'kontrol ediliyor', responseTime: 0 },
        resend: { status: 'kontrol ediliyor', responseTime: 0 },
        supabaseServer: { status: 'kontrol ediliyor', responseTime: 0 },
        vercel: {
            status: 'kontrol ediliyor',
            region: '',
            commitSha: '',
            commitMsg: '',
            env: ''
        },
    });
    const [browserInfo, setBrowserInfo] = useState({
        name: '',
        version: '',
        os: '',
        device: 'desktop',
    });

    const supabase = createClient();

    const loadRecentLogs = useCallback(async () => {
        try {
            const { data } = await supabase
                .from('system_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);
            if (data) setLogs(data as SystemLog[]);
        } catch (err) {
            console.error('Error loading logs:', err);
        }
    }, [supabase]);

    const updateSystemMetrics = useCallback(() => {
        if (typeof window !== 'undefined' && 'memory' in performance) {
            const memory = (performance as any).memory;
            const heapUsed = Math.round(memory.usedJSHeapSize / 1048576);
            const heapLimit = Math.round(memory.jsHeapSizeLimit / 1048576);
            const memoryPercent = Math.round((heapUsed / heapLimit) * 100);
            setSystemMetrics({ heapUsed, heapLimit, memoryPercent });
        }
    }, []);

    const updateNetworkInfo = useCallback(() => {
        if (typeof window !== 'undefined' && 'connection' in navigator) {
            const conn = (navigator as any).connection;
            setNetworkInfo({
                effectiveType: conn?.effectiveType || 'unknown',
                downlink: conn?.downlink || 0,
                rtt: conn?.rtt || 0,
            });
        }
    }, []);

    const loadErrorStats = useCallback(async () => {
        try {
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
            const { data: recentErrors } = await supabase
                .from('system_logs')
                .select('*')
                .eq('event_type', 'error')
                .gte('created_at', oneHourAgo)
                .order('created_at', { ascending: false })
                .limit(5);

            const { count: totalCount } = await supabase
                .from('system_logs')
                .select('*', { count: 'exact', head: true })
                .eq('event_type', 'error');

            setErrorStats({
                total: totalCount || 0,
                lastHour: recentErrors?.length || 0,
                recentErrors: (recentErrors || []) as SystemLog[],
            });
        } catch (err) {
            console.error('Error loading stats:', err);
        }
    }, [supabase]);

    const checkGeminiHealth = useCallback(async () => {
        try {
            const start = performance.now();
            const response = await fetch('/api/ai/health', { method: 'GET' });
            const end = performance.now();
            const responseTime = Math.round(end - start);

            setExternalApis(prev => ({
                ...prev,
                gemini: {
                    status: response.ok ? 'çalışıyor' : 'hata',
                    responseTime,
                },
            }));
        } catch (err) {
            setExternalApis(prev => ({
                ...prev,
                gemini: { status: 'hata', responseTime: 0 },
            }));
        }
    }, []);

    const checkResendHealth = useCallback(async () => {
        try {
            const response = await fetch('/api/health/resend', { method: 'GET' });
            const data = await response.json();

            setExternalApis(prev => ({
                ...prev,
                resend: {
                    status: data.status === 'operational' ? 'çalışıyor' : data.status === 'unauthorized' ? 'yetkisiz' : 'hata',
                    responseTime: data.responseTime || 0,
                },
            }));
        } catch (err) {
            setExternalApis(prev => ({
                ...prev,
                resend: { status: 'hata', responseTime: 0 },
            }));
        }
    }, []);

    const checkSupabaseServerHealth = useCallback(async () => {
        try {
            const response = await fetch('/api/health/supabase', { method: 'GET' });
            const data = await response.json();

            setExternalApis(prev => ({
                ...prev,
                supabaseServer: {
                    status: data.status === 'operational' ? 'çalışıyor' : data.status === 'degraded' ? 'yavaş' : 'hata',
                    responseTime: data.responseTime || 0,
                },
            }));
        } catch (err) {
            setExternalApis(prev => ({
                ...prev,
                supabaseServer: { status: 'hata', responseTime: 0 },
            }));
        }
    }, []);

    const checkVercelHealth = useCallback(async () => {
        try {
            const response = await fetch('/api/health/vercel', { method: 'GET' });
            const data = await response.json();

            setExternalApis(prev => ({
                ...prev,
                vercel: {
                    status: data.status === 'operational' ? 'çalışıyor' : 'hata',
                    region: data.region || 'local',
                    commitSha: data.commitSha || '',
                    commitMsg: data.commitMsg || '',
                    env: data.env || '',
                },
            }));
        } catch (err) {
            setExternalApis(prev => ({
                ...prev,
                vercel: {
                    status: 'hata',
                    region: '',
                    commitSha: '',
                    commitMsg: '',
                    env: ''
                },
            }));
        }
    }, []);

    const checkHealth = useCallback(async () => {
        setLoading(true);
        try {
            // 1. DATABASE HEALTH CHECK
            const dbStart = performance.now();
            const { error: dbError } = await supabase.from('gyms').select('id').limit(1);
            const dbEnd = performance.now();
            const dbResponseTime = Math.round(dbEnd - dbStart);

            // 2. AUTH HEALTH CHECK
            const { data: { session }, error: authError } = await supabase.auth.getSession();

            // 3. STORAGE HEALTH CHECK
            const { error: storageError } = await supabase.storage.listBuckets();

            // 4. REALTIME HEALTH CHECK
            const channels = supabase.getChannels();
            setRealtimeStats({
                activeChannels: channels.length,
                status: channels.length > 0 ? 'connected' : 'disconnected',
            });

            // 5. EXTERNAL API CHECKS (non-blocking)
            checkGeminiHealth();
            checkResendHealth();
            checkSupabaseServerHealth();
            checkVercelHealth();

            setHealthMetrics({
                dbResponseTime,
                dbStatus: dbError ? 'Hata' : dbResponseTime < 100 ? 'Mükemmel' : dbResponseTime < 300 ? 'İyi' : 'Yavaş',
                authStatus: authError ? 'Hata' : session ? 'Aktif' : 'İnaktif',
                storageStatus: storageError ? 'Hata' : 'Çalışıyor',
            });

            setResponseHistory(prev => [...prev, dbResponseTime].slice(-20));
            setLastRefresh(new Date());
            setLoading(false);
        } catch (err) {
            console.error(err);
            setHealthMetrics(prev => ({
                ...prev,
                dbStatus: 'Hata',
                authStatus: 'Hata',
                storageStatus: 'Hata',
            }));
            setLoading(false);
        }
    }, [supabase, checkGeminiHealth, checkResendHealth, checkSupabaseServerHealth, checkVercelHealth]);

    const initializeWebVitals = useCallback(() => {
        if (typeof window === 'undefined') return;
        // Core Web Vitals using PerformanceObserver
        try {
            // LCP - Largest Contentful Paint
            new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1] as any;
                setWebVitals(prev => ({ ...prev, lcp: Math.round(lastEntry.renderTime || lastEntry.loadTime) }));
            }).observe({ entryTypes: ['largest-contentful-paint'] });

            // FID - First Input Delay
            new PerformanceObserver((list) => {
                list.getEntries().forEach((entry: any) => {
                    setWebVitals(prev => ({ ...prev, fid: Math.round(entry.processingStart - entry.startTime) }));
                });
            }).observe({ entryTypes: ['first-input'] });

            // CLS - Cumulative Layout Shift
            let clsValue = 0;
            new PerformanceObserver((list) => {
                list.getEntries().forEach((entry: any) => {
                    if (!entry.hadRecentInput) clsValue += entry.value;
                });
                setWebVitals(prev => ({ ...prev, cls: Math.round(clsValue * 1000) / 1000 }));
            }).observe({ entryTypes: ['layout-shift'] });
        } catch (err) {
            console.error('Web Vitals error:', err);
        }
    }, []);

    const detectBrowser = useCallback(() => {
        if (typeof window === 'undefined') return;
        const ua = navigator.userAgent;
        let browserName = 'Unknown';
        let browserVersion = '';

        if (ua.indexOf('Chrome') > -1) browserName = 'Chrome';
        else if (ua.indexOf('Safari') > -1) browserName = 'Safari';
        else if (ua.indexOf('Firefox') > -1) browserName = 'Firefox';
        else if (ua.indexOf('Edge') > -1) browserName = 'Edge';

        const versionMatch = ua.match(/(?:Chrome|Safari|Firefox|Edge)\/(\d+)/);
        if (versionMatch) browserVersion = versionMatch[1];

        let os = 'Unknown';
        if (ua.indexOf('Win') > -1) os = 'Windows';
        else if (ua.indexOf('Mac') > -1) os = 'macOS';
        else if (ua.indexOf('Linux') > -1) os = 'Linux';
        else if (ua.indexOf('Android') > -1) os = 'Android';
        else if (ua.indexOf('iOS') > -1) os = 'iOS';

        const device = /Mobile|Android|iPhone/.test(ua) ? 'mobile' : 'desktop';

        setBrowserInfo({ name: browserName, version: browserVersion, os, device });
    }, []);

    useEffect(() => {
        // İlk yükleme
        checkHealth();
        loadRecentLogs();
        updateSystemMetrics();
        initializeWebVitals();
        updateNetworkInfo();
        detectBrowser();
        loadErrorStats();

        // Intervals
        const healthInterval = setInterval(() => {
            checkHealth();
            loadRecentLogs();
        }, 30000);

        const metricsInterval = setInterval(() => {
            updateSystemMetrics();
            updateNetworkInfo();
        }, 5000);

        const uptimeInterval = setInterval(() => {
            setUptime(prev => ({
                ...prev,
                upSeconds: Math.floor((Date.now() - prev.startTime) / 1000)
            }));
        }, 1000);

        const errorInterval = setInterval(loadErrorStats, 60000);

        // 🔥 REALTIME: System logs'u canlı dinle
        const logsChannel = supabase
            .channel('health-system-logs')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'system_logs'
                },
                () => {
                    loadRecentLogs(); 
                    loadErrorStats(); 
                }
            )
            .subscribe((status) => {
                const channels = supabase.getChannels();
                setRealtimeStats({
                    activeChannels: channels.length,
                    status: channels.length > 0 ? 'connected' : 'disconnected',
                });
            });

        return () => {
            clearInterval(healthInterval);
            clearInterval(metricsInterval);
            clearInterval(uptimeInterval);
            clearInterval(errorInterval);
            supabase.removeChannel(logsChannel);
        };
    }, [
        supabase, 
        checkHealth, 
        loadRecentLogs, 
        updateSystemMetrics, 
        initializeWebVitals, 
        updateNetworkInfo, 
        detectBrowser, 
        loadErrorStats
    ]);

    return (
        <div className="space-y-8 text-left text-white">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl shadow-blue-500/20">
                            <Activity className="w-8 h-8 text-white" />
                        </div>
                        Sistem Sağlık Paneli
                    </h1>
                    <p className="text-zinc-400 mt-1 font-medium ml-14">Sunucu, veritabanı ve API katmanlarının canlı takibi</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <p className="text-[10px] font-black text-zinc-500 uppercase">Son Güncelleme</p>
                        <p className="text-xs font-bold text-zinc-300">{lastRefresh.toLocaleTimeString()}</p>
                    </div>
                    <Button onClick={checkHealth} variant="secondary" className="bg-zinc-900 border-white/5 rounded-xl font-bold h-12 w-12 p-0">
                        <RefreshCcw className={`w-5 h-5 text-zinc-400 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {/* Health Overview Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-6 bg-zinc-950/50 border-white/5 group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-white/5 rounded-xl group-hover:scale-110 transition-transform text-emerald-500">
                            <Database className="w-5 h-5" />
                        </div>
                        <StatusBadge status={healthMetrics.dbStatus} />
                    </div>
                    <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">Veritabanı (SQL)</p>
                </Card>

                <Card className="p-6 bg-zinc-950/50 border-white/5 group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-white/5 rounded-xl group-hover:scale-110 transition-transform text-amber-500">
                            <Zap className="w-5 h-5" />
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                            <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">
                                {healthMetrics.dbResponseTime}ms
                            </span>
                        </div>
                    </div>
                    <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">API Yanıt Süresi</p>
                </Card>

                <Card className="p-6 bg-zinc-950/50 border-white/5 group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-white/5 rounded-xl group-hover:scale-110 transition-transform text-blue-500">
                            <Lock className="w-5 h-5" />
                        </div>
                        <StatusBadge status={healthMetrics.authStatus} />
                    </div>
                    <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">Kimlik Doğrulama</p>
                </Card>

                <Card className="p-6 bg-zinc-950/50 border-white/5 group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-white/5 rounded-xl group-hover:scale-110 transition-transform text-purple-500">
                            <Server className="w-5 h-5" />
                        </div>
                        <StatusBadge status={healthMetrics.storageStatus} />
                    </div>
                    <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">Bulut Depolama</p>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Latency Chart Simulation */}
                <Card className="lg:col-span-2 bg-zinc-950 border-white/5 p-8 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-white">Performans Grafiği</h3>
                            <p className="text-xs text-zinc-500 mt-1">Son 6 saatlik milisaniye cinsinden gecikme</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-blue-500 rounded-full" />
                                <span className="text-[10px] font-bold text-zinc-400">Main API</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                                <span className="text-[10px] font-bold text-zinc-400">DB Queries</span>
                            </div>
                        </div>
                    </div>

                    <div className="h-48 flex items-end gap-2 px-2">
                        {responseHistory.length > 0 ? responseHistory.map((responseTime, i) => {
                            const maxTime = Math.max(...responseHistory, 100);
                            const heightPercent = (responseTime / maxTime) * 100;
                            return (
                                <div key={i} className="flex-1 space-y-1 relative group/bar">
                                    <div
                                        className="w-full bg-emerald-500/20 rounded-t-sm hover:bg-emerald-500/40 transition-colors"
                                        style={{ height: `${Math.max(heightPercent, 5)}%` }}
                                    />
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-zinc-900 border border-white/10 rounded text-[10px] font-bold text-emerald-400 opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                        {responseTime}ms
                                    </div>
                                </div>
                            );
                        }) : (
                            // Placeholder while loading
                            Array(20).fill(0).map((_, i) => (
                                <div key={i} className="flex-1">
                                    <div className="w-full bg-zinc-800/20 rounded-t-sm h-[20%]" />
                                </div>
                            ))
                        )}
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/5 flex justify-between text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                        <span>12:00</span>
                        <span>14:00</span>
                        <span>16:00</span>
                        <span>Şimdi</span>
                    </div>
                </Card>

                {/* System Logs */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                        <Globe className="w-5 h-5 text-zinc-500" /> Sistem Kayıtları
                    </h2>
                    <Card className="bg-zinc-950 border-white/5 p-6 space-y-4">
                        {logs.map((log, i) => (
                            <div key={i} className="flex gap-3 text-left">
                                <div className={`w-1 h-10 rounded-full shrink-0 ${log.event_type === 'success' ? 'bg-emerald-500' : log.event_type === 'error' ? 'bg-red-500' : 'bg-blue-500'}`} />
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-medium text-zinc-300 leading-tight truncate">{log.message}</p>
                                    <p className="text-[10px] font-bold text-zinc-600 uppercase mt-1">
                                        {new Date(log.created_at).toLocaleTimeString()} • {log.user_email?.split('@')[0] || 'System'}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {logs.length === 0 && <p className="text-xs text-zinc-600 italic">Henüz kayıt bulunmuyor.</p>}

                        <Link href="/health/logs" className="block">
                            <Button className="w-full mt-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white text-xs font-black uppercase tracking-widest h-12 rounded-xl shadow-lg shadow-orange-500/20">
                                Tüm Logları İncele
                            </Button>
                        </Link>
                    </Card>

                    <Card className="bg-gradient-to-br from-blue-600/20 to-transparent border-blue-500/20 p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Cpu className="w-4 h-4 text-blue-400" />
                            <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                                Tarayıcı Belleği
                            </h4>
                        </div>
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase">
                                    <span>Kullanılan</span>
                                    <span>{systemMetrics.heapUsed > 0 ? `${systemMetrics.heapUsed} MB` : 'N/A'}</span>
                                </div>
                                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 transition-all duration-500"
                                        style={{ width: `${systemMetrics.memoryPercent}%` }}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase">
                                    <span>Limit</span>
                                    <span>{systemMetrics.heapLimit > 0 ? `${systemMetrics.heapLimit} MB` : 'N/A'}</span>
                                </div>
                                <div className="text-[10px] text-zinc-600 mt-2">
                                    {systemMetrics.heapUsed > 0 ? (
                                        `${systemMetrics.memoryPercent}% kullanımda`
                                    ) : (
                                        'Chrome/Edge tarayıcısında çalıştırın'
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* New Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Core Web Vitals */}
                <Card className="p-6 bg-gradient-to-br from-purple-600/10 to-transparent border-purple-500/20">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-purple-500/10 rounded-xl">
                            <Activity className="w-5 h-5 text-purple-400" />
                        </div>
                        <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Web Metrikleri</span>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px]">
                            <span className="text-zinc-500 font-bold">LCP</span>
                            <span className={`font-black ${webVitals.lcp < 2500 ? 'text-emerald-400' : webVitals.lcp < 4000 ? 'text-amber-400' : 'text-red-400'}`}>
                                {webVitals.lcp > 0 ? `${webVitals.lcp}ms` : 'N/A'}
                            </span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                            <span className="text-zinc-500 font-bold">FID</span>
                            <span className={`font-black ${webVitals.fid < 100 ? 'text-emerald-400' : webVitals.fid < 300 ? 'text-amber-400' : 'text-red-400'}`}>
                                {webVitals.fid > 0 ? `${webVitals.fid}ms` : 'N/A'}
                            </span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                            <span className="text-zinc-500 font-bold">CLS</span>
                            <span className={`font-black ${webVitals.cls < 0.1 ? 'text-emerald-400' : webVitals.cls < 0.25 ? 'text-amber-400' : 'text-red-400'}`}>
                                {webVitals.cls > 0 ? webVitals.cls : 'N/A'}
                            </span>
                        </div>
                    </div>
                </Card>

                {/* Network Quality */}
                <Card className="p-6 bg-gradient-to-br from-cyan-600/10 to-transparent border-cyan-500/20">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-cyan-500/10 rounded-xl">
                            <Globe className="w-5 h-5 text-cyan-400" />
                        </div>
                        <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest">Ağ Bağlantısı</span>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px]">
                            <span className="text-zinc-500 font-bold">Tür</span>
                            <span className="text-cyan-400 font-black uppercase">{networkInfo.effectiveType}</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                            <span className="text-zinc-500 font-bold">Hız</span>
                            <span className="text-cyan-400 font-black">{networkInfo.downlink > 0 ? `${networkInfo.downlink} Mbps` : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                            <span className="text-zinc-500 font-bold">RTT</span>
                            <span className="text-cyan-400 font-black">{networkInfo.rtt > 0 ? `${networkInfo.rtt}ms` : 'N/A'}</span>
                        </div>
                    </div>
                </Card>

                {/* Realtime Connections */}
                <Card className="p-6 bg-gradient-to-br from-green-600/10 to-transparent border-green-500/20">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-green-500/10 rounded-xl">
                            <Zap className="w-5 h-5 text-green-400" />
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 border border-green-500/20 rounded-lg">
                            <span className={`w-1.5 h-1.5 rounded-full ${realtimeStats.status === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-zinc-600'}`} />
                            <span className="text-[10px] font-black text-green-400 uppercase tracking-widest">
                                {realtimeStats.status === 'connected' ? 'bağlı' : 'bağlantı kesildi'}
                            </span>
                        </div>
                    </div>
                    <div className="text-3xl font-black text-green-400">{realtimeStats.activeChannels}</div>
                    <p className="text-[10px] text-zinc-500 mt-1 uppercase font-bold tracking-widest">Aktif Kanallar</p>
                </Card>

                {/* Uptime */}
                <Card className="p-6 bg-gradient-to-br from-amber-600/10 to-transparent border-amber-500/20">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-amber-500/10 rounded-xl">
                            <Clock className="w-5 h-5 text-amber-400" />
                        </div>
                        <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest">Çalışma Süresi</span>
                    </div>
                    <div className="text-2xl font-black text-amber-400">
                        {Math.floor(uptime.upSeconds / 3600)}h {Math.floor((uptime.upSeconds % 3600) / 60)}m
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-1 uppercase font-bold tracking-widest">
                        {Math.floor(uptime.upSeconds / 86400)} gün aktif
                    </p>
                </Card>
            </div>

            {/* External APIs & Browser Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* External APIs */}
                <Card className="p-6 bg-zinc-950/50 border-white/5">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                            <Server className="w-5 h-5 text-white" />
                        </div>
                        Harici Servisler
                    </h3>
                    <div className="space-y-4">
                        {/* Gemini AI */}
                        <div className="flex items-center justify-between p-4 bg-zinc-900/40 rounded-xl border border-white/5 group/service">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-500/10 rounded-lg group-hover/service:bg-purple-500/20 transition-colors">
                                    <Sparkles className="w-4 h-4 text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">Google Gemini 2.0</p>
                                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">AI Model API</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className={`text-xs font-black uppercase ${externalApis.gemini.status === 'çalışıyor' ? 'text-emerald-400' :
                                    externalApis.gemini.status === 'kontrol ediliyor' ? 'text-amber-400' : 'text-red-400'
                                    }`}>
                                    {externalApis.gemini.status}
                                </div>
                                {externalApis.gemini.responseTime > 0 && (
                                    <p className="text-[10px] text-zinc-600 font-bold">{externalApis.gemini.responseTime}ms</p>
                                )}
                            </div>
                        </div>

                        {/* Resend */}
                        <div className="flex items-center justify-between p-4 bg-zinc-900/40 rounded-xl border border-white/5 group/service">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-500/10 rounded-lg group-hover/service:bg-orange-500/20 transition-colors">
                                    <Server className="w-4 h-4 text-orange-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">Resend</p>
                                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Email Delivery</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className={`text-xs font-black uppercase ${externalApis.resend.status === 'çalışıyor' ? 'text-emerald-400' :
                                    externalApis.resend.status === 'yetkisiz' ? 'text-amber-400' :
                                        externalApis.resend.status === 'kontrol ediliyor' ? 'text-amber-400' : 'text-red-400'
                                    }`}>
                                    {externalApis.resend.status}
                                </div>
                                {externalApis.resend.responseTime > 0 && (
                                    <p className="text-[10px] text-zinc-600 font-bold">{externalApis.resend.responseTime}ms</p>
                                )}
                            </div>
                        </div>

                        {/* Supabase Server */}
                        <div className="flex items-center justify-between p-4 bg-zinc-900/40 rounded-xl border border-white/5 group/service">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/10 rounded-lg group-hover/service:bg-emerald-500/20 transition-colors">
                                    <Database className="w-4 h-4 text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">Supabase Core</p>
                                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Backend Engine (Srv)</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className={`text-xs font-black uppercase ${externalApis.supabaseServer.status === 'çalışıyor' ? 'text-emerald-400' :
                                    externalApis.supabaseServer.status === 'kontrol ediliyor' ? 'text-amber-400' : 'text-red-400'
                                    }`}>
                                    {externalApis.supabaseServer.status}
                                </div>
                                {externalApis.supabaseServer.responseTime > 0 && (
                                    <p className="text-[10px] text-zinc-600 font-bold">{externalApis.supabaseServer.responseTime}ms</p>
                                )}
                            </div>
                        </div>

                        {/* Vercel */}
                        <div className="flex items-center justify-between p-4 bg-zinc-900/40 rounded-xl border border-white/5 group/service">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="p-2 bg-blue-500/10 rounded-lg group-hover/service:bg-blue-500/20 transition-colors shrink-0">
                                    <Globe className="w-4 h-4 text-blue-400" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-white flex items-center gap-2">
                                        Vercel Edge
                                        {externalApis.vercel.env && (
                                            <span className="text-[8px] px-1.5 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded font-black text-blue-400">
                                                {externalApis.vercel.env.toUpperCase()}
                                            </span>
                                        )}
                                    </p>
                                    <p className="text-[10px] text-zinc-500 font-bold truncate">
                                        {externalApis.vercel.commitMsg || 'Deployment Network'}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                <div className={`text-xs font-black uppercase ${externalApis.vercel.status === 'çalışıyor' ? 'text-emerald-400' :
                                    externalApis.vercel.status === 'kontrol ediliyor' ? 'text-amber-400' : 'text-red-400'
                                    }`}>
                                    {externalApis.vercel.status}
                                </div>
                                <div className="flex flex-col items-end">
                                    {externalApis.vercel.region && (
                                        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">{externalApis.vercel.region}</p>
                                    )}
                                    {externalApis.vercel.commitSha && (
                                        <p className="text-[9px] text-zinc-700 font-mono font-bold mt-0.5 tracking-tighter">
                                            ID: {externalApis.vercel.commitSha}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Browser & Device Info */}
                <Card className="p-6 bg-zinc-950/50 border-white/5">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl">
                            <Cpu className="w-5 h-5 text-white" />
                        </div>
                        Tarayıcı & Cihaz
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-zinc-900/40 rounded-xl border border-white/5">
                            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-2">Tarayıcı</p>
                            <p className="text-lg font-black text-white">{browserInfo.name}</p>
                            <p className="text-[10px] text-zinc-600 font-bold">v{browserInfo.version}</p>
                        </div>
                        <div className="p-4 bg-zinc-900/40 rounded-xl border border-white/5">
                            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-2">İşletim Sistemi</p>
                            <p className="text-lg font-black text-white">{browserInfo.os}</p>
                            <p className="text-[10px] text-zinc-600 font-bold uppercase">
                                {browserInfo.device === 'mobile' ? 'Mobil' : 'Masaüstü'}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Error Stats */}
            <Card className="p-6 bg-zinc-950/50 border-red-500/20">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl">
                            <AlertCircle className="w-5 h-5 text-white" />
                        </div>
                        Hata Takibi
                    </h3>
                    <div className="flex gap-4">
                        <div className="text-right">
                            <p className="text-[10px] text-zinc-500 uppercase font-bold">Son Saat</p>
                            <p className="text-2xl font-black text-red-400">{errorStats.lastHour}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-zinc-500 uppercase font-bold">Toplam</p>
                            <p className="text-2xl font-black text-zinc-400">{errorStats.total}</p>
                        </div>
                    </div>
                </div>
                {errorStats.recentErrors.length > 0 ? (
                    <div className="space-y-2">
                        {errorStats.recentErrors.map((error, i) => (
                            <div key={i} className="p-3 bg-red-500/5 border border-red-500/10 rounded-lg flex items-start gap-3">
                                <div className="w-1 h-8 bg-red-500 rounded-full shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs text-red-400 font-medium truncate">{error.message}</p>
                                    <p className="text-[10px] text-zinc-600 font-bold uppercase mt-1">
                                        {new Date(error.created_at).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-zinc-600">
                        <CheckCircle2 className="w-12 h-12 mx-auto mb-2 opacity-20" />
                        <p className="text-sm font-bold">Son saatte hata yok! 🎉</p>
                    </div>
                )}
            </Card>
        </div>
    );
}

const StatusBadge = ({ status }: { status: string }) => {
    return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{status}</span>
        </div>
    );
};
