'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Command, Cpu, Zap, ShieldCheck } from 'lucide-react';

export function SystemHeartbeatSplash() {
    const [visible, setVisible] = useState(false);
    const [stage, setStage] = useState(0);

    useEffect(() => {
        // Oturum başına bir kez göster
        const hasSeenSplash = sessionStorage.getItem('has_seen_console_splash');
        if (hasSeenSplash) return;

        setVisible(true);
        
        // Gelişmiş Animasyon Aşamaları
        const t1 = setTimeout(() => setStage(1), 1000); // Sistemin Kalbine Hoş Geldiniz
        const t2 = setTimeout(() => setStage(2), 2600); // Yetki Doğrulandı
        const t3 = setTimeout(() => setStage(3), 4200); // Melih GÜÇLÜ
        const t4 = setTimeout(() => {
            setVisible(false);
            sessionStorage.setItem('has_seen_console_splash', 'true');
        }, 6500);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
            clearTimeout(t4);
        };
    }, []);

    if (!visible) return null;

    return (
        <AnimatePresence>
            {visible && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
                    transition={{ duration: 0.8 }}
                    className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center overflow-hidden"
                >
                    {/* Background AI Glows */}
                    <motion.div 
                        animate={{ 
                            scale: [1, 1.2, 1],
                            opacity: [0.3, 0.6, 0.3],
                        }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className="absolute w-[500px] h-[500px] bg-cyan-500/10 blur-[120px] rounded-full top-[-100px] -left-20"
                    />
                    <motion.div 
                        animate={{ 
                            scale: [1.2, 1, 1.2],
                            opacity: [0.3, 0.5, 0.3],
                        }}
                        transition={{ duration: 5, repeat: Infinity }}
                        className="absolute w-[600px] h-[600px] bg-purple-500/10 blur-[150px] rounded-full bottom-[-150px] -right-20"
                    />
                    <motion.div 
                        animate={{ 
                            scale: [1, 1.3, 1],
                            opacity: [0.2, 0.4, 0.2],
                        }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="absolute w-[400px] h-[400px] bg-orange-500/10 blur-[100px] rounded-full center"
                    />

                    {/* Central Core Icon */}
                    <div className="relative mb-12">
                        <motion.div 
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                            className="w-32 h-32 bg-zinc-950 border border-white/10 rounded-[2.5rem] flex items-center justify-center relative z-10 shadow-2xl"
                        >
                            <Command className="w-16 h-16 text-white" />
                            
                            {/* Scanning Ring */}
                            <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-[-10px] border-2 border-dashed border-orange-500/20 rounded-[3rem]"
                            />
                        </motion.div>
                        
                        {/* Outer Glow */}
                        <motion.div 
                            animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.05, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute inset-0 bg-orange-500/20 blur-3xl rounded-full"
                        />
                    </div>

                    {/* Text Stages */}
                    <div className="text-center space-y-4 relative z-10">
                        <AnimatePresence mode="wait">
                            {stage === 0 && (
                                <motion.div
                                    key="stage0"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="flex flex-col items-center gap-3"
                                >
                                    <div className="flex gap-1.5">
                                        {[1,2,3].map(i => <motion.div key={i} animate={{ opacity: [0.2, 1, 0.2], scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity, delay: i*0.2 }} className="w-2 h-2 bg-orange-500 rounded-full shadow-[0_0_10px_#f97316]" />)}
                                    </div>
                                    <p className="text-[10px] font-mono font-black text-zinc-600 uppercase tracking-[0.6em] ml-[0.6em]">Sistem Çekirdeği Başlatılıyor</p>
                                </motion.div>
                            )}
                            {stage === 1 && (
                                <motion.div
                                    key="stage1"
                                    initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                                    exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
                                    className="space-y-3"
                                >
                                    <h1 className="text-5xl font-black text-white tracking-tighter uppercase leading-tight">
                                        SİSTEMİN <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-fuchsia-500 to-cyan-500 animate-pulse">KALBİNE</span><br/>HOŞ GELDİNİZ
                                    </h1>
                                    <p className="text-[10px] font-mono font-black text-zinc-500 uppercase tracking-[0.5em] ml-[0.5em]">Master Admin Console v2.4</p>
                                </motion.div>
                            )}
                            {stage === 2 && (
                                <motion.div
                                    key="stage2"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="flex flex-col items-center gap-5"
                                >
                                    <div className="px-6 py-2.5 bg-emerald-500/5 border border-emerald-500/20 rounded-full flex items-center gap-4 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                                        <ShieldCheck className="w-5 h-5 text-emerald-500" />
                                        <span className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.2em]">Yetki Doğrulandı: Tam Erişim</span>
                                    </div>
                                    <div className="flex gap-10">
                                        <div className="flex items-center gap-2.5">
                                            <Cpu className="w-4 h-4 text-zinc-800" />
                                            <span className="text-[10px] font-mono text-zinc-700 uppercase tracking-widest">Neural Link: OK</span>
                                        </div>
                                        <div className="flex items-center gap-2.5">
                                            <Zap className="w-4 h-4 text-zinc-800" />
                                            <span className="text-[10px] font-mono text-zinc-700 uppercase tracking-widest">Kernel: STABLE</span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                            {stage === 3 && (
                                <motion.div
                                    key="stage3"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex flex-col items-center gap-4"
                                >
                                    <p className="text-[10px] font-mono font-black text-zinc-600 uppercase tracking-[0.8em] ml-[0.8em] mb-2">Hoş Geldin,</p>
                                    <h2 className="text-6xl font-black text-white tracking-tighter uppercase relative">
                                        MELİH <span className="text-orange-500 drop-shadow-[0_0_20px_rgba(249,115,22,0.5)]">GÜÇLÜ</span>
                                        <motion.div 
                                            animate={{ opacity: [0, 1, 0] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                            className="absolute -inset-x-10 top-1/2 h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent"
                                        />
                                    </h2>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Bottom Decorative Line */}
                    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-64 h-[1px] bg-white/5 overflow-hidden">
                        <motion.div 
                            animate={{ x: ['-100%', '100%'] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="w-full h-full bg-gradient-to-r from-transparent via-orange-500 to-transparent"
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
