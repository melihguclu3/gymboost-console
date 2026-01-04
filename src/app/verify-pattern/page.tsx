'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui';
import { PatternLock } from '@/components/PatternLock';
import { verifyPattern } from './actions';
import { Grid3X3, LockKeyhole, ShieldCheck } from 'lucide-react';

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
                // Başarılı! Login'e git
                router.push('/login');
                router.refresh();
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
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-[-20%] right-[-20%] w-[50%] h-[50%] bg-blue-900/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-20%] left-[-20%] w-[50%] h-[50%] bg-purple-900/10 blur-[120px] rounded-full" />
            
            <Card className="w-full max-w-md bg-zinc-950/80 backdrop-blur-xl border-white/5 shadow-2xl rounded-[2.5rem] p-8 flex flex-col items-center text-center relative z-10">
                <div className="mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <Grid3X3 className="w-8 h-8 text-zinc-500" />
                    </div>
                    <h1 className="text-xl font-black text-white tracking-tight">Güvenlik Deseni</h1>
                    <p className="text-zinc-500 text-xs mt-2 font-medium">Lütfen 4x4 güvenlik desenini çizin.</p>
                </div>

                <div className="w-full flex justify-center py-4">
                    <PatternLock 
                        onComplete={handlePatternComplete} 
                        error={error}
                        disabled={isLoading}
                    />
                </div>

                <div className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-600">
                    <ShieldCheck className="w-3 h-3" />
                    Askeri Düzey Şifreleme (16 Nokta)
                </div>
            </Card>
        </div>
    );
}
