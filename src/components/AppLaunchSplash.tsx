'use client';

import { useEffect, useState } from 'react';

export function AppLaunchSplash() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches
            || (window.navigator as any).standalone;
        if (!isStandalone) return;

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setVisible(true);
        const timer = window.setTimeout(() => setVisible(false), 1200);
        return () => window.clearTimeout(timer);
    }, []);

    if (!visible) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 animate-in fade-in zoom-in-95 duration-300">
                <div className="w-20 h-20 rounded-3xl bg-zinc-950 border border-white/10 flex items-center justify-center shadow-2xl shadow-orange-500/20">
                    <img src="/icon-192" alt="GymBoost" className="w-12 h-12" />
                </div>
                <div className="text-[10px] font-black tracking-[0.4em] text-orange-500 uppercase">GymBoost</div>
            </div>
        </div>
    );
}
