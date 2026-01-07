'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { useDialog } from '@/context/DialogContext';
import {
    Building2,
    Search,
    Plus,
    Edit2,
    Trash2,
    ChevronRight,
    X,
    Copy,
    RotateCcw,
    Settings,
    Link as LinkIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function SuperAdminGyms() {
    const { showConfirm, showDanger } = useDialog();
    const router = useRouter();
    const [gyms, setGyms] = useState<any[]>([]);
    const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showArchived, setShowArchived] = useState(false);

    const [showModal, setShowModal] = useState(false);
    const [showInviteSuccess, setShowInviteSuccess] = useState(false);
    const [generatedLink, setGeneratedLink] = useState('');
    const [editingGym, setEditingGym] = useState<any>(null);
    const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', status: 'active', notificationEmail: '' });
    const [actionLoading, setActionLoading] = useState(false);

    const supabase = createClient();

    const loadGyms = useCallback(async () => {
        setLoading(true);
        const { data } = await supabase.from('gyms').select('*').order('created_at', { ascending: false });
        if (data) {
            setGyms(data);
            loadMemberCounts(data.map(gym => gym.id));
        }
        setLoading(false);
    }, [supabase]);

    useEffect(() => { loadGyms(); }, [loadGyms]);

    async function loadMemberCounts(gymIds: string[]) {
        if (gymIds.length === 0) return;
        const { data } = await supabase.from('users').select('gym_id').eq('role', 'member').in('gym_id', gymIds);
        if (!data) return;
        const counts: Record<string, number> = {};
        for (const row of data) { if (row.gym_id) counts[row.gym_id] = (counts[row.gym_id] || 0) + 1; }
        setMemberCounts(counts);
    }

    const filteredGyms = gyms.filter(gym => {
        const isArchived = gym.settings?.status === 'archived';
        if (showArchived ? !isArchived : isArchived) return false;
        return (
            gym.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            gym.email?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    });

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name) return toast.error('Salon adı zorunludur.');

        setActionLoading(true);
        try {
            if (editingGym) {
                const { error } = await supabase.from('gyms').update({
                    name: form.name,
                    email: form.email,
                    phone: form.phone,
                    address: form.address,
                    settings: {
                        ...editingGym.settings,
                        status: form.status,
                        notification_email: form.notificationEmail
                    }
                }).eq('id', editingGym.id);
                if (error) throw error;
                toast.success('Salon güncellendi.');
                setShowModal(false);
            } else {
                const activationToken = Math.random().toString(36).substring(2, 10).toUpperCase();
                const { data: gymData, error: gymError } = await supabase.from('gyms').insert({
                    name: form.name,
                    settings: {
                        status: 'pending_activation',
                        activation_token: activationToken,
                        is_activated: false,
                        notification_email: form.notificationEmail
                    }
                }).select().single();
                if (gymError) throw gymError;
                const link = `${window.location.origin}/activate-salon?token=${activationToken}`;
                setGeneratedLink(link);
                setShowModal(false);
                setShowInviteSuccess(true);
            }
            loadGyms();
        } catch (error: any) {
            toast.error(error.message);
        } finally { setActionLoading(false); }
    };

    const handleArchive = (gym: any) => {
        showDanger('Salon Arşivlensin mi?', `"${gym.name}" salonu arşive alınacak. Bu işlem işletme sahibinin erişimini durdurur.`, async () => {
            const { error } = await supabase.from('gyms').update({
                settings: { ...gym.settings, status: 'archived', is_activated: false, archived_at: new Date().toISOString() }
            }).eq('id', gym.id);
            if (error) toast.error(error.message);
            else { toast.success('Salon arşivlendi.'); loadGyms(); }
        });
    };

    const handleRestore = (gym: any) => {
        showConfirm('Geri Yükle', `"${gym.name}" tekrar aktif edilsin mi?`, async () => {
            const { error } = await supabase.from('gyms').update({
                settings: { ...gym.settings, status: 'active', is_activated: true, archived_at: null }
            }).eq('id', gym.id);
            if (error) toast.error(error.message);
            else { toast.success('Salon geri yüklendi.'); loadGyms(); }
        });
    };

    const copyInviteLink = () => {
        navigator.clipboard.writeText(generatedLink);
        toast.success('Davetiye linki kopyalandı.');
    };

    if (loading && gyms.length === 0) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-8 h-8 border-2 border-zinc-600 border-t-blue-600 rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100">
                        Salonlar
                    </h1>
                    <p className="text-sm text-zinc-400 mt-1">
                        Toplam {gyms.length} salon
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button
                        onClick={() => setShowArchived(!showArchived)}
                        variant="secondary"
                        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100"
                    >
                        {showArchived ? 'Aktifleri Göster' : 'Arşivi Göster'}
                    </Button>
                    <Button
                        onClick={() => { setEditingGym(null); setForm({ name: '', email: '', phone: '', address: '', status: 'active', notificationEmail: '' }); setShowModal(true); }}
                        variant="primary"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Yeni Salon
                    </Button>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                    placeholder="Salon ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
            </div>

            {/* List */}
            <div className="space-y-3">
                {filteredGyms.map((gym) => {
                    const isArchived = gym.settings?.status === 'archived';
                    return (
                        <Card key={gym.id} className="p-4 bg-zinc-800/50 border-zinc-700/50 hover:border-blue-600 hover:bg-zinc-800 transition-all">
                            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                                <div
                                    onClick={() => router.push(`/gyms/${gym.id}`)}
                                    className="flex items-center gap-3 lg:flex-1 cursor-pointer"
                                >
                                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
                                        <Building2 className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-semibold text-zinc-100 truncate">
                                            {gym.name}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={cn(
                                                "text-xs px-2 py-0.5 rounded font-medium",
                                                isArchived ? 'bg-red-600 text-white' :
                                                    gym.settings?.is_activated ? 'bg-green-600 text-white' : 'bg-orange-600 text-white'
                                            )}>
                                                {isArchived ? 'Arşivlendi' : gym.settings?.is_activated ? 'Aktif' : 'Beklemede'}
                                            </span>
                                            <span className="text-xs text-zinc-400">
                                                {memberCounts[gym.id] ?? 0} üye
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="secondary"
                                        size="icon"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingGym(gym);
                                            setForm({
                                                name: gym.name,
                                                email: gym.email || '',
                                                phone: gym.phone || '',
                                                address: gym.address || '',
                                                status: gym.settings?.status || 'active',
                                                notificationEmail: gym.settings?.notification_email || ''
                                            });
                                            setShowModal(true);
                                        }}
                                        className="bg-zinc-700 hover:bg-zinc-600 text-zinc-100"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </Button>

                                    {isArchived ? (
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            onClick={(e) => { e.stopPropagation(); handleRestore(gym); }}
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                        >
                                            <RotateCcw className="w-4 h-4" />
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="danger"
                                            size="icon"
                                            onClick={(e) => { e.stopPropagation(); handleArchive(gym); }}
                                            className="bg-red-600 hover:bg-red-700 text-white"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}

                                    <Button
                                        variant="secondary"
                                        size="icon"
                                        onClick={() => router.push(`/gyms/${gym.id}`)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Modals */}
            <AnimatePresence>
                {/* Add/Edit Modal */}
                {showModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-lg bg-zinc-800 border border-zinc-700 rounded-2xl p-6 relative z-10 shadow-2xl">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-600 rounded-lg">
                                        {editingGym ? <Settings className="w-5 h-5 text-white" /> : <Plus className="w-5 h-5 text-white" />}
                                    </div>
                                    <h2 className="text-lg font-bold text-zinc-100">{editingGym ? 'Salon Düzenle' : 'Yeni Salon'}</h2>
                                </div>
                                <button onClick={() => setShowModal(false)} className="p-1 text-zinc-400 hover:text-white transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSave} className="space-y-4">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-zinc-300 mb-2 block">Salon Adı</label>
                                        <input
                                            value={form.name}
                                            onChange={e => setForm({ ...form, name: e.target.value })}
                                            className="w-full h-11 bg-zinc-900 border border-zinc-700 rounded-lg px-4 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                                            placeholder="Örn: Elite Fitness"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-zinc-300 mb-2 block">
                                            Ödeme Bildirim E-postası
                                            <span className="text-zinc-500 text-xs font-normal ml-2">(Opsiyonel)</span>
                                        </label>
                                        <input
                                            type="email"
                                            value={form.notificationEmail}
                                            onChange={e => setForm({ ...form, notificationEmail: e.target.value })}
                                            className="w-full h-11 bg-zinc-900 border border-zinc-700 rounded-lg px-4 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                                            placeholder="odeme@salon.com"
                                        />
                                        <p className="text-[10px] text-zinc-500 mt-1">Stripe ödemelerinde bu adrese bilgi gider.</p>
                                    </div>
                                </div>

                                {editingGym && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-zinc-300 mb-2 block">İletişim E-posta</label>
                                            <input
                                                value={form.email}
                                                onChange={e => setForm({ ...form, email: e.target.value })}
                                                className="w-full h-11 bg-zinc-900 border border-zinc-700 rounded-lg px-4 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-zinc-300 mb-2 block">Durum</label>
                                            <select
                                                value={form.status}
                                                onChange={e => setForm({ ...form, status: e.target.value })}
                                                className="w-full h-11 bg-zinc-900 border border-zinc-700 rounded-lg px-4 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                                            >
                                                <option value="active">Aktif</option>
                                                <option value="suspended">Erişimi Durdur</option>
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {!editingGym && (
                                    <div className="p-4 bg-blue-600/10 border border-blue-600/30 rounded-lg">
                                        <p className="text-xs text-zinc-300">Yeni salon için sadece isim yeterlidir. Onaylandığında bir aktivasyon anahtarı üretilecektir.</p>
                                    </div>
                                )}

                                <Button type="submit" isLoading={actionLoading} variant="primary" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                                    {editingGym ? 'Kaydet' : 'Davetiye Oluştur'}
                                </Button>
                            </form>
                        </motion.div>
                    </div>
                )}

                {/* Success Modal */}
                {showInviteSuccess && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/90 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-md bg-zinc-800 border border-green-600/50 rounded-2xl p-8 text-center relative shadow-2xl">
                            <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <LinkIcon className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-xl font-bold text-zinc-100 mb-2">Bağlantı Hazır</h2>
                            <p className="text-sm text-zinc-400 mb-6">Yeni salon için güvenli aktivasyon anahtarı oluşturuldu. Bu bağlantıyı işletme sahibine iletin.</p>

                            <div className="p-4 bg-zinc-900 border border-zinc-700 rounded-lg mb-6 break-all font-mono text-xs text-blue-400">
                                {generatedLink}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <Button onClick={copyInviteLink} variant="secondary" className="bg-zinc-700 hover:bg-zinc-600 text-zinc-100">
                                    <Copy className="w-4 h-4 mr-2" /> Kopyala
                                </Button>
                                <Button onClick={() => setShowInviteSuccess(false)} variant="primary" className="bg-green-600 hover:bg-green-700 text-white">
                                    Tamam
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
