'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Input } from '@/components/ui';
import { ShieldCheck, Mail, Lock, ArrowRight, Smartphone, Sparkles, Loader2, RefreshCcw, Send } from 'lucide-react';
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

    // Countdown timer effect
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
            setError('E-posta bulunamadi. Lutfen yeniden giris yapin.');
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
            setError('E-posta bulunamadi. Lutfen yeniden giris yapin.');
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

            router.push('');
        } catch (err: any) {
            setError(err.message || 'Doğrulama sırasında hata oluştu.');
            setCode('');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden text-white">
            {/* Background Decor */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-orange-500/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-red-500/10 blur-[120px] rounded-full" />

            <Card className="w-full max-w-md bg-zinc-950 border-white/10 shadow-2xl rounded-[3rem] overflow-hidden relative z-10 p-8">
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-orange-500/20 rotate-3 transition-transform duration-500">
                        <ShieldCheck className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-2xl font-black text-white tracking-tight uppercase text-center">Güvenlik Doğrulaması</h1>
                    <p className="text-zinc-500 text-sm font-bold mt-2 text-center tracking-widest uppercase opacity-80">Sistem Sahibi Doğrulaması</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-2xl text-red-400 text-xs font-bold text-center animate-shake">
                        {error}
                    </div>
                )}

                {step === 'request' ? (
                    <div className="space-y-6">
                        <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5 text-center text-white">
                            <Mail className="w-8 h-8 text-zinc-600 mx-auto mb-4" />
                            <p className="text-zinc-400 text-sm leading-relaxed text-center">
                                Sisteme tam yetki ile erişmek için <span className="text-white font-bold">{userEmail || '...'} </span> adresine bir güvenlik kodu gönderilecektir.
                            </p>
                        </div>
                        <Button 
                            onClick={sendEmailCode}
                            isLoading={isLoading}
                            className="w-full h-16 bg-white text-black hover:bg-zinc-200 font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-white/5 text-xs text-center"
                        >
                            <Send className="w-4 h-4 mr-2" /> E-posta Kodu Gönder
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 text-center block">Doğrulama Kodu</label>
                            <input 
                                type="text"
                                maxLength={6}
                                placeholder="000 000"
                                value={code}
                                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                                className={`w-full p-5 bg-zinc-900 border rounded-2xl text-white text-3xl font-black tracking-[0.5em] text-center outline-none transition-all ${countdown > 0 ? 'border-orange-500/50 focus:border-orange-500' : 'border-red-500/50 opacity-50 cursor-not-allowed'}`}
                                disabled={countdown === 0}
                            />
                            {countdown > 0 ? (
                                <p className="text-center text-xs font-bold text-orange-500 animate-pulse">
                                    Kalan Süre: {countdown} saniye
                                </p>
                            ) : (
                                <p className="text-center text-xs font-bold text-red-500">
                                    Süre doldu.
                                </p>
                            )}
                        </div>
                        <Button 
                            onClick={handleVerify}
                            disabled={countdown === 0 || isLoading}
                            className="w-full h-16 bg-gradient-to-r from-orange-600 to-red-600 text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-orange-500/30 text-xs text-center disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Kontrol Ediliyor...' : 'Sistemi Aç'} <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                        <button 
                            onClick={() => sendEmailCode()} // Yeniden başlat
                            disabled={resendCountdown > 0}
                            className={`w-full text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors cursor-pointer ${resendCountdown > 0 ? 'text-zinc-600 opacity-50' : 'text-white hover:text-orange-500'}`}
                        >
                            <RefreshCcw className="w-3 h-3" /> {resendCountdown > 0 ? `Tekrar göndermek için ${resendCountdown} sn` : 'Yeni Kod İste'}
                        </button>
                    </div>
                )}

                <div className="mt-10 pt-8 border-t border-white/5 text-center text-white">
                    <p className="text-[9px] text-zinc-700 font-black uppercase tracking-[0.2em] text-center">
                        GymBoost Security Protocol v2.2
                    </p>
                </div>
            </Card>
        </div>
    );
}
