'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Command, Cpu, Zap, ShieldCheck, Database, Server, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';

export function SystemHeartbeatSplash() {
    const [visible, setVisible] = useState(false);
    const [stage, setStage] = useState(0);

    useEffect(() => {
        // Oturum başına bir kez göster
        const hasSeenSplash = sessionStorage.getItem('has_seen_console_splash');
        if (hasSeenSplash) return;

        setVisible(true);

        // Gelişmiş Animasyon Aşamaları - Süreler optimize edildi (10sn)
        const t1 = setTimeout(() => setStage(1), 1500); // Sistemin Kalbine Hoş Geldiniz
        const t2 = setTimeout(() => setStage(2), 3200); // Yetki Doğrulandı
        const t3 = setTimeout(() => setStage(3), 5000); // DATABASE GÜNCELLENİYOR
        const t4 = setTimeout(() => setStage(4), 6800); // SİSTEM VERİLERİ GÜNCEL
        const t5 = setTimeout(() => setStage(5), 8200); // MELİH
        const t6 = setTimeout(() => {
            setVisible(false);
            sessionStorage.setItem('has_seen_console_splash', 'true');
        }, 10000);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
            clearTimeout(t4);
            clearTimeout(t5);
            clearTimeout(t6);
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
                    transition={{ duration: 1.2, ease: "easeInOut" }}
                    className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center overflow-hidden"
                >
                    {/* Background AI Glows - Enhanced */}
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.3, 0.6, 0.3],
                            rotate: [0, 90, 0]
                        }}
                        transition={{ duration: 10, repeat: Infinity }}
                        className="absolute w-[800px] h-[800px] bg-cyan-500/10 blur-[120px] rounded-full top-[-200px] -left-40"
                    />
                    <motion.div
                        animate={{
                            scale: [1.2, 1, 1.2],
                            opacity: [0.3, 0.5, 0.3],
                            rotate: [0, -90, 0]
                        }}
                        transition={{ duration: 12, repeat: Infinity }}
                        className="absolute w-[900px] h-[900px] bg-purple-500/10 blur-[150px] rounded-full bottom-[-250px] -right-40"
                    />

                    {/* Grid Pattern Overlay */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />

                    {/* Central Core Icon */}
                    <div className="relative mb-16">
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                            className="w-40 h-40 bg-zinc-950 border border-white/10 rounded-[3rem] flex items-center justify-center relative z-10 shadow-[0_0_100px_rgba(0,0,0,0.8)]"
                        >
                            <AnimatePresence mode="wait">
                                {stage < 3 ? (
                                    <motion.div
                                        key="icon-command"
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.8, opacity: 0 }}
                                    >
                                        <Command className="w-20 h-20 text-white" strokeWidth={1} />
                                    </motion.div>
                                ) : stage === 3 ? (
                                    <motion.div
                                        key="icon-db"
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.8, opacity: 0 }}
                                    >
                                        <Database className="w-20 h-20 text-orange-500" strokeWidth={1} />
                                    </motion.div>
                                ) : stage === 4 ? (
                                    <motion.div
                                        key="icon-check"
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.8, opacity: 0 }}
                                    >
                                        <Server className="w-20 h-20 text-emerald-500" strokeWidth={1} />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="icon-final"
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.8, opacity: 0 }}
                                    >
                                        <Command className="w-20 h-20 text-white" strokeWidth={1} />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Scanning Rings */}
                            <motion.div
                                animate={{ rotate: 360, scale: [1, 1.02, 1] }}
                                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-[-15px] border border-dashed border-white/20 rounded-[3.5rem]"
                            />
                            <motion.div
                                animate={{ rotate: -360, opacity: [0.3, 0.6, 0.3] }}
                                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-[-30px] border border-dotted border-orange-500/20 rounded-[4rem]"
                            />
                        </motion.div>

                        {/* Dynamic Glow */}
                        <motion.div
                            animate={{
                                opacity: [0.3, 0.6, 0.3],
                                scale: [1, 1.1, 1],
                                background: stage === 3 ? "radial-gradient(circle, rgba(249,115,22,0.3) 0%, transparent 70%)" :
                                    stage === 4 ? "radial-gradient(circle, rgba(16,185,129,0.3) 0%, transparent 70%)" :
                                        "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)"
                            }}
                            transition={{ duration: 2 }}
                            className="absolute inset-[-50px] -z-10 blur-3xl rounded-full"
                        />
                    </div>

                    {/* Text Stages */}
                    <div className="text-center space-y-4 relative z-10 w-full max-w-2xl px-4 h-32 flex flex-col justify-center items-center">
                        <AnimatePresence mode="wait">
                            {stage === 0 && (
                                <motion.div
                                    key="stage0"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="flex flex-col items-center gap-4"
                                >
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4].map(i => (
                                            <motion.div
                                                key={i}
                                                animate={{ opacity: [0.2, 1, 0.2], height: ['8px', '16px', '8px'] }}
                                                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1 }}
                                                className="w-1 bg-orange-500 rounded-full shadow-[0_0_10px_#f97316]"
                                            />
                                        ))}
                                    </div>
                                    <p className="text-xs font-mono font-black text-zinc-600 uppercase tracking-[0.6em] ml-[0.6em]">Sistem Çekirdeği Başlatılıyor</p>
                                </motion.div>
                            )}
                            {stage === 1 && (
                                <motion.div
                                    key="stage1"
                                    initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                                    exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
                                    className="space-y-4"
                                >
                                    <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter uppercase leading-tight">
                                        SİSTEMİN <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-fuchsia-500 to-cyan-500 animate-pulse">KALBİNE</span><br />HOŞ GELDİNİZ
                                    </h1>
                                    <p className="text-xs font-mono font-black text-zinc-500 uppercase tracking-[0.5em] ml-[0.5em]">Master Admin Console v2.4</p>
                                </motion.div>
                            )}
                            {stage === 2 && (
                                <motion.div
                                    key="stage2"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="flex flex-col items-center gap-6"
                                >
                                    <div className="px-8 py-3 bg-white/5 border border-white/10 rounded-full flex items-center gap-4 shadow-[0_0_30px_rgba(255,255,255,0.05)] backdrop-blur-md">
                                        <div className="relative">
                                            <ShieldCheck className="w-6 h-6 text-emerald-500" />
                                            <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 2, repeat: Infinity }} className="absolute inset-0 bg-emerald-500 rounded-full -z-10" />
                                        </div>
                                        <span className="text-xs font-black text-white uppercase tracking-[0.2em]">Yetki Doğrulandı: Tam Erişim</span>
                                    </div>
                                    <div className="flex gap-12">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Neural Link: OK</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Kernel: STABLE</span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                            {stage === 3 && (
                                <motion.div
                                    key="stage3"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
                                    className="flex flex-col items-center gap-6"
                                >
                                    <div className="w-16 h-16 rounded-full border-2 border-orange-500/20 flex items-center justify-center relative">
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                            className="absolute inset-0 border-t-2 border-orange-500 rounded-full"
                                        />
                                        <RefreshCw className="w-6 h-6 text-orange-500" />
                                    </div>
                                    <div className="space-y-2">
                                        <h2 className="text-2xl font-black text-white tracking-widest uppercase">
                                            DATABASE GÜNCELLENİYOR
                                        </h2>
                                        <p className="text-[10px] font-mono text-orange-500/80 uppercase tracking-[0.5em] typing-effect">
                                            Veri tablosu senkronizasyonu başlatıldı...
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                            {stage === 4 && (
                                <motion.div
                                    key="stage4"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="flex flex-col items-center gap-6"
                                >
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", damping: 15, stiffness: 200 }}
                                        className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/50 flex items-center justify-center"
                                    >
                                        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                                    </motion.div>
                                    <div className="space-y-2">
                                        <h2 className="text-2xl font-black text-white tracking-widest uppercase">
                                            SİSTEM VERİLERİ GÜNCEL
                                        </h2>
                                        <div className="flex justify-center gap-2">
                                            <span className="text-[10px] font-mono text-emerald-500/80 uppercase tracking-widest">Latency: 12ms</span>
                                            <span className="text-zinc-700">|</span>
                                            <span className="text-[10px] font-mono text-emerald-500/80 uppercase tracking-widest">Uptime: 99.9%</span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                            {stage === 5 && (
                                <motion.div
                                    key="stage5"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex flex-col items-center gap-4"
                                >
                                    <p className="text-xs font-mono font-black text-zinc-600 uppercase tracking-[0.8em] ml-[0.8em] mb-4">Master Admin Yetkilisi</p>
                                    <h2 className="text-7xl font-black text-white tracking-tighter uppercase relative">
                                        HOŞ GELDİN, <br />
                                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-300 drop-shadow-[0_0_20px_rgba(249,115,22,0.5)]">MELİH</span>
                                    </h2>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: "100%" }}
                                        transition={{ duration: 1, delay: 0.5 }}
                                        className="h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent w-full mt-4"
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Bottom Loading Bar */}
                    <div className="absolute bottom-10 left-10 right-10 h-[2px] bg-zinc-900 overflow-hidden rounded-full max-w-md mx-auto">
                        <motion.div
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 10, ease: "linear" }}
                            className="h-full bg-gradient-to-r from-orange-500 via-fuchsia-500 to-cyan-500"
                        />
                    </div>

                    <div className="absolute bottom-6 text-[9px] font-mono text-zinc-700 uppercase tracking-widest">
                        System Initialization Sequence ID: {Math.random().toString(36).substring(7).toUpperCase()}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
