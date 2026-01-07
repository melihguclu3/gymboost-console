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

    async function loadData() {
        setLoading(true);
        try {
            // Fetch all completed payments
            const { data, error } = await supabase
                .from('payments')
                .select('*, gyms(name), users(full_name)')
                .eq('status', 'completed')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                setTransactions(data);

                // Calculate Stats
                const now = new Date();
                const currentMonth = now.getMonth();
                const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;

                const total = data.reduce((sum, t) => sum + (t.amount || 0), 0);

                const thisMonthTotal = data
                    .filter(t => new Date(t.created_at).getMonth() === currentMonth)
                    .reduce((sum, t) => sum + (t.amount || 0), 0);

                const lastMonthTotal = data
                    .filter(t => new Date(t.created_at).getMonth() === lastMonth)
                    .reduce((sum, t) => sum + (t.amount || 0), 0);

                const growth = lastMonthTotal > 0
                    ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
                    : 100;

                setStats({
                    totalRevenue: total,
                    monthlyRevenue: thisMonthTotal,
                    lastMonthRevenue: lastMonthTotal,
                    growth: growth,
                    averageOrder: data.length > 0 ? total / data.length : 0
                });
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
                    <p className="text-sm text-zinc-400 mt-1">
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
                            <h3 className="text-sm font-medium text-zinc-400">Toplam Gelir</h3>
                            <div className="p-2 bg-emerald-600/10 text-emerald-500 rounded-lg">
                                <DollarSign className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-zinc-100">{stats.totalRevenue.toLocaleString('tr-TR')} ₺</p>
                        <p className="text-xs text-zinc-500 mt-1">Tüm zamanlar</p>
                    </div>
                    <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-600/5 rounded-full blur-2xl" />
                </Card>

                <Card className="p-6 bg-zinc-800/50 border-zinc-700/50 relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-zinc-400">Bu Ay</h3>
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
                            <span className="text-xs text-zinc-500 ml-1">geçen aya göre</span>
                        </div>
                    </div>
                </Card>

                <Card className="p-6 bg-zinc-800/50 border-zinc-700/50">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-zinc-400">Ortalama İşlem</h3>
                        <div className="p-2 bg-blue-600/10 text-blue-500 rounded-lg">
                            <CreditCard className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-zinc-100">{Math.round(stats.averageOrder).toLocaleString('tr-TR')} ₺</p>
                    <p className="text-xs text-zinc-500 mt-1">İşlem başına</p>
                </Card>

                <Card className="p-6 bg-zinc-800/50 border-zinc-700/50">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-zinc-400">Tahmini Yıllık</h3>
                        <div className="p-2 bg-purple-600/10 text-purple-500 rounded-lg">
                            <Wallet className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-zinc-100">{(stats.monthlyRevenue * 12).toLocaleString('tr-TR')} ₺</p>
                    <p className="text-xs text-zinc-500 mt-1">Mevcut trende göre</p>
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
                <div className="h-64 flex items-end gap-3 px-2">
                    {[45, 60, 55, 70, 65, 80, 75, 90, 85, 95, 80, 100].map((h, i) => (
                        <div key={i} className="flex-1 group relative h-full flex flex-col justify-end gap-1">
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${h * 0.3}%` }}
                                className="w-full bg-blue-600/30 rounded-t-sm"
                            />
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${h * 0.7}%` }}
                                className="w-full bg-emerald-600 rounded-t-sm group-hover:bg-emerald-500 transition-colors"
                            />
                        </div>
                    ))}
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
