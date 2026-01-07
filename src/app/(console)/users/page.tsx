'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { GymSelector } from '@/components/GymSelector';
import {
    Users,
    Search,
    Building2,
    UserCheck,
    Mail,
    ArrowUpRight,
    ShieldAlert,
    Clock,
    AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface GlobalMember {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    created_at: string;
    status: string;
    gym_id: string;
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
    const [selectedGymId, setSelectedGymId] = useState<string | null>(null);
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        atRisk: 0,
        expiringToday: 0
    });

    const supabase = createClient();

    const loadGlobalMembers = useCallback(async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('users')
                .select(`
                    id,
                    full_name,
                    email,
                    phone,
                    created_at,
                    status,
                    gym_id,
                    gyms (name),
                    memberships (status, end_date, plan_type)
                `)
                .eq('role', 'member')
                .order('created_at', { ascending: false });

            if (selectedGymId) {
                query = query.eq('gym_id', selectedGymId);
            }

            const { data, error } = await query;

            if (error) throw error;

            if (data) {
                setMembers(data as any);

                const todayStr = new Date().toISOString().split('T')[0];

                // Active: has at least one active membership
                const activeCount = data.filter((m: any) =>
                    m.memberships?.some((ms: any) => ms.status === 'active')
                ).length;

                // At Risk: membership expired or will expire in next 7 days
                const sevenDaysLater = new Date();
                sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
                const sevenDaysStr = sevenDaysLater.toISOString().split('T')[0];

                const atRiskCount = data.filter((m: any) => {
                    // User is suspended
                    if (m.status === 'suspended') return true;

                    // Check if any membership is expiring soon or expired
                    const activeMembership = m.memberships?.find((ms: any) => ms.status === 'active');
                    if (activeMembership && activeMembership.end_date) {
                        const endDate = activeMembership.end_date.split('T')[0];
                        return endDate <= sevenDaysStr && endDate >= todayStr;
                    }

                    // No active membership at all
                    return m.memberships?.length === 0 ||
                        !m.memberships?.some((ms: any) => ms.status === 'active');
                }).length;

                // Expiring today
                const expiringTodayCount = data.filter((m: any) =>
                    m.memberships?.some((ms: any) =>
                        ms.status === 'active' && ms.end_date?.startsWith(todayStr)
                    )
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
    }, [supabase, selectedGymId]);

    useEffect(() => {
        loadGlobalMembers();
    }, [loadGlobalMembers]);

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

    const getMembershipBadge = (memberships: any[]) => {
        if (!memberships || memberships.length === 0) {
            return <span className="text-xs px-2 py-0.5 rounded bg-zinc-700 text-zinc-400">Üyelik Yok</span>;
        }

        const activeMembership = memberships.find(m => m.status === 'active');
        if (!activeMembership) {
            return <span className="text-xs px-2 py-0.5 rounded bg-red-600/10 text-red-400">Süresi Dolmuş</span>;
        }

        const endDate = new Date(activeMembership.end_date);
        const today = new Date();
        const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysLeft <= 0) {
            return <span className="text-xs px-2 py-0.5 rounded bg-red-600/10 text-red-400">Süresi Doldu</span>;
        }
        if (daysLeft <= 7) {
            return <span className="text-xs px-2 py-0.5 rounded bg-orange-600/10 text-orange-400">{daysLeft} gün kaldı</span>;
        }
        return <span className="text-xs px-2 py-0.5 rounded bg-emerald-600/10 text-emerald-400">{daysLeft} gün</span>;
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
                    <p className="text-sm text-zinc-300 mt-1">
                        {selectedGymId ? 'Salon bazlı' : 'Tüm salonların'} üye listesi ({stats.total} üye)
                    </p>
                </div>
                <GymSelector
                    value={selectedGymId}
                    onChange={setSelectedGymId}
                    showAllOption={true}
                    allLabel="Tüm Salonlar"
                />
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4 bg-zinc-800/50 border-zinc-700/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600/10 text-blue-500 rounded-lg">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-zinc-300">Toplam Üye</p>
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
                            <p className="text-sm font-medium text-zinc-300">Aktif Üyelik</p>
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
                            <p className="text-sm font-medium text-zinc-300">Riskli Üye</p>
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
                            <p className="text-sm font-medium text-zinc-300">Bugün Bitiyor</p>
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

                <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-zinc-900/50 text-zinc-400 border-b border-zinc-700/50">
                            <tr>
                                <th className="px-6 py-3 font-medium">Üye</th>
                                {!selectedGymId && <th className="px-6 py-3 font-medium">Salon</th>}
                                <th className="px-6 py-3 font-medium">Durum</th>
                                <th className="px-6 py-3 font-medium">Üyelik</th>
                                <th className="px-6 py-3 font-medium w-16"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-700/50">
                            {filteredMembers.length > 0 ? filteredMembers.map((member) => (
                                <tr
                                    key={member.id}
                                    onClick={() => router.push(`/users/${member.id}`)}
                                    className="hover:bg-zinc-700/10 transition-colors cursor-pointer group"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-300 font-semibold text-sm">
                                                {member.full_name?.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-medium text-zinc-200">{member.full_name}</div>
                                                <div className="text-xs text-zinc-400 flex items-center gap-1">
                                                    <Mail className="w-3 h-3" />
                                                    {member.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    {!selectedGymId && (
                                        <td className="px-6 py-4 text-zinc-300 text-xs">
                                            <div className="flex items-center gap-2">
                                                <Building2 className="w-3.5 h-3.5 text-zinc-500" />
                                                {member.gyms?.name || 'Bağımsız'}
                                            </div>
                                        </td>
                                    )}
                                    <td className="px-6 py-4">
                                        <span className={cn(
                                            "px-2 py-1 rounded text-xs font-medium",
                                            getStatusStyles(member.status)
                                        )}>
                                            {getStatusLabel(member.status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {getMembershipBadge(member.memberships)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <ArrowUpRight className="w-4 h-4 text-zinc-600 group-hover:text-blue-500 transition-colors" />
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={selectedGymId ? 4 : 5} className="px-6 py-12 text-center text-zinc-500">
                                        <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        {selectedGymId ? 'Bu salonda üye bulunamadı.' : 'Üye bulunamadı.'}
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
