'use client';

import { useEffect, useState } from 'react';
import { Card, Button } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import {
    DollarSign,
    TrendingUp,
    CreditCard,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Wallet,
    Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function RevenuePage() {
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        monthlyRevenue: 0,
        lastMonthRevenue: 0,
        growth: 0,
        averageOrder: 0
    });

    const supabase = createClient();

    useEffect(() => {
        loadData();
    }, []);

    const [chartData, setChartData] = useState<{ month: string; amount: number; height: number }[]>([]);

    async function loadData() {
        setLoading(true);
        try {
            // Fetch all completed payments with basic info
            const { data, error } = await supabase
                .from('payments')
                .select('*, gyms(name), users(full_name)')
                .eq('status', 'completed')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                setTransactions(data);

                // --- STATS CALCULATION ---
                const now = new Date();
                const currentMonth = now.getMonth();
                const currentYear = now.getFullYear();

                // Last Month logic: Handle flow from Jan to Dec of prev year
                const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const lastMonth = lastMonthDate.getMonth();
                const lastMonthYear = lastMonthDate.getFullYear();

                const total = data.reduce((sum, t) => sum + (t.amount || 0), 0);

                const thisMonthTotal = data
                    .filter(t => {
                        const d = new Date(t.created_at);
                        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
                    })
                    .reduce((sum, t) => sum + (t.amount || 0), 0);

                const lastMonthTotal = data
                    .filter(t => {
                        const d = new Date(t.created_at);
                        return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
                    })
                    .reduce((sum, t) => sum + (t.amount || 0), 0);

                const growth = lastMonthTotal > 0
                    ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
                    : (thisMonthTotal > 0 ? 100 : 0);

                setStats({
                    totalRevenue: total,
                    monthlyRevenue: thisMonthTotal,
                    lastMonthRevenue: lastMonthTotal,
                    growth: growth,
                    averageOrder: data.length > 0 ? total / data.length : 0
                });

                // --- CHART DATA CALCULATION (Last 12 Months) ---
                const last12Months = [];
                let maxAmount = 0;

                for (let i = 11; i >= 0; i--) {
                    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    const monthName = d.toLocaleString('tr-TR', { month: 'short' });
                    const monthIndex = d.getMonth();
                    const year = d.getFullYear();

                    const monthlySum = data
                        .filter(t => {
                            const tDate = new Date(t.created_at);
                            return tDate.getMonth() === monthIndex && tDate.getFullYear() === year;
                        })
                        .reduce((sum, t) => sum + (t.amount || 0), 0);

                    if (monthlySum > maxAmount) maxAmount = monthlySum;

                    last12Months.push({
                        month: monthName,
                        amount: monthlySum,
                        height: 0 // Will calculate after finding max
                    });
                }

                // Normalize heights (0-100%)
                const finalChartData = last12Months.map(item => ({
                    ...item,
                    height: maxAmount > 0 ? Math.round((item.amount / maxAmount) * 100) : 0
                }));

                setChartData(finalChartData);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }


    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="w-8 h-8 border-2 border-zinc-600 border-t-emerald-600 rounded-full animate-spin" />
                <p className="text-xs font-medium text-zinc-500">Finansal Veriler Hesaplanıyor...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100">
                        Gelir Yönetimi
                    </h1>
                    <p className="text-sm text-zinc-300 mt-1">
                        Tüm salonların finansal özeti
                    </p>
                </div>
                <Button variant="secondary" className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100">
                    <Download className="w-4 h-4 mr-2" />
                    Raporu İndir
                </Button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-6 bg-zinc-800/50 border-zinc-700/50 relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-zinc-300">Toplam Gelir</h3>
                            <div className="p-2 bg-emerald-600/10 text-emerald-500 rounded-lg">
                                <DollarSign className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-zinc-100">{stats.totalRevenue.toLocaleString('tr-TR')} ₺</p>
                        <p className="text-xs text-zinc-400 mt-1">Tüm zamanlar</p>
                    </div>
                    <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-600/5 rounded-full blur-2xl" />
                </Card>

                <Card className="p-6 bg-zinc-800/50 border-zinc-700/50 relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-zinc-300">Bu Ay</h3>
                            <div className={cn(
                                "p-2 rounded-lg",
                                stats.growth >= 0 ? "bg-emerald-600/10 text-emerald-500" : "bg-red-600/10 text-red-500"
                            )}>
                                <TrendingUp className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-zinc-100">{stats.monthlyRevenue.toLocaleString('tr-TR')} ₺</p>
                        <div className="flex items-center gap-1 mt-1">
                            {stats.growth >= 0 ? (
                                <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                            ) : (
                                <ArrowDownRight className="w-3 h-3 text-red-500" />
                            )}
                            <span className={cn(
                                "text-xs font-medium",
                                stats.growth >= 0 ? "text-emerald-500" : "text-red-500"
                            )}>
                                %{Math.abs(stats.growth).toFixed(1)}
                            </span>
                            <span className="text-xs text-zinc-400 ml-1">geçen aya göre</span>
                        </div>
                    </div>
                </Card>

                <Card className="p-6 bg-zinc-800/50 border-zinc-700/50">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-zinc-300">Ortalama İşlem</h3>
                        <div className="p-2 bg-blue-600/10 text-blue-500 rounded-lg">
                            <CreditCard className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-zinc-100">{Math.round(stats.averageOrder).toLocaleString('tr-TR')} ₺</p>
                    <p className="text-xs text-zinc-400 mt-1">İşlem başına</p>
                </Card>

                <Card className="p-6 bg-zinc-800/50 border-zinc-700/50">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-zinc-300">Tahmini Yıllık</h3>
                        <div className="p-2 bg-purple-600/10 text-purple-500 rounded-lg">
                            <Wallet className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-zinc-100">{(stats.monthlyRevenue * 12).toLocaleString('tr-TR')} ₺</p>
                    <p className="text-xs text-zinc-400 mt-1">Mevcut trende göre</p>
                </Card>
            </div>

            {/* Visual Chart Placeholder */}
            <Card className="p-6 bg-zinc-800/50 border-zinc-700/50">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="font-semibold text-zinc-100">Gelir Akışı</h3>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            Abonelikler
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-zinc-400 ml-3">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            Tekil Satış
                        </div>
                    </div>
                </div>
                <div className="h-64 flex items-end gap-2 sm:gap-4 px-2">
                    {chartData.length > 0 ? chartData.map((item, i) => (
                        <div key={i} className="flex-1 group relative h-full flex flex-col justify-end gap-2">
                            {/* Tooltip */}
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-zinc-900 border border-zinc-700 px-2 py-1 rounded text-xs text-zinc-100 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none">
                                {item.amount.toLocaleString('tr-TR')} ₺
                            </div>

                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${item.height}%` }}
                                className="w-full bg-blue-600 rounded-t-sm group-hover:bg-blue-500 transition-colors relative min-h-[4px]"
                            >
                                {item.height > 0 && (
                                    <div className="absolute top-0 left-0 w-full h-1 bg-white/20" />
                                )}
                            </motion.div>

                            <span className="text-[10px] sm:text-xs text-zinc-400 text-center truncate w-full block">
                                {item.month}
                            </span>
                        </div>
                    )) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-500 text-sm">
                            Görüntülenecek veri yok
                        </div>
                    )}
                </div>
            </Card>

            {/* Transaction List */}
            <div className="space-y-4">
                <h2 className="text-lg font-bold text-zinc-100">Son İşlemler</h2>
                <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-zinc-900/50 text-zinc-400 border-b border-zinc-700/50">
                            <tr>
                                <th className="px-6 py-3 font-medium">İşlem ID</th>
                                <th className="px-6 py-3 font-medium">Kullanıcı</th>
                                <th className="px-6 py-3 font-medium">Salon</th>
                                <th className="px-6 py-3 font-medium">Tarih</th>
                                <th className="px-6 py-3 font-medium text-right">Tutar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-700/50">
                            {transactions.length > 0 ? transactions.map((t) => (
                                <tr key={t.id} className="hover:bg-zinc-700/10 transition-colors">
                                    <td className="px-6 py-4 text-zinc-500 font-mono text-xs">
                                        #{t.id.slice(0, 8)}
                                    </td>
                                    <td className="px-6 py-4 text-zinc-200 font-medium">
                                        {t.users?.full_name || 'Misafir'}
                                    </td>
                                    <td className="px-6 py-4 text-zinc-400 text-xs">
                                        {t.gyms?.name || 'Bilinmiyor'}
                                    </td>
                                    <td className="px-6 py-4 text-zinc-400 text-xs">
                                        {format(new Date(t.created_at), 'dd MMM yyyy, HH:mm', { locale: tr })}
                                    </td>
                                    <td className="px-6 py-4 text-right font-medium text-emerald-500 font-mono">
                                        +{t.amount?.toLocaleString('tr-TR')} ₺
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                                        Henüz işlem kaydı bulunmuyor.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
