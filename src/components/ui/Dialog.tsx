'use client';

import { X, AlertTriangle, AlertCircle, HelpCircle } from 'lucide-react';
import { Card, Button } from '@/components/ui';
import { useEffect } from 'react';

export type DialogType = 'alert' | 'confirm' | 'danger';

interface DialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm?: () => void;
    title: string;
    description: React.ReactNode;
    type?: DialogType;
    confirmText?: string;
    cancelText?: string;
}

export function Dialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    type = 'alert',
    confirmText = 'Tamam',
    cancelText = 'Vazgeç'
}: DialogProps) {
    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'danger':
                return <AlertTriangle className="w-8 h-8 text-red-500" />;
            case 'confirm':
                return <HelpCircle className="w-8 h-8 text-orange-500" />;
            default:
                return <AlertCircle className="w-8 h-8 text-blue-500" />;
        }
    };

    const getConfirmButtonStyles = () => {
        switch (type) {
            case 'danger':
                return "bg-red-600 hover:bg-red-700 text-white shadow-red-900/20";
            case 'confirm':
                return "bg-orange-600 hover:bg-orange-700 text-white shadow-orange-900/20";
            default:
                return "bg-zinc-800 hover:bg-zinc-700 text-white border-white/5";
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal Content */}
            <Card
                variant="glass"
                padding="none"
                className="w-full max-w-sm border-white/10 shadow-3xl relative overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
            >
                {/* Visual Accent */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 ${type === 'danger' ? 'bg-red-500' : type === 'confirm' ? 'bg-orange-500' : 'bg-blue-500'
                    }`} />

                <div className="p-8">
                    {/* Icon & Title */}
                    <div className="flex flex-col items-center text-center">
                        <div className={`p-4 rounded-3xl mb-6 ${type === 'danger' ? 'bg-red-500/10' : type === 'confirm' ? 'bg-orange-500/10' : 'bg-blue-500/10'
                            }`}>
                            {getIcon()}
                        </div>

                        <h3 className="text-xl font-black text-white uppercase tracking-tight mb-3">
                            {title}
                        </h3>

                        <div className="text-zinc-400 font-medium leading-relaxed">
                            {description}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-10 flex flex-col sm:flex-row gap-3">
                        {type !== 'alert' && (
                            <Button
                                variant="secondary"
                                onClick={onClose}
                                className="flex-1 h-14 bg-zinc-900/50 hover:bg-zinc-800 border-white/5 uppercase tracking-widest font-black text-xs"
                            >
                                {cancelText}
                            </Button>
                        )}
                        <Button
                            onClick={() => {
                                if (onConfirm) onConfirm();
                                onClose();
                            }}
                            className={`flex-1 h-14 uppercase tracking-widest font-black text-xs ${getConfirmButtonStyles()}`}
                        >
                            {confirmText}
                        </Button>
                    </div>
                </div>

                {/* Close Button (X) */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full text-zinc-500 hover:text-white hover:bg-white/10 transition-all"
                >
                    <X className="w-5 h-5" />
                </button>
            </Card>
        </div>
    );
}
