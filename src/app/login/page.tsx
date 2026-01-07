'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { Mail, Lock, ShieldCheck } from 'lucide-react';
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
            setError('Yetkisiz erişim: Bu e-posta adresi izinli değil');
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

            router.push('/verify');
        } catch (err) {
            console.error('Login error:', err);
            setError('Giriş hatası: E-posta veya şifre hatalı');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
            <Card className="w-full max-w-md p-8 sm:p-10 bg-zinc-900 border-zinc-800 shadow-2xl">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <ShieldCheck className="w-8 h-8 text-white" />
                    </div>

                    <h1 className="text-2xl font-bold text-white mb-2">
                        Komuta Merkezi
                    </h1>
                    <p className="text-sm text-zinc-400">
                        Kimliğinizi doğrulayın
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-3 bg-red-600 text-white rounded-lg">
                        <p className="text-sm text-center font-medium">{error}</p>
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-zinc-300 mb-2 block">
                                E-posta
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full h-12 bg-zinc-800 border border-zinc-700 rounded-lg pl-11 pr-4 text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/50 transition-all"
                                    placeholder="admin@gymboost.tr"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-zinc-300 mb-2 block">
                                Şifre
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full h-12 bg-zinc-800 border border-zinc-700 rounded-lg pl-11 pr-4 text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/50 transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        isLoading={isLoading}
                        className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                    >
                        Giriş Yap
                    </Button>
                </form>

                <div className="mt-8 pt-6 border-t border-zinc-800 text-center">
                    <p className="text-xs text-zinc-500">
                        GymBoost Güvenlik Sistemi
                    </p>
                </div>
            </Card>
        </div>
    );
}