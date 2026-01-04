'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button } from '@/components/ui';
import { KeyRound, ShieldAlert, Fingerprint, Loader2 } from 'lucide-react';
import Cookies from 'js-cookie';

export default function MasterGatePage() {
    const router = useRouter();
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [shake, setShake] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const GATE_CODE = '896903';

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

        // Auto-submit when all digits are entered
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
            setError('Lütfen 6 haneli kodu girin');
            return;
        }

        setIsLoading(true);

        // Simulate verification delay
        await new Promise(resolve => setTimeout(resolve, 800));

        if (enteredCode === GATE_CODE) {
            // Set gate access cookie (expires in 24 hours)
            Cookies.set('master-gate-access', 'granted', { expires: 1, secure: true, sameSite: 'strict' });
            router.push('/login');
        } else {
            setShake(true);
            setError('Geçersiz erişim kodu');
            setCode(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
            setTimeout(() => setShake(false), 500);
        }

        setIsLoading(false);
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decor - More subtle/dark for gate */}
            <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-red-900/5 blur-[150px] rounded-full" />
            <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-orange-900/5 blur-[150px] rounded-full" />

            {/* Scan lines effect */}
            <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.1)_2px,rgba(0,0,0,0.1)_4px)] pointer-events-none" />

            <Card className={`w-full max-w-md bg-zinc-950 border-white/5 shadow-2xl rounded-[3rem] overflow-hidden relative z-10 p-8 ${shake ? 'animate-shake' : ''}`}>
                <div className="text-center mb-10">
                    <div className="w-24 h-24 bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl relative">
                        <ShieldAlert className="w-12 h-12 text-zinc-500" />
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
                    </div>
                    <h1 className="text-xl font-black text-white tracking-tight uppercase text-center">
                        Kısıtlı Bölge
                    </h1>
                    <p className="text-zinc-600 text-[9px] font-black mt-3 text-center tracking-[0.4em] uppercase">
                        Erişim Kodu Gerekli
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-xs font-bold text-center flex items-center justify-center gap-2">
                        <ShieldAlert className="w-4 h-4" />
                        {error}
                    </div>
                )}

                <div className="space-y-8">
                    <div className="flex justify-center gap-3" onPaste={handlePaste}>
                        {code.map((digit, index) => (
                            <input
                                key={index}
                                ref={el => { inputRefs.current[index] = el; }}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                className="w-12 h-14 text-center text-xl font-black bg-zinc-900 border-2 border-white/10 rounded-xl text-white focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
                                disabled={isLoading}
                            />
                        ))}
                    </div>

                    <Button
                        onClick={() => handleSubmit()}
                        disabled={isLoading || code.some(d => !d)}
                        className="w-full h-14 bg-zinc-900 hover:bg-zinc-800 text-white font-black uppercase tracking-[0.2em] rounded-2xl border border-white/10 text-xs disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <Fingerprint className="w-4 h-4 mr-2" />
                                Doğrula
                            </>
                        )}
                    </Button>
                </div>

                <div className="mt-10 pt-8 border-t border-white/5 text-center">
                    <div className="flex items-center justify-center gap-2 text-zinc-700">
                        <KeyRound className="w-3 h-3" />
                        <p className="text-[8px] font-black uppercase tracking-[0.3em]">
                            Yetkisiz Erişim Kayıt Altına Alınır
                        </p>
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
                    animation: shake 0.5s ease-in-out;
                }
            `}</style>
        </div>
    );
}
