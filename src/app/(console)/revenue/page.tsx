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
        monthlyGrowth: 12.5,
        pendingPayments: 0,
        gymCount: 0
    });

    const supabase = createClient();

    useEffect(() => {
        loadFinancialData();
    }, []);

    async function loadFinancialData() {
        setLoading(true);
        try {
            // Tüm ödemeleri çek
            const { data, error } = await supabase
                .from('payments')
                .select(`
                    id,
                    amount,
                    payment_method,
                    payment_date,
                    status,
                    description,
                    gyms (name),
                    users (full_name)
                `)
                .order('payment_date', { ascending: false });

            if (error) throw error;

            if (data) {
                setTransactions(data as any);
                const total = data.reduce((sum, p) => sum + (p.amount || 0), 0);
                
                // Salon sayısını bul
                const uniqueGyms = new Set(data.map(p => (p as any).gyms?.name)).size;

                setStats({
                    totalRevenue: total,
                    monthlyGrowth: 12.5, // Simüle
                    pendingPayments: data.filter(p => p.status === 'pending').length,
                    gymCount: uniqueGyms
                });
            }
        } catch (err) {
            console.error('Finansal veri hatası:', err);
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
        <div className="space-y-8 text-left text-white">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-xl shadow-emerald-500/20">
                            <TrendingUp className="w-8 h-8 text-white" />
                        </div>
                        Finansal Kontrol Merkezi
                    </h1>
                    <p className="text-zinc-400 mt-1 font-medium ml-14">Tüm ağın gelir akışı ve ödeme raporları</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" className="bg-zinc-900 border-white/5 rounded-xl font-bold h-12">
                        <Download className="w-4 h-4 mr-2" /> Excel İndir
                    </Button>
                </div>
            </div>

            {/* Financial Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-6 bg-zinc-950/50 border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <DollarSign className="w-16 h-16 text-emerald-500" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-1">Toplam Brüt Gelir</p>
                        <h3 className="text-3xl font-black text-white tracking-tighter">{formatCurrency(stats.totalRevenue)}</h3>
                        <div className="flex items-center gap-1 mt-2 text-emerald-500 text-[10px] font-bold uppercase">
                            <ArrowUpRight className="w-3 h-3" /> %{stats.monthlyGrowth} Büyüme
                        </div>
                    </div>
                </Card>

                <Card className="p-6 bg-zinc-950/50 border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Building2 className="w-16 h-16 text-blue-500" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-1">Aktif Salon Sayısı</p>
                        <h3 className="text-3xl font-black text-white tracking-tighter">{stats.gymCount}</h3>
                        <div className="flex items-center gap-1 mt-2 text-zinc-500 text-[10px] font-bold uppercase">
                            Ödeme Yapan İşletmeler
                        </div>
                    </div>
                </Card>

                <Card className="p-6 bg-zinc-950/50 border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Clock className="w-16 h-16 text-amber-500" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-1">Tahsilat Bekleyen</p>
                        <h3 className="text-3xl font-black text-white tracking-tighter">{stats.pendingPayments}</h3>
                        <div className="flex items-center gap-1 mt-2 text-amber-500 text-[10px] font-bold uppercase">
                            Onay Bekleyen İşlemler
                        </div>
                    </div>
                </Card>

                <Card className="p-6 bg-zinc-950/50 border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Zap className="w-16 h-16 text-orange-500" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-1">Ortalama İşlem</p>
                        <h3 className="text-3xl font-black text-white tracking-tighter">
                            {formatCurrency(stats.totalRevenue / (transactions.length || 1))}
                        </h3>
                        <div className="flex items-center gap-1 mt-2 text-zinc-500 text-[10px] font-bold uppercase">
                            İşlem Başına Gelir
                        </div>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Transaction List */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white tracking-tight">Son Global İşlemler</h2>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <Input placeholder="İşlem ara..." className="pl-10 h-10 bg-zinc-900 border-white/5 text-xs" />
                        </div>
                    </div>

                    <div className="space-y-3">
                        {transactions.slice(0, 10).map((t) => (
                            <Card key={t.id} padding="none" className="bg-zinc-900/20 border-white/5 hover:border-emerald-500/20 transition-all group">
                                <div className="flex items-center p-4 gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border border-white/5 shrink-0 ${t.amount > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                        {getMethodIcon(t.payment_method)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-bold text-white truncate">{t.users?.full_name || 'İsimsiz Üye'}</p>
                                            <span className="px-1.5 py-0.5 bg-white/5 rounded text-[8px] font-black text-zinc-500 uppercase">{t.gyms?.name}</span>
                                        </div>
                                        <p className="text-[10px] text-zinc-500 mt-0.5">{t.description || 'Üyelik Ödemesi'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-white">{formatCurrency(t.amount)}</p>
                                        <p className="text-[9px] text-zinc-600 font-bold uppercase">{new Date(t.payment_date).toLocaleDateString('tr-TR')}</p>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Top Gyms Sidebar */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-white tracking-tight">En Çok Kazandıranlar</h2>
                    <Card className="bg-zinc-950 border-white/5 p-6">
                        <div className="space-y-6">
                            {/* Bu kısım normalde grup edilerek hesaplanmalı, şimdilik örnek */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500 font-black text-xs">1</div>
                                    <span className="text-sm font-bold text-white">Elite Fitness</span>
                                </div>
                                <span className="text-sm font-black text-emerald-500">12.450 ₺</span>
                            </div>
                            <div className="flex items-center justify-between opacity-80">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-zinc-500 font-black text-xs">2</div>
                                    <span className="text-sm font-bold text-white">Gold Gym</span>
                                </div>
                                <span className="text-sm font-black text-emerald-500">9.800 ₺</span>
                            </div>
                            <div className="flex items-center justify-between opacity-60">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-zinc-500 font-black text-xs">3</div>
                                    <span className="text-sm font-bold text-white">Power Zone</span>
                                </div>
                                <span className="text-sm font-black text-emerald-500">7.200 ₺</span>
                            </div>
                        </div>

                        <Button className="w-full mt-8 bg-zinc-900 border border-white/5 hover:bg-white/5 text-zinc-400 font-bold text-xs h-11 rounded-xl">
                            Tüm Listeyi Gör
                        </Button>
                    </Card>

                    {/* Quick Insight */}
                    <Card className="bg-gradient-to-br from-emerald-600/20 to-transparent border-emerald-500/20 p-6">
                        <h4 className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-2">Finansal Özet</h4>
                        <p className="text-sm text-zinc-300 leading-relaxed font-medium">
                            Bu ay nakit ödemeler geçen aya göre %15 azaldı, kredi kartı kullanımı ise %22 arttı. Dijitalleşme hızlanıyor.
                        </p>
                    </Card>
                </div>
            </div>
        </div>
    );
}
