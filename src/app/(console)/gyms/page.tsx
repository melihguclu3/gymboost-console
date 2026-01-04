'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Input } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { useDialog } from '@/context/DialogContext';
import {
    Building2,
    Search,
    MoreVertical,
    Plus,
    Globe,
    Calendar,
    CheckCircle2,
    XCircle,
    Edit2,
    Trash2,
    ArrowUpRight,
    Mail,
    Phone,
    X,
    TrendingUp,
    Copy,
    RotateCcw,
    AlertTriangle
} from 'lucide-react';

export default function SuperAdminGyms() {
    const { showAlert, showConfirm, showDanger } = useDialog();
    const router = useRouter();
    const [gyms, setGyms] = useState<any[]>([]);
    const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showArchived, setShowArchived] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showInviteSuccess, setShowInviteSuccess] = useState(false);
    const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
    const [archiveTarget, setArchiveTarget] = useState<any | null>(null);
    const [generatedLink, setGeneratedLink] = useState('');
    const [editingGym, setEditingGym] = useState<any>(null);
    const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', status: 'active' });

    const supabase = createClient();

    useEffect(() => { loadGyms(); }, []);

    async function loadGyms() {
        setLoading(true);
        const { data } = await supabase.from('gyms').select('*').order('created_at', { ascending: false });
        if (data) {
            setGyms(data);
            loadMemberCounts(data.map(gym => gym.id));
        }
        setLoading(false);
    }

    async function loadMemberCounts(gymIds: string[]) {
        if (gymIds.length === 0) {
            setMemberCounts({});
            return;
        }

        const { data, error } = await supabase
            .from('users')
            .select('gym_id')
            .eq('role', 'member')
            .in('gym_id', gymIds);

        if (error || !data) {
            return;
        }

        const counts: Record<string, number> = {};
        for (const row of data) {
            if (!row.gym_id) continue;
            counts[row.gym_id] = (counts[row.gym_id] || 0) + 1;
        }
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

    async function confirmArchive(gym: any) {
        const previousStatus = gym.settings?.status || (gym.settings?.is_activated ? 'active' : 'pending_activation');
        const previousActivation = Boolean(gym.settings?.is_activated);

        const { error } = await supabase.from('gyms').update({
            settings: {
                ...(gym.settings || {}),
                status: 'archived',
                is_activated: false,
                archived_at: new Date().toISOString(),
                archived_from: previousStatus,
                archived_is_activated: previousActivation,
            },
        }).eq('id', gym.id);

        if (error) {
            showAlert('Hata', error.message);
            return;
        }

        setArchiveTarget(null);
        loadGyms();
    }

    function handleArchive(gym: any) {
        showDanger(
            'DİKKAT: Salonu Arşivle',
            `"${gym.name}" salonunu arşivlemek istediğinize emin misiniz? Salon sahibi sisteme giriş yapamaz ve tüm işlemler durur. İstediğiniz zaman geri alabilirsiniz.`,
            async () => {
                await confirmArchive(gym);
            }
        );
    }

    async function handleRestore(gym: any) {
        showConfirm(
            'Salonu Geri Yükle',
            `"${gym.name}" salonunu arşivden çıkarmak istiyor musun?`,
            async () => {
                const restoredStatus = gym.settings?.archived_from || 'active';
                const restoredActivation = gym.settings?.archived_is_activated ?? true;

                const { error } = await supabase.from('gyms').update({
                    settings: {
                        ...(gym.settings || {}),
                        status: restoredStatus,
                        is_activated: restoredActivation,
                        archived_at: null,
                        archived_from: null,
                        archived_is_activated: null,
                    },
                }).eq('id', gym.id);

                if (error) {
                    showAlert('Hata', error.message);
                    return;
                }

                loadGyms();
            }
        );
    }

    async function handleSave() {
        if (!form.name) return showAlert('Uyarı', 'Lütfen salon adını girin.');

        try {
            if (editingGym) {
                const { error } = await supabase.from('gyms').update({
                    name: form.name,
                    email: form.email,
                    phone: form.phone,
                    address: form.address,
                    settings: { ...editingGym.settings, status: form.status }
                }).eq('id', editingGym.id);

                if (error) throw error;
                setShowModal(false);
                loadGyms();
            } else {
                // YENI SALON DAVETIYESI
                const activationToken = Math.random().toString(36).substring(2, 10).toUpperCase();
                const { data: gymData, error: gymError } = await supabase.from('gyms').insert({
                    name: form.name,
                    settings: {
                        status: 'pending_activation', // Aktivasyon bekliyor
                        activation_token: activationToken,
                        is_activated: false
                    }
                }).select().single();

                if (gymError) throw gymError;

                const link = `${window.location.origin}/activate-salon?token=${activationToken}`;
                setGeneratedLink(link);
                setShowModal(false);
                setCopyStatus('idle');
                setShowInviteSuccess(true);
                loadGyms();
            }
        } catch (error: any) {
            console.error(error);
            showAlert('Hata', error.message);
        }
    }

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>;

    return (
        <div className="space-y-6 text-left">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-white flex items-center gap-3">
                        <Building2 className="w-6 h-6 text-orange-500" /> Salon Portföyü
                    </h1>
                    <p className="text-zinc-400 text-sm mt-1">Sistemdeki tüm işletmelerin listesi ve durumu</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        onClick={() => setShowArchived(!showArchived)}
                        variant="secondary"
                        className="bg-zinc-900 border-white/10 text-zinc-300 rounded-xl font-bold h-11 px-4 hover:bg-zinc-800 transition-colors"
                    >
                        {showArchived ? 'Aktifleri Göster' : 'Arşivlileri Göster'}
                    </Button>
                    <Button onClick={() => { setEditingGym(null); setForm({ name: '', email: '', phone: '', address: '', status: 'active' }); setShowModal(true); }} className="bg-orange-600 hover:bg-orange-500 rounded-xl font-bold h-11 px-6">
                        <Plus className="w-4 h-4 mr-2" /> Yeni Salon Tanımla
                    </Button>
                </div>
            </div>

            <Card className="p-4 bg-zinc-950/50 border-white/5">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <Input
                        placeholder="Salon adı, yetkili e-postası veya şehir ile ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-zinc-900 border-white/5"
                    />
                </div>
            </Card>

            <div className="grid gap-3">
                {filteredGyms.map((gym) => {
                    const isArchived = gym.settings?.status === 'archived';
                    return (
                        <Card key={gym.id} padding="none" className="bg-zinc-900/20 border-white/5 hover:border-orange-500/20 transition-all group overflow-hidden cursor-pointer" onClick={() => router.push(`/gyms/${gym.id}`)}>
                            <div className="flex items-center p-4 gap-6">
                                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 shrink-0">
                                    <Building2 className="w-7 h-7 text-zinc-500 group-hover:text-orange-500 transition-colors" />
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                    <div className="flex items-center gap-3 text-left">
                                        <h3 className="text-lg font-bold text-white truncate text-left">{gym.name}</h3>
                                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${isArchived
                                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                            : gym.settings?.is_activated
                                                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                                : 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/20'
                                            }`}>
                                            {isArchived ? 'ARSIVLENDI' : gym.settings?.is_activated ? 'AKTİF İŞLETME' : 'BEKLEMEDE'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 mt-1 text-left">
                                        <div className="flex items-center gap-1.5 text-xs text-zinc-500 text-left">
                                            <Globe className="w-3.5 h-3.5 text-left" /> {gym.email || 'E-posta yok'}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-zinc-500 text-left">
                                            <Calendar className="w-3.5 h-3.5 text-left" /> Kayıt: {new Date(gym.created_at).toLocaleDateString('tr-TR')}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 shrink-0 px-6 border-l border-white/5">
                                    <div className="text-right">
                                        <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-0.5">Üye Sayısı</div>
                                        <div className="text-sm font-black text-white">
                                            {memberCounts[gym.id] ?? 0}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => {
                                                setEditingGym(gym);
                                                setForm({
                                                    name: gym.name,
                                                    email: gym.email || '',
                                                    phone: gym.phone || '',
                                                    address: gym.address || '',
                                                    status: gym.settings?.status || 'active'
                                                });
                                                setShowModal(true);
                                            }}
                                            className="bg-white/5 border-white/5 hover:bg-white/10 text-zinc-300 h-9 px-4 rounded-lg cursor-pointer"
                                        >
                                            <Edit2 className="w-3.5 h-3.5 mr-2" /> Düzenle
                                        </Button>
                                    </div>
                                    <div className="text-right">
                                        {isArchived ? (
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => handleRestore(gym)}
                                                className="bg-white/5 border-white/5 hover:bg-white/10 text-emerald-300 h-9 px-4 rounded-lg cursor-pointer"
                                            >
                                                <RotateCcw className="w-3.5 h-3.5 mr-2" /> Geri Al
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => handleArchive(gym)}
                                                className="bg-red-500/10 border-red-500/20 hover:bg-red-500/20 text-red-400 h-9 px-4 rounded-lg cursor-pointer"
                                            >
                                                <Trash2 className="w-3.5 h-3.5 mr-2" /> Arşivle
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )
                })}
            </div>

            {/* Edit/Add Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
                    <Card className="w-full max-w-lg bg-zinc-950 border-white/10 rounded-[2.5rem] p-8">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-black text-white">{editingGym ? 'Salonu Düzenle' : 'Yeni Salon Davetiyesi'}</h2>
                            <button onClick={() => setShowModal(false)} className="p-2 text-zinc-500 hover:text-white cursor-pointer"><X /></button>
                        </div>
                        <div className="space-y-4">
                            <Input label="Salon Adı" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Örn: Elite Fitness" />

                            {editingGym ? (
                                <>
                                    <Input label="E-posta" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="salon@email.com" />
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input label="Telefon" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="05..." />
                                        <div className="space-y-1 text-left">
                                            <label className="text-xs font-bold text-zinc-500 uppercase ml-1">İşletme Durumu</label>
                                            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full p-3 bg-zinc-900 border border-white/5 rounded-xl text-white outline-none focus:border-orange-500/50">
                                                <option value="active">Aktif</option>
                                                <option value="suspended">Erişimi Durdur</option>
                                            </select>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="p-6 bg-orange-500/5 border border-orange-500/10 rounded-2xl text-left">
                                    <p className="text-xs text-zinc-400 leading-relaxed text-left">
                                        Yeni salon için sadece isim girmeniz yeterlidir. Kayıt tamamlandığında size özel bir <b>Aktivasyon Linki</b> üretilecektir. Bu linki müşterinize ileterek kendi hesabını kurmasını sağlayabilirsiniz.
                                    </p>
                                </div>
                            )}

                            <Button onClick={handleSave} className="w-full py-4 bg-orange-600 hover:bg-orange-500 font-bold rounded-2xl mt-4">
                                {editingGym ? 'Değişiklikleri Kaydet' : 'Davetiye Oluştur'}
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Success Invitation Modal */}
            {showInviteSuccess && (
                <div className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
                    <Card className="w-full max-w-md bg-zinc-950 border-emerald-500/20 rounded-[3rem] p-8 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
                        <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 text-emerald-500">
                            <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <h2 className="text-2xl font-black text-white mb-2 uppercase italic">Davetiye Hazır!</h2>
                        <p className="text-zinc-400 text-sm mb-8">Bu linki müşterinize iletin. Kendi hesabını bu link üzerinden kuracaktır.</p>

                        <div className="p-4 bg-white/5 border border-white/5 rounded-2xl mb-6 break-all text-xs font-mono text-orange-400 leading-relaxed">
                            {generatedLink}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:items-stretch">
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(generatedLink);
                                    setCopyStatus('copied');
                                    setTimeout(() => setCopyStatus('idle'), 2000);
                                }}
                                className="flex items-center justify-center gap-2 py-4 bg-zinc-900 hover:bg-zinc-800 border border-white/5 rounded-2xl text-white font-bold text-xs transition-all h-12 sm:h-auto"
                            >
                                <Copy className="w-4 h-4" /> {copyStatus === 'copied' ? 'Kopyalandı' : 'Kopyala'}
                            </button>
                            <Button onClick={() => setShowInviteSuccess(false)} className="bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-bold h-12 sm:h-auto">Tamam</Button>
                        </div>
                    </Card>
                </div>
            )}

        </div>
    );
}
