'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, Button, Input } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import {
    ScrollText,
    Search,
    Filter,
    Clock,
    ArrowLeft,
    RefreshCcw,
    Download,
    Building2,
    ShieldCheck,
    Dumbbell,
    Users,
    Activity,
    Terminal,
    ChevronRight,
    SearchCode,
    Settings,
    Cpu,
    ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { cn, maskEmail } from '@/lib/utils';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

// --- TRANSLATIONS ---
const CATEGORY_MAP: Record<string, string> = {
    'gyms': 'Sistem Ayarları', 'users': 'Üye & Eğitmen', 'memberships': 'Üyelikler',
    'payments': 'Finansal', 'products': 'Mağaza', 'inventory': 'Stok',
    'check_ins': 'Giriş/Çıkış', 'workout_sessions': 'Antrenman', 'auth': 'Güvenlik'
};

const ROLE_MAP: Record<string, string> = {
    'super_admin': 'Geliştirici', 'admin': 'Yönetici', 'trainer': 'Eğitmen', 'member': 'Üye'
};

function LoggerContent() {
    const searchParams = useSearchParams();
    const gymIdParam = searchParams.get('gymId');

    const [logs, setLogs] = useState<any[]>([]);
    const [gyms, setGyms] = useState<any[]>([]);
    const [selectedGymId, setSelectedGymId] = useState<string>(gymIdParam || 'ALL');
    const [activeTab, setActiveTab] = useState<'admin' | 'trainer' | 'member' | 'system'>('admin');
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const supabase = createClient();

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const { data: gymsData } = await supabase.from('gyms').select('id, name').order('name');
            if (gymsData) setGyms(gymsData);
            
            // Eğer URL'den gymId geldiyse onu set et
            if (gymIdParam) {
                setSelectedGymId(gymIdParam);
            }

            await fetchLogs();
        } catch (err) { console.error(err); }
    };

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            let query = supabase.from('system_logs').select('*').order('created_at', { ascending: false });
            if (selectedGymId !== 'ALL') query = query.eq('gym_id', selectedGymId);
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
        log.user_email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8 text-left text-white font-sans pb-20">
            {/* --- HEADER --- */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-8">
                <div className="flex items-center gap-5">
                    <Link href="/health">
                        <div className="p-3 bg-zinc-900 border border-white/10 rounded-2xl hover:bg-zinc-800 transition-colors cursor-pointer group">
                            <ArrowLeft className="w-5 h-5 text-zinc-500 group-hover:text-white" />
                        </div>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3 uppercase">
                            EVRENSEL <span className="text-orange-500">GÜNLÜK</span>
                        </h1>
                        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">Salonlar Arası Aktivite Akışı</p>
                    </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative group">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <select 
                            value={selectedGymId}
                            onChange={(e) => setSelectedGymId(e.target.value)}
                            className="bg-zinc-900 border border-white/10 rounded-xl pl-12 pr-10 py-3 text-xs font-bold text-white uppercase outline-none focus:border-orange-500/50 appearance-none cursor-pointer"
                        >
                            <option value="ALL">TÜM SALON AĞI</option>
                            {gyms.map(gym => (
                                <option key={gym.id} value={gym.id}>{gym.name.toUpperCase()}</option>
                            ))}
                        </select>
                    </div>
                    <Button onClick={fetchLogs} variant="secondary" className="bg-white/5 border-white/10 h-12 px-6 rounded-xl hover:bg-white/10 font-bold uppercase text-[10px] tracking-widest">
                        <RefreshCcw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} /> YENİDEN SENKRONİZE ET
                    </Button>
                </div>
            </div>

            {/* --- NAVIGATION TABS --- */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex bg-zinc-950/50 p-1.5 rounded-2xl border border-white/5">
                    {[
                        { id: 'admin', label: 'Yönetici Operasyonları', icon: ShieldCheck, color: 'text-orange-500' },
                        { id: 'trainer', label: 'Eğitmen Operasyonları', icon: Dumbbell, color: 'text-blue-500' },
                        { id: 'member', label: 'Üye Operasyonları', icon: Users, color: 'text-emerald-500' },
                        { id: 'system', label: 'Sistem Çekirdeği', icon: Activity, color: 'text-purple-500' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "flex items-center gap-2.5 px-6 py-3 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest relative overflow-hidden cursor-pointer",
                                activeTab === tab.id ? "bg-white/5 text-white shadow-xl" : "text-zinc-600 hover:text-zinc-300"
                            )}
                        >
                            <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? tab.color : "text-zinc-700")} />
                            <span>{tab.label}</span>
                            {activeTab === tab.id && (
                                <div className={cn("absolute bottom-0 left-0 w-full h-0.5 shadow-[0_0_8px_currentColor]", tab.color.replace('text', 'bg'))} />
                            )}
                        </button>
                    ))}
                </div>

                <div className="relative group flex-1 max-w-sm">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-orange-500 transition-colors" />
                    <input 
                        placeholder="ANAHTAR KELİME İLE ARA..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-zinc-950/50 border border-white/5 rounded-2xl pl-12 pr-6 h-12 text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:border-orange-500/50"
                    />
                </div>
            </div>

            {/* --- LOG TERMINAL --- */}
            <Card className="bg-[#050505] border-white/5 min-h-[600px] flex flex-col overflow-hidden shadow-2xl">
                <div className="bg-white/[0.02] px-8 py-4 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Terminal className="w-4 h-4 text-orange-500" />
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Konsol Terminali v4.0.1</span>
                    </div>
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                        <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                        <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center py-40 opacity-20">
                            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mb-4" />
                            <p className="text-[10px] font-black uppercase tracking-widest">Uzak Akış Bekleniyor...</p>
                        </div>
                    ) : filteredLogs.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center py-40 opacity-20">
                            <SearchCode className="w-16 h-16 mb-4" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-center">Kriterlere uygun günlük kaydı bulunamadı</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {filteredLogs.map((log, i) => (
                                <div key={log.id} className="group flex items-start gap-4 p-4 hover:bg-white/[0.03] transition-all rounded-xl border border-transparent hover:border-white/[0.05] relative">
                                    <span className="text-[9px] font-mono text-zinc-800 tabular-nums pt-1 w-6">{i + 1}</span>
                                    <div className={cn(
                                        "w-[2px] h-10 rounded-full shrink-0",
                                        log.actor_role === 'admin' || log.actor_role === 'super_admin' ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]' :
                                        log.actor_role === 'trainer' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' :
                                        log.actor_role === 'member' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-zinc-700'
                                    )} />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-4 mb-1.5">
                                            <span className="text-[10px] font-black text-zinc-400 font-mono">
                                                [{format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss')}]
                                            </span>
                                            <span className={cn(
                                                "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                                                log.actor_role === 'admin' ? 'bg-orange-500/10 text-orange-500' :
                                                log.actor_role === 'trainer' ? 'bg-blue-500/10 text-blue-500' :
                                                log.actor_role === 'member' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-800 text-zinc-500'
                                            )}>
                                                {ROLE_MAP[log.actor_role] || 'SİSTEM'}
                                            </span>
                                            {log.user_email && (
                                                <span className="text-[10px] font-mono text-zinc-600">
                                                    {maskEmail(log.user_email)}
                                                </span>
                                            )}
                                            {log.gym_name && (
                                                <span className="flex items-center gap-1 text-[9px] font-bold text-zinc-600 uppercase tracking-tight">
                                                    <Building2 className="w-3 h-3" /> {log.gym_name}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs font-medium text-zinc-300 leading-relaxed group-hover:text-white transition-colors">
                                            <span className="text-zinc-600 mr-2 font-bold font-mono">MESAJ:</span>
                                            {log.message}
                                        </p>
                                    </div>
                                    {log.gym_id && (
                                        <Link href={`/gyms/${log.gym_id}`} className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="p-2 bg-white/5 hover:bg-orange-500/20 rounded-lg text-zinc-600 hover:text-orange-500 transition-all border border-white/5 shadow-lg">
                                                <ExternalLink className="w-3.5 h-3.5" />
                                            </div>
                                        </Link>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-white/[0.02] px-8 py-3 border-t border-white/5 flex items-center justify-between text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                    <div className="flex gap-6 font-mono">
                        <span>Bellek: {logs.length}/100</span>
                        <span>Seçim: {activeTab.toUpperCase()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Canlı Senkronizasyon Aktif</span>
                    </div>
                </div>
            </Card>
        </div>
    );
}

export default function UniversalLoggerPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-6 h-6 border-2 border-white/10 border-t-orange-500 rounded-full animate-spin" />
            </div>
        }>
            <LoggerContent />
        </Suspense>
    );
}
