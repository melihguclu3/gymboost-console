'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link, { LinkProps } from 'next/link';
import { useRouter } from 'next/navigation';
import { useBulkSelection } from '@/contexts/BulkSelectionContext';
import { AlertTriangle, LogOut, ShieldAlert, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ProtectedLinkProps extends LinkProps {
    children: React.ReactNode;
    className?: string;
    onClick?: (e: React.MouseEvent) => void;
    title?: string; // Optional title for accessibility
    warning?: {
        title: string;
        message: string;
        confirmText: string;
        timer?: number;
    };
}

export function ProtectedLink({ children, onClick, warning, ...props }: ProtectedLinkProps) {
    const router = useRouter();
    const { hasActiveSelection, triggerCancel } = useBulkSelection();
    const [showConfirm, setShowConfirm] = useState(false);
    const [showWarning, setShowWarning] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleClick = (e: React.MouseEvent) => {
        if (hasActiveSelection) {
            e.preventDefault();
            e.stopPropagation();
            setShowConfirm(true);
            return;
        }

        if (warning) {
            e.preventDefault();
            e.stopPropagation();
            setCountdown(warning.timer || 0);
            setShowWarning(true);
            return;
        }

        if (onClick) {
            onClick(e);
        }
    };

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (showWarning && countdown > 0) {
            timer = setInterval(() => {
                setCountdown(prev => prev - 1);
            }, 1000);
        } else if (showWarning && countdown === 0) {
            // Otomatik yönlendirme (Süre dolduğunda)
            setShowWarning(false);
            if (props.href) router.push(props.href.toString());
        }
        return () => clearInterval(timer);
    }, [showWarning, countdown, props.href, router]);

    const handleConfirmCancel = (e: React.MouseEvent) => {
        e.stopPropagation();
        triggerCancel();
        setShowConfirm(false);
        if (onClick) onClick(e);
        if (props.href) router.push(props.href.toString());
    };

    const handleConfirmWarning = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowWarning(false);
        if (onClick) onClick(e);
        if (props.href) router.push(props.href.toString());
    };

    return (
        <>
            <Link {...props} onClick={handleClick}>
                {children}
            </Link>

            {mounted && showConfirm && createPortal(
                <div 
                    className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" 
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="bg-zinc-950 border border-white/10 rounded-3xl p-8 max-w-sm w-full text-center space-y-6 shadow-2xl">
                        <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto">
                            <LogOut className="w-8 h-8 text-orange-500" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white mb-2">Seçimi İptal Et?</h3>
                            <p className="text-zinc-400 text-sm">
                                Başka bir sayfaya geçerseniz seçimleriniz kaybolacak. Devam etmek istiyor musunuz?
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Button 
                                variant="secondary" 
                                onClick={(e) => { e.stopPropagation(); setShowConfirm(false); }} 
                                className="flex-1 h-12 rounded-xl font-bold bg-zinc-900 border border-white/10 hover:bg-zinc-800 text-white"
                            >
                                Kal
                            </Button>
                            <Button
                                onClick={handleConfirmCancel}
                                className="flex-1 h-12 rounded-xl font-bold bg-orange-600 hover:bg-orange-700 text-white"
                            >
                                Evet, İlerle
                            </Button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {mounted && showWarning && warning && createPortal(
                <div 
                    className="fixed inset-0 z-[999] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in duration-500" 
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="bg-zinc-950 border border-white/10 rounded-[2.5rem] p-10 max-w-lg w-full text-center relative overflow-hidden shadow-2xl">
                        {/* Ambient Background Aura */}
                        <div className="absolute -top-24 -left-24 w-48 h-48 bg-orange-500/20 rounded-full blur-[80px]" />
                        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-red-500/20 rounded-full blur-[80px]" />

                        <div className="relative z-10 space-y-8">
                            <div className="w-20 h-20 rounded-[2rem] bg-orange-500/10 flex items-center justify-center mx-auto border border-orange-500/20 shadow-[0_0_30px_rgba(249,115,22,0.2)]">
                                <ShieldAlert className="w-10 h-10 text-orange-500" />
                            </div>
                            
                            <div className="space-y-3">
                                <h3 className="text-2xl font-black text-white tracking-tight uppercase">{warning.title}</h3>
                                <p className="text-zinc-400 text-sm font-medium leading-relaxed">
                                    {warning.message}
                                </p>
                            </div>

                            <div className="flex flex-col gap-3">
                                <Button
                                    onClick={handleConfirmWarning}
                                    className="w-full h-14 rounded-2xl font-black uppercase tracking-widest bg-white text-black hover:bg-zinc-200 transition-all shadow-xl flex items-center justify-center gap-3 group"
                                >
                                    {warning.confirmText}
                                    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                </Button>
                                
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setShowWarning(false); }}
                                    className="text-[11px] font-black text-zinc-400 hover:text-white uppercase tracking-[0.2em] py-2.5 transition-colors cursor-pointer"
                                >
                                    Vazgeç ve Geri Dön
                                </button>
                            </div>

                            {countdown > 0 && (
                                <div className="absolute top-6 right-8">
                                    <div className="relative w-10 h-10 flex items-center justify-center">
                                        <svg className="w-10 h-10 transform -rotate-90">
                                            <circle
                                                cx="20"
                                                cy="20"
                                                r="18"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                fill="transparent"
                                                className="text-white/5"
                                            />
                                            <circle
                                                cx="20"
                                                cy="20"
                                                r="18"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                fill="transparent"
                                                strokeDasharray="113"
                                                strokeDashoffset={113 - (113 * (countdown / (warning.timer || 5)))}
                                                className="text-orange-500 transition-all duration-1000"
                                            />
                                        </svg>
                                        <span className="absolute text-[10px] font-black text-white">{countdown}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
