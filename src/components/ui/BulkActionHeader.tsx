'use client';

import { X, CheckCircle, Trash2, MessageSquare, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useBulkSelection } from '@/contexts/BulkSelectionContext';
import { useEffect } from 'react';

interface BulkActionHeaderProps {
    selectedCount: number;
    totalCount?: number;
    onSelectAll?: () => void;
    onClear: () => void;
    onMessage?: () => void;
    onDelete?: () => void;
    onApprove?: () => void;
    onReject?: () => void;
    actionLabels?: {
        message?: string;
        delete?: string;
        approve?: string;
        reject?: string;
    };
}

export function BulkActionHeader({
    selectedCount,
    totalCount,
    onSelectAll,
    onClear,
    onMessage,
    onDelete,
    onApprove,
    onReject,
    actionLabels
}: BulkActionHeaderProps) {
    const { setHasActiveSelection, registerCancelHandler } = useBulkSelection();

    // Sync Context State
    useEffect(() => {
        setHasActiveSelection(selectedCount > 0);
    }, [selectedCount, setHasActiveSelection]);

    // Register Cancel Handler
    useEffect(() => {
        registerCancelHandler(() => {
            onClear();
        });
    }, [onClear, registerCancelHandler]);

    if (selectedCount === 0) return null;

    const isAllSelected = totalCount !== undefined && selectedCount === totalCount;

    return (
        <div className="flex items-center gap-2 p-1.5 bg-zinc-900 border border-white/10 rounded-2xl animate-in slide-in-from-right-4 fade-in duration-300 shadow-xl">
            <div className="px-4 flex flex-col items-start justify-center border-r border-white/10 pr-4 mr-1 min-w-[100px]">
                <span className="text-xs font-black text-orange-500 uppercase tracking-wider">{selectedCount} SEÇİLDİ</span>
                {onSelectAll && (
                    <button
                        onClick={onSelectAll}
                        className="text-[9px] font-bold text-zinc-500 hover:text-white uppercase tracking-widest transition-colors flex items-center gap-1 mt-0.5"
                    >
                        {isAllSelected ? (
                            <><X className="w-3 h-3" /> Seçimi Kaldır</>
                        ) : (
                            <><CheckCircle className="w-3 h-3" /> Tümünü Seç</>
                        )}
                    </button>
                )}
            </div>

            {onMessage && (
                <Button
                    variant="ghost"
                    onClick={onMessage}
                    className="h-10 hover:bg-white/5 rounded-xl text-zinc-300 hover:text-white font-bold"
                >
                    <MessageSquare className="w-4 h-4 mr-2" /> {actionLabels?.message || 'Duyuru'}
                </Button>
            )}

            {onApprove && (
                <Button
                    variant="ghost"
                    onClick={onApprove}
                    className="h-10 hover:bg-emerald-500/10 rounded-xl text-emerald-500 hover:text-emerald-400 font-bold"
                >
                    <Check className="w-4 h-4 mr-2" /> {actionLabels?.approve || 'Onayla'}
                </Button>
            )}

            {onReject && (
                <Button
                    variant="ghost"
                    onClick={onReject}
                    className="h-10 hover:bg-red-500/10 rounded-xl text-red-500 hover:text-red-400 font-bold"
                >
                    <X className="w-4 h-4 mr-2" /> {actionLabels?.reject || 'Reddet'}
                </Button>
            )}

            {onDelete && (
                <Button
                    variant="ghost"
                    onClick={onDelete}
                    className="h-10 hover:bg-red-500/10 rounded-xl text-red-500 hover:text-red-400 font-bold"
                >
                    <Trash2 className="w-4 h-4 mr-2" /> {actionLabels?.delete || 'Sil'}
                </Button>
            )}

            <div className="w-px h-6 bg-white/10 mx-1" />

            <Button
                variant="ghost"
                size="icon"
                onClick={onClear}
                title="Seçimi Temizle"
                className="h-10 w-10 hover:bg-white/5 rounded-xl text-zinc-400 hover:text-white"
            >
                <X className="w-5 h-5" />
            </Button>
        </div>
    );
}
