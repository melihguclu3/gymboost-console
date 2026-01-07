'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export function SystemHeartbeatSplash() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Oturum başına bir kez göster
        const hasSeenSplash = sessionStorage.getItem('has_seen_console_splash');
        if (hasSeenSplash) return;

        setVisible(true);

        // 3 saniye sonra kapat
        const timer = setTimeout(() => {
            setVisible(false);
            sessionStorage.setItem('has_seen_console_splash', 'true');
        }, 3000);

        return () => {
            clearTimeout(timer);
        };
    }, []);

    if (!visible) return null;

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-[9999] bg-white dark:bg-zinc-950 flex flex-col items-center justify-center"
                >
                    {/* Logo/Icon */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="mb-8"
                    >
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <svg
                                className="w-10 h-10 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                                />
                            </svg>
                        </div>
                    </motion.div>

                    {/* Text */}
                    <motion.div
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        className="text-center"
                    >
                        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                            GymBoost Console
                        </h1>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            Sistem başlatılıyor...
                        </p>
                    </motion.div>

                    {/* Loading Spinner */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6, duration: 0.3 }}
                        className="mt-8"
                    >
                        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
