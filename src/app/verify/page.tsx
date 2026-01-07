'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button } from '@/components/ui';
import { ShieldCheck, Mail, ArrowRight, RefreshCcw, Send } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function SuperVerifyPage() {
    const router = useRouter();
    const [step, setStep] = useState<'request' | 'verify'>('request');
    const [userEmail, setUserEmail] = useState('');
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data }) => {
            const email = data.user?.email?.trim() || '';
            if (!email) {
                router.push('/login');
                return;
            }
            setUserEmail(email);
        });
    }, [router]);

    const [countdown, setCountdown] = useState(0);
    const [resendCountdown, setResendCountdown] = useState(0);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (countdown > 0) {
            timer = setInterval(() => setCountdown(c => c - 1), 1000);
        }
        return () => clearInterval(timer);
    }, [countdown]);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (resendCountdown > 0) {
            timer = setInterval(() => setResendCountdown(c => c - 1), 1000);
        }
        return () => clearInterval(timer);
    }, [resendCountdown]);

    const sendEmailCode = async () => {
        if (!userEmail) {
            setError('E-posta bulunamadı. Lütfen yeniden giriş yapın.');
            return;
        }
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/admin/verify-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'E-posta gönderilemedi.');
            }

            const data = await response.json();
            setCountdown(typeof data.expiresIn === 'number' ? data.expiresIn : 300);
            setResendCountdown(typeof data.cooldown === 'number' ? data.cooldown : 30);
            setStep('verify');
        } catch (err: any) {
            setError(err.message || 'E-posta servisine ulaşılamadı.');
            setCountdown(0);
            setResendCountdown(0);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerify = () => {
        if (countdown === 0) {
            setError('Kodun süresi doldu. Lütfen yeni kod isteyin.');
            return;
        }

        verifyCode();
    };

    const verifyCode = async () => {
        if (!userEmail) {
            setError('E-posta bulunamadı. Lütfen yeniden giriş yapın.');
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            const response = await fetch('/api/admin/verify-email/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email: userEmail, code })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Doğrulama başarısız.');
            }

            router.push('/');
        } catch (err: any) {
            setError(err.message || 'Doğrulama sırasında hata oluştu.');
            setCode('');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
            <Card className="w-full max-w-md p-8 sm:p-10 bg-zinc-900 border-zinc-800 shadow-2xl">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <ShieldCheck className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">
                        Güvenlik Doğrulaması
                    </h1>
                    <p className="text-sm text-zinc-400">
                        E-posta doğrulaması gerekli
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-3 bg-red-600 text-white rounded-lg">
                        <p className="text-sm text-center font-medium">{error}</p>
                    </div>
                )}

                {step === 'request' ? (
                    <div className="space-y-6">
                        <div className="p-5 bg-zinc-800 rounded-lg border border-zinc-700 text-center">
                            <Mail className="w-8 h-8 text-zinc-400 mx-auto mb-3" />
                            <p className="text-sm text-zinc-300 leading-relaxed">
                                Sisteme tam yetki ile erişmek için <span className="text-white font-semibold">kayıtlı e-posta adresinize</span> bir güvenlik kodu gönderilecektir.
                            </p>
                        </div>
                        <Button
                            onClick={sendEmailCode}
                            isLoading={isLoading}
                            className="w-full h-12 bg-orange-600 hover:bg-orange-700 text-white font-semibold"
                        >
                            <Send className="w-4 h-4 mr-2" /> E-posta Kodu Gönder
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300 mb-2 block">
                                Doğrulama Kodu
                            </label>
                            <input
                                type="text"
                                maxLength={6}
                                placeholder="000000"
                                value={code}
                                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                                className={`w-full p-4 bg-zinc-800 border rounded-lg text-white text-2xl font-bold tracking-widest text-center outline-none transition-all ${countdown > 0 ? 'border-zinc-700 focus:border-orange-600 focus:ring-2 focus:ring-orange-600/50' : 'border-red-600 opacity-50 cursor-not-allowed'}`}
                                disabled={countdown === 0}
                            />
                            {countdown > 0 ? (
                                <p className="text-center text-sm font-medium text-orange-500">
                                    Kalan Süre: {countdown} saniye
                                </p>
                            ) : (
                                <p className="text-center text-sm font-medium text-red-500">
                                    Süre doldu
                                </p>
                            )}
                        </div>
                        <Button
                            onClick={handleVerify}
                            disabled={countdown === 0 || isLoading}
                            className="w-full h-12 bg-orange-600 hover:bg-orange-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Kontrol Ediliyor...' : 'Sistemi Aç'} <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                        <button
                            onClick={() => sendEmailCode()}
                            disabled={resendCountdown > 0}
                            className={`w-full text-sm font-medium flex items-center justify-center gap-2 transition-colors ${resendCountdown > 0 ? 'text-zinc-600 cursor-not-allowed' : 'text-zinc-400 hover:text-white'}`}
                        >
                            <RefreshCcw className="w-4 h-4" /> {resendCountdown > 0 ? `Tekrar göndermek için ${resendCountdown} sn` : 'Yeni Kod İste'}
                        </button>
                    </div>
                )}

                <div className="mt-8 pt-6 border-t border-zinc-800 text-center">
                    <p className="text-xs text-zinc-500">
                        GymBoost Security Protocol v2.2
                    </p>
                </div>
            </Card>
        </div>
    );
}
