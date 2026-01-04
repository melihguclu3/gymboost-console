'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Input } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { Mail, Lock, ShieldCheck, Sparkles, Loader2 } from 'lucide-react';

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
            setError('Yetkisiz e-posta adresi.');
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
            setError('Kimlik doğrulanamadı. Lütfen bilgilerinizi kontrol edin.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-orange-500/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-red-500/10 blur-[120px] rounded-full" />

            <Card className="w-full max-w-md bg-zinc-950 border-white/10 shadow-2xl rounded-[3rem] overflow-hidden relative z-10 p-8">
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-orange-500/20">
                        <ShieldCheck className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-2xl font-black text-white tracking-tight uppercase text-center">Kurumsal Giriş</h1>
                    <p className="text-zinc-500 text-[10px] font-black mt-2 text-center tracking-[0.3em] uppercase opacity-80">Üst Düzey Yetkili Erişimi</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-2xl text-red-400 text-xs font-bold text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                    <Input 
                        label="Yetkili E-posta"
                        type="email"
                        placeholder="kurumsal@gymboost.tr"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        icon={<Mail className="w-5 h-5 text-zinc-500" />}
                        required
                    />
                    <Input 
                        label="Erişim Parolası"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        icon={<Lock className="w-5 h-5 text-zinc-500" />}
                        required
                    />

                    <div className="pt-4">
                        <Button 
                            type="submit" 
                            isLoading={isLoading}
                            className="w-full h-16 bg-white text-black hover:bg-zinc-200 font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-white/5 text-xs"
                        >
                            KİMLİĞİ DOĞRULA <Sparkles className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </form>

                <div className="mt-10 pt-8 border-t border-white/5 text-center">
                    <p className="text-[9px] text-zinc-700 font-black uppercase tracking-[0.3em] text-center">
                        GymBoost Global Management Protocol
                    </p>
                </div>
            </Card>
        </div>
    );
}
