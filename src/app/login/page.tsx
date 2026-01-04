'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Input } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { Mail, Lock, ShieldCheck, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SuperAdminLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        const allowedEmails = ['bigfoothdestek@gmail.com', 'guclumelih3@gmail.com'];
        const normalizedEmail = email.trim().toLowerCase();
        if (!allowedEmails.includes(normalizedEmail)) {
            setError('YETKİSİZ KİMLİK: Erişim Kısıtlandı');
            return;
        }

        setIsLoading(true);

        try {
            const supabase = createClient();
            const { error: authError } = await supabase.auth.signInWithPassword({
                email: normalizedEmail,
                password,
            });

            if (authError) throw authError;

            // Giriş başarılı, şimdi 2. faktöre (verify) gönder
            router.push('/verify');
        } catch (err) {
            console.error('Login error:', err);
            setError('KİMLİK DOĞRULAMA HATASI: Geçersiz Bilgiler');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden font-mono">
            {/* --- Cyberpunk Background Layers --- */}
            
            {/* 1. Grid Floor */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
            
            {/* 2. Gradient Spotlights */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-orange-600/10 blur-[150px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-900/10 blur-[150px] rounded-full pointer-events-none" />

            {/* --- Main Card --- */}
            <Card className="w-full max-w-md bg-zinc-950/70 backdrop-blur-2xl border-white/10 shadow-[0_20px_50px_-12px_rgba(0,0,0,1)] rounded-[2rem] overflow-hidden relative z-10 p-8 transition-colors duration-500 hover:border-orange-500/20">
                
                {/* Header */}
                <div className="text-center mb-8 relative">
                    <div className="w-20 h-20 bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-500/5 group">
                        <ShieldCheck className="w-10 h-10 text-orange-500 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    
                    <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                                Sistemler Çevrimiçi
                            </span>
                        </div>
                        <h1 className="text-xl font-black text-white tracking-tight uppercase mt-2">
                            Komuta Merkezi
                        </h1>
                        <p className="text-zinc-500 text-[10px] font-medium tracking-wide uppercase">
                            Kimliğinizi Tanımlayın
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border-l-2 border-red-500 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-red-400 text-[10px] font-black uppercase tracking-wide">{error}</span>
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-4">
                        <div className="group">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1.5 block group-focus-within:text-orange-500 transition-colors">
                                Operatör Kimliği (E-posta)
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-orange-500 transition-colors" />
                                <input 
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full h-12 bg-black/50 border border-white/10 rounded-xl pl-12 pr-4 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all"
                                    placeholder="admin@gymboost.tr"
                                    required
                                />
                            </div>
                        </div>

                        <div className="group">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1.5 block group-focus-within:text-orange-500 transition-colors">
                                Erişim Anahtarı
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-orange-500 transition-colors" />
                                <input 
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full h-12 bg-black/50 border border-white/10 rounded-xl pl-12 pr-4 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <Button 
                        type="submit" 
                        isLoading={isLoading}
                        className={cn(
                            "w-full h-14 font-black uppercase tracking-[0.2em] rounded-xl text-xs transition-all duration-300 group relative overflow-hidden",
                            "bg-white text-black hover:bg-orange-500 hover:text-white border border-white/20"
                        )}
                    >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                            Oturumu Başlat <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </span>
                    </Button>
                </form>

                <div className="mt-8 pt-6 border-t border-white/5 text-center">
                    <p className="text-[9px] text-zinc-600 font-medium uppercase tracking-widest">
                        GymBoost Güvenlik Ağı Tarafından Korunmaktadır
                    </p>
                </div>
            </Card>
        </div>
    );
}