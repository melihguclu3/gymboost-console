'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, Button } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { GymSelector } from '@/components/GymSelector';
import { useDialog } from '@/context/DialogContext';
import {
    Package,
    Search,
    Plus,
    AlertTriangle,
    Tag,
    Edit2,
    Trash2,
    X,
    Save
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

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

const CATEGORIES = [
    'Supplement',
    'Giyim',
    'Aksesuar',
    'Ekipman',
    'Yiyecek/İçecek',
    'Diğer'
];

export default function InventoryPage() {
    const { showDanger } = useDialog();
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState<Product[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGymId, setSelectedGymId] = useState<string | null>(null);
    const [stats, setStats] = useState({
        totalItems: 0,
        lowStock: 0,
        outOfStock: 0,
        totalValue: 0
    });

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        name: '',
        description: '',
        category: 'Supplement',
        stock: 0,
        price: 0
    });

    const supabase = createClient();

    const loadInventory = useCallback(async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('products')
                .select('*, gyms(name)')
                .eq('status', 'active')
                .order('created_at', { ascending: false });

            if (selectedGymId) {
                query = query.eq('gym_id', selectedGymId);
            }

            const { data } = await query;

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
            toast.error('Envanter yüklenemedi');
        } finally {
            setLoading(false);
        }
    }, [supabase, selectedGymId]);

    useEffect(() => {
        loadInventory();
    }, [loadInventory]);

    const handleOpenModal = (product?: Product) => {
        if (product) {
            setEditingProduct(product);
            setForm({
                name: product.name,
                description: product.description || '',
                category: product.category || 'Supplement',
                stock: product.stock,
                price: product.price
            });
        } else {
            setEditingProduct(null);
            setForm({
                name: '',
                description: '',
                category: 'Supplement',
                stock: 0,
                price: 0
            });
        }
        setShowModal(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name) return toast.error('Ürün adı zorunludur');

        setSaving(true);
        try {
            if (editingProduct) {
                const { error } = await supabase
                    .from('products')
                    .update({
                        name: form.name,
                        description: form.description,
                        category: form.category,
                        stock: form.stock,
                        price: form.price
                    })
                    .eq('id', editingProduct.id);

                if (error) throw error;
                toast.success('Ürün güncellendi');
            } else {
                if (!selectedGymId) {
                    toast.error('Lütfen önce bir salon seçin');
                    setSaving(false);
                    return;
                }

                const { error } = await supabase
                    .from('products')
                    .insert({
                        gym_id: selectedGymId,
                        name: form.name,
                        description: form.description,
                        category: form.category,
                        stock: form.stock,
                        price: form.price,
                        status: 'active'
                    });

                if (error) throw error;
                toast.success('Ürün eklendi');
            }

            setShowModal(false);
            loadInventory();
        } catch (error: any) {
            toast.error(error.message || 'Bir hata oluştu');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (product: Product) => {
        showDanger(
            'Ürün Silinsin mi?',
            `"${product.name}" ürünü kalıcı olarak silinecek.`,
            async () => {
                const { error } = await supabase
                    .from('products')
                    .update({ status: 'archived' })
                    .eq('id', product.id);

                if (error) {
                    toast.error(error.message);
                } else {
                    toast.success('Ürün silindi');
                    loadInventory();
                }
            }
        );
    };

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
                        {selectedGymId ? 'Salon bazlı' : 'Tüm salonların'} stok ve ürün takibi
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <GymSelector
                        value={selectedGymId}
                        onChange={setSelectedGymId}
                        showAllOption={true}
                        allLabel="Tüm Salonlar"
                    />
                    {selectedGymId && (
                        <Button
                            onClick={() => handleOpenModal()}
                            variant="primary"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Yeni Ürün
                        </Button>
                    )}
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
                                {!selectedGymId && <th className="px-6 py-3 font-medium">Salon</th>}
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
                                    {!selectedGymId && (
                                        <td className="px-6 py-4 text-zinc-300 text-xs">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                {product.gyms?.name || 'Genel'}
                                            </div>
                                        </td>
                                    )}
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
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleOpenModal(product)}
                                                className="h-8 w-8 text-zinc-400 hover:text-blue-500"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(product)}
                                                className="h-8 w-8 text-zinc-400 hover:text-red-500"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={selectedGymId ? 5 : 6} className="px-6 py-12 text-center text-zinc-500">
                                        <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        {selectedGymId ? 'Bu salonda ürün bulunamadı.' : 'Envanter kaydı bulunamadı.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowModal(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="w-full max-w-lg bg-zinc-800 border border-zinc-700 rounded-2xl p-6 relative z-10 shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-600 rounded-lg">
                                        {editingProduct ? <Edit2 className="w-5 h-5 text-white" /> : <Plus className="w-5 h-5 text-white" />}
                                    </div>
                                    <h2 className="text-lg font-bold text-zinc-100">
                                        {editingProduct ? 'Ürün Düzenle' : 'Yeni Ürün'}
                                    </h2>
                                </div>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="p-1 text-zinc-400 hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSave} className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-zinc-300 mb-2 block">Ürün Adı</label>
                                    <input
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        placeholder="Örn: Protein Tozu 1kg"
                                        className="w-full h-11 bg-zinc-900 border border-zinc-700 rounded-lg px-4 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-zinc-300 mb-2 block">Açıklama</label>
                                    <textarea
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        placeholder="Ürün açıklaması (opsiyonel)"
                                        rows={2}
                                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-zinc-300 mb-2 block">Kategori</label>
                                    <select
                                        value={form.category}
                                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                                        className="w-full h-11 bg-zinc-900 border border-zinc-700 rounded-lg px-4 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                                    >
                                        {CATEGORIES.map((cat) => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-zinc-300 mb-2 block">Stok Adedi</label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={form.stock}
                                            onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || 0 })}
                                            className="w-full h-11 bg-zinc-900 border border-zinc-700 rounded-lg px-4 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-zinc-300 mb-2 block">Satış Fiyatı (₺)</label>
                                        <input
                                            type="number"
                                            min={0}
                                            step={0.01}
                                            value={form.price}
                                            onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                                            className="w-full h-11 bg-zinc-900 border border-zinc-700 rounded-lg px-4 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    isLoading={saving}
                                    variant="primary"
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-2"
                                >
                                    <Save className="w-4 h-4 mr-2" />
                                    {editingProduct ? 'Güncelle' : 'Ürün Ekle'}
                                </Button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
