'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, Button } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import {
    MessageSquare,
    Bug,
    Lightbulb,
    MessageCircle,
    HelpCircle,
    Search,
    Filter,
    RefreshCw,
    ExternalLink,
    Image as ImageIcon,
    Clock,
    CheckCircle2,
    Circle,
    AlertCircle,
    X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type FeedbackType = 'bug_report' | 'feature_request' | 'feedback' | 'question';
type Priority = 'low' | 'medium' | 'high' | 'critical';
type Status = 'new' | 'in_progress' | 'resolved' | 'closed';

interface Feedback {
    id: string;
    gym_id: string;
    type: FeedbackType;
    priority: Priority;
    status: Status;
    title: string;
    description: string;
    screenshot_url: string | null;
    context_data: {
        url?: string;
        pathname?: string;
        userAgent?: string;
        screenSize?: string;
        viewport?: string;
    };
    admin_response: string | null;
    admin_response_at: string | null;
    created_at: string;
    user: {
        id: string;
        full_name: string;
        email: string;
        role: string;
        avatar_url?: string;
    };
    gym?: {
        name: string;
    };
}

const TYPE_CONFIG = {
    bug_report: { label: 'Hata', icon: Bug, color: 'text-red-500 bg-red-500/10' },
    feature_request: { label: 'Özellik', icon: Lightbulb, color: 'text-yellow-500 bg-yellow-500/10' },
    feedback: { label: 'Geri Bildirim', icon: MessageCircle, color: 'text-blue-500 bg-blue-500/10' },
    question: { label: 'Soru', icon: HelpCircle, color: 'text-purple-500 bg-purple-500/10' },
};

const PRIORITY_CONFIG = {
    low: { label: 'Düşük', color: 'text-zinc-400 bg-zinc-800' },
    medium: { label: 'Orta', color: 'text-blue-400 bg-blue-900/50' },
    high: { label: 'Yüksek', color: 'text-orange-400 bg-orange-900/50' },
    critical: { label: 'Kritik', color: 'text-red-400 bg-red-900/50' },
};

const STATUS_CONFIG = {
    new: { label: 'Yeni', icon: Circle, color: 'text-blue-400 bg-blue-900/30' },
    in_progress: { label: 'İşleniyor', icon: Clock, color: 'text-yellow-400 bg-yellow-900/30' },
    resolved: { label: 'Çözüldü', icon: CheckCircle2, color: 'text-emerald-400 bg-emerald-900/30' },
    closed: { label: 'Kapatıldı', icon: X, color: 'text-zinc-400 bg-zinc-800' },
};

