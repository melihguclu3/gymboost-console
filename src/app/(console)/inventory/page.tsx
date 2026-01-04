'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, Button } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import {
    Package,
    AlertTriangle,
    Search,
    Filter,
    ArrowLeft,
    RefreshCcw,
    Building2,
    TrendingDown,
    ChevronRight,
    Tag,
    Database,
    Clock,
    ShoppingCart,
    Archive
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function GlobalInventoryPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [stats, setStats] = useState({
        totalProducts: 0,
        lowStockItems: 0,
        totalStockValue: 0,
        todaySales: 0
    });

    const supabase = createClient();

    const loadInventoryData = useCallback(async () => {
        setLoading(true);
        try {
            // 1. Fetch all products with gym info
            const { data: productData, error } = await supabase
                .from('products')
                .select('*, gyms(name)')
                .order('current_stock', { ascending: true });

            if (error) throw error;

            if (productData) {
                setProducts(productData);
                
                const lowStock = productData.filter(p => p.current_stock <= p.min_stock).length;
                const totalValue = productData.reduce((sum, p) => sum + (p.current_stock * p.sale_price), 0);

                // 2. Fetch today's transactions for sales count
                const today = new Date().toISOString().split('T')[0];
                const { count: salesCount } = await supabase
                    .from('inventory_transactions')
                    .select('*', { count: 'exact', head: true })
                    .eq('transaction_type', 'sale')
                    .gt('created_at', today);

                setStats({
                    totalProducts: productData.length,
                    lowStockItems: lowStock,
                    totalStockValue: totalValue,
                    todaySales: salesCount || 0
                });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    useEffect(() => { loadInventoryData(); }, [loadInventoryData]);

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.gyms?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-12 pb-20 text-left text-white">
            {/* --- SURGICAL UNIFIED HEADER --- */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 border-b border-white/[0.04] pb-12">
                <div className="flex items-start gap-8">
                    <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-[1.5rem] shadow-lg shadow-orange-500/5 relative overflow-hidden group">
                        <Package className="w-10 h-10 text-orange-500 relative z-10 group-hover:scale-110 transition-transform" />
                        <div className="absolute inset-0 bg-orange-500/5 animate-pulse" />
                    </div>
                    <div>
                        <div className="flex items-center gap-4 mb-3">
                            <h1 className="text-4xl font-black text-white tracking-tighter uppercase">
                                ENVANTER <span className="text-orange-500">DENETİMİ</span>
                            </h1>
                            <div className="flex items-center gap-2.5 px-3 py-1 bg-orange-500/5 border border-orange-500/20 rounded-lg">
                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                                <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em]">Küresel Stok Takibi</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-6 text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">
                            <div className="flex items-center gap-2 font-mono">
                                <Database className="w-3.5 h-3.5" /> TOPLAM KALEM: {stats.totalProducts}
                            </div>
                            <div className="flex items-center gap-2 font-mono">
                                <Archive className="w-3.5 h-3.5" /> KRİTİK STOK: {stats.lowStockItems}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button onClick={loadInventoryData} variant="secondary" className="bg-zinc-950 border border-white/10 hover:border-orange-500/40 hover:bg-orange-500/5 rounded-xl h-14 px-8 font-black text-[10px] tracking-[0.3em] uppercase transition-all">
                        <RefreshCcw className={cn("w-4 h-4 mr-3", loading && "animate-spin")} /> YENİLE
                    </Button>
                </div>
            </div>

            {/* --- ANALYTICS BENTO --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                    { label: 'Toplam Ürün', val: stats.totalProducts, sub: 'Tüm Salonlardaki Çeşit', icon: Package, color: 'text-white', bg: 'bg-white/5', border: 'border-white/5' },
                    { label: 'Düşük Stok', val: stats.lowStockItems, sub: 'İkmal Gereken Kalemler', icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-500/5', border: 'border-orange-500/20' },
                    { label: 'Bugünkü Satış', val: stats.todaySales, sub: 'Toplam İşlem Sayısı', icon: ShoppingCart, color: 'text-emerald-500', bg: 'bg-emerald-500/5', border: 'border-emerald-500/20' },
                    { label: 'Stok Değeri', val: `${stats.totalStockValue.toLocaleString()} ₺`, sub: 'Tahmini Brüt Değer', icon: Tag, color: 'text-blue-500', bg: 'bg-blue-500/5', border: 'border-blue-500/20' },
                ].map((s, i) => (
                    <Card key={i} className={cn("p-8 bg-zinc-950/20 border-white/[0.04] relative overflow-hidden group hover:border-orange-500/20 transition-all rounded-[2rem]", s.border)}>
                        <div className="flex items-center justify-between mb-8 relative z-10">
                            <div className={cn("p-3.5 rounded-2xl border transition-all duration-500", s.bg, s.border)}>
                                <s.icon className={cn("w-6 h-6", s.color)} />
                            </div>
                            <div className="flex gap-0.5">
                                {[1,2,3].map(j => <div key={j} className="w-0.5 h-3 bg-zinc-800 group-hover:bg-orange-500/40 transition-colors" />)}
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

            {/* --- INVENTORY LIST --- */}
            <div className="space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-10 border-b border-white/[0.04] pb-10">
                    <div className="flex items-center gap-5">
                        <div className="p-3 bg-zinc-950 border border-white/5 rounded-2xl text-zinc-600">
                            <Search className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tighter uppercase">
                                KÜRESEL STOK VERİTABANI
                            </h2>
                            <p className="text-[10px] font-mono font-black text-zinc-700 uppercase tracking-[0.3em] mt-1">ARAMA SONUCU: {filteredProducts.length} ÜRÜN BULUNDU</p>
                        </div>
                    </div>
                    <div className="relative w-full sm:w-[450px] group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700 group-focus-within:text-orange-500 transition-colors" />
                        <input 
                            placeholder="ÜRÜN ADI VEYA SALON ARA..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-14 pr-6 h-16 bg-zinc-950/40 border border-white/[0.04] rounded-2xl text-[11px] font-mono font-black uppercase tracking-widest focus:outline-none focus:border-orange-500/30 transition-all placeholder:text-zinc-800"
                        />
                    </div>
                </div>

                <div className="grid gap-4">
                    {filteredProducts.map((product) => {
                        const isLowStock = product.current_stock <= product.min_stock;
                        return (
                            <div 
                                key={product.id}
                                className="bg-[#050505] border border-white/[0.04] rounded-[2rem] hover:border-orange-500/20 hover:bg-zinc-900/10 transition-all group overflow-hidden relative p-8"
                            >
                                <div className="flex flex-col lg:flex-row lg:items-center gap-10">
                                    {/* Product Info */}
                                    <div className="flex items-center gap-6 lg:w-[35%] shrink-0">
                                        <div className={cn(
                                            "w-16 h-16 bg-zinc-950 border rounded-[1.2rem] flex items-center justify-center transition-all shadow-inner",
                                            isLowStock ? "border-orange-500/30 text-orange-500" : "border-white/5 text-zinc-700 group-hover:text-white"
                                        )}>
                                            <Package className="w-8 h-8" />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-lg font-black text-white truncate uppercase tracking-tight group-hover:text-orange-400 transition-colors">{product.name}</h3>
                                            <div className="flex items-center gap-3 mt-1.5">
                                                <span className="px-2 py-0.5 bg-white/[0.02] border border-white/[0.05] rounded text-[8px] font-mono font-black text-zinc-600 uppercase tracking-widest">
                                                    {product.category || 'GENEL'}
                                                </span>
                                                <span className="flex items-center gap-1 text-[10px] font-black text-zinc-500 uppercase">
                                                    <Building2 className="w-3 h-3" /> {product.gyms?.name}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stock Levels */}
                                    <div className="grid grid-cols-2 lg:flex-1 gap-12 border-x border-white/[0.04] px-12">
                                        <div className="space-y-2">
                                            <p className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.2em]">Mevcut Stok</p>
                                            <div className="flex items-center gap-3">
                                                <p className={cn(
                                                    "text-2xl font-black tabular-nums font-mono",
                                                    isLowStock ? "text-orange-500" : "text-white"
                                                )}>{product.current_stock}</p>
                                                <span className="text-[10px] font-bold text-zinc-600 uppercase">{product.unit || 'ADET'}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.2em]">Kritik Eşik</p>
                                            <p className="text-lg font-black text-zinc-400 tabular-nums font-mono">{product.min_stock}</p>
                                        </div>
                                    </div>

                                    {/* Price & Action */}
                                    <div className="flex items-center justify-end gap-10 lg:w-[20%] shrink-0">
                                        <div className="text-right">
                                            <p className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.2em] mb-1.5">Satış Fiyatı</p>
                                            <p className="text-xl font-black text-emerald-500 tabular-nums font-mono">{product.sale_price} ₺</p>
                                        </div>
                                        <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-white/[0.02] border border-white/[0.05] text-zinc-700 group-hover:text-white group-hover:bg-orange-500 transition-all shadow-lg group-hover:shadow-orange-500/20">
                                            <ChevronRight className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>
                                {isLowStock && (
                                    <div className="absolute top-0 right-0">
                                        <div className="bg-orange-500 text-black text-[8px] font-black px-3 py-1 uppercase tracking-widest rounded-bl-xl shadow-lg">
                                            Kritik Seviye
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
