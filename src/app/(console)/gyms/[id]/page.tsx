'use client';

import { useEffect, useState, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, Button } from '@/components/ui';
import {
    Building2,
    Users,
    TrendingUp,
    Calendar,
    Globe,
    Phone,
    MapPin,
    ArrowLeft,
    ShieldCheck,
    CreditCard,
    DollarSign,
    Activity,
    Dumbbell,
    MoreVertical,
    Terminal,
    ChevronRight,
    Wifi,
    Cpu,
    Lock,
    Clock,
    FileText,
    Search,
    Settings,
    Database,
    Zap,
    CircleDot,
    X,
    Package
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

// --- TRANSLATIONS ---
const CATEGORY_MAP: Record<string, { label: string, color: string }> = {
    'gyms': { label: 'SYSTEM', color: 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20' },
    'system_settings': { label: 'CONFIG', color: 'text-orange-400 bg-orange-400/10 border-orange-400/20' },
    'users': { label: 'PERSONNEL', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
    'memberships': { label: 'SUBSCRIPTION', color: 'text-purple-400 bg-purple-400/10 border-purple-400/20' },
    'payments': { label: 'FINANCE', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
    'auth': { label: 'SECURITY', color: 'text-red-400 bg-red-400/10 border-red-400/20' },
    'products': { label: 'STORE', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
    'inventory': { label: 'STOCK', color: 'text-orange-400 bg-orange-400/10 border-orange-400/20' },
    'check_ins': { label: 'ACCESS', color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20' },
    'workout_sessions': { label: 'WORKOUT', color: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20' },
    'measurements': { label: 'METRICS', color: 'text-pink-400 bg-pink-400/10 border-pink-400/20' },
    'nutrition': { label: 'DIET', color: 'text-lime-400 bg-lime-400/10 border-lime-400/20' },
    'appointments': { label: 'CALENDAR', color: 'text-rose-400 bg-rose-400/10 border-rose-400/20' },
    'announcements': { label: 'BROADCAST', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
    'ai_assistant': { label: 'COPILOT', color: 'text-fuchsia-400 bg-fuchsia-400/10 border-fuchsia-400/20' },
    'rentals': { label: 'RENTAL', color: 'text-orange-400 bg-orange-400/10 border-orange-400/20' }
};

// --- COMPONENTS ---
const TelemetryLine = ({ log, index }: { log: any, index: number }) => {
    const catInfo = CATEGORY_MAP[log.entity_type] || { label: log.entity_type?.toUpperCase() || 'CORE', color: 'text-zinc-500 bg-zinc-500/5 border-zinc-500/10' };

    return (
        <motion.div
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
            className="flex items-start gap-5 py-2.5 px-6 hover:bg-white/[0.02] transition-colors group cursor-default border-l-2 border-transparent hover:border-orange-500/40"
        >
            {/* Line Metadata */}
            <div className="flex items-center gap-4 shrink-0 pt-1">
                <span className="text-[9px] font-mono text-zinc-800 w-6 tabular-nums">{String(index + 1).padStart(2, '0')}</span>
                <span className="text-[10px] font-mono text-zinc-600 tabular-nums">
                    {format(new Date(log.created_at), 'HH:mm:ss:SSS')}
                </span>
            </div>

            {/* Type Badge */}
            <div className={cn(
                "shrink-0 px-2.5 py-0.5 rounded border text-[8px] font-black tracking-[0.2em] leading-none mt-1 shadow-sm",
                catInfo.color
            )}>
                {catInfo.label}
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-zinc-400 leading-relaxed group-hover:text-zinc-200 transition-colors font-mono">
                    <span className="text-orange-500/40 mr-2">»</span>
                    {log.message}
                </p>
            </div>

            {/* Status light */}
            <div className="shrink-0 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className={cn(
                    "w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor]",
                    log.event_type?.includes('error') ? 'text-red-500 bg-current' : 'text-emerald-500 bg-current'
                )} />
            </div>
        </motion.div>
    );
};

import { toast } from 'sonner';



export default function GymDetailPage({ params }: { params: Promise<{ id: string }> }) {

    const router = useRouter();

    const resolvedParams = use(params);

    const gymId = resolvedParams.id;



    const [loading, setLoading] = useState(true);

    const [gym, setGym] = useState<any>(null);

    const [logs, setLogs] = useState<any[]>([]);

    const [stats, setStats] = useState({

        totalMembers: 0, activeMembers: 0,

        totalTrainers: 0, totalRevenue: 0,

        monthlyRevenue: 0, revenueTrend: [] as number[],

        recentPayments: [] as any[]

    });



    // --- CONFIGURATION STATE ---

    const [showConfigModal, setShowConfigModal] = useState(false);

    const [configLoading, setConfigLoading] = useState(false);

    const [configForm, setConfigForm] = useState({

        name: '',

        email: '',

        phone: '',

        address: '',

        status: 'active',

        // Settings (JSONB)

        is_ai_enabled: true,

        is_inventory_enabled: true,

        is_pt_enabled: true,

        max_members: 500,

        max_trainers: 10,

        subscription_tier: 'pro'

    });



    const supabase = createClient();



    const loadGymData = useCallback(async () => {

        setLoading(true);

        try {

            const { data: gymData } = await supabase.from('gyms').select('*').eq('id', gymId).single();

            if (gymData) {

                setGym(gymData);

                // Sync form with current settings

                const s = gymData.settings || {};

                setConfigForm({

                    name: gymData.name || '',

                    email: gymData.email || '',

                    phone: gymData.phone || '',

                    address: gymData.address || '',

                    status: s.status || 'active',

                    is_ai_enabled: s.is_ai_enabled ?? true,

                    is_inventory_enabled: s.is_inventory_enabled ?? true,

                    is_pt_enabled: s.is_pt_enabled ?? true,

                    max_members: s.max_members || 500,

                    max_trainers: s.max_trainers || 10,

                    subscription_tier: s.subscription_tier || 'pro'

                });

            }



            const { data: logData } = await supabase.from('system_logs').select('*').eq('gym_id', gymId).order('created_at', { ascending: false }).limit(15);

            if (logData) setLogs(logData);



            const { count: members } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('gym_id', gymId).eq('role', 'member');

            const { count: trainers } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('gym_id', gymId).eq('role', 'trainer');



            const { data: payments } = await supabase.from('payments').select('amount, created_at, status').eq('gym_id', gymId).eq('status', 'completed').order('created_at', { ascending: false });

            const totalRev = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;



            setStats({

                totalMembers: members || 0, activeMembers: members || 0,

                totalTrainers: trainers || 0, totalRevenue: totalRev,

                monthlyRevenue: 0, revenueTrend: [40, 60, 45, 80, 55, 90],

                recentPayments: payments?.slice(0, 5) || []

            });

        } catch (error) { console.error(error); } finally { setLoading(false); }

    }, [gymId, supabase]);



    const handleSaveConfig = async (e: React.FormEvent) => {

        e.preventDefault();

        setConfigLoading(true);

        try {

            const { error } = await supabase

                .from('gyms')

                .update({

                    name: configForm.name,

                    email: configForm.email,

                    phone: configForm.phone,

                    address: configForm.address,

                    settings: {

                        ...(gym.settings || {}),

                        status: configForm.status,

                        is_ai_enabled: configForm.is_ai_enabled,

                        is_inventory_enabled: configForm.is_inventory_enabled,

                        is_pt_enabled: configForm.is_pt_enabled,

                        max_members: configForm.max_members,

                        max_trainers: configForm.max_trainers,

                        subscription_tier: configForm.subscription_tier,

                        updated_at: new Date().toISOString()

                    }

                })

                .eq('id', gymId);



            if (error) throw error;



            toast.success('Salon yapılandırması başarıyla güncellendi.');



            setShowConfigModal(false);



            loadGymData();

        } catch (error: any) {

            toast.error('Güncelleme hatası: ' + error.message);

        } finally {

            setConfigLoading(false);

        }

    };



    useEffect(() => { loadGymData(); }, [loadGymData]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-8 h-8 border-2 border-white/10 border-t-orange-500 rounded-full animate-spin" />
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest animate-pulse">Salon Yapısı Taranıyor...</p>
        </div>
    );

    if (!gym) return (
        <div className="text-center py-20 bg-zinc-950 border border-dashed border-white/10 rounded-[3rem]">
            <ShieldCheck className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white uppercase tracking-tighter">Salon Bulunamadı</h2>
            <Button variant="secondary" onClick={() => router.back()} className="mt-6">MERKEZE DÖN</Button>
        </div>
    );

    return (
        <div className="space-y-10 pb-20">
            {/* --- CONFIGURATION MODAL --- */}
            <AnimatePresence>
                {showConfigModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-10">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowConfigModal(false)} className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
                        <motion.div initial={{ scale: 0.95, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 30 }} className="w-full max-w-4xl bg-[#050505] border border-white/10 rounded-[2.5rem] p-12 relative z-10 shadow-[0_0_100px_rgba(0,0,0,1)] overflow-hidden max-h-[90vh] overflow-y-auto hide-scrollbar">
                            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />

                            <div className="flex items-center justify-between mb-16">
                                <div className="flex items-center gap-6">
                                    <div className="p-4 bg-orange-500/10 rounded-2xl text-orange-500 border border-orange-500/20 shadow-lg shadow-orange-500/5">
                                        <Settings className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Salon Yapılandırması</h2>
                                        <p className="text-[11px] font-mono text-zinc-500 uppercase tracking-[0.3em] mt-1.5 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" /> Doğrudan Erişim: {gym.name}
                                        </p>
                                    </div>                                </div>
                                <button onClick={() => setShowConfigModal(false)} className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/5 rounded-2xl text-zinc-500 hover:text-white hover:bg-white/10 transition-all cursor-pointer"><X className="w-6 h-6" /></button>
                            </div>

                            <form onSubmit={handleSaveConfig} className="space-y-16">
                                {/* Section 1: System Modules */}
                                <div className="space-y-8">
                                    <div className="flex items-center gap-4">
                                        <div className="h-[1px] flex-1 bg-white/[0.04]" />
                                        <h3 className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.4em]">Alt-Sistem Modülleri</h3>
                                        <div className="h-[1px] flex-1 bg-white/[0.04]" />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                        {[
                                            { id: 'is_ai_enabled', label: 'NEURAL PILL', icon: Zap, desc: 'AI Copilot Engine' },
                                            { id: 'is_inventory_enabled', label: 'INVENTORY V4', icon: Package, desc: 'Global SKU Tracking' },
                                            { id: 'is_pt_enabled', label: 'TRAINER HUB', icon: Dumbbell, desc: 'Personnel Management' },
                                        ].map((module) => (
                                            <div
                                                key={module.id}
                                                onClick={() => setConfigForm({ ...configForm, [module.id]: !(configForm as any)[module.id] })}
                                                className={cn(
                                                    "p-6 rounded-[2rem] border transition-all cursor-pointer group relative overflow-hidden",
                                                    (configForm as any)[module.id]
                                                        ? "bg-orange-500/[0.03] border-orange-500/30 shadow-lg shadow-orange-500/5"
                                                        : "bg-white/[0.02] border-white/[0.04] opacity-40 hover:opacity-100 grayscale hover:grayscale-0"
                                                )}
                                            >
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className={cn("p-2 rounded-lg", (configForm as any)[module.id] ? "bg-orange-500/10 text-orange-500" : "bg-white/5 text-zinc-600")}>
                                                        <module.icon className="w-5 h-5" />
                                                    </div>
                                                    <div className={cn(
                                                        "w-10 h-5 rounded-full relative transition-colors border",
                                                        (configForm as any)[module.id] ? "bg-orange-500 border-orange-500/50" : "bg-zinc-900 border-white/5"
                                                    )}>
                                                        <motion.div
                                                            animate={{ x: (configForm as any)[module.id] ? 20 : 0 }}
                                                            className="absolute top-0.5 left-0.5 w-3.5 h-3.5 bg-white rounded-full shadow-xl"
                                                        />
                                                    </div>
                                                </div>
                                                <p className="text-xs font-black text-white uppercase tracking-widest">{module.label}</p>
                                                <p className="text-[9px] text-zinc-500 font-mono uppercase mt-1.5">{module.desc}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Section 2: Capacity Limits */}
                                <div className="space-y-8">
                                    <div className="flex items-center gap-4">
                                        <div className="h-[1px] flex-1 bg-white/[0.04]" />
                                        <h3 className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.4em]">Kaynak Eşikleri</h3>
                                        <div className="h-[1px] flex-1 bg-white/[0.04]" />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center px-1">
                                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Maksimum Üye Kapasitesi</label>
                                                <span className="text-[10px] font-mono text-orange-500 font-bold">Kesin Sınır</span>
                                            </div>
                                            <input
                                                type="number"
                                                value={configForm.max_members}
                                                onChange={e => setConfigForm({ ...configForm, max_members: parseInt(e.target.value) || 0 })}
                                                className="w-full h-14 bg-white/[0.02] border border-white/10 rounded-2xl px-6 text-base font-mono text-white focus:outline-none focus:border-orange-500/50 transition-all focus:bg-white/[0.04]"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center px-1">
                                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Eğitmen Kümesi Limiti</label>
                                                <span className="text-[10px] font-mono text-blue-500 font-bold">Esnek Üst Sınır</span>
                                            </div>
                                            <input
                                                type="number"
                                                value={configForm.max_trainers}
                                                onChange={e => setConfigForm({ ...configForm, max_trainers: parseInt(e.target.value) || 0 })}
                                                className="w-full h-14 bg-white/[0.02] border border-white/10 rounded-2xl px-6 text-base font-mono text-white focus:outline-none focus:border-blue-500/50 transition-all focus:bg-white/[0.04]"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 pt-10">
                                    <Button type="button" onClick={() => setShowConfigModal(false)} className="flex-1 h-16 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-[11px] font-black tracking-[0.3em] uppercase">
                                        DEĞİŞİKLİKLERİ İPTAL ET
                                    </Button>
                                    <Button type="submit" isLoading={configLoading} variant="primary" className="flex-[2] h-16 rounded-2xl text-[11px] font-black tracking-[0.3em] uppercase shadow-2xl shadow-orange-500/20">
                                        YAPILDIRMAYI UYGULA
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- TOP HUD --- */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 border-b border-white/[0.04] pb-12">
                <div className="flex items-start gap-8">
                    <div className="w-24 h-24 bg-[#050505] border border-white/10 rounded-[2rem] flex items-center justify-center text-orange-500 shadow-2xl relative group overflow-hidden">
                        <div className="absolute inset-0 bg-orange-500/5 group-hover:bg-orange-500/10 transition-colors" />
                        <Building2 className="w-12 h-12 relative z-10" />
                        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-orange-500/20" />
                    </div>
                    <div>
                        <div className="flex items-center gap-5 mb-3">
                            <h1 className="text-4xl font-black text-white tracking-tighter uppercase">{gym.name}</h1>
                            <div className="flex items-center gap-2.5 px-3 py-1 bg-emerald-500/5 border border-emerald-500/20 rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Bağlantı: Aktif</span>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-8 text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                            <div className="flex items-center gap-2 text-zinc-400 font-mono lowercase italic bg-white/5 px-3 py-1 rounded-lg border border-white/5">
                                <Globe className="w-3.5 h-3.5 text-zinc-600" /> {gym.email || 'çevrimdışı'}
                            </div>
                            <div
                                onClick={() => { navigator.clipboard.writeText(gym.id); toast.success('Salon ID kopyalandı.'); }}
                                className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors group"
                            >
                                <Lock className="w-3.5 h-3.5 text-zinc-700 group-hover:text-orange-500 transition-colors" />
                                <span className="font-mono">UUID::{gym.id.slice(0, 12)}...</span>
                            </div>
                            <div className="flex items-center gap-2 text-orange-500/80 bg-orange-500/5 px-3 py-1 rounded-lg border border-orange-500/10">
                                <Settings className="w-3.5 h-3.5" /> ÇEKİRDEK v4.2.1
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <Button onClick={() => router.back()} className="bg-zinc-950 border border-white/5 hover:bg-white/5 rounded-xl h-14 px-8 font-black text-[10px] tracking-[0.2em] uppercase transition-all">
                        <ArrowLeft className="w-4 h-4 mr-3" /> HQ DÖNÜŞ
                    </Button>
                    <Button onClick={() => setShowConfigModal(true)} variant="primary" className="h-14 px-10 shadow-2xl shadow-orange-500/20 rounded-xl font-black text-[10px] tracking-[0.2em] uppercase">
                        <Settings className="w-4 h-4 mr-3" /> YAPILANDIR
                    </Button>
                </div>
            </div>

            {/* --- BENTO TELEMETRY --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2 p-8 bg-zinc-950/40 relative overflow-hidden group border-white/[0.06]">
                    <div className="flex items-center justify-between mb-10 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500 border border-emerald-500/20">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <div>
                                <span className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">Hacim Akışı</span>
                                <p className="text-xs text-zinc-600 font-bold mt-0.5">Gerçek zamanlı gelir işleme</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-3xl font-black text-white tabular-nums">{stats.totalRevenue.toLocaleString()} <span className="text-lg text-zinc-700">₺</span></p>
                        </div>
                    </div>
                    <div className="flex items-end gap-2 h-20">
                        {[40, 70, 45, 90, 65, 80, 100, 85, 95, 60, 75, 85].map((h, i) => (
                            <div key={i} className="flex-1 bg-white/[0.02] rounded-t-lg h-full relative overflow-hidden">
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${h}%` }}
                                    className="absolute bottom-0 left-0 w-full bg-emerald-500/20 border-t border-emerald-500/40 rounded-t-lg"
                                />
                            </div>
                        ))}
                    </div>
                </Card>

                <Card className="p-8 bg-zinc-950/40 border-white/[0.06]">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500 border border-blue-500/20">
                            <Users className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">Üye Durumu</span>
                    </div>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-2xl border border-white/[0.04]">
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Global Üyeler</span>
                            <span className="text-xl font-black text-white">{stats.totalMembers}</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-2xl border border-white/[0.04]">
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Salon Eğitmenleri</span>
                            <span className="text-xl font-black text-white">{stats.totalTrainers}</span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* --- THE TERMINAL (NODE TELEMETRY STREAM) --- */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-4">
                    <div className="flex items-center gap-5">
                        <div className="p-3 bg-orange-500/10 rounded-2xl border border-orange-500/20 shadow-lg shadow-orange-500/5">
                            <Terminal className="w-6 h-6 text-orange-500" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Salon Telemetri Akışı</h3>
                            <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.3em] mt-1.5 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" /> Çekirdek Bağlantısı: Aktif
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button
                            onClick={() => router.push(`/health/logs?gymId=${gymId}`)}
                            className="bg-zinc-950 border border-white/5 hover:border-orange-500/30 hover:text-orange-500 rounded-xl h-12 px-6 font-black text-[10px] tracking-[0.2em] uppercase transition-all"
                        >
                            TÜM KAYITLARI İNCELE
                        </Button>
                        <div className="px-4 py-2 bg-[#050505] border border-white/5 rounded-xl flex items-center gap-4">
                            <div className="flex gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse delay-100" />
                            </div>
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest font-mono">CANLI AKIŞ</span>
                        </div>
                    </div>
                </div>

                <Card className="bg-[#020202] border-white/[0.04] rounded-[2.5rem] overflow-hidden shadow-2xl relative">
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

                    {/* Terminal Header */}
                    <div className="bg-white/[0.02] px-8 py-4 border-b border-white/[0.04] flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-6">
                            <div className="flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500/10 border border-red-500/30" />
                                <div className="w-3 h-3 rounded-full bg-amber-500/10 border border-amber-500/30" />
                                <div className="w-3 h-3 rounded-full bg-emerald-500/10 border border-emerald-500/30" />
                            </div>
                            <span className="text-[10px] font-mono text-zinc-600 tracking-[0.2em] uppercase">OTURUM :: {Math.random().toString(36).substring(7).toUpperCase()}</span>
                        </div>
                        <div className="flex items-center gap-6 text-zinc-700">
                            <Search className="w-4 h-4 hover:text-white cursor-pointer transition-colors" />
                            <div className="h-4 w-[1px] bg-white/5" />
                            <Settings className="w-4 h-4 hover:text-white cursor-pointer transition-colors" />
                        </div>
                    </div>

                    {/* Terminal Body */}
                    <div className="p-2 min-h-[500px] font-mono overflow-y-auto hide-scrollbar relative z-10">
                        {logs.length > 0 ? (
                            <div className="divide-y divide-white/[0.02]">
                                {logs.map((log, i) => (
                                    <TelemetryLine key={i} log={log} index={i} />
                                ))}
                                {/* Cursor indicator */}
                                <div className="flex items-center gap-5 py-4 px-6 border-l-2 border-orange-500/40 bg-orange-500/5">
                                    <span className="text-[9px] text-zinc-800 tabular-nums w-6">{String(logs.length + 1).padStart(2, '0')}</span>
                                    <div className="flex items-center gap-4">
                                        <div className="w-2.5 h-5 bg-orange-500 animate-pulse shadow-[0_0_15px_orange]" />
                                        <span className="text-[11px] text-orange-500/70 font-black uppercase tracking-[0.2em] animate-pulse">Küresel telemetri patlaması bekleniyor...</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center py-40 opacity-10">
                                <Activity className="w-20 h-20 mb-6 animate-pulse" />
                                <p className="text-sm font-black uppercase tracking-[0.4em]">Aktif Telemetri Yok</p>
                            </div>
                        )}
                    </div>

                    {/* Terminal Footer */}
                    <div className="bg-white/[0.01] px-8 py-3 border-t border-white/[0.04] flex items-center justify-between text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em] relative z-10">
                        <div className="flex gap-10">
                            <span className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-emerald-500" /> Çekirdek: Aktif</span>
                            <span className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-blue-500" /> Tampon: 100%</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span>Bölge: TR-BATI-1</span>
                            <div className="h-3 w-[1px] bg-white/5 mx-2" />
                            <span className="text-zinc-500">Salon_ID: {gymId.slice(0, 8).toUpperCase()}</span>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
