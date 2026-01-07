'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui';
import { PatternLock } from '@/components/PatternLock';
import { verifyPattern } from './actions';
import { Fingerprint, ShieldCheck, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

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
                setTimeout(() => {
                    router.push('/login');
                    router.refresh();
                }, 300);
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
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
            <Card className="w-full max-w-md p-8 sm:p-10 bg-zinc-900 border-zinc-800 shadow-2xl">
                <div className="text-center mb-8">
                    <div className={cn(
                        "w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-colors",
                        error
                            ? "bg-red-600"
                            : "bg-purple-600"
                    )}>
                        {error ? (
                            <AlertCircle className="w-8 h-8 text-white" />
                        ) : (
                            <Fingerprint className="w-8 h-8 text-white" />
                        )}
                    </div>

                    <h1 className="text-2xl font-bold text-white mb-2">
                        Desen Doğrulama
                    </h1>
                    <p className="text-sm text-zinc-400">
                        Güvenlik desenini çizin
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-3 bg-red-600 text-white rounded-lg">
                        <p className="text-sm text-center font-medium">
                            Geçersiz desen, lütfen tekrar deneyin
                        </p>
                    </div>
                )}

                {/* Pattern Lock */}
                <div className="flex justify-center py-4">
                    <PatternLock
                        onComplete={handlePatternComplete}
                        error={error}
                        disabled={isLoading}
                    />
                </div>

                {/* Footer */}
                <div className="mt-8 pt-6 border-t border-zinc-800 text-center">
                    <div className="flex items-center justify-center gap-2 text-zinc-500">
                        <ShieldCheck className="w-4 h-4" />
                        <p className="text-xs">
                            Güvenli Doğrulama
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
}