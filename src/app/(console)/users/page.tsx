'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Input } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { 
    Users, 
    Search, 
    Filter, 
    Building2, 
    Calendar, 
    ShieldCheck, 
    UserCheck, 
    ChevronRight,
    Mail,
    Phone,
    ArrowUpRight,
    Sparkles,
    AlertTriangle,
    Clock,
    Ban,
    UserPlus,
    Activity,
    Database,
    ShieldAlert,
    Target
} from 'lucide-react';
import { cn, maskEmail, maskId } from '@/lib/utils';
import { motion } from 'framer-motion';

interface GlobalMember {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    created_at: string;
    status: string;
    gyms: {
        name: string;
    } | null;
    memberships: {
        status: string;
        end_date: string;
        plan_type: string;
    }[];
}

export default function GlobalUsersPage() {
    const router = useRouter();
    const [members, setMembers] = useState<GlobalMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        atRisk: 0,
        expiringToday: 0
    });

    const supabase = createClient();

    useEffect(() => {
        loadGlobalMembers();
    }, []);

    async function loadGlobalMembers() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('users')
                .select(`
                    id, 
                    full_name, 
                    email, 
                    phone, 
                    created_at, 
                    status,
                    gyms (name),
                    memberships (status, end_date, plan_type)
                `)
                .eq('role', 'member')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                setMembers(data as any);
                
                const now = new Date();
                const todayStr = now.toISOString().split('T')[0];
                const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30)).toISOString();

                const activeCount = data.filter((m: any) => m.memberships?.some((ms: any) => ms.status === 'active')).length;
                
                // Real Risk: No check-in for 30 days or status is suspended
                const atRiskCount = data.filter((m: any) => 
                    m.status === 'suspended' || 
                    (m.created_at < thirtyDaysAgo && m.status !== 'active')
                ).length;

                // Real Expiring: memberships ending today
                const expiringTodayCount = data.filter((m: any) => 
                    m.memberships?.some((ms: any) => ms.end_date?.startsWith(todayStr))
                ).length;

                setStats({
                    total: data.length,
                    active: activeCount,
                    atRisk: atRiskCount,
                    expiringToday: expiringTodayCount
                });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const filteredMembers = members.filter(m => 
        m.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.gyms?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'active': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'pending': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'suspended': return 'bg-red-500/10 text-red-500 border-red-500/20';
            default: return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Global Üye Verileri İşleniyor...</p>
            </div>
        );
    }

    return (
        <div className="space-y-12 pb-20 text-left text-white">
            {/* --- SURGICAL UNIFIED HEADER --- */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 border-b border-white/[0.04] pb-12">
                <div className="flex items-start gap-8">
                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-[1.5rem] shadow-lg shadow-blue-500/5 relative overflow-hidden group">
                        <Users className="w-10 h-10 text-blue-500 relative z-10 group-hover:scale-110 transition-transform" />
                        <div className="absolute inset-0 bg-blue-500/5 animate-pulse" />
                    </div>
                    <div>
                        <div className="flex items-center gap-4 mb-3">
                            <h1 className="text-4xl font-black text-white tracking-tighter uppercase">
                                ÜYE <span className="text-blue-500">YÖNETİMİ</span>
                            </h1>
                            <div className="flex items-center gap-2.5 px-3 py-1 bg-blue-500/5 border border-blue-500/20 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_#3b82f6]" />
                                <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">Küresel Veritabanı: Bağlı</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-6 text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">
                            <div className="flex items-center gap-2 font-mono">
                                <Database className="w-3.5 h-3.5" /> TOPLAM_VARLIK: {members.length}
                            </div>
                            <div className="flex items-center gap-2 font-mono">
                                <ShieldCheck className="w-3.5 h-3.5" /> YETKİ_SEVİYESİ: MASTER_ROOT
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="px-6 py-4 bg-zinc-950/40 border border-white/[0.04] rounded-2xl text-right group hover:border-blue-500/30 transition-all shadow-2xl relative overflow-hidden">
                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1 group-hover:text-blue-500 transition-colors font-mono">Güncelleme</p>
                        <p className="text-2xl font-black text-white tabular-nums font-mono">30<span className="text-[10px] text-zinc-800 ml-1 font-mono uppercase">sn</span></p>
                    </div>
                    <Button className="bg-zinc-950 border border-white/10 hover:border-blue-500/40 hover:bg-blue-500/5 rounded-xl h-14 px-8 font-black text-[10px] tracking-[0.3em] uppercase transition-all">
                        <Target className="w-4 h-4 mr-3" /> KOHORT ANALİZİ
                    </Button>
                </div>
            </div>

            {/* --- ANALYTICS BENTO --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                    { label: 'Küresel Varlıklar', val: stats.total, sub: 'Tüm Kayıtlı Üyeler', icon: Users, color: 'text-white', bg: 'bg-white/5', border: 'border-white/5' },
                    { label: 'Aktif Oturumlar', val: stats.active, sub: 'Doğrulanmış Güncel Erişim', icon: UserCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/5', border: 'border-emerald-500/20' },
                    { label: 'Riskli Anomaliler', val: stats.atRisk, sub: 'Devamsızlık Uyarıları', icon: ShieldAlert, color: 'text-orange-500', bg: 'bg-orange-500/5', border: 'border-orange-500/20' },
                    { label: 'Biten Üyelikler', val: stats.expiringToday, sub: 'Gün Sonu Sözleşme Fesihleri', icon: Clock, color: 'text-red-500', bg: 'bg-red-500/5', border: 'border-red-500/20' },
                ].map((s, i) => (
                    <Card key={i} className={cn("p-8 bg-zinc-950/20 border-white/[0.04] relative overflow-hidden group hover:border-blue-500/20 transition-all rounded-[2rem]", s.border)}>
                        <div className="flex items-center justify-between mb-8 relative z-10">
                            <div className={cn("p-3.5 rounded-2xl border transition-all duration-500", s.bg, s.border)}>
                                <s.icon className={cn("w-6 h-6", s.color)} />
                            </div>
                            <div className="flex gap-0.5">
                                {[1,2,3].map(j => <div key={j} className="w-0.5 h-3 bg-zinc-800 group-hover:bg-blue-500/40 transition-colors" />)}
                            </div>
                        </div>
                        <div className="relative z-10">
                            <p className="text-4xl font-black text-white tracking-tighter tabular-nums font-mono">{s.val}</p>
                            <p className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] mt-1.5">{s.label}</p>
                        </div>
                        <p className="text-[9px] font-mono font-black text-zinc-800 uppercase tracking-widest mt-8 border-t border-white/[0.04] pt-5 group-hover:text-zinc-600 transition-colors">{s.sub}</p>
                    </Card>
                ))}
            </div>

            {/* --- SEARCH INTERFACE --- */}
            <div className="space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-10 border-b border-white/[0.04] pb-10">
                    <div className="flex items-center gap-5">
                        <div className="p-3 bg-zinc-950 border border-white/5 rounded-2xl text-zinc-600">
                            <Search className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tighter uppercase">
                                EVRENSEL ÜYE VERİTABANI
                            </h2>
                            <p className="text-[10px] font-mono font-black text-zinc-700 uppercase tracking-[0.3em] mt-1">SORGU SONUÇLARI: {filteredMembers.length} EŞLEŞME</p>
                        </div>
                    </div>
                    <div className="relative w-full sm:w-[450px] group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700 group-focus-within:text-blue-500 transition-colors" />
                        <input 
                            placeholder="İSİM_EPOSTA_VEYA_SALON_ARA..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-14 pr-6 h-16 bg-zinc-950/40 border border-white/[0.04] rounded-2xl text-[11px] font-mono font-black uppercase tracking-widest focus:outline-none focus:border-blue-500/30 transition-all placeholder:text-zinc-800"
                        />
                    </div>
                </div>

                <div className="grid gap-4">
                    {filteredMembers.map((member) => (
                        <div 
                            key={member.id}
                            onClick={() => router.push(`/users/${member.id}`)}
                            className="bg-[#050505] border border-white/[0.04] rounded-[2rem] hover:border-blue-500/20 hover:bg-zinc-900/10 transition-all group overflow-hidden cursor-pointer relative"
                        >
                            <div className="flex flex-col lg:flex-row lg:items-center p-8 gap-10">
                                {/* Identity Block */}
                                <div className="flex items-center gap-6 lg:w-[35%] shrink-0">
                                    <div className="w-16 h-16 bg-zinc-950 border border-white/5 rounded-[1.2rem] flex items-center justify-center text-zinc-700 group-hover:text-blue-500 group-hover:border-blue-500/20 transition-all shadow-inner text-2xl font-black font-mono">
                                        {member.full_name?.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-lg font-black text-white truncate group-hover:text-blue-400 transition-colors uppercase tracking-tight">{member.full_name}</h3>
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <span className={cn(
                                                "px-2.5 py-0.5 rounded text-[8px] font-mono font-black uppercase tracking-[0.2em] border",
                                                getStatusStyles(member.status)
                                            )}>
                                                {member.status === 'active' ? 'AKTİF' : member.status === 'suspended' ? 'ASKIYA_ALINDI' : 'BEKLEMEDE'}
                                            </span>
                                            <span className="text-[10px] text-zinc-800 font-mono font-black tracking-widest uppercase">{maskId(member.id)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Node & Contact Block */}
                                <div className="grid grid-cols-2 lg:flex-1 gap-12 border-x border-white/[0.04] px-12 hidden lg:grid">
                                    <div className="space-y-2">
                                        <p className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.2em]">Bağlı Salon</p>
                                        <div className="flex items-center gap-2.5 text-zinc-400 text-[11px] font-black uppercase tracking-tight">
                                            <Building2 className="w-4 h-4 text-orange-500/60" />
                                            {member.gyms?.name || 'BAĞIMSIZ'}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.2em]">Güvenli İletişim</p>
                                        <div className="flex items-center gap-3 text-zinc-500 text-[10px] font-mono font-bold lowercase italic">
                                            <Mail className="w-3.5 h-3.5 text-zinc-700" /> {maskEmail(member.email)}
                                        </div>
                                    </div>
                                </div>

                                {/* Action Block */}
                                <div className="flex items-center justify-end gap-10 lg:w-[20%] shrink-0">
                                    <div className="text-right hidden sm:block">
                                        <p className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.2em] mb-1.5">Kayıt Tarihi</p>
                                        <p className="text-[11px] font-mono font-black text-zinc-400 uppercase tracking-widest">{new Date(member.created_at).toLocaleDateString('tr-TR')}</p>
                                    </div>
                                    <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white/[0.02] border border-white/[0.05] text-zinc-700 group-hover:text-white group-hover:bg-blue-600 transition-all cursor-pointer shadow-lg group-hover:shadow-blue-500/20">
                                        <ArrowUpRight className="w-6 h-6" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {filteredMembers.length === 0 && (
                        <div className="text-center py-40 bg-zinc-950/20 rounded-[3rem] border border-dashed border-white/[0.04]">
                            <Users className="w-20 h-20 mx-auto mb-6 text-zinc-900 animate-pulse" />
                            <p className="text-[11px] font-mono font-black text-zinc-700 uppercase tracking-[0.4em]">Sorgu Boş: Kriterlere uygun varlık bulunamadı</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
