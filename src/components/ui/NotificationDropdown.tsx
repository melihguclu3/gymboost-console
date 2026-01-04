'use client';

import type { ReactNode } from 'react';
import {
    Bell,
    CheckCircle2,
    Wallet,
    Package,
    User,
    Info,
    Check,
    Clock,
    ChevronRight,
    Calendar,
    Dumbbell
} from 'lucide-react';

// Simple class merger utility
function cn(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(' ');
}

interface Notification {
    id: string;
    title: string;
    body: string;
    read: boolean;
    created_at: string;
    type?: string;
}

interface NotificationDropdownProps {
    notifications: Notification[];
    unreadCount: number;
    onMarkAsRead: (id: string) => void;
    onMarkAllAsRead: () => void;
    onItemClick: (notification: Notification) => void;
    isOpen: boolean;
    onClose: () => void;
    className?: string; // Konumlandırma için (lg:right-0 vb.)
    topContent?: ReactNode;
}

export function NotificationDropdown({
    notifications,
    unreadCount,
    onMarkAllAsRead,
    onItemClick,
    isOpen,
    onClose,
    className,
    topContent
}: NotificationDropdownProps) {
    if (!isOpen) return null;

    // İçeriğe göre ikon seçici
    const getIcon = (title: string, body: string) => {
        const text = (title + body).toLowerCase();
        if (text.includes('onay') || text.includes('approval')) return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
        if (text.includes('ödeme') || text.includes('payment') || text.includes('tahsilat')) return <Wallet className="w-5 h-5 text-emerald-400" />;
        if (text.includes('stok') || text.includes('envanter')) return <Package className="w-5 h-5 text-purple-500" />;
        if (text.includes('üye') || text.includes('kayıt')) return <User className="w-5 h-5 text-blue-500" />;
        if (text.includes('seans') || text.includes('randevu')) return <Calendar className="w-5 h-5 text-orange-500" />;
        if (text.includes('antrenman') || text.includes('program')) return <Dumbbell className="w-5 h-5 text-yellow-500" />;
        return <Info className="w-5 h-5 text-zinc-400" />;
    };

    // Basit zaman hesaplayıcı (date-fns yerine)
    const getTimeAgo = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            const now = new Date();
            const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

            if (diffInSeconds < 60) return 'Az önce';

            const diffInMinutes = Math.floor(diffInSeconds / 60);
            if (diffInMinutes < 60) return `${diffInMinutes} dk önce`;

            const diffInHours = Math.floor(diffInMinutes / 60);
            if (diffInHours < 24) return `${diffInHours} sa önce`;

            const diffInDays = Math.floor(diffInHours / 24);
            return `${diffInDays} gün önce`;
        } catch {
            return '';
        }
    };

    return (
        <>
            {/* Backdrop for mobile */}
            <div className="fixed inset-0 z-40 lg:hidden" onClick={onClose} />

            {/* Backdrop for desktop (invisible, just to catch clicks outside) */}
            <div className="fixed inset-0 z-40 hidden lg:block" onClick={onClose} />

            <div
                className={cn(
                    "absolute z-50 w-full max-w-[360px] lg:w-[400px] mt-2",
                    "bg-zinc-950/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl",
                    "animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200",
                    "overflow-hidden ring-1 ring-black/50",
                    className
                )}
            >
                {/* Header */}
                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Bell className="w-5 h-5 text-white" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-zinc-900 animate-pulse" />
                            )}
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-white tracking-wide">BİLDİRİMLER</h3>
                            <p className="text-[10px] text-zinc-400 font-medium">
                                {unreadCount > 0 ? `${unreadCount} okunmamış bildirim` : 'Tüm bildirimler okundu'}
                            </p>
                        </div>
                    </div>

                    {unreadCount > 0 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onMarkAllAsRead(); }}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 transition-colors group"
                        >
                            <span className="text-[10px] font-bold uppercase tracking-wider">Tümünü Oku</span>
                            <Check className="w-3 h-3 group-hover:scale-110 transition-transform" />
                        </button>
                    )}
                </div>

                {topContent}

                {/* List */}
                <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
                    {notifications.length > 0 ? (
                        <div className="divide-y divide-white/5">
                            {notifications.map((n) => (
                                <div
                                    key={n.id}
                                    onClick={() => onItemClick(n)}
                                    className={cn(
                                        "relative group p-4 flex gap-4 transition-all duration-200 cursor-pointer overflow-hidden",
                                        "hover:bg-white/[0.03]",
                                        !n.read ? "bg-orange-500/[0.02]" : ""
                                    )}
                                >
                                    {/* Unread Indicator Bar */}
                                    {!n.read && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
                                    )}

                                    {/* Icon Box */}
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-colors",
                                        !n.read
                                            ? "bg-zinc-900 border-orange-500/20 shadow-[0_0_15px_rgba(0,0,0,0.3)]"
                                            : "bg-zinc-900/50 border-white/5"
                                    )}>
                                        {getIcon(n.title, n.body)}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0 py-0.5">
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <h4 className={cn(
                                                "text-xs font-bold leading-tight",
                                                !n.read ? "text-white" : "text-zinc-400 group-hover:text-zinc-200"
                                            )}>
                                                {n.title}
                                            </h4>
                                            <span className="text-[9px] text-zinc-500 whitespace-nowrap font-mono flex items-center gap-1 shrink-0">
                                                <Clock className="w-2.5 h-2.5" />
                                                {getTimeAgo(n.created_at)}
                                            </span>
                                        </div>
                                        <p className={cn(
                                            "text-[11px] leading-relaxed line-clamp-2",
                                            !n.read ? "text-zinc-300" : "text-zinc-500"
                                        )}>
                                            {n.body}
                                        </p>
                                    </div>

                                    {/* Arrow */}
                                    <div className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity -mr-2">
                                        <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-orange-500" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-16 px-6 flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 rounded-3xl bg-zinc-900/50 border border-white/5 flex items-center justify-center mb-4 relative overflow-hidden">
                                <Bell className="w-8 h-8 text-zinc-700" />
                                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent animate-shimmer" />
                            </div>
                            <h4 className="text-white text-sm font-bold mb-1">Bildirim Yok</h4>
                            <p className="text-zinc-500 text-xs max-w-[200px]">
                                Şu an için görüntülenecek yeni bir bildiriminiz bulunmuyor.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                    <button
                        onClick={onMarkAllAsRead}
                        className="w-full py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white hover:bg-white/5 transition-colors border-t border-white/5"
                    >
                        Tümünü Temizle
                    </button>
                )}
            </div>
        </>
    );
}
