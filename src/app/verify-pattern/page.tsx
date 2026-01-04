'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui';
import { PatternLock } from '@/components/PatternLock';
import { verifyPattern } from './actions';
import { Grid3X3, LockKeyhole, ShieldCheck, Fingerprint } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PatternVerifyPage() {
    const router = useRouter();
    const [error, setError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handlePatternComplete = async (pattern: number[]) => {
        setIsLoading(true);
        setError(false);

        try {
            const result = await verifyPattern(pattern);
            
            if (result.success) {
                // Success animation delay
                setTimeout(() => {
                    router.push('/login');
                    router.refresh();
                }, 300);
            } else {
                setError(true);
            }
        } catch (e) {
            setError(true);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden font-mono">
            {/* --- Cyberpunk Background Layers --- */}
            
            {/* 1. Hex Pattern */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none" />
            
            {/* 2. Gradient Orbs */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(249,115,22,0.15),transparent_50%)] pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-900/10 blur-[100px] rounded-full pointer-events-none" />

            {/* --- Main Card --- */}
            <Card className={cn(
                "w-full max-w-md bg-zinc-950/70 backdrop-blur-3xl border-white/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,1)] rounded-[2.5rem] p-8 flex flex-col items-center text-center relative z-10 transition-colors duration-500",
                error && "border-red-500/30 bg-red-950/20"
            )}>
                {/* Header Section */}
                <div className="mb-8 w-full">
                    <div className="flex items-center justify-between px-2 mb-6">
                         <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                             <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Geçiş İzni: Onaylandı</span>
                         </div>
                         <LockKeyhole className="w-4 h-4 text-zinc-600" />
                    </div>

                    <div className="relative">
                        <div className={cn(
                            "w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center border transition-all duration-300 shadow-lg",
                            error 
                                ? "bg-red-500/10 border-red-500/50 shadow-red-500/20" 
                                : "bg-gradient-to-br from-zinc-800 to-zinc-900 border-white/10 shadow-orange-500/5"
                        )}>
                            <Fingerprint className={cn(
                                "w-8 h-8 transition-colors",
                                error ? "text-red-500" : "text-zinc-400"
                            )} />
                        </div>
                        {error && (
                            <div className="absolute -right-4 top-0 bg-red-500 text-white text-[9px] font-black px-2 py-1 rounded uppercase tracking-wider animate-bounce">
                                Geçersiz Desen
                            </div>
                        )}
                    </div>
                    
                    <h1 className="text-xl font-black text-white tracking-tight uppercase">
                        Biyometrik Doğrulama
                    </h1>
                    <p className="text-zinc-500 text-[10px] mt-2 font-medium tracking-wide uppercase">
                        16 noktalı güvenlik desenini çizin
                    </p>
                </div>

                {/* The Pattern Lock Component */}
                <div className="w-full flex justify-center py-2 relative">
                    <div className="absolute inset-0 bg-orange-500/5 blur-3xl rounded-full pointer-events-none" />
                    <PatternLock 
                        onComplete={handlePatternComplete} 
                        error={error}
                        disabled={isLoading}
                    />
                </div>

                {/* Footer Info */}
                <div className="mt-8 flex items-center gap-3 py-2 px-4 rounded-full bg-white/5 border border-white/5">
                    <ShieldCheck className="w-3 h-3 text-orange-500" />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">
                        Seviye 4 Güvenlik İzni
                    </span>
                </div>
            </Card>
        </div>
    );
}