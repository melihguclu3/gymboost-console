'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, Button } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { GymSelector } from '@/components/GymSelector';
import {
    ScrollText,
    Search,
    Clock,
    ArrowLeft,
    RefreshCcw,
    Building2,
    ShieldCheck,
    Dumbbell,
    Users,
    Activity,
    Terminal,
    SearchCode,
    ExternalLink,
    Table,
    Rows3
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const CATEGORY_MAP: Record<string, string> = {
    'gyms': 'Sistem', 'system_settings': 'Ayarlar', 'users': 'Kullanıcı',
    'memberships': 'Üyelik', 'payments': 'Finans', 'products': 'Mağaza',
    'inventory': 'Stok', 'check_ins': 'Giriş', 'workout_sessions': 'Antrenman',
    'auth': 'Güvenlik', 'measurements': 'Ölçüm', 'nutrition': 'Beslenme',
    'appointments': 'Randevu', 'announcements': 'Duyuru',
    'ai_assistant': 'AI', 'rentals': 'Kiralama'
};

const ROLE_MAP: Record<string, string> = {
    'super_admin': 'Geliştirici', 'admin': 'Yönetici', 'trainer': 'Eğitmen', 'member': 'Üye'
};

function LoggerContent() {
    const searchParams = useSearchParams();
    const gymIdParam = searchParams.get('gymId');

    const [logs, setLogs] = useState<any[]>([]);
    const [gyms, setGyms] = useState<any[]>([]);
    const [selectedGymId, setSelectedGymId] = useState<string | null>(gymIdParam || null);
    const [activeTab, setActiveTab] = useState<'admin' | 'trainer' | 'member' | 'system'>('admin');
    const [viewMode, setViewMode] = useState<'terminal' | 'table'>('table');
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const supabase = createClient();

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const { data: gymsData } = await supabase.from('gyms').select('id, name').order('name');
            if (gymsData) setGyms(gymsData);
            await fetchLogs();
        } catch (err) { console.error(err); }
    };

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            let query = supabase.from('system_logs').select('*, gyms(name)').order('created_at', { ascending: false });
            if (selectedGymId) query = query.eq('gym_id', selectedGymId);
            if (activeTab === 'admin') query = query.or('actor_role.in.("admin","super_admin"),actor_role.is.null');
            else if (activeTab === 'trainer') query = query.eq('actor_role', 'trainer');
            else if (activeTab === 'member') query = query.eq('actor_role', 'member');
            else if (activeTab === 'system') query = query.is('actor_user_id', null);
            const { data } = await query.limit(100);
            if (data) setLogs(data);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    }, [selectedGymId, activeTab, supabase]);

    useEffect(() => { loadInitialData(); }, []);
    useEffect(() => { fetchLogs(); }, [activeTab, selectedGymId]);

    const filteredLogs = logs.filter(log =>
        log.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.gyms?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'admin':
            case 'super_admin':
                return 'bg-orange-500/10 text-orange-500';
            case 'trainer':
                return 'bg-blue-500/10 text-blue-500';
            case 'member':
                return 'bg-emerald-500/10 text-emerald-500';
            default:
                return 'bg-zinc-700/50 text-zinc-400';
        }
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/health">
                        <Button variant="ghost" className="p-2 h-auto hover:bg-zinc-800">
                            <ArrowLeft className="w-5 h-5 text-zinc-400" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100">
                            Sistem Günlükleri
                        </h1>
                        <p className="text-sm text-zinc-400 mt-1">
                            {selectedGymId ? 'Salon bazlı' : 'Tüm salonların'} aktivite akışı
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <GymSelector
                        value={selectedGymId}
                        onChange={setSelectedGymId}
                        showAllOption={true}
                        allLabel="Tüm Salonlar"
                    />
                    <div className="flex bg-zinc-800 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('table')}
                            className={cn(
                                "p-2 rounded-md transition-colors",
                                viewMode === 'table' ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-white"
                            )}
                            title="Tablo Görünümü"
                        >
                            <Table className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('terminal')}
                            className={cn(
                                "p-2 rounded-md transition-colors",
                                viewMode === 'terminal' ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-white"
                            )}
                            title="Terminal Görünümü"
                        >
                            <Terminal className="w-4 h-4" />
                        </button>
                    </div>
                    <Button
                        onClick={fetchLogs}
                        variant="secondary"
                        className="bg-zinc-800 hover:bg-zinc-700"
                    >
                        <RefreshCcw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
                        Yenile
                    </Button>
                </div>
            </div>

            {/* Tabs + Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex bg-zinc-800/50 p-1 rounded-xl border border-zinc-700/50">
                    {[
                        { id: 'admin', label: 'Yönetici', icon: ShieldCheck, color: 'text-orange-500' },
                        { id: 'trainer', label: 'Eğitmen', icon: Dumbbell, color: 'text-blue-500' },
                        { id: 'member', label: 'Üye', icon: Users, color: 'text-emerald-500' },
                        { id: 'system', label: 'Sistem', icon: Activity, color: 'text-purple-500' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium",
                                activeTab === tab.id ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-white"
                            )}
                        >
                            <tab.icon className={cn("w-4 h-4", activeTab === tab.id && tab.color)} />
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>

                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                        placeholder="Mesaj, e-posta veya salon ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                </div>
            </div>

            {/* Content */}
            {viewMode === 'table' ? (
                /* Table View */
                <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-zinc-900/50 text-zinc-400 border-b border-zinc-700/50">
                            <tr>
                                <th className="px-4 py-3 font-medium w-40">Tarih</th>
                                <th className="px-4 py-3 font-medium w-28">Rol</th>
                                <th className="px-4 py-3 font-medium w-36">Salon</th>
                                <th className="px-4 py-3 font-medium">E-posta</th>
                                <th className="px-4 py-3 font-medium">Mesaj</th>
                                <th className="px-4 py-3 font-medium w-16"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-700/50">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center">
                                        <div className="flex items-center justify-center gap-3">
                                            <div className="w-5 h-5 border-2 border-zinc-600 border-t-blue-500 rounded-full animate-spin" />
                                            <span className="text-zinc-500">Yükleniyor...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-zinc-500">
                                        <SearchCode className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        Günlük kaydı bulunamadı.
                                    </td>
                                </tr>
                            ) : filteredLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-zinc-700/10 transition-colors group">
                                    <td className="px-4 py-3 text-zinc-400 text-xs font-mono">
                                        {format(new Date(log.created_at), 'dd MMM HH:mm:ss', { locale: tr })}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={cn(
                                            "px-2 py-1 rounded text-xs font-medium",
                                            getRoleColor(log.actor_role)
                                        )}>
                                            {ROLE_MAP[log.actor_role] || 'Sistem'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {log.gyms?.name ? (
                                            <div className="flex items-center gap-1.5 text-xs text-blue-400">
                                                <Building2 className="w-3.5 h-3.5" />
                                                <span className="truncate max-w-[100px]">{log.gyms.name}</span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-zinc-600">—</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-zinc-400 text-xs font-mono truncate max-w-[150px]">
                                        {log.user_email || '—'}
                                    </td>
                                    <td className="px-4 py-3 text-zinc-300 text-sm truncate max-w-[300px]">
                                        {log.message}
                                    </td>
                                    <td className="px-4 py-3">
                                        {log.gym_id && (
                                            <Link
                                                href={`/gyms/${log.gym_id}`}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <div className="p-1.5 bg-zinc-700 hover:bg-blue-600 rounded text-zinc-400 hover:text-white transition-colors">
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </div>
                                            </Link>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="bg-zinc-900/50 px-4 py-2 border-t border-zinc-700/50 text-xs text-zinc-500">
                        {filteredLogs.length} / 100 kayıt gösteriliyor
                    </div>
                </div>
            ) : (
                /* Terminal View */
                <Card className="bg-[#0a0a0a] border-zinc-800 min-h-[500px] flex flex-col overflow-hidden">
                    <div className="bg-zinc-900/50 px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Terminal className="w-4 h-4 text-blue-500" />
                            <span className="text-xs font-mono text-zinc-500">Sistem Günlükleri</span>
                        </div>
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                            <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 font-mono text-xs">
                        {loading ? (
                            <div className="h-full flex items-center justify-center text-zinc-600">
                                <div className="w-5 h-5 border-2 border-zinc-700 border-t-orange-500 rounded-full animate-spin mr-3" />
                                Akış bekleniyor...
                            </div>
                        ) : filteredLogs.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-zinc-600">
                                Kayıt bulunamadı.
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {filteredLogs.map((log, i) => (
                                    <div key={log.id} className="flex items-start gap-3 py-2 hover:bg-white/[0.02] rounded px-2 group">
                                        <span className="text-zinc-700 w-4">{i + 1}</span>
                                        <div className={cn(
                                            "w-1 h-4 rounded-full shrink-0 mt-0.5",
                                            log.actor_role === 'admin' || log.actor_role === 'super_admin' ? 'bg-orange-500' :
                                                log.actor_role === 'trainer' ? 'bg-blue-500' :
                                                    log.actor_role === 'member' ? 'bg-emerald-500' : 'bg-zinc-700'
                                        )} />
                                        <div className="flex-1 min-w-0">
                                            <span className="text-zinc-600">[{format(new Date(log.created_at), 'HH:mm:ss')}]</span>
                                            <span className={cn(
                                                "ml-2",
                                                log.actor_role === 'admin' || log.actor_role === 'super_admin' ? 'text-orange-500' :
                                                    log.actor_role === 'trainer' ? 'text-blue-500' :
                                                        log.actor_role === 'member' ? 'text-emerald-500' : 'text-zinc-500'
                                            )}>
                                                [{ROLE_MAP[log.actor_role] || 'SYS'}]
                                            </span>
                                            {log.gyms?.name && (
                                                <span className="ml-2 text-blue-400">[{log.gyms.name}]</span>
                                            )}
                                            <span className="ml-2 text-zinc-300">{log.message}</span>
                                        </div>
                                        {log.gym_id && (
                                            <Link href={`/gyms/${log.gym_id}`} className="opacity-0 group-hover:opacity-100">
                                                <ExternalLink className="w-3.5 h-3.5 text-zinc-600 hover:text-blue-400" />
                                            </Link>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-zinc-900/50 px-4 py-2 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-600">
                        <span>{filteredLogs.length}/100 kayıt</span>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Canlı</span>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
}

export default function UniversalLoggerPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-6 h-6 border-2 border-zinc-700 border-t-blue-500 rounded-full animate-spin" />
            </div>
        }>
            <LoggerContent />
        </Suspense>
    );
}
