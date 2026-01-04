'use client';

import { useEffect, useState } from 'react';
import { Card, Button, Input } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { 
    TrendingUp, 
    CreditCard, 
    Wallet, 
    Banknote, 
    Building2, 
    Calendar, 
    ArrowUpRight, 
    ArrowDownRight,
    Search,
    Download,
    Filter,
    DollarSign,
    CheckCircle2,
    Clock,
    Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface GlobalTransaction {
    id: string;
    amount: number;
    payment_method: string;
    payment_date: string;
    status: string;
    description: string;
    gyms: {
        name: string;
    };
    users: {
        full_name: string;
    };
}

export default function GlobalRevenuePage() {
    const [transactions, setTransactions] = useState<GlobalTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        monthlyGrowth: 0,
        pendingPayments: 0,
        gymCount: 0,
        topNodes: [] as { name: string, amount: number }[]
    });

    const supabase = createClient();

    useEffect(() => {
        loadFinancialData();
    }, []);

    async function loadFinancialData() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('payments')
                .select(`
                    id, amount, payment_method, payment_date, status, description,
                    gyms (name), users (full_name)
                `)
                .order('payment_date', { ascending: false });

            if (error) throw error;

            if (data) {
                setTransactions(data as any);
                const completedPayments = data.filter(p => p.status === 'completed');
                const total = completedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
                
                // Calculate Growth (Current Month vs Last Month)
                const now = new Date();
                const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                
                const thisMonthRev = completedPayments
                    .filter(p => new Date(p.payment_date) >= thisMonthStart)
                    .reduce((sum, p) => sum + p.amount, 0);
                
                const lastMonthRev = completedPayments
                    .filter(p => new Date(p.payment_date) >= lastMonthStart && new Date(p.payment_date) < thisMonthStart)
                    .reduce((sum, p) => sum + p.amount, 0);
                
                const growth = lastMonthRev === 0 ? 100 : Math.round(((thisMonthRev - lastMonthRev) / lastMonthRev) * 100);

                // Aggregated Node Ranking
                const nodeMap: Record<string, number> = {};
                completedPayments.forEach(p => {
                    const name = (p as any).gyms?.name || 'Unknown Node';
                    nodeMap[name] = (nodeMap[name] || 0) + p.amount;
                });

                const topNodes = Object.entries(nodeMap)
                    .map(([name, amount]) => ({ name, amount }))
                    .sort((a, b) => b.amount - a.amount)
                    .slice(0, 3);

                setStats({
                    totalRevenue: total,
                    monthlyGrowth: growth,
                    pendingPayments: data.filter(p => p.status === 'pending').length,
                    gymCount: new Set(data.map(p => (p as any).gyms?.name)).size,
                    topNodes
                });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);
    };

    const getMethodIcon = (method: string) => {
        switch (method) {
            case 'card': return <CreditCard className="w-4 h-4" />;
            case 'bank_transfer': return <Building2 className="w-4 h-4" />;
            default: return <Banknote className="w-4 h-4" />;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-12 pb-20 text-left text-white">
            {/* --- SURGICAL UNIFIED HEADER --- */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 border-b border-white/[0.04] pb-12">
                <div className="flex items-start gap-8">
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-[1.5rem] shadow-lg shadow-emerald-500/5 relative overflow-hidden group">
                        <TrendingUp className="w-10 h-10 text-emerald-500 relative z-10 group-hover:scale-110 transition-transform" />
                        <div className="absolute inset-0 bg-emerald-500/5 animate-pulse" />
                    </div>
                    <div>
                        <div className="flex items-center gap-4 mb-3">
                            <h1 className="text-4xl font-black text-white tracking-tighter uppercase">
                                GELİR <span className="text-emerald-500">AKIŞI</span>
                            </h1>
                            <div className="flex items-center gap-2.5 px-3 py-1 bg-emerald-500/5 border border-emerald-500/20 rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Finans Motoru: Kararlı</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-6 text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">
                            <div className="flex items-center gap-2 font-mono">
                                <Wallet className="w-3.5 h-3.5" /> BRÜT_TOPLAM: {formatCurrency(stats.totalRevenue)}
                            </div>
                            <div className="flex items-center gap-2 font-mono">
                                <Building2 className="w-3.5 h-3.5" /> AKTİF_SALONLAR: {stats.gymCount}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="px-6 py-4 bg-zinc-950/40 border border-white/[0.04] rounded-2xl text-right group hover:border-emerald-500/30 transition-all shadow-2xl relative overflow-hidden">
                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1 group-hover:text-emerald-500 transition-colors font-mono">Büyüme Oranı</p>
                        <p className="text-2xl font-black text-white tabular-nums font-mono">+{stats.monthlyGrowth}<span className="text-[10px] text-zinc-800 ml-1 font-mono uppercase">%</span></p>
                    </div>
                    <Button className="bg-zinc-950 border border-white/10 hover:border-emerald-500/40 hover:bg-emerald-500/5 rounded-xl h-14 px-8 font-black text-[10px] tracking-[0.3em] uppercase transition-all">
                        <Download className="w-4 h-4 mr-3" /> RAPORLARI DIŞA AKTAR
                    </Button>
                </div>
            </div>

            {/* --- FINANCIAL BENTO GRID --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                    { label: 'Brüt İşlem Hacmi', val: formatCurrency(stats.totalRevenue), sub: 'Toplam Net Hacim', icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/5', border: 'border-emerald-500/20' },
                    { label: 'Aktif Salon Payı', val: stats.gymCount, sub: 'Ödeme Yapan İşletmeler', icon: Building2, color: 'text-blue-500', bg: 'bg-blue-500/5', border: 'border-blue-500/20' },
                    { label: 'Tahsilat Kuyruğu', val: stats.pendingPayments, sub: 'Onay Bekleyen İşlemler', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/5', border: 'border-amber-500/20' },
                    { label: 'İşlem Başına Gelir', val: formatCurrency(stats.totalRevenue / (transactions.length || 1)), sub: 'Ortalama İşlem Değeri', icon: Zap, color: 'text-orange-500', bg: 'bg-orange-500/5', border: 'border-orange-500/20' },
                ].map((s, i) => (
                    <Card key={i} className={cn("p-8 bg-zinc-950/20 border-white/[0.04] relative overflow-hidden group hover:border-emerald-500/20 transition-all rounded-[2rem]", s.border)}>
                        <div className="flex items-center justify-between mb-8 relative z-10">
                            <div className={cn("p-3.5 rounded-2xl border transition-all duration-500", s.bg, s.border)}>
                                <s.icon className={cn("w-6 h-6", s.color)} />
                            </div>
                            <div className="flex gap-0.5">
                                {[1,2,3].map(j => <div key={j} className="w-0.5 h-3 bg-zinc-800 group-hover:bg-emerald-500/40 transition-colors" />)}
                            </div>
                        </div>
                        <div className="relative z-10">
                            <p className="text-3xl font-black text-white tracking-tighter tabular-nums font-mono">{s.val}</p>
                            <p className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] mt-1.5">{s.label}</p>
                        </div>
                        <p className="text-[9px] font-mono font-black text-zinc-800 uppercase tracking-widest mt-8 border-t border-white/[0.04] pt-5 group-hover:text-zinc-600 transition-colors">{s.sub}</p>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Transaction List */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-10 border-b border-white/[0.04] pb-10">
                        <div className="flex items-center gap-5">
                            <div className="p-3 bg-zinc-950 border border-white/5 rounded-2xl text-zinc-600">
                                <CreditCard className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white tracking-tighter uppercase">
                                    KÜRESEL İŞLEM GÜNLÜĞÜ
                                </h2>
                                <p className="text-[10px] font-mono font-black text-zinc-700 uppercase tracking-[0.3em] mt-1">AKIŞ AKTİF: SON 10 İŞLEM</p>
                            </div>
                        </div>
                        <div className="relative w-full sm:w-[350px] group">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700 group-focus-within:text-emerald-500 transition-colors" />
                            <input 
                                placeholder="İŞLEM_VEYA_VARLIK_ARA..."
                                className="w-full pl-14 pr-6 h-16 bg-zinc-950/40 border border-white/[0.04] rounded-2xl text-[11px] font-mono font-black uppercase tracking-widest focus:outline-none focus:border-emerald-500/30 transition-all placeholder:text-zinc-800"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        {transactions.slice(0, 10).map((t) => (
                            <div 
                                key={t.id} 
                                className="bg-[#050505] border border-white/[0.04] rounded-[1.5rem] hover:border-emerald-500/20 hover:bg-zinc-900/10 transition-all group overflow-hidden relative p-6"
                            >
                                <div className="flex items-center gap-6">
                                    <div className={cn(
                                        "w-14 h-14 rounded-xl flex items-center justify-center border transition-all duration-500 group-hover:scale-105 shadow-inner",
                                        t.amount > 0 ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/10' : 'bg-red-500/5 text-red-500 border-red-500/10'
                                    )}>
                                        {getMethodIcon(t.payment_method)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            <p className="text-base font-black text-white truncate uppercase tracking-tight">{t.users?.full_name || 'ANONİM VARLIK'}</p>
                                            <span className="px-2 py-0.5 bg-white/[0.02] border border-white/[0.05] rounded text-[8px] font-mono font-black text-zinc-600 uppercase tracking-widest">{t.gyms?.name}</span>
                                        </div>
                                        <p className="text-[10px] font-mono font-bold text-zinc-600 uppercase tracking-widest">{t.description || 'SİSTEM ABONELİK YENİLEME'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-black text-white tabular-nums font-mono">{formatCurrency(t.amount)}</p>
                                        <p className="text-[9px] font-mono font-black text-zinc-700 uppercase tracking-widest mt-1">TARİH::{new Date(t.payment_date).toLocaleDateString('tr-TR')}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Nodes Sidebar */}
                <div className="space-y-6">
                    <div className="flex items-center gap-4 px-4">
                        <Banknote className="w-5 h-5 text-zinc-700" />
                        <h2 className="text-[11px] font-black text-zinc-600 uppercase tracking-[0.3em]">EN ÇOK KAZANDIRANLAR</h2>
                    </div>
                    <Card className="bg-[#020202] border-white/[0.04] p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                        <div className="space-y-6 relative z-10">
                            {stats.topNodes.length > 0 ? stats.topNodes.map((gym, i) => (
                                <div key={i} className="flex items-center justify-between group cursor-pointer">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs font-mono border border-white/5 group-hover:scale-110 transition-transform",
                                            i === 0 ? "bg-orange-500/10 text-orange-500" : "bg-white/5 text-zinc-500"
                                        )}>
                                            {i + 1}
                                        </div>
                                        <span className="text-sm font-black text-zinc-400 group-hover:text-white transition-colors uppercase tracking-tight">{gym.name}</span>
                                    </div>
                                    <span className="text-sm font-black text-emerald-500 font-mono tabular-nums">{formatCurrency(gym.amount)}</span>
                                </div>
                            )) : (
                                <div className="text-center py-10 opacity-20 italic text-xs uppercase tracking-widest">İşlem verisi yok</div>
                            )}
                        </div>

                        <Button className="w-full mt-10 bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.05] text-zinc-500 hover:text-white text-[10px] font-black uppercase tracking-[0.3em] h-14 rounded-2xl transition-all">
                            TAM HACİM RAPORU
                        </Button>
                    </Card>

                    {/* Quick Insight */}
                    <Card className="bg-emerald-500/[0.02] border-emerald-500/20 p-8 rounded-[2.5rem] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Zap className="w-16 h-16 text-emerald-500" />
                        </div>
                        <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] mb-4">Finansal Zeka</h4>
                        <p className="text-xs text-zinc-500 leading-relaxed font-medium uppercase tracking-tight">
                            Nakit işlemler azalırken, <span className="text-white">API tabanlı ödemeler</span> artış gösteriyor. Dijital salon entegrasyonu başarılı.
                        </p>
                    </Card>
                </div>
            </div>
        </div>
    );
}
