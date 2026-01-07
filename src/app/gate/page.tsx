'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button } from '@/components/ui';
import { ShieldCheck, Lock, AlertCircle } from 'lucide-react';
import { verifyGateAccess } from './actions';
import { cn } from '@/lib/utils';

export default function MasterGatePage() {
    const router = useRouter();
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
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
            setError('Lütfen 6 haneli kodu girin');
            return;
        }

        setIsLoading(true);

        try {
            const result = await verifyGateAccess(enteredCode);

            if (result.success) {
                router.push('/login');
                router.refresh();
            } else {
                setError('Geçersiz erişim kodu');
                setCode(['', '', '', '', '', '']);
                inputRefs.current[0]?.focus();
            }
        } catch (err) {
            setError('Bağlantı hatası');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
            <Card className="w-full max-w-md p-8 sm:p-10 bg-zinc-900 border-zinc-800 shadow-2xl">
                <div className="text-center mb-8">
                    <div className={cn(
                        "w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-colors",
                        error
                            ? "bg-red-600"
                            : "bg-blue-600"
                    )}>
                        {error ? (
                            <AlertCircle className="w-8 h-8 text-white" />
                        ) : (
                            <Lock className="w-8 h-8 text-white" />
                        )}
                    </div>

                    <h1 className="text-2xl font-bold text-white mb-2">
                        Güvenli Erişim
                    </h1>
                    <p className="text-sm text-zinc-400">
                        Devam etmek için erişim kodunu girin
                    </p>
                </div>

                <div className="space-y-6">
                    {/* Error Message */}
                    {error && (
                        <div className="p-3 bg-red-600 text-white rounded-lg">
                            <p className="text-sm text-center font-medium">
                                {error}
                            </p>
                        </div>
                    )}

                    {/* Code Inputs */}
                    <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
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
                                className={cn(
                                    "w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold rounded-lg transition-all",
                                    "bg-zinc-800 border-2 text-white focus:outline-none focus:ring-2",
                                    error
                                        ? "border-red-600 focus:border-red-500 focus:ring-red-500/50"
                                        : digit
                                            ? "border-blue-600 focus:border-blue-500 focus:ring-blue-500/50"
                                            : "border-zinc-700 focus:border-blue-600 focus:ring-blue-500/50"
                                )}
                                disabled={isLoading}
                            />
                        ))}
                    </div>

                    {/* Submit Button */}
                    <Button
                        onClick={() => handleSubmit()}
                        disabled={isLoading || code.some(d => !d)}
                        variant="primary"
                        className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700"
                        isLoading={isLoading}
                    >
                        Doğrula
                    </Button>
                </div>

                {/* Footer */}
                <div className="mt-8 pt-6 border-t border-zinc-800 text-center">
                    <div className="flex items-center justify-center gap-2 text-zinc-500">
                        <ShieldCheck className="w-4 h-4" />
                        <p className="text-xs">
                            GymBoost Console v2.4
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
}