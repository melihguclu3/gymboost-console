'use client';

import { useEffect, useState, use } from 'react';
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
    UserCheck,
    Dumbbell,
    MoreVertical,
    Archive,
    RotateCcw
} from 'lucide-react';

// Custom SVG Chart for Revenue Trend
const RevenueChart = ({ data }: { data: number[] }) => {
    if (!data || data.length < 2) return null;

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    // Normalize data points to 0-100 scale for plotting
    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - ((val - min) / range) * 80 - 10; // maintain padding
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className="w-full h-32 relative">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                {/* Gradient Fill */}
                <defs>
                    <linearGradient id="revenueGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Fill Area */}
                <polygon
                    points={`0,100 ${points} 100,100`}
                    fill="url(#revenueGradient)"
                />

                {/* Line */}
                <polyline
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={points}
                />
            </svg>
        </div>
    );
};

export default function GymDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const resolvedParams = use(params);
    const gymId = resolvedParams.id;

    const [loading, setLoading] = useState(true);
    const [gym, setGym] = useState<any>(null);
    const [stats, setStats] = useState({
        totalMembers: 0,
        activeMembers: 0,
        totalTrainers: 0,
        totalRevenue: 0,
        monthlyRevenue: 0,
        lastMonthRevenue: 0,
        revenueTrend: [] as number[],
        recentPayments: [] as any[]
    });

    useEffect(() => {
        loadGymData();
    }, [gymId]);

    const loadGymData = async () => {
        setLoading(true);
        try {
            const supabase = createClient();

            // 1. Get Gym Details
            const { data: gymData, error: gymError } = await supabase
                .from('gyms')
                .select('*')
                .eq('id', gymId)
                .single();

            if (gymError) throw gymError;
            setGym(gymData);

            // 2. Get Members Stats
            const { count: totalMembers } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('gym_id', gymId)
                .eq('role', 'member');

            const { count: totalTrainers } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('gym_id', gymId)
                .eq('role', 'trainer');

            // 3. Get Financials
            const { data: payments } = await supabase
                .from('payments')
                .select('amount, created_at, status')
                .eq('gym_id', gymId)
                .eq('status', 'completed')
                .order('created_at', { ascending: false });

            const totalRev = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;

            // Calculate monthly revenue
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
            const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

            const thisMonthRev = payments
                ?.filter(p => p.created_at >= startOfMonth)
                .reduce((sum, p) => sum + p.amount, 0) || 0;

            const lastMonthRev = payments
                ?.filter(p => p.created_at >= startOfLastMonth && p.created_at <= endOfLastMonth)
                .reduce((sum, p) => sum + p.amount, 0) || 0;

            // Generate trend data (last 6 months, mock logic if not enough data for real graph)
            // For real implementation, we would group payments by month.
            // Simplified for now: just random variations based on total revenue to show the chart component working
            const trendData = [
                totalRev * 0.1,
                totalRev * 0.12,
                totalRev * 0.15,
                totalRev * 0.14,
                totalRev * 0.18,
                totalRev * 0.2
            ];

            setStats({
                totalMembers: totalMembers || 0,
                activeMembers: totalMembers || 0, // Assuming all represent active for now
                totalTrainers: totalTrainers || 0,
                totalRevenue: totalRev,
                monthlyRevenue: thisMonthRev,
                lastMonthRevenue: lastMonthRev,
                revenueTrend: trendData,
                recentPayments: payments?.slice(0, 5) || []
            });

        } catch (error) {
            console.error('Error loading gym details:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!gym) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold text-white">Salon Bulunamadı</h2>
                <Button variant="secondary" onClick={() => router.back()} className="mt-4">
                    Geri Dön
                </Button>
            </div>
        );
    }

    const isArchived = gym.settings?.status === 'archived';

    return (
        <div className="space-y-8 pb-20">
            {/* Header / Navigation */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => router.back()}
                        className="bg-zinc-900 border-white/10 hover:bg-zinc-800 text-zinc-400"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-black text-white">{gym.name}</h1>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${isArchived
                                    ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                    : gym.settings?.is_activated
                                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                        : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                }`}>
                                {isArchived ? 'ARŞİVLENDİ' : gym.settings?.is_activated ? 'AKTİF' : 'BEKLEMEDE'}
                            </span>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-zinc-400">
                            {gym.email && (
                                <div className="flex items-center gap-1.5">
                                    <Globe className="w-3.5 h-3.5" /> {gym.email}
                                </div>
                            )}
                            {gym.phone && (
                                <div className="flex items-center gap-1.5">
                                    <Phone className="w-3.5 h-3.5" /> {gym.phone}
                                </div>
                            )}
                            {gym.address && (
                                <div className="flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5" /> {gym.address}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Financial Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Revenue Card */}
                <Card className="lg:col-span-2 bg-zinc-950/50 border-white/5 p-6 relative overflow-hidden">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-2 bg-emerald-500/10 rounded-lg">
                                    <DollarSign className="w-5 h-5 text-emerald-500" />
                                </div>
                                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                                    Toplam Gelir
                                </span>
                            </div>
                            <div className="text-4xl font-black text-white tracking-tight">
                                {stats.totalRevenue.toLocaleString('tr-TR')} ₺
                            </div>
                        </div>
                        <div className="flex gap-8">
                            <div>
                                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
                                    Bu Ay
                                </div>
                                <div className="text-xl font-bold text-white">
                                    {stats.monthlyRevenue.toLocaleString('tr-TR')} ₺
                                </div>
                            </div>
                            <div>
                                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
                                    Geçen Ay
                                </div>
                                <div className="text-xl font-bold text-zinc-400">
                                    {stats.lastMonthRevenue.toLocaleString('tr-TR')} ₺
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Chart */}
                    <div className="mt-auto">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-bold text-zinc-500">6 Aylık Trend</span>
                            <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" /> +12%
                            </span>
                        </div>
                        <RevenueChart data={stats.revenueTrend} />
                    </div>
                </Card>

                {/* Operations Stats */}
                <div className="space-y-6">
                    <Card className="bg-zinc-950/50 border-white/5 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">
                                Operasyon
                            </h3>
                            <Activity className="w-4 h-4 text-zinc-600" />
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                        <Users className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-white">Üyeler</div>
                                        <div className="text-[10px] text-zinc-500">Aktif Kayıtlar</div>
                                    </div>
                                </div>
                                <div className="text-xl font-black text-white">{stats.totalMembers}</div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                                        <Dumbbell className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-white">Eğitmenler</div>
                                        <div className="text-[10px] text-zinc-500">Kadro</div>
                                    </div>
                                </div>
                                <div className="text-xl font-black text-white">{stats.totalTrainers}</div>
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-zinc-950/50 border-white/5 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">
                                Sistem Durumu
                            </h3>
                            <ShieldCheck className="w-4 h-4 text-zinc-600" />
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-zinc-500">Abonelik</span>
                                <span className="font-bold text-white">Pro Plan</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-zinc-500">Yenileme</span>
                                <span className="font-bold text-white">12.12.2026</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Recent Payments Table */}
            <div>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-zinc-500" />
                    Son Ödemeler
                </h3>

                {stats.recentPayments.length > 0 ? (
                    <div className="grid gap-3">
                        {stats.recentPayments.map((payment, i) => (
                            <Card key={i} className="bg-zinc-900/20 border-white/5 p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                        <DollarSign className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-white">
                                            {payment.amount.toLocaleString('tr-TR')} ₺
                                        </div>
                                        <div className="text-xs text-zinc-500">
                                            {new Date(payment.created_at).toLocaleDateString('tr-TR', {
                                                day: 'numeric',
                                                month: 'long',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </div>
                                    </div>
                                </div>
                                <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                                    TAMAMLANDI
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="bg-zinc-900/20 border-white/5 p-8 text-center">
                        <CreditCard className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                        <div className="text-white font-bold">Ödeme Kaydı Yok</div>
                        <div className="text-sm text-zinc-500">Bu işletme henüz ödeme almamış.</div>
                    </Card>
                )}
            </div>
        </div>
    );
}
