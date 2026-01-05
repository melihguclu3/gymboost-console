'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button } from '@/components/ui';
import { ShieldCheck, Mail, ArrowRight, RefreshCcw, Send, Command, LockKeyhole } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

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

            router.push('/');
        } catch (err: any) {
            setError(err.message || 'Doğrulama sırasında hata oluştu.');
            setCode('');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-orange-500/20">
            {/* Background Grid & Glows */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-orange-500/5 blur-[150px] rounded-full" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-500/5 blur-[150px] rounded-full" />

            <Card className="w-full max-w-md bg-zinc-950 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-[2rem] overflow-hidden relative z-10 backdrop-blur-xl">
                {/* Header Section */}
                <div className="p-8 pb-0 text-center relative">
                    <div className="w-24 h-24 mx-auto mb-6 relative group">
                        <div className="absolute inset-0 bg-orange-500/20 blur-2xl rounded-full group-hover:bg-orange-500/30 transition-colors" />
                        <div className="relative w-full h-full bg-zinc-900 border border-white/10 rounded-[1.5rem] flex items-center justify-center shadow-2xl group-hover:scale-105 transition-transform duration-300">
                            <AnimatePresence mode="wait">
                                {step === 'request' ? (
                                    <motion.div
                                        key="lock"
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.8, opacity: 0 }}
                                    >
                                        <LockKeyhole className="w-10 h-10 text-orange-500" strokeWidth={1.5} />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="shield"
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.8, opacity: 0 }}
                                    >
                                        <ShieldCheck className="w-10 h-10 text-emerald-500" strokeWidth={1.5} />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        {/* Status Dot */}
                        <div className={`absolute -right-2 -top-2 w-4 h-4 rounded-full border-2 border-zinc-950 flex items-center justify-center ${step === 'verify' ? 'bg-emerald-500' : 'bg-orange-500'}`}>
                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                        </div>
                    </div>

                    <h1 className="text-2xl font-black text-white tracking-tight uppercase mb-2">Güvenlik Doğrulaması</h1>
                    <div className="flex items-center justify-center gap-2">
                        <div className="h-[1px] w-8 bg-zinc-800" />
                        <p className="text-[10px] font-mono font-black text-zinc-500 uppercase tracking-widest">Sistem Sahibi Erişimi</p>
                        <div className="h-[1px] w-8 bg-zinc-800" />
                    </div>
                </div>

                <div className="p-8">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-6 p-4 bg-red-500/5 border border-red-500/20 rounded-xl flex items-center gap-3"
                        >
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shrink-0" />
                            <p className="text-red-400 text-xs font-bold leading-relaxed">{error}</p>
                        </motion.div>
                    )}

                    <AnimatePresence mode="wait">
                        {step === 'request' ? (
                            <motion.div
                                key="step-request"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="p-5 bg-zinc-900/50 border border-white/5 rounded-2xl flex gap-4 items-start">
                                    <div className="p-2.5 bg-zinc-800 rounded-lg shrink-0">
                                        <Mail className="w-5 h-5 text-zinc-400" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-white uppercase tracking-wide">Doğrulama Gerekli</p>
                                        <p className="text-xs text-zinc-500 leading-relaxed">
                                            Güvenlik protokolü gereği, sistem erişimi için kayıtlı e-posta adresinize tek kullanımlık kod gönderilecektir.
                                        </p>
                                    </div>
                                </div>

                                <Button
                                    onClick={sendEmailCode}
                                    isLoading={isLoading}
                                    className="w-full h-14 bg-white text-black hover:bg-zinc-200 font-black uppercase tracking-widest rounded-xl text-xs flex items-center justify-center gap-3 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    {!isLoading && <Send className="w-4 h-4" />}
                                    <span>KOD GÖNDER</span>
                                </Button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="step-verify"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="space-y-4">
                                    <div className="flex justify-between items-end px-1">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Güvenlik Kodu</label>
                                        {countdown > 0 ? (
                                            <span className="text-[10px] font-mono font-bold text-orange-500 animate-pulse">
                                                {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                                            </span>
                                        ) : (
                                            <span className="text-[10px] font-bold text-red-500">SÜRE DOLDU</span>
                                        )}
                                    </div>
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            maxLength={6}
                                            placeholder="XXXXXX"
                                            value={code}
                                            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                                            className={`w-full h-20 bg-zinc-900/50 border text-center text-4xl font-mono font-bold tracking-[0.5em] text-white rounded-2xl outline-none transition-all placeholder:text-zinc-800
                                                ${countdown > 0
                                                    ? 'border-white/10 focus:border-orange-500/50 focus:shadow-[0_0_30px_rgba(249,115,22,0.1)]'
                                                    : 'border-red-500/30 text-red-500/50 cursor-not-allowed'
                                                }`}
                                            disabled={countdown === 0}
                                            autoFocus
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Button
                                        onClick={handleVerify}
                                        disabled={countdown === 0 || isLoading || code.length !== 6}
                                        className="w-full h-14 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-black uppercase tracking-widest rounded-xl text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(249,115,22,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all"
                                    >
                                        {isLoading ? (
                                            'DOĞRULANIYOR...'
                                        ) : (
                                            <>
                                                <span>ERİŞİM İZNİ VER</span>
                                                <ArrowRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </Button>

                                    <button
                                        onClick={() => sendEmailCode()}
                                        disabled={resendCountdown > 0}
                                        className={`w-full py-3 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors rounded-lg hover:bg-white/5 disabled:hover:bg-transparent
                                            ${resendCountdown > 0 ? 'text-zinc-600 cursor-not-allowed' : 'text-zinc-400 hover:text-white cursor-pointer'}`}
                                    >
                                        <RefreshCcw className={`w-3 h-3 ${resendCountdown === 0 && 'group-hover:rotate-180 transition-transform'}`} />
                                        {resendCountdown > 0 ? `YENİ KOD İÇİN ${resendCountdown}sn` : 'KOD GELMEDİ Mİ? TEKRAR GÖNDER'}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer Section */}
                <div className="px-8 py-6 bg-zinc-950/50 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-wider">Güvenli Bağlantı</span>
                    </div>
                    <div className="flex items-center gap-2 opacity-50">
                        <Command className="w-3 h-3 text-zinc-600" />
                        <span className="text-[9px] font-mono font-bold text-zinc-600">OTURUM: {Math.random().toString(36).substring(7).toUpperCase()}</span>
                    </div>
                </div>
            </Card>
        </div>
    );
}
