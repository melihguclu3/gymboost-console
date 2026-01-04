'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button } from '@/components/ui';
import { ShieldCheck, Fingerprint, Loader2, Lock, AlertTriangle, ScanLine } from 'lucide-react';
import { verifyGateAccess } from './actions';
import { cn } from '@/lib/utils';

export default function MasterGatePage() {
    const router = useRouter();
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [shake, setShake] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        inputRefs.current[0]?.focus();
    }, []);

    const handleChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;

        const newCode = [...code];
        newCode[index] = value.slice(-1);
        setCode(newCode);
        setError('');

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        if (newCode.every(digit => digit !== '') && index === 5) {
            handleSubmit(newCode.join(''));
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pastedData.length === 6) {
            const newCode = pastedData.split('');
            setCode(newCode);
            inputRefs.current[5]?.focus();
            handleSubmit(pastedData);
        }
    };

    const handleSubmit = async (submittedCode?: string) => {
        const enteredCode = submittedCode || code.join('');

        if (enteredCode.length !== 6) {
            setError('ERİŞİM REDDEDİLDİ: EKSİK VERİ');
            return;
        }

        setIsLoading(true);

        try {
            const result = await verifyGateAccess(enteredCode);

            if (result.success) {
                router.push('/login');
                router.refresh();
            } else {
                setShake(true);
                setError('ERİŞİM REDDEDİLDİ: GEÇERSİZ KİMLİK');
                setCode(['', '', '', '', '', '']);
                inputRefs.current[0]?.focus();
                setTimeout(() => setShake(false), 500);
            }
        } catch (err) {
            setError('SİSTEM HATASI: BAĞLANTI KESİLDİ');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden font-mono">
            {/* --- Cyberpunk Background Layers --- */}
            
            {/* 1. Grid Floor */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_100%)] pointer-events-none" />
            
            {/* 2. Red Alarm Pulse */}
            <div className={`absolute inset-0 bg-red-900/10 mix-blend-overlay transition-opacity duration-500 ${error ? 'opacity-100 animate-pulse' : 'opacity-0'}`} />

            {/* 3. Radial Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-600/5 blur-[120px] rounded-full pointer-events-none" />

            {/* 4. Scanlines */}
            <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,#000_3px)] opacity-20 pointer-events-none" />

            {/* --- Main Card --- */}
            <Card className={cn(
                "w-full max-w-md bg-zinc-950/60 backdrop-blur-xl border-white/10 shadow-[0_0_50px_-12px_rgba(0,0,0,1)] rounded-3xl overflow-hidden relative z-10 p-10 transition-all duration-300",
                shake && "animate-shake border-red-500/50 shadow-[0_0_50px_-12px_rgba(239,68,68,0.5)]",
                !shake && "hover:border-orange-500/30 hover:shadow-[0_0_50px_-12px_rgba(249,115,22,0.3)]"
            )}>
                {/* Decor: Corner brackets */}
                <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-white/20 rounded-tl-lg" />
                <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-white/20 rounded-tr-lg" />
                <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-white/20 rounded-bl-lg" />
                <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-white/20 rounded-br-lg" />

                <div className="text-center mb-10 relative">
                    <div className={cn(
                        "w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center border transition-all duration-500 relative overflow-hidden group",
                        error ? "bg-red-500/10 border-red-500/50" : "bg-orange-500/10 border-orange-500/50"
                    )}>
                        {/* Rotating ring inside icon */}
                        <div className="absolute inset-0 border-2 border-dashed border-white/20 rounded-2xl animate-[spin_10s_linear_infinite]" />
                        
                        {isLoading ? (
                            <Loader2 className="w-8 h-8 text-white animate-spin" />
                        ) : error ? (
                            <AlertTriangle className="w-8 h-8 text-red-500 animate-pulse" />
                        ) : (
                            <Lock className="w-8 h-8 text-orange-500 group-hover:scale-110 transition-transform" />
                        )}
                    </div>
                    
                    <h1 className="text-2xl font-black text-white tracking-tighter uppercase mb-2">
                        Sistem <span className="text-orange-500">Kilitli</span>
                    </h1>
                    <div className="flex items-center justify-center gap-2 text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em]">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        Güvenli Bağlantı Gerekli
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Status Display */}
                    <div className={cn(
                        "h-8 flex items-center justify-center text-[10px] font-bold uppercase tracking-widest transition-colors rounded bg-black/50 border",
                        error ? "text-red-400 border-red-500/30 bg-red-950/30" : "text-zinc-600 border-white/5"
                    )}>
                        {error || (isLoading ? "ŞİFRELEME DOĞRULANIYOR..." : "ERİŞİM KODUNU GİRİN")}
                    </div>

                    <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
                        {code.map((digit, index) => (
                            <div key={index} className="relative group">
                                <input
                                    ref={el => { inputRefs.current[index] = el; }}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    className={cn(
                                        "w-10 h-14 sm:w-12 sm:h-16 text-center text-xl sm:text-2xl font-black bg-black/50 border border-white/10 rounded-lg text-white transition-all focus:outline-none focus:scale-110 relative z-10",
                                        "focus:border-orange-500 focus:shadow-[0_0_15px_rgba(249,115,22,0.5)] focus:text-orange-500",
                                        error && "border-red-500/50 text-red-500 focus:border-red-500 focus:text-red-500 focus:shadow-[0_0_15px_rgba(239,68,68,0.5)]",
                                        digit && !error && "border-orange-500/50 text-orange-500"
                                    )}
                                    disabled={isLoading}
                                />
                                {/* Bottom glow bar for each input */}
                                <div className={cn(
                                    "absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-orange-500 transition-all duration-300",
                                    (digit || index === code.findIndex(c => c === '')) && "w-8 shadow-[0_0_10px_orange]"
                                )} />
                            </div>
                        ))}
                    </div>

                    <Button
                        onClick={() => handleSubmit()}
                        disabled={isLoading || code.some(d => !d)}
                        className={cn(
                            "w-full h-14 font-black uppercase tracking-[0.2em] rounded-xl border text-xs transition-all duration-300 relative overflow-hidden group",
                            "bg-white text-black hover:bg-orange-500 hover:text-white hover:border-orange-500 border-white/20",
                            "disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-black"
                        )}
                    >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />}
                            Kimliği Doğrula
                        </span>
                        {/* Button Shine Effect */}
                        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-500 ease-in-out" />
                    </Button>
                </div>

                <div className="mt-10 pt-6 border-t border-white/5 text-center">
                    <div className="flex flex-col gap-1 items-center justify-center text-zinc-700">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-3 h-3" />
                            <p className="text-[9px] font-bold uppercase tracking-[0.2em]">GymBoost Güvenlik Çekirdeği v2.0</p>
                        </div>
                        <p className="text-[8px] opacity-50">YETKİSİZ ERİŞİM DENEMELERİ KAYDEDİLMEKTEDİR</p>
                    </div>
                </div>
            </Card>

            <style jsx global>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
                    20%, 40%, 60%, 80% { transform: translateX(4px); }
                }
                .animate-shake {
                    animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
                }
            `}</style>
        </div>
    );
}