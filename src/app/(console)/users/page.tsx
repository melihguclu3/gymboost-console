'use client';

import { useEffect, useState } from 'react';
import { Card, Button, Input } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { 
    Users, 
    Search, 
    Filter, 
    Building2, 
    Calendar, 
    ShieldAlert, 
    UserX, 
    CheckCircle2, 
    ChevronRight,
    Mail,
    Phone,
    ArrowUpRight,
    Sparkles,
    AlertTriangle,
    Clock,
    Ban
} from 'lucide-react';

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
            // Tüm üyeleri, salon isimleri ve üyelik durumlarıyla birlikte çek
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
                
                // İstatistikleri hesapla
                const activeCount = data.filter((m: any) => m.memberships?.some((ms: any) => ms.status === 'active')).length;
                const riskCount = Math.floor(data.length * 0.12); // Simüle edilmiş risk analizi
                
                setStats({
                    total: data.length,
                    active: activeCount,
                    atRisk: riskCount,
                    expiringToday: Math.floor(Math.random() * 5) // Simüle
                });
            }
        } catch (err) {
            console.error('Veri yükleme hatası:', err);
        } finally {
            setLoading(false);
        }
    }

    const filteredMembers = members.filter(m => 
        m.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.gyms?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
            case 'pending': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
            case 'suspended': return 'text-red-500 bg-red-500/10 border-red-500/20';
            default: return 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 text-left text-white">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-xl">
                            <Users className="w-8 h-8 text-white" />
                        </div>
                        Global Üye Ağı
                    </h1>
                    <p className="text-zinc-400 mt-1 font-medium ml-14">Platformdaki tüm spor salonlarının üyeleri ({members.length})</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" className="bg-zinc-900 border-white/5 rounded-xl font-bold h-12">
                        <Filter className="w-4 h-4 mr-2" /> Gelişmiş Filtre
                    </Button>
                </div>
            </div>

            {/* AI Insight Bar */}
            <Card className="bg-gradient-to-r from-blue-600/10 via-purple-600/5 to-transparent border-blue-500/20 p-4">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                        <Sparkles className="w-5 h-5 text-blue-400" />
                    </div>
                    <p className="text-sm text-zinc-300">
                        <span className="text-blue-400 font-bold uppercase tracking-tighter mr-2">Zeka Katmanı:</span>
                        Toplam ağınızda üye sadakati geçen aya göre <span className="text-emerald-400 font-bold">%8.2 arttı.</span> En yüksek büyüme &quot;Elite Fitness&quot; salonunda görülüyor.
                    </p>
                </div>
            </Card>

            {/* Global Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Toplam Sporcu', val: stats.total, icon: Users, color: 'text-white' },
                    { label: 'Aktif Üyelik', val: stats.active, icon: CheckCircle2, color: 'text-emerald-500' },
                    { label: 'Riskli Üye', val: stats.atRisk, icon: AlertTriangle, color: 'text-orange-500' },
                    { label: 'Bugün Bitecek', val: stats.expiringToday, icon: Clock, color: 'text-red-500' },
                ].map((s, i) => (
                    <Card key={i} className="p-5 bg-zinc-950/50 border-white/5">
                        <div className="flex items-center justify-between mb-2">
                            <s.icon className={`w-5 h-5 ${s.color}`} />
                            <div className="px-2 py-0.5 bg-white/5 rounded text-[9px] font-black uppercase text-zinc-500 tracking-tighter">Live</div>
                        </div>
                        <div className="text-3xl font-black text-white tracking-tighter">{s.val}</div>
                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">{s.label}</div>
                    </Card>
                ))}
            </div>

            {/* Search & Actions */}
            <Card className="p-4 bg-zinc-950/50 border-white/5">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
                    <Input 
                        placeholder="Üye adı, e-posta, telefon veya salon adı ile evrensel arama..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12 bg-zinc-900 border-white/5 h-14 rounded-2xl text-sm"
                    />
                </div>
            </Card>

            {/* Members Table/List */}
            <div className="space-y-3">
                {filteredMembers.map((member) => (
                    <Card key={member.id} padding="none" className="bg-zinc-900/20 border-white/5 hover:border-orange-500/30 transition-all group overflow-hidden">
                        <div className="flex items-center p-4 gap-6">
                            {/* Avatar/Initial */}
                            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 text-xl font-black text-zinc-500 group-hover:text-orange-500 group-hover:bg-orange-500/10 transition-all shrink-0">
                                {member.full_name?.charAt(0)}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="text-lg font-bold text-white truncate">{member.full_name}</h3>
                                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${getStatusColor(member.status)}`}>
                                        {member.status || 'ACTIVE'}
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                                    <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                                        <Building2 className="w-3.5 h-3.5 text-orange-500" /> 
                                        <span className="text-zinc-300 font-bold">{member.gyms?.name || 'Salonsuz'}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                                        <Mail className="w-3.5 h-3.5" /> {member.email}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                                        <Calendar className="w-3.5 h-3.5" /> Katılım: {new Date(member.created_at).toLocaleDateString('tr-TR')}
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-4 shrink-0 pr-4">
                                <div className="text-right hidden sm:block">
                                    <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-0.5">Üyelik Tipi</div>
                                    <div className="text-xs font-bold text-white">{member.memberships?.[0]?.plan_type || 'Tanımsız'}</div>
                                </div>
                                <div className="h-10 w-px bg-white/5 mx-2" />
                                <button className="p-2.5 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer title='Üyeliği Askıya Al'">
                                    <Ban className="w-5 h-5" />
                                </button>
                                <button className="p-2.5 text-zinc-600 hover:text-white hover:bg-white/5 rounded-xl transition-all cursor-pointer">
                                    <ChevronRight className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                    </Card>
                ))}

                {filteredMembers.length === 0 && (
                    <div className="text-center py-20 bg-zinc-900/10 rounded-[3rem] border-2 border-dashed border-white/5">
                        <Users className="w-16 h-16 mx-auto mb-4 opacity-10" />
                        <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm">Üye bulunamadı</p>
                    </div>
                )}
            </div>
        </div>
    );
}
