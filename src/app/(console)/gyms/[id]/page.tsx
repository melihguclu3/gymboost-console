'use client';

import { useEffect, useState, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, Button } from '@/components/ui';
import {
    Building2,
    Users,
    TrendingUp,
    Settings,
    ArrowLeft,
    ShieldCheck,
    Lock,
    Globe,
    Zap,
    Package,
    Dumbbell,
    Mail,
    X,
    Activity,
    Search,
    ChevronRight,
    Clock,
    Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { toast } from 'sonner';

// --- TRANSLATIONS ---
const CATEGORY_MAP: Record<string, { label: string, color: string }> = {
    'gyms': { label: 'Sistem', color: 'bg-zinc-500/10 text-zinc-500' },
    'system_settings': { label: 'Ayarlar', color: 'bg-orange-500/10 text-orange-500' },
    'users': { label: 'Kullanıcı', color: 'bg-blue-500/10 text-blue-500' },
    'memberships': { label: 'Üyelik', color: 'bg-purple-500/10 text-purple-500' },
    'payments': { label: 'Finans', color: 'bg-emerald-500/10 text-emerald-500' },
    'auth': { label: 'Güvenlik', color: 'bg-red-500/10 text-red-500' },
    'products': { label: 'Mağaza', color: 'bg-amber-500/10 text-amber-500' },
    'inventory': { label: 'Stok', color: 'bg-orange-500/10 text-orange-500' },
    'check_ins': { label: 'Giriş', color: 'bg-cyan-500/10 text-cyan-500' },
    'workout_sessions': { label: 'Antrenman', color: 'bg-indigo-500/10 text-indigo-500' },
    'measurements': { label: 'Ölçüm', color: 'bg-pink-500/10 text-pink-500' },
    'nutrition': { label: 'Diyet', color: 'bg-lime-500/10 text-lime-500' },
    'appointments': { label: 'Randevu', color: 'bg-rose-500/10 text-rose-500' },
    'announcements': { label: 'Duyuru', color: 'bg-yellow-500/10 text-yellow-500' },
    'ai_assistant': { label: 'AI', color: 'bg-fuchsia-500/10 text-fuchsia-500' },
    'rentals': { label: 'Kiralama', color: 'bg-orange-500/10 text-orange-500' }
};

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
        notification_email: '',
        is_ai_enabled: true,
        is_inventory_enabled: true,
        is_pt_enabled: true,
        pro_model_enabled: false,
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
                const s = gymData.settings || {};
                setConfigForm({
                    name: gymData.name || '',
                    email: gymData.email || '',
                    phone: gymData.phone || '',
                    address: gymData.address || '',
                    status: s.status || 'active',
                    notification_email: s.notification_email || '',
                    is_ai_enabled: s.is_ai_enabled ?? true,
                    is_inventory_enabled: s.is_inventory_enabled ?? true,
                    is_pt_enabled: s.is_pt_enabled ?? true,
                    pro_model_enabled: s.pro_model_enabled ?? false,
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

            // Calculate real revenue trend (last 6 months)
            const now = new Date();
            const revenueTrend: number[] = [];
            let maxRevenue = 0;

            for (let i = 5; i >= 0; i--) {
                const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

                const monthlySum = payments?.filter(p => {
                    const pDate = new Date(p.created_at);
                    return pDate >= monthDate && pDate <= monthEnd;
                }).reduce((sum, p) => sum + p.amount, 0) || 0;

                if (monthlySum > maxRevenue) maxRevenue = monthlySum;
                revenueTrend.push(monthlySum);
            }

            // Normalize to percentages (0-100)
            const normalizedTrend = revenueTrend.map(v =>
                maxRevenue > 0 ? Math.round((v / maxRevenue) * 100) : 0
            );

            // This month's revenue
            const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const monthlyRevenue = payments?.filter(p => new Date(p.created_at) >= thisMonth)
                .reduce((sum, p) => sum + p.amount, 0) || 0;

            setStats({
                totalMembers: members || 0, activeMembers: members || 0,
                totalTrainers: trainers || 0, totalRevenue: totalRev,
                monthlyRevenue, revenueTrend: normalizedTrend,
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
                        notification_email: configForm.notification_email,
                        status: configForm.status,
                        is_ai_enabled: configForm.is_ai_enabled,
                        is_inventory_enabled: configForm.is_inventory_enabled,
                        is_pt_enabled: configForm.is_pt_enabled,
                        pro_model_enabled: configForm.pro_model_enabled,
                        max_members: configForm.max_members,
                        max_trainers: configForm.max_trainers,
                        subscription_tier: configForm.subscription_tier,
                        updated_at: new Date().toISOString()
                    }
                })
                .eq('id', gymId);

            if (error) throw error;
            toast.success('Salon yapılandırması güncellendi.');
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
            <div className="w-8 h-8 border-2 border-zinc-600 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-xs font-medium text-zinc-500">Salon Verileri Yükleniyor...</p>
        </div>
    );

    if (!gym) return (
        <div className="text-center py-20 bg-zinc-800/50 border border-zinc-700/50 rounded-2xl">
            <ShieldCheck className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-zinc-100">Salon Bulunamadı</h2>
            <Button variant="secondary" onClick={() => router.back()} className="mt-6">Geri Dön</Button>
        </div>
    );

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <Button
                        onClick={() => router.back()}
                        variant="ghost"
                        className="pl-0 text-zinc-400 hover:text-zinc-100 mb-2 h-auto p-0 hover:bg-transparent"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Salonlara Dön
                    </Button>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
                            <Building2 className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-zinc-100">{gym.name}</h1>
                            <div className="flex flex-wrap items-center gap-4 mt-1 text-sm text-zinc-400">
                                <span className="flex items-center gap-1.5">
                                    <Globe className="w-3.5 h-3.5" /> {gym.email || 'E-posta yok'}
                                </span>
                                <span className="hidden sm:inline">•</span>
                                <span className="font-mono text-xs bg-zinc-800 px-2 py-0.5 rounded text-zinc-500 flex items-center gap-1.5 cursor-pointer hover:text-blue-400" onClick={() => { navigator.clipboard.writeText(gym.id); toast.success('ID kopyalandı') }}>
                                    <Lock className="w-3 h-3" /> {gym.id.slice(0, 8)}...
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <Button onClick={() => setShowConfigModal(true)} variant="primary" className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20">
                    <Settings className="w-4 h-4 mr-2" /> Yapılandır
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2 p-6 bg-zinc-800/50 border-zinc-700/50">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-600/10 text-emerald-500 rounded-lg">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-zinc-100">Toplam Gelir</h3>
                                <p className="text-xs text-zinc-400">Tüm zamanlar</p>
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-zinc-100">{stats.totalRevenue.toLocaleString('tr-TR')} ₺</p>
                    </div>
                    <div className="flex items-end gap-2 h-32">
                        {[40, 70, 45, 90, 65, 80, 100, 85, 95, 60, 75, 85].map((h, i) => (
                            <div key={i} className="flex-1 bg-zinc-700/20 rounded-t relative overflow-hidden group">
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${h}%` }}
                                    className="absolute bottom-0 left-0 w-full bg-emerald-600/50 group-hover:bg-emerald-500 transition-colors rounded-t"
                                />
                            </div>
                        ))}
                    </div>
                </Card>

                <Card className="p-6 bg-zinc-800/50 border-zinc-700/50">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-600/10 text-blue-500 rounded-lg">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-zinc-100">Kullanıcılar</h3>
                            <p className="text-xs text-zinc-400">Üye ve Personel</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-lg border border-zinc-700/50">
                            <span className="text-sm text-zinc-400">Üyeler</span>
                            <span className="text-lg font-bold text-zinc-100">{stats.totalMembers}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-lg border border-zinc-700/50">
                            <span className="text-sm text-zinc-400">Eğitmenler</span>
                            <span className="text-lg font-bold text-zinc-100">{stats.totalTrainers}</span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Logs Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-zinc-100">Olay Günlükleri</h2>
                    <Button
                        variant="ghost"
                        onClick={() => router.push(`/health/logs?gymId=${gymId}`)}
                        className="text-zinc-400 hover:text-zinc-100"
                    >
                        Tümünü Gör <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                </div>

                <Card className="overflow-hidden bg-zinc-800/50 border-zinc-700/50 min-h-[400px]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-zinc-900/50 text-zinc-400 border-b border-zinc-700/50">
                                <tr>
                                    <th className="px-6 py-3 font-medium w-32">Zaman</th>
                                    <th className="px-6 py-3 font-medium w-32">Kategori</th>
                                    <th className="px-6 py-3 font-medium">Mesaj</th>
                                    <th className="px-6 py-3 font-medium w-24">Durum</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-700/50">
                                {logs.length > 0 ? logs.map((log) => {
                                    const catInfo = CATEGORY_MAP[log.entity_type] || { label: 'Diğer', color: 'bg-zinc-500/10 text-zinc-500' };
                                    return (
                                        <tr key={log.id} className="hover:bg-zinc-700/10 transition-colors">
                                            <td className="px-6 py-4 text-zinc-400 font-mono text-xs">
                                                {format(new Date(log.created_at), 'HH:mm:ss')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={cn("px-2 py-1 rounded text-xs font-medium whitespace-nowrap", catInfo.color)}>
                                                    {catInfo.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-zinc-200">
                                                {log.message}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={cn(
                                                    "w-2 h-2 rounded-full",
                                                    log.event_type === 'error' ? 'bg-red-500' : 'bg-green-500'
                                                )} />
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                                            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                            Henüz kayıt yok.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {/* Config Modal */}
            <AnimatePresence>
                {showConfigModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowConfigModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-2xl bg-zinc-800 border border-zinc-700 rounded-2xl p-6 relative z-10 shadow-2xl max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-600/10 text-blue-600 rounded-lg">
                                        <Settings className="w-6 h-6" />
                                    </div>
                                    <h2 className="text-xl font-bold text-zinc-100">Salon Yapılandırması</h2>
                                </div>
                                <button onClick={() => setShowConfigModal(false)} className="p-1 text-zinc-400 hover:text-white transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSaveConfig} className="space-y-6">
                                {/* Modules */}
                                <div>
                                    <label className="text-sm font-medium text-zinc-400 mb-3 block">Aktif Modüller</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {[
                                            { id: 'is_ai_enabled', label: 'AI Asistan', icon: Zap },
                                            { id: 'pro_model_enabled', label: 'AI Pro Model', icon: Sparkles, premium: true },
                                            { id: 'is_inventory_enabled', label: 'Envanter', icon: Package },
                                            { id: 'is_pt_enabled', label: 'Eğitmen', icon: Dumbbell },
                                        ].map((module) => (
                                            <div
                                                key={module.id}
                                                onClick={() => setConfigForm({ ...configForm, [module.id]: !(configForm as any)[module.id] })}
                                                className={cn(
                                                    "p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-3",
                                                    (configForm as any)[module.id]
                                                        ? (module as any).premium
                                                            ? "bg-purple-600/10 border-purple-600/30 text-purple-400"
                                                            : "bg-blue-600/10 border-blue-600/30 text-blue-500"
                                                        : "bg-zinc-900 border-zinc-700/50 text-zinc-500 hover:border-zinc-600"
                                                )}
                                            >
                                                <module.icon className="w-4 h-4" />
                                                <span className="text-sm font-medium">{module.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Inputs */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-zinc-300 mb-1.5 block">Yönetici E-posta</label>
                                        <input
                                            type="email"
                                            value={configForm.notification_email}
                                            onChange={e => setConfigForm({ ...configForm, notification_email: e.target.value })}
                                            className="w-full h-10 bg-zinc-900 border border-zinc-700 rounded-lg px-3 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent placeholder:text-zinc-600"
                                            placeholder="ornek@salon.com"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-zinc-300 mb-1.5 block">Max Üye</label>
                                            <input
                                                type="number"
                                                value={configForm.max_members}
                                                onChange={e => setConfigForm({ ...configForm, max_members: parseInt(e.target.value) || 0 })}
                                                className="w-full h-10 bg-zinc-900 border border-zinc-700 rounded-lg px-3 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-zinc-300 mb-1.5 block">Max Eğitmen</label>
                                            <input
                                                type="number"
                                                value={configForm.max_trainers}
                                                onChange={e => setConfigForm({ ...configForm, max_trainers: parseInt(e.target.value) || 0 })}
                                                className="w-full h-10 bg-zinc-900 border border-zinc-700 rounded-lg px-3 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <Button type="button" onClick={() => setShowConfigModal(false)} variant="secondary" className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white">
                                        İptal
                                    </Button>
                                    <Button type="submit" isLoading={configLoading} variant="primary" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                                        Kaydet
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
