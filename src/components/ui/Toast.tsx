'use client';

import { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

interface ToastProps {
    message: string;
    subMessage?: string;
    type?: 'success' | 'error';
    isVisible: boolean;
    onClose: () => void;
}

export function Toast({ message, subMessage, type = 'success', isVisible, onClose }: ToastProps) {
    useEffect(() => {
        if (isVisible) {
            // Otomatik kapanma
            const timer = setTimeout(() => {
                onClose();
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [isVisible, onClose]);

    if (!isVisible) return null;

    return (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="bg-zinc-950 border border-white/20 text-white px-5 py-4 rounded-xl shadow-2xl flex items-start gap-4 min-w-[380px] max-w-lg">
                {type === 'success' ? (
                    <div className="p-2 bg-green-500/10 border border-green-500/20 rounded-full shrink-0">
                        <CheckCircle className="w-6 h-6 text-green-500" />
                    </div>
                ) : (
                    <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-full shrink-0">
                        <XCircle className="w-6 h-6 text-red-500" />
                    </div>
                )}

                <div className="flex-1 pt-0.5">
                    <h4 className="font-bold text-white text-base leading-tight mb-1">{message}</h4>
                    {subMessage && <p className="text-sm text-zinc-300 leading-snug">{subMessage}</p>}
                </div>

                <button
                    onClick={onClose}
                    className="p-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer text-zinc-400 hover:text-white shrink-0 -mr-2 -mt-2"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
