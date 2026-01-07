'use client';

import { useEffect, useState } from 'react';
import { Card, Button, Input } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import {
    Package,
    Search,
    Plus,
    Filter,
    AlertTriangle,
    Tag,
    Edit2,
    Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Product {
    id: string;
    gym_id: string;
    name: string;
    description?: string;
    category: string;
    stock: number;
    price: number;
    status: 'active' | 'archived';
    gyms?: { name: string };
}

export default function InventoryPage() {
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState<Product[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [stats, setStats] = useState({
        totalItems: 0,
        lowStock: 0,
        outOfStock: 0,
        totalValue: 0
    });

    const supabase = createClient();

    useEffect(() => {
        loadInventory();
    }, []);

    async function loadInventory() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*, gyms(name)')
                .order('created_at', { ascending: false });

            if (data) {
                setProducts(data as Product[]);

                // Calculate Stats
                setStats({
                    totalItems: data.length,
                    lowStock: data.filter((p: any) => p.stock > 0 && p.stock < 10).length,
                    outOfStock: data.filter((p: any) => p.stock === 0).length,
                    totalValue: data.reduce((sum, p: any) => sum + (p.price * p.stock), 0)
                });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.gyms?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-8 h-8 border-2 border-zinc-600 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-xs font-medium text-zinc-500">Envanter Yükleniyor...</p>
        </div>
    );

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100">
                        Envanter Yönetimi
                    </h1>
                    <p className="text-sm text-zinc-300 mt-1">
                        Küresel stok ve ürün takibi
                    </p>
                </div>
                <div></div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4 bg-zinc-800/50 border-zinc-700/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600/10 text-blue-500 rounded-lg">
                            <Package className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-zinc-300">Toplam Ürün</p>
                            <p className="text-xl font-bold text-zinc-100">{stats.totalItems}</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-4 bg-zinc-800/50 border-zinc-700/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-600/10 text-orange-500 rounded-lg">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-zinc-300">Kritik Stok</p>
                            <p className="text-xl font-bold text-zinc-100">{stats.lowStock}</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-4 bg-zinc-800/50 border-zinc-700/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-600/10 text-red-500 rounded-lg">
                            <Tag className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-zinc-300">Stok Yok</p>
                            <p className="text-xl font-bold text-zinc-100">{stats.outOfStock}</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-4 bg-zinc-800/50 border-zinc-700/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-600/10 text-emerald-500 rounded-lg">
                            <Tag className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-zinc-300">Envanter Değeri</p>
                            <p className="text-xl font-bold text-zinc-100">{stats.totalValue.toLocaleString('tr-TR')} ₺</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Table */}
            <div className="space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                        placeholder="Ürün adı, kategori veya salon ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                </div>

                <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-zinc-900/50 text-zinc-400 border-b border-zinc-700/50">
                            <tr>
                                <th className="px-6 py-3 font-medium">Ürün Adı</th>
                                <th className="px-6 py-3 font-medium">Salon</th>
                                <th className="px-6 py-3 font-medium">Kategori</th>
                                <th className="px-6 py-3 font-medium">Stok</th>
                                <th className="px-6 py-3 font-medium">Fiyat</th>
                                <th className="px-6 py-3 font-medium w-32">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-700/50">
                            {filteredProducts.length > 0 ? filteredProducts.map((product) => (
                                <tr key={product.id} className="hover:bg-zinc-700/10 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-zinc-200">{product.name}</div>
                                        {product.description && (
                                            <div className="text-xs text-zinc-400 truncate max-w-[200px]">{product.description}</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-zinc-300 text-xs">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                            {product.gyms?.name || 'Genel'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 rounded-md bg-zinc-700/50 text-zinc-300 text-xs border border-zinc-700">
                                            {product.category || 'Genel'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={cn(
                                            "px-2 py-1 rounded text-xs font-medium",
                                            product.stock === 0 ? "bg-red-500/10 text-red-500" :
                                                product.stock < 10 ? "bg-orange-500/10 text-orange-500" :
                                                    "bg-emerald-500/10 text-emerald-500"
                                        )}>
                                            {product.stock} Adet
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-zinc-300">
                                        {(product.price || 0).toLocaleString('tr-TR')} ₺
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-blue-500">
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-red-500">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                                        <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        Envanter kaydı bulunamadı.
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
