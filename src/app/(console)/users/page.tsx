'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Input } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import {
    Users,
    Search,
    Building2,
    UserCheck,
    Mail,
    ArrowUpRight,
    ShieldAlert,
    Clock,
    UserPlus,
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

                const atRiskCount = data.filter((m: any) =>
                    m.status === 'suspended' ||
                    (m.created_at < thirtyDaysAgo && m.status !== 'active')
                ).length;

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
            case 'active': return 'bg-emerald-600/10 text-emerald-500';
            case 'pending': return 'bg-amber-600/10 text-amber-500';
            case 'suspended': return 'bg-red-600/10 text-red-500';
            default: return 'bg-zinc-600/10 text-zinc-500';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'active': return 'Aktif';
            case 'pending': return 'Beklemede';
            case 'suspended': return 'Askıda';
            default: return 'Bilinmiyor';
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="w-8 h-8 border-2 border-zinc-600 border-t-blue-600 rounded-full animate-spin" />
                <p className="text-xs font-medium text-zinc-500">Üye Verileri Yükleniyor...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100">
                        Üye Yönetimi
                    </h1>
                    <p className="text-sm text-zinc-400 mt-1">
                        Toplam {stats.total} kayıtlı üye
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="secondary" className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100">
                        <Target className="w-4 h-4 mr-2" />
                        Analiz
                    </Button>
                    <Button variant="primary" className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Yeni Üye
                    </Button>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4 bg-zinc-800/50 border-zinc-700/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600/10 text-blue-500 rounded-lg">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-zinc-400">Toplam Üye</p>
                            <p className="text-xl font-bold text-zinc-100">{stats.total}</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-4 bg-zinc-800/50 border-zinc-700/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-600/10 text-emerald-500 rounded-lg">
                            <UserCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-zinc-400">Aktif Üye</p>
                            <p className="text-xl font-bold text-zinc-100">{stats.active}</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-4 bg-zinc-800/50 border-zinc-700/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-600/10 text-orange-500 rounded-lg">
                            <ShieldAlert className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-zinc-400">Riskli Üye</p>
                            <p className="text-xl font-bold text-zinc-100">{stats.atRisk}</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-4 bg-zinc-800/50 border-zinc-700/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-600/10 text-red-500 rounded-lg">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-zinc-400">Biten Üyelikler</p>
                            <p className="text-xl font-bold text-zinc-100">{stats.expiringToday}</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* List */}
            <div className="space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                        placeholder="İsim, e-posta veya salon ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                </div>

                <div className="space-y-2">
                    {filteredMembers.map((member) => (
                        <div
                            key={member.id}
                            onClick={() => router.push(`/users/${member.id}`)}
                            className="group flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-zinc-800/30 hover:bg-zinc-800 border border-zinc-700/30 hover:border-blue-600/30 rounded-xl transition-all cursor-pointer"
                        >
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-300 font-semibold shrink-0">
                                    {member.full_name?.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-sm font-semibold text-zinc-100 truncate group-hover:text-blue-400 transition-colors">
                                        {member.full_name}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-400">
                                        <Mail className="w-3 h-3" />
                                        <span className="truncate">{member.email}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-auto">
                                <div className="flex flex-col sm:items-end gap-1 min-w-[120px]">
                                    <span className="text-xs text-zinc-500 flex items-center gap-1">
                                        <Building2 className="w-3 h-3" />
                                        {member.gyms?.name || 'Bağımsız'}
                                    </span>
                                </div>

                                <div className="flex items-center gap-4">
                                    <span className={cn(
                                        "px-2.5 py-1 rounded text-xs font-medium min-w-[80px] text-center",
                                        getStatusStyles(member.status)
                                    )}>
                                        {getStatusLabel(member.status)}
                                    </span>
                                    <ArrowUpRight className="w-4 h-4 text-zinc-600 group-hover:text-blue-500 transition-colors" />
                                </div>
                            </div>
                        </div>
                    ))}

                    {filteredMembers.length === 0 && (
                        <div className="text-center py-20 bg-zinc-800/20 rounded-2xl border border-dashed border-zinc-700">
                            <Users className="w-12 h-12 mx-auto mb-4 text-zinc-600" />
                            <p className="text-sm text-zinc-500">Arama kriterlerine uygun üye bulunamadı.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
