'use client';

import { useEffect, useState, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, Button } from '@/components/ui';
import {
    Users,
    Building2,
    TrendingUp,
    Calendar,
    Mail,
    Phone,
    ArrowLeft,
    ShieldCheck,
    CreditCard,
    DollarSign,
    Activity,
    Dumbbell,
    Terminal,
    ChevronRight,
    Cpu,
    Lock,
    Clock,
    FileText,
    Settings,
    Database,
    Zap,
    CircleDot,
    Package,
    HeartPulse,
    AlertCircle,
    Wallet,
    Copy
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'sonner';

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const resolvedParams = use(params);
    const userId = resolvedParams.id;

    const [loading, setLoading] = useState(true);
    const [member, setMember] = useState<any>(null);
    const [memberships, setMemberships] = useState<any[]>([]);
    const [payments, setPayments] = useState<any[]>([]);
    const [sessions, setSessions] = useState<any[]>([]);
    const [purchases, setPurchases] = useState<any[]>([]);
    const [measurements, setMeasurements] = useState<any[]>([]);

    // Edit State
    const [showEditModal, setShowEditModal] = useState(false);
    const [updateLoading, setUpdateLoading] = useState(false);
    const [editForm, setEditForm] = useState({
        full_name: '',
        email: '',
        phone: '',
        status: '',
        gender: '',
        blood_type: '',
        health_issues: '',
        balance: 0
    });

    const supabase = createClient();

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('ID panoya kopyalandı.');
    };

    const loadMemberData = useCallback(async () => {
        setLoading(true);
        try {
            // 1. Core Profile
            const { data: userData } = await supabase
                .from('users')
                .select('*, gyms(name)')
                .eq('id', userId)
                .single();
            if (userData) {
                setMember(userData);
                setEditForm({
                    full_name: userData.full_name || '',
                    email: userData.email || '',
                    phone: userData.phone || '',
                    status: userData.status || 'active',
                    gender: userData.gender || '',
                    blood_type: userData.blood_type || '',
                    health_issues: userData.health_issues || '',
                    balance: userData.balance || 0
                });
            }

            // 2. Memberships
            const { data: memberPlans } = await supabase
                .from('memberships')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });
            if (memberPlans) setMemberships(memberPlans);

            // 3. Payments
            const { data: paymentData } = await supabase
                .from('payments')
                .select('*')
                .eq('user_id', userId)
                .order('payment_date', { ascending: false });
            if (paymentData) setPayments(paymentData);

            // 4. Workout Sessions
            const { data: sessionData } = await supabase
                .from('workout_sessions')
                .select('*, trainer:trainer_id(full_name)')
                .eq('user_id', userId)
                .order('started_at', { ascending: false });
            if (sessionData) setSessions(sessionData);

            // 5. Purchases (Inventory)
            const { data: purchaseData } = await supabase
                .from('inventory_transactions')
                .select('*, products(name)')
                .eq('member_id', userId)
                .order('created_at', { ascending: false });
            if (purchaseData) setPurchases(purchaseData);

            // 6. Physical Measurements
            const { data: measurementData } = await supabase
                .from('measurements')
                .select('*')
                .eq('user_id', userId)
                .order('measured_at', { ascending: true });
            if (measurementData) setMeasurements(measurementData);

        } catch (error) {
            console.error('Error loading member profile:', error);
        } finally {
            setLoading(false);
        }
    }, [userId, supabase]);

    const handleUpdateMember = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpdateLoading(true);
        try {
            const { error } = await supabase
                .from('users')
                .update(editForm)
                .eq('id', userId);

            if (error) throw error;

            toast.success('Üye bilgileri başarıyla güncellendi.');
            setShowEditModal(false);
            loadMemberData();
        } catch (error: any) {
            toast.error('Güncelleme sırasında hata: ' + error.message);
        } finally {
            setUpdateLoading(false);
        }
    };

    useEffect(() => { loadMemberData(); }, [loadMemberData]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-8 h-8 border-2 border-white/10 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest animate-pulse">Decrypting Personnel File...</p>
        </div>
    );

    if (!member) return (
        <div className="text-center py-20 bg-zinc-950 border border-dashed border-white/10 rounded-[3rem]">
            <ShieldCheck className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white uppercase tracking-tighter">Subject ID Not Found</h2>
            <Button variant="secondary" onClick={() => router.back()} className="mt-6">RETURN TO DATABASE</Button>
        </div>
    );

    return (
        <div className="space-y-10 pb-20 font-sans">
            {/* --- EDIT MODAL --- */}
            <AnimatePresence>
                {showEditModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowEditModal(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
                        />
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="w-full max-w-2xl bg-zinc-950 border border-white/10 rounded-[2.5rem] p-8 relative z-10 shadow-2xl overflow-hidden"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
                                        <Settings className="w-6 h-6" />
                                    </div>
                                    <h2 className="text-xl font-black text-white uppercase tracking-tight">Profil Düzenleme</h2>
                                </div>
                                <Button onClick={() => setShowEditModal(false)} variant="secondary" className="w-10 h-10 p-0 rounded-full">
                                    <ChevronRight className="w-5 h-5 rotate-45" />
                                </Button>
                            </div>

                            <form onSubmit={handleUpdateMember} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Ad Soyad</label>
                                    <input 
                                        type="text"
                                        value={editForm.full_name}
                                        onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">E-posta</label>
                                    <input 
                                        type="email"
                                        value={editForm.email}
                                        onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Telefon</label>
                                    <input 
                                        type="text"
                                        value={editForm.phone}
                                        onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Durum</label>
                                    <select 
                                        value={editForm.status}
                                        onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all"
                                    >
                                        <option value="active">AKTİF</option>
                                        <option value="pending">BEKLEMEDE</option>
                                        <option value="suspended">ASKIDA</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Cinsiyet</label>
                                    <select 
                                        value={editForm.gender}
                                        onChange={(e) => setEditForm({...editForm, gender: e.target.value})}
                                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all"
                                    >
                                        <option value="">Belirtilmemiş</option>
                                        <option value="male">ERKEK</option>
                                        <option value="female">KADIN</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Bakiye (₺)</label>
                                    <input 
                                        type="number"
                                        value={editForm.balance}
                                        onChange={(e) => setEditForm({...editForm, balance: parseFloat(e.target.value) || 0})}
                                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all"
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Sağlık Durumu / Notlar</label>
                                    <textarea 
                                        value={editForm.health_issues}
                                        onChange={(e) => setEditForm({...editForm, health_issues: e.target.value})}
                                        className="w-full h-24 bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all resize-none"
                                    />
                                </div>

                                <div className="md:col-span-2 pt-4 flex gap-4">
                                    <Button 
                                        type="button" 
                                        onClick={() => setShowEditModal(false)}
                                        className="flex-1 bg-white/5 border border-white/10 text-white h-14 rounded-2xl font-bold uppercase tracking-widest text-[10px]"
                                    >
                                        İptal
                                    </Button>
                                    <Button 
                                        type="submit" 
                                        disabled={updateLoading}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-14 rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-blue-500/20"
                                    >
                                        {updateLoading ? 'Güncelleniyor...' : 'Değişiklikleri Kaydet'}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- TOP HUD: PROFILE OVERVIEW --- */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 border-b border-white/[0.06] pb-10">
                <div className="flex items-start gap-6">
                    <div className="w-24 h-24 bg-zinc-950 border border-white/10 rounded-[2.5rem] flex items-center justify-center text-blue-500 shadow-2xl relative group overflow-hidden">
                        <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors" />
                        <span className="text-3xl font-black relative z-10">{member.full_name?.charAt(0)}</span>
                    </div>
                    <div>
                        <div className="flex items-center gap-4 mb-2">
                            <h1 className="text-3xl font-black text-white tracking-tight uppercase">{member.full_name}</h1>
                            <span className={cn(
                                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                member.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
                            )}>
                                {member.status || 'UNKNOWN'}
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-6 text-xs font-bold text-zinc-500 uppercase tracking-widest">
                            <div className="flex items-center gap-2"><Building2 className="w-3.5 h-3.5 text-orange-500" /> {member.gyms?.name || 'STANDALONE'}</div>
                            <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> {member.email}</div>
                            <div 
                                onClick={() => copyToClipboard(member.id)}
                                className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors group/id"
                            >
                                <Lock className="w-3.5 h-3.5 text-zinc-700 group-hover/id:text-blue-500 transition-colors" /> 
                                <span className="font-mono lowercase text-[10px] tracking-normal">{member.id}</span>
                                <Copy className="w-3 h-3 opacity-0 group-hover/id:opacity-100 transition-opacity" />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button onClick={() => router.back()} className="bg-white/[0.03] border border-white/10 hover:bg-white/5 rounded-xl h-12 px-6 font-bold text-[10px] tracking-[0.2em] uppercase">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Geri Dön
                    </Button>
                    <Button onClick={() => setShowEditModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12 px-6 font-bold text-[10px] tracking-[0.2em] uppercase shadow-lg shadow-blue-500/20">
                        <Settings className="w-4 h-4 mr-2" /> Üye Bilgilerini Düzenle
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* --- LEFT COLUMN: CORE INTEL --- */}
                <div className="lg:col-span-2 space-y-8">
                    {/* BENTO STATS */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="p-6 bg-zinc-950/40 border-white/[0.06]">
                            <div className="flex items-center gap-3 mb-4">
                                <Wallet className="w-4 h-4 text-emerald-500" />
                                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Hesap Bakiyesi</span>
                            </div>
                            <p className="text-2xl font-black text-white">{member.balance || 0} <span className="text-sm text-zinc-600">₺</span></p>
                        </Card>
                        <Card className="p-6 bg-zinc-950/40 border-white/[0.06]">
                            <div className="flex items-center gap-3 mb-4">
                                <CreditCard className="w-4 h-4 text-blue-500" />
                                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Aktif Paketler</span>
                            </div>
                            <p className="text-2xl font-black text-white">{memberships.filter(m => m.status === 'active').length}</p>
                        </Card>
                        <Card className="p-6 bg-zinc-950/40 border-white/[0.06]">
                            <div className="flex items-center gap-3 mb-4">
                                <Dumbbell className="w-4 h-4 text-orange-500" />
                                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Toplam Seans</span>
                            </div>
                            <p className="text-2xl font-black text-white">{sessions.length}</p>
                        </Card>
                    </div>

                    {/* RECENT ACTIVITY TERMINAL */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 px-2">
                            <Terminal className="w-4 h-4 text-zinc-500" />
                            <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">Oturum & İşlem Kayıtları</h3>
                        </div>
                        <Card className="bg-[#020202] border-white/[0.06] overflow-hidden">
                            <div className="p-2 divide-y divide-white/[0.02] font-mono">
                                {payments.length > 0 || sessions.length > 0 ? (
                                    <>
                                        {[...payments.map(p => ({ ...p, type: 'PAYMENT' })), ...sessions.map(s => ({ ...s, type: 'SESSION' }))]
                                            .sort((a, b) => new Date(b.created_at || b.payment_date).getTime() - new Date(a.created_at || a.payment_date).getTime())
                                            .slice(0, 10)
                                            .map((item, i) => (
                                                <div key={i} className="flex items-start gap-4 p-3 hover:bg-white/[0.02] transition-colors group">
                                                    <span className="text-[9px] text-zinc-800 tabular-nums pt-1">{String(i + 1).padStart(2, '0')}</span>
                                                    <div className={cn(
                                                        "w-[2px] h-8 rounded-full shrink-0",
                                                        item.type === 'PAYMENT' ? 'bg-emerald-500' : 'bg-blue-500'
                                                    )} />
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-3 mb-0.5">
                                                            <span className={cn(
                                                                "text-[8px] font-black px-1.5 py-0.5 rounded border",
                                                                item.type === 'PAYMENT' ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5' : 'text-blue-500 border-blue-500/20 bg-blue-500/5'
                                                            )}>{item.type}</span>
                                                            <span className="text-[9px] text-zinc-600 tabular-nums">
                                                                {format(new Date(item.created_at || item.payment_date), 'dd.MM HH:mm')}
                                                            </span>
                                                        </div>
                                                        <p className="text-[11px] text-zinc-400 truncate">
                                                            {item.description || (item.type === 'PAYMENT' ? `${item.amount} ₺ Tahsilat` : 'Antrenman Seansı')}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))
                                        }
                                    </>
                                ) : (
                                    <div className="py-20 text-center opacity-10">
                                        <Activity className="w-12 h-12 mx-auto mb-4" />
                                        <p className="text-xs font-black uppercase tracking-widest">No Activity Records</p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>

                {/* --- RIGHT COLUMN: SUBSYSTEMS --- */}
                <div className="space-y-8">
                    {/* MEMBERSHIP STATUS */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em] px-2">Üyelik Durumu</h3>
                        <Card className="p-6 bg-zinc-950/40 border-white/[0.06] space-y-6">
                            {memberships.length > 0 ? memberships.map((m, i) => (
                                <div key={i} className="space-y-3 pb-6 border-b border-white/5 last:border-0 last:pb-0">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-bold text-white">{m.plan_type}</p>
                                            <p className="text-[10px] text-zinc-500 font-medium mt-0.5 uppercase tracking-wider">
                                                {m.end_date ? `${formatDate(m.end_date)} tarihine kadar` : 'Süresiz'}
                                            </p>
                                        </div>
                                        <span className={cn(
                                            "px-2 py-0.5 rounded text-[8px] font-black uppercase border",
                                            m.status === 'active' ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5' : 'text-zinc-500 border-zinc-500/20 bg-zinc-500/5'
                                        )}>{m.status}</span>
                                    </div>
                                    {(m.sessions_remaining || 0) > 0 && (
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-[10px] font-bold text-zinc-600 uppercase">
                                                <span>Kalan Seans</span>
                                                <span>{m.sessions_remaining} / {m.sessions_used + m.sessions_remaining}</span>
                                            </div>
                                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" 
                                                    style={{ width: `${(m.sessions_remaining / (m.sessions_used + m.sessions_remaining)) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )) : (
                                <p className="text-xs font-bold text-zinc-600 italic text-center py-4">Aktif paket bulunmuyor.</p>
                            )}
                        </Card>
                    </div>

                    {/* PHYSICAL INTEL & PROGRESS */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">Fiziksel Gelişim Analizi</h3>
                            <div className="flex items-center gap-2 px-2 py-1 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                                <Activity className="w-3 h-3 text-blue-500" />
                                <span className="text-[8px] font-black text-blue-500 uppercase">Biyometrik Veri</span>
                            </div>
                        </div>
                        <Card className="p-8 bg-zinc-950/40 border-white/[0.06] space-y-10 rounded-[2.5rem] relative overflow-hidden">
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />
                            
                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-4 relative z-10">
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-blue-500/30 transition-all">
                                    <p className="text-[9px] font-black text-zinc-600 uppercase mb-1 tracking-widest">Mevcut Kilo</p>
                                    <p className="text-2xl font-black text-white font-mono">{measurements.length > 0 ? measurements[measurements.length - 1].weight : member.weight || '--'} <span className="text-xs text-zinc-700">KG</span></p>
                                </div>
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-emerald-500/30 transition-all">
                                    <p className="text-[9px] font-black text-zinc-600 uppercase mb-1 tracking-widest">Vücut Yağ %</p>
                                    <p className="text-2xl font-black text-emerald-500 font-mono">{measurements.length > 0 ? measurements[measurements.length - 1].body_fat_percentage : '--'} <span className="text-xs text-zinc-700">%</span></p>
                                </div>
                            </div>

                            {/* Progress Chart (Custom Surgical Style) */}
                            <div className="space-y-6 relative z-10">
                                <div className="flex justify-between items-center">
                                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Kilo Değişim Grafiği</p>
                                    <span className="text-[9px] font-mono text-zinc-700 uppercase">Scale: Dynamic</span>
                                </div>
                                
                                <div className="h-40 flex items-end gap-3 px-2">
                                    {measurements.length > 1 ? measurements.slice(-8).map((m, i) => {
                                        const maxWeight = Math.max(...measurements.map(x => x.weight)) + 5;
                                        const minWeight = Math.min(...measurements.map(x => x.weight)) - 5;
                                        const height = ((m.weight - minWeight) / (maxWeight - minWeight)) * 100;
                                        
                                        return (
                                            <div key={i} className="flex-1 flex flex-col justify-end gap-2 group relative">
                                                <motion.div 
                                                    initial={{ height: 0 }}
                                                    animate={{ height: `${Math.max(height, 10)}%` }}
                                                    className="w-full bg-blue-500/20 group-hover:bg-blue-500 transition-all rounded-t-lg relative"
                                                >
                                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 p-1.5 bg-zinc-900 border border-white/10 rounded text-[9px] font-black text-white opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap">
                                                        {m.weight} KG
                                                    </div>
                                                </motion.div>
                                                <p className="text-[8px] font-mono font-black text-zinc-800 text-center uppercase">{format(new Date(m.measured_at), 'dd/MM')}</p>
                                            </div>
                                        );
                                    }) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center opacity-20 border border-dashed border-white/10 rounded-2xl">
                                            <TrendingUp className="w-8 h-8 mb-2" />
                                            <p className="text-[10px] font-black uppercase tracking-widest">Yetersiz Veri Akışı</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-4 bg-orange-500/5 border border-orange-500/10 rounded-2xl relative z-10">
                                <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <AlertCircle className="w-3 h-3" /> Sağlık Notu
                                </p>
                                <p className="text-[11px] text-zinc-400 leading-relaxed italic">
                                    {member.health_issues || 'Kayıtlı bir sağlık uyarısı bulunmuyor.'}
                                </p>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}

const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });