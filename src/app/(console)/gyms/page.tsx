'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Input } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { useDialog } from '@/context/DialogContext';
import {
    Building2,
    Search,
    Plus,
    Globe,
    Calendar,
    CheckCircle2,
    Edit2,
    Trash2,
    ArrowUpRight,
    Mail,
    Phone,
    X,
    Copy,
    RotateCcw,
    AlertTriangle,
    ShieldAlert,
    Activity,
    Terminal,
    Settings,
    ChevronRight,
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
    
    // Modal States
    const [showModal, setShowModal] = useState(false);
    const [showInviteSuccess, setShowInviteSuccess] = useState(false);
    const [generatedLink, setGeneratedLink] = useState('');
    const [editingGym, setEditingGym] = useState<any>(null);
    const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', status: 'active' });
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
                    settings: { ...editingGym.settings, status: form.status }
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
                        is_activated: false
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
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="space-y-10 text-left pb-20">
            {/* --- HEADER --- */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-10">
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="px-2 py-0.5 bg-orange-500/10 border border-orange-500/20 rounded text-[9px] font-black text-orange-500 uppercase tracking-widest">
                            Küresel Portföy
                        </div>
                        <span className="text-zinc-700 text-[10px] font-bold uppercase tracking-widest">Salon Sayısı: {gyms.length}</span>
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-4 uppercase">
                        SALON <span className="text-orange-500">AĞI</span>
                    </h1>
                    <p className="text-zinc-400 mt-3 font-medium text-base leading-relaxed">Sistemdeki tüm bağımsız işletmelerin ve salonların yönetimi.</p>
                </div>
                <div className="flex gap-3">
                    <Button 
                        onClick={() => setShowArchived(!showArchived)} 
                        variant="secondary" 
                        className="h-12 px-6"
                    >
                        {showArchived ? 'Aktifleri Göster' : 'Arşivdekileri Gör'}
                    </Button>
                    <Button 
                        onClick={() => { setEditingGym(null); setForm({ name: '', email: '', phone: '', address: '', status: 'active' }); setShowModal(true); }} 
                        variant="primary"
                        icon={<Plus className="w-4 h-4" />}
                        className="h-12 px-6"
                    >
                        Yeni Salon Tanımla
                    </Button>
                </div>
            </div>

            {/* --- SEARCH --- */}
            <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-orange-500 transition-colors" />
                <input 
                    placeholder="SALON ADI, E-POSTA VEYA ŞEHİR İLE ARA..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-14 pr-6 h-16 bg-zinc-950/50 border border-white/5 rounded-2xl text-sm font-bold focus:outline-none focus:border-orange-500/50 transition-all placeholder:text-zinc-800"
                />
            </div>

            {/* --- LIST --- */}
            <div className="grid gap-4">
                {filteredGyms.map((gym) => {
                    const isArchived = gym.settings?.status === 'archived';
                    return (
                        <div key={gym.id} className="bg-[#080808] border border-white/5 rounded-[2rem] hover:border-orange-500/20 hover:bg-zinc-900/30 transition-all group overflow-hidden relative">
                            <div className="flex flex-col lg:flex-row lg:items-center p-8 gap-8">
                                <div onClick={() => router.push(`/gyms/${gym.id}`)} className="flex items-center gap-6 lg:w-[35%] shrink-0 cursor-pointer">
                                    <div className="w-16 h-16 bg-zinc-950 border border-white/10 rounded-2xl flex items-center justify-center text-zinc-600 group-hover:text-orange-500 group-hover:border-orange-500/20 transition-all shadow-inner">
                                        <Building2 className="w-8 h-8" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-lg font-black text-white truncate group-hover:text-orange-400 transition-colors">{gym.name.toUpperCase()}</h3>
                                        <span className={cn(
                                            "mt-1 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border inline-block",
                                            isArchived ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                                            gym.settings?.is_activated ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                        )}>
                                            {isArchived ? 'ARŞİVLENDİ' : gym.settings?.is_activated ? 'AKTİF SALON' : 'BEKLEMEDE'}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 lg:flex-1 gap-10 border-l border-white/5 pl-10 hidden lg:grid">
                                    <div className="space-y-1.5">
                                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Kayıtlı Üye</p>
                                        <p className="text-xl font-black text-white tabular-nums">{memberCounts[gym.id] ?? 0}</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">İletişim</p>
                                        <div className="text-[11px] font-medium text-zinc-400 truncate lowercase italic">{gym.email || 'bağlantı_yok'}</div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-3 lg:w-[25%] shrink-0">
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
                                                status: gym.settings?.status || 'active'
                                            });
                                            setShowModal(true);
                                        }}
                                        className="h-11 w-11 rounded-xl"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </Button>
                                    
                                    {isArchived ? (
                                        <Button 
                                            variant="secondary"
                                            size="icon"
                                            onClick={(e) => { e.stopPropagation(); handleRestore(gym); }} 
                                            className="h-11 w-11 rounded-xl hover:text-emerald-400 hover:border-emerald-500/30"
                                        >
                                            <RotateCcw className="w-4 h-4" />
                                        </Button>
                                    ) : (
                                        <Button 
                                            variant="danger"
                                            size="icon"
                                            onClick={(e) => { e.stopPropagation(); handleArchive(gym); }} 
                                            className="h-11 w-11 rounded-xl"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}

                                    <Button 
                                        variant="secondary"
                                        size="icon"
                                        onClick={() => router.push(`/gyms/${gym.id}`)} 
                                        className="h-11 w-11 rounded-xl hover:text-orange-500 hover:border-orange-500/30"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* --- MODALS --- */}
            <AnimatePresence>
                {/* 1. Add/Edit Modal */}
                {showModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="w-full max-w-lg bg-zinc-950 border border-white/10 rounded-[2.5rem] p-8 relative z-10 shadow-2xl overflow-hidden">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-orange-500/10 rounded-2xl text-orange-500">
                                        {editingGym ? <Settings className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                                    </div>
                                    <h2 className="text-xl font-black text-white uppercase tracking-tight">{editingGym ? 'Salon Yapılandırması' : 'Yeni Salon Talebi'}</h2>
                                </div>
                                <button onClick={() => setShowModal(false)} className="p-2 text-zinc-500 hover:text-white transition-colors cursor-pointer"><X /></button>
                            </div>

                            <form onSubmit={handleSave} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">İşletme / Salon Adı</label>
                                    <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-all" placeholder="Örn: ELITE FITNESS HQ" />
                                </div>

                                {editingGym && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">E-posta</label>
                                            <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-all" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Durum</label>
                                            <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-all">
                                                <option value="active">AKTİF</option>
                                                <option value="suspended">ERİŞİMİ DURDUR</option>
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {!editingGym && (
                                    <div className="p-6 bg-orange-500/5 border border-orange-500/10 rounded-2xl">
                                        <p className="text-[11px] text-zinc-400 leading-relaxed italic">Yeni bir salon için sadece isim yeterlidir. Onaylandığında bir <b>aktivasyon anahtarı</b> üretilecektir.</p>
                                    </div>
                                )}

                                <Button type="submit" isLoading={actionLoading} variant="primary" className="w-full h-14 mt-4">
                                    {editingGym ? 'Yapılandırmayı Kaydet' : 'Davetiye Oluştur'}
                                </Button>
                            </form>
                        </motion.div>
                    </div>
                )}

                {/* 2. Success Invite Modal */}
                {showInviteSuccess && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/95 backdrop-blur-xl" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-md bg-zinc-950 border border-emerald-500/20 rounded-[3rem] p-10 text-center relative overflow-hidden shadow-2xl">
                            <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
                            <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                                <LinkIcon className="w-10 h-10" />
                            </div>
                            <h2 className="text-2xl font-black text-white mb-3 uppercase tracking-tight">Bağlantı Hazır</h2>
                            <p className="text-zinc-500 text-sm mb-10 leading-relaxed">Yeni salon için güvenli aktivasyon anahtarı oluşturuldu. Bu bağlantıyı işletme sahibine iletin.</p>

                            <div className="p-5 bg-white/5 border border-white/5 rounded-2xl mb-8 break-all font-mono text-[10px] text-orange-400 leading-relaxed shadow-inner">
                                {generatedLink}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Button onClick={copyInviteLink} variant="secondary" className="h-14">
                                    <Copy className="w-4 h-4 mr-2" /> Kopyala
                                </Button>
                                <Button onClick={() => setShowInviteSuccess(false)} variant="primary" className="h-14 bg-emerald-600 hover:bg-emerald-500 border-emerald-500/20">
                                    Tamamla
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
