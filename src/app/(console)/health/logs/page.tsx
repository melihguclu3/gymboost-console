'use client';

import { useEffect, useState } from 'react';
import { Card, Button, Input } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import {
    ScrollText,
    Search,
    Filter,
    Clock,
    AlertCircle,
    CheckCircle2,
    Info,
    ArrowLeft,
    RefreshCcw,
    Download,
    Mail,
    Building2,
    Plus,
    Pencil,
    Trash2,
    Megaphone,
    AlertTriangle
} from 'lucide-react';
import Link from 'next/link';

interface SystemLog {
    id: string;
    event_type: string;
    message: string;
    user_email: string;
    gym_name: string;
    created_at: string;
}

export default function FullLogsPage() {
    const [logs, setLogs] = useState<SystemLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const supabase = createClient();

    useEffect(() => {
        loadLogs();
    }, []);

    async function loadLogs() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('system_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);

            if (data) setLogs(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const getLogIcon = (type: string) => {
        switch (type) {
            case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
            case 'success': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
            case 'login': return <Mail className="w-4 h-4 text-blue-500" />;
            case 'create': return <Plus className="w-4 h-4 text-emerald-500" />;
            case 'update': return <Pencil className="w-4 h-4 text-amber-400" />;
            case 'delete': return <Trash2 className="w-4 h-4 text-red-500" />;
            case 'announcement': return <Megaphone className="w-4 h-4 text-orange-500" />;
            case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
            default: return <Info className="w-4 h-4 text-zinc-500" />;
        }
    };

    const filteredLogs = logs.filter(log =>
        log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.gym_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 text-left text-white">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/health">
                        <Button variant="secondary" className="bg-zinc-900 border-white/5 rounded-xl h-10 w-10 p-0">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-white flex items-center gap-2">
                            <ScrollText className="w-6 h-6 text-orange-500" /> Sistem Kayıt Defteri
                        </h1>
                        <p className="text-zinc-500 text-xs font-medium">Son 100 işlem ve olay kaydı</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button onClick={loadLogs} variant="secondary" className="bg-zinc-900 border-white/5 rounded-xl h-10 px-4 text-xs font-bold">
                        <RefreshCcw className={`w-3.5 h-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} /> Yenile
                    </Button>
                    <Button variant="secondary" className="bg-zinc-900 border-white/5 rounded-xl h-10 px-4 text-xs font-bold text-zinc-400">
                        <Download className="w-3.5 h-3.5 mr-2" /> Dışa Aktar
                    </Button>
                </div>
            </div>

            <Card className="p-4 bg-zinc-950/50 border-white/5">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                    <Input
                        placeholder="Mesaj, e-posta veya salon adı ile filtrele..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12 bg-zinc-900 border-white/5 h-12 rounded-xl text-sm"
                    />
                </div>
            </Card>

            <Card className="bg-zinc-950 border-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-white/5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                            <tr>
                                <th className="px-6 py-4">Olay</th>
                                <th className="px-6 py-4">Kullanıcı / Salon</th>
                                <th className="px-6 py-4">Mesaj</th>
                                <th className="px-6 py-4 text-right">Zaman</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {getLogIcon(log.event_type)}
                                            <span className="text-xs font-bold uppercase tracking-wide text-zinc-300">{log.event_type}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-0.5">
                                            <p className="text-xs font-bold text-white">{log.user_email || 'Sistem'}</p>
                                            {log.gym_name && (
                                                <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-bold uppercase">
                                                    <Building2 className="w-3 h-3 text-orange-500" /> {log.gym_name}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm text-zinc-200 font-medium leading-relaxed max-w-lg truncate group-hover:whitespace-normal">
                                            {log.message}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 text-xs font-bold text-zinc-400">
                                            <Clock className="w-3.5 h-3.5" />
                                            {new Date(log.created_at).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {!loading && filteredLogs.length === 0 && (
                    <div className="py-20 text-center space-y-4">
                        <ScrollText className="w-12 h-12 text-zinc-800 mx-auto" />
                        <p className="text-zinc-600 font-bold uppercase text-xs tracking-widest">Kayıt bulunamadı</p>
                    </div>
                )}
            </Card>
        </div>
    );
}