export default function FeedbackPage() {
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<FeedbackType | 'all'>('all');
    const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all');
    const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
    const [stats, setStats] = useState({ total: 0, new: 0, bug_reports: 0, feature_requests: 0 });

    const loadFeedbacks = useCallback(async () => {
        try {
            setLoading(true);
            const supabase = createClient();

            // Tüm feedback'leri çek (super admin, tüm gym'leri görebilir)
            const { data, error } = await supabase
                .from('feedback')
                .select(`
                    *,
                    user:users!feedback_user_id_fkey(id, full_name, email, role, avatar_url),
                    gym:gyms(name)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            setFeedbacks(data || []);

            // Stats
            const stats = {
                total: data?.length || 0,
                new: data?.filter(f => f.status === 'new').length || 0,
                bug_reports: data?.filter(f => f.type === 'bug_report').length || 0,
                feature_requests: data?.filter(f => f.type === 'feature_request').length || 0,
            };
            setStats(stats);

        } catch (error) {
            console.error('Load feedbacks error:', error);
            toast.error('Feedback\'ler yüklenemedi');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadFeedbacks();
    }, [loadFeedbacks]);

    // Filtreleme
    const filteredFeedbacks = feedbacks.filter(f => {
        if (typeFilter !== 'all' && f.type !== typeFilter) return false;
        if (statusFilter !== 'all' && f.status !== statusFilter) return false;
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                f.title.toLowerCase().includes(query) ||
                f.description.toLowerCase().includes(query) ||
                f.user?.full_name?.toLowerCase().includes(query) ||
                f.gym?.name?.toLowerCase().includes(query)
            );
        }
        return true;
    });

    return (
        <div className="min-h-screen bg-black text-white p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                            <MessageSquare className="w-8 h-8 text-blue-500" />
                            Kullanıcı Geri Bildirimleri
                        </h1>
                        <p className="text-zinc-500 mt-1">GymBoost kullanıcılarından gelen hata bildirimleri ve öneriler</p>
                    </div>
                    <Button
                        onClick={loadFeedbacks}
                        variant="secondary"
                        className="flex items-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Yenile
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4">
                    <Card className="bg-zinc-950 border-white/5 p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-xl">
                                <MessageSquare className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-xs text-zinc-500">Toplam</p>
                                <p className="text-2xl font-black">{stats.total}</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="bg-zinc-950 border-white/5 p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-xl">
                                <Circle className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-xs text-zinc-500">Yeni</p>
                                <p className="text-2xl font-black text-blue-500">{stats.new}</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="bg-zinc-950 border-white/5 p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-500/10 rounded-xl">
                                <Bug className="w-5 h-5 text-red-500" />
                            </div>
                            <div>
                                <p className="text-xs text-zinc-500">Bug</p>
                                <p className="text-2xl font-black text-red-500">{stats.bug_reports}</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="bg-zinc-950 border-white/5 p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-yellow-500/10 rounded-xl">
                                <Lightbulb className="w-5 h-5 text-yellow-500" />
                            </div>
                            <div>
                                <p className="text-xs text-zinc-500">Özellik</p>
                                <p className="text-2xl font-black text-yellow-500">{stats.feature_requests}</p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Ara..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-white/5 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-zinc-500" />
                        <select
                            value={typeFilter}
                            onChange={e => setTypeFilter(e.target.value as FeedbackType | 'all')}
                            className="px-3 py-2 bg-zinc-900 border border-white/5 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        >
                            <option value="all">Tüm Tipler</option>
                            <option value="bug_report">Hata</option>
                            <option value="feature_request">Özellik</option>
                            <option value="feedback">Geri Bildirim</option>
                            <option value="question">Soru</option>
                        </select>
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value as Status | 'all')}
                            className="px-3 py-2 bg-zinc-900 border border-white/5 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        >
                            <option value="all">Tüm Durumlar</option>
                            <option value="new">Yeni</option>
                            <option value="in_progress">İşleniyor</option>
                            <option value="resolved">Çözüldü</option>
                            <option value="closed">Kapatıldı</option>
                        </select>
                    </div>
                </div>

                {/* Feedback List */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : filteredFeedbacks.length === 0 ? (
                    <Card className="bg-zinc-950 border-white/5 p-12 text-center">
                        <MessageSquare className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                        <p className="text-zinc-500">Feedback bulunamadı</p>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {filteredFeedbacks.map(feedback => {
                            const typeConfig = TYPE_CONFIG[feedback.type];
                            const TypeIcon = typeConfig.icon;
                            const priorityConfig = PRIORITY_CONFIG[feedback.priority];
                            const statusConfig = STATUS_CONFIG[feedback.status];
                            const StatusIcon = statusConfig.icon;

                            return (
                                <Card
                                    key={feedback.id}
                                    className="bg-zinc-950 border-white/5 p-4 hover:border-white/10 transition-all cursor-pointer"
                                    onClick={() => setSelectedFeedback(feedback)}
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Icon */}
                                        <div className={cn('p-2 rounded-xl', typeConfig.color)}>
                                            <TypeIcon className="w-5 h-5" />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-4 mb-2">
                                                <h3 className="font-bold text-white text-lg">{feedback.title}</h3>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    <span className={cn('px-2 py-1 rounded-lg text-[10px] font-bold uppercase', priorityConfig.color)}>
                                                        {priorityConfig.label}
                                                    </span>
                                                    <span className={cn('px-2 py-1 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1', statusConfig.color)}>
                                                        <StatusIcon className="w-3 h-3" />
                                                        {statusConfig.label}
                                                    </span>
                                                </div>
                                            </div>

                                            <p className="text-sm text-zinc-400 mb-3 line-clamp-2">{feedback.description}</p>

                                            <div className="flex items-center gap-4 text-xs text-zinc-500">
                                                <span>{feedback.gym?.name || 'Bilinmeyen Salon'}</span>
                                                <span>•</span>
                                                <span>{feedback.user?.full_name || 'Bilinmeyen'}</span>
                                                <span>•</span>
                                                <span>{new Date(feedback.created_at).toLocaleDateString('tr-TR')}</span>
                                                {feedback.screenshot_url && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="flex items-center gap-1">
                                                            <ImageIcon className="w-3 h-3" />
                                                            Ekran görüntüsü
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {/* Detail Modal */}
                {selectedFeedback && (
                    <div
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setSelectedFeedback(null)}
                    >
                        <Card
                            className="bg-zinc-950 border-white/5 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-6 space-y-6">
                                {/* Header */}
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3 flex-1">
                                        <div className={cn('p-2 rounded-xl', TYPE_CONFIG[selectedFeedback.type].color)}>
                                            {(() => {
                                                const Icon = TYPE_CONFIG[selectedFeedback.type].icon;
                                                return <Icon className="w-5 h-5" />;
                                            })()}
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black text-white mb-2">{selectedFeedback.title}</h2>
                                            <div className="flex items-center gap-2">
                                                <span className={cn('px-2 py-1 rounded-lg text-[10px] font-bold uppercase', PRIORITY_CONFIG[selectedFeedback.priority].color)}>
                                                    {PRIORITY_CONFIG[selectedFeedback.priority].label}
                                                </span>
                                                <span className={cn('px-2 py-1 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1', STATUS_CONFIG[selectedFeedback.status].color)}>
                                                    {(() => {
                                                        const Icon = STATUS_CONFIG[selectedFeedback.status].icon;
                                                        return <Icon className="w-3 h-3" />;
                                                    })()}
                                                    {STATUS_CONFIG[selectedFeedback.status].label}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedFeedback(null)}
                                        className="p-2 hover:bg-zinc-900 rounded-lg transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Description */}
                                <div className="space-y-2">
                                    <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest">Açıklama</h3>
                                    <p className="text-zinc-300 whitespace-pre-wrap">{selectedFeedback.description}</p>
                                </div>

                                {/* Screenshot */}
                                {selectedFeedback.screenshot_url && (
                                    <div className="space-y-2">
                                        <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest">Ekran Görüntüsü</h3>
                                        <img
                                            src={selectedFeedback.screenshot_url}
                                            alt="Screenshot"
                                            className="w-full rounded-xl border border-white/5"
                                        />
                                    </div>
                                )}

                                {/* Context */}
                                <div className="space-y-2">
                                    <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest">Context Bilgisi</h3>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <span className="text-zinc-500">Salon:</span>
                                            <p className="text-white font-medium">{selectedFeedback.gym?.name || 'Bilinmiyor'}</p>
                                        </div>
                                        <div>
                                            <span className="text-zinc-500">Kullanıcı:</span>
                                            <p className="text-white font-medium">{selectedFeedback.user?.full_name} ({selectedFeedback.user?.role})</p>
                                        </div>
                                        <div>
                                            <span className="text-zinc-500">URL:</span>
                                            <a
                                                href={selectedFeedback.context_data.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
                                            >
                                                {selectedFeedback.context_data.pathname || selectedFeedback.context_data.url}
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </div>
                                        <div>
                                            <span className="text-zinc-500">Ekran Çözünürlüğü:</span>
                                            <p className="text-white font-medium">{selectedFeedback.context_data.viewport || 'Bilinmiyor'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* User Agent */}
                                {selectedFeedback.context_data.userAgent && (
                                    <div className="space-y-2">
                                        <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest">Tarayıcı</h3>
                                        <p className="text-xs text-zinc-400 font-mono">{selectedFeedback.context_data.userAgent}</p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
