'use client';

import { useState } from 'react';
import { Card, Button, Input } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import {
    Settings,
    ShieldCheck,
    Globe,
    Bell,
    Zap,
    Lock,
    Eye,
    Save,
    AlertCircle,
    Server,
    ShieldAlert,
    Smartphone,
    Bot,
    Megaphone,
    Mail
} from 'lucide-react';
import { useDialog } from '@/context/DialogContext';

import { motion, AnimatePresence } from 'framer-motion';

export default function GlobalSettingsPage() {
    const { showAlert } = useDialog();
    const [isSaving, setIsLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Simüle edilmiş ayarlar
    const [settings, setSettings] = useState({
        systemMaintenance: false,
        publicRegistration: false,
        enforceTwoFactor: true,
        aiEnabled: true,
        globalAnnouncement: '',
        supportEmail: 'bigfoothdestek@gmail.com'
    });

    const handleSave = () => {
        setIsLoading(true);

        // Bakım modu için cookie ayarla
        if (settings.systemMaintenance) {
            document.cookie = "gymboost_maintenance_mode=true; path=/; max-age=86400"; // 1 gün
        } else {
            document.cookie = "gymboost_maintenance_mode=false; path=/; max-age=0";
        }

        setTimeout(() => {
            setIsLoading(false);
            showAlert(
                settings.systemMaintenance ? 'Sistem Bakım Modu' : 'Sistem Bilgi',
                settings.systemMaintenance
                    ? '⚠️ DİKKAT: Sistem BAKIM MODUNA alındı. Siz hariç kimse giriş yapamaz.'
                    : '✅ Sistem tekrar herkesin erişimine açıldı.'
            );
        }, 800);
    };

    const handleBroadcast = async () => {
        if (!settings.globalAnnouncement.trim()) return showAlert('Uyarı', 'Lütfen bir duyuru metni girin.');

        setIsLoading(true);
        try {
            const supabase = createClient();

            // 1. Tüm admin kullanıcılarını bul
            const { data: admins } = await supabase
                .from('users')
                .select('id')
                .eq('role', 'admin');

            if (admins && admins.length > 0) {
                // 2. Her admin için bir sistem bildirimi oluştur
                const notifications = admins.map(admin => ({
                    user_id: admin.id,
                    title: 'KRİTİK SİSTEM DUYURUSU',
                    body: settings.globalAnnouncement,
                    type: 'system',
                    read: false
                }));

                const { error } = await supabase.from('notifications').insert(notifications);
                if (error) throw error;
            }

            // 3. Sistem loglarına kaydet
            await supabase.from('system_logs').insert({
                event_type: 'success',
                entity_type: 'system_settings',
                message: `Ayarlar üzerinden küresel duyuru yayınlandı (Admins: ${admins?.length || 0}): ${settings.globalAnnouncement.slice(0, 30)}...`,
                actor_role: 'super_admin'
            });

            setShowSuccessModal(true);
            setSettings({ ...settings, globalAnnouncement: '' });
        } catch (err: any) {
            showAlert('Hata', 'Duyuru yayınlanırken bir hata oluştu: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-12 pb-20 text-left text-white">
            {/* --- SURGICAL UNIFIED HEADER --- */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 border-b border-white/[0.04] pb-12">
                <div className="flex items-start gap-8">
                    <div className="p-4 bg-zinc-900 border border-white/10 rounded-[1.5rem] shadow-lg shadow-black/5 relative overflow-hidden group">
                        <Settings className="w-10 h-10 text-zinc-400 relative z-10 group-hover:scale-110 transition-transform" />
                        <div className="absolute inset-0 bg-white/5 animate-pulse" />
                    </div>
                    <div>
                        <div className="flex items-center gap-4 mb-3">
                            <h1 className="text-4xl font-black text-white tracking-tighter uppercase">
                                ANA <span className="text-orange-500">AYARLAR</span>
                            </h1>
                            <div className="flex items-center gap-2.5 px-3 py-1 bg-white/5 border border-white/10 rounded-lg">
                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse shadow-[0_0_8px_#f97316]" />
                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Çekirdek Yapılandırma</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-6 text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">
                            <div className="flex items-center gap-2 font-mono">
                                <Server className="w-3.5 h-3.5" /> ENVIRONMENT: {process.env.NODE_ENV?.toUpperCase()}
                            </div>
                            <div className="flex items-center gap-2 font-mono">
                                <ShieldAlert className="w-3.5 h-3.5" /> SECURITY_LEVEL: MAXIMUM
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button onClick={handleSave} isLoading={isSaving} variant="primary" className="h-14 px-10 shadow-2xl shadow-orange-500/20 rounded-xl font-black text-[10px] tracking-[0.3em] uppercase">
                        <Save className="w-4 h-4 mr-3" /> DEĞİŞİKLİKLERİ KAYDET
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Security & Access */}
                    <Card className="p-10 bg-zinc-950/20 border-white/[0.04] rounded-[2.5rem] relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-orange-500/20 to-transparent" />
                        
                        <div className="flex items-center gap-5 mb-12 border-b border-white/[0.04] pb-6">
                            <div className="p-3 bg-orange-500/10 rounded-2xl text-orange-500 border border-orange-500/20">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-white uppercase tracking-tighter">Güvenlik ve Erişim</h2>
                                <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest mt-1">Access Control & Integrity</p>
                            </div>
                        </div>

                        <div className="space-y-10">
                            <div className="flex items-center justify-between group">
                                <div className="space-y-1.5">
                                    <p className="text-base font-black text-white group-hover:text-orange-400 transition-colors uppercase tracking-tight">Bakım Modu (Kill Switch)</p>
                                    <p className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider">Aktif edildiğinde, siz hariç hiç kimse sisteme giriş yapamaz.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={settings.systemMaintenance} onChange={(e) => setSettings({ ...settings, systemMaintenance: e.target.checked })} className="sr-only peer" />
                                    <div className="w-12 h-6 bg-zinc-900 border border-white/10 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-[4px] after:bg-zinc-500 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-600 peer-checked:after:bg-white"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between group border-t border-white/[0.04] pt-10">
                                <div className="space-y-1.5">
                                    <p className="text-base font-black text-white group-hover:text-orange-400 transition-colors uppercase tracking-tight">Dışarıdan Kayıtları Aç</p>
                                    <p className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider">Kapatıldığında sadece sizin davetiyenizle salon kaydı yapılabilir.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={settings.publicRegistration} onChange={(e) => setSettings({ ...settings, publicRegistration: e.target.checked })} className="sr-only peer" />
                                    <div className="w-12 h-6 bg-zinc-900 border border-white/10 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-[4px] after:bg-zinc-500 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-600 peer-checked:after:bg-white"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between group border-t border-white/[0.04] pt-10">
                                <div className="space-y-1.5">
                                    <p className="text-base font-black text-white group-hover:text-orange-400 transition-colors uppercase tracking-tight">Zorunlu 2FA (Doğrulama)</p>
                                    <p className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider">Tüm işletme sahiplerinin giriş yaparken e-posta kodu girmesini zorunlu kılar.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={settings.enforceTwoFactor} onChange={(e) => setSettings({ ...settings, enforceTwoFactor: e.target.checked })} className="sr-only peer" />
                                    <div className="w-12 h-6 bg-zinc-900 border border-white/10 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-[4px] after:bg-zinc-500 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-600 peer-checked:after:bg-white"></div>
                                </label>
                            </div>
                        </div>
                    </Card>

                    {/* AI & Features */}
                    <Card className="p-10 bg-zinc-950/20 border-white/[0.04] rounded-[2.5rem] relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
                        
                        <div className="flex items-center gap-5 mb-12 border-b border-white/[0.04] pb-6">
                            <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500 border border-blue-500/20">
                                <Bot className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-white uppercase tracking-tighter">Yapay Zeka Motoru</h2>
                                <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest mt-1">Neural Network Config</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between group">
                                <div className="space-y-1.5">
                                    <p className="text-base font-black text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">Gemini AI Entegrasyonu</p>
                                    <p className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider">Platform genelindeki tüm AI asistanlarını ve analizleri açar/kapatır.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={settings.aiEnabled} onChange={(e) => setSettings({ ...settings, aiEnabled: e.target.checked })} className="sr-only peer" />
                                    <div className="w-12 h-6 bg-zinc-900 border border-white/10 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-[4px] after:bg-zinc-500 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 peer-checked:after:bg-white"></div>
                                </label>
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="space-y-8">
                    {/* Broadcast Card Update */}
                    <Card className="p-8 bg-[#020202] border-orange-500/20 rounded-[2rem] relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />
                        <div className="flex items-center gap-4 mb-6 relative z-10">
                            <div className="p-2.5 bg-orange-500/10 rounded-xl text-orange-500 border border-orange-500/20">
                                <Megaphone className="w-5 h-5" />
                            </div>
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">Küresel Duyuru</h3>
                        </div>
                        <p className="text-[11px] text-zinc-500 mb-6 leading-relaxed uppercase tracking-tight font-medium">Bu mesaj tüm salonların yönetim panellerinde kritik uyarı olarak görünecektir.</p>
                        <textarea
                            value={settings.globalAnnouncement}
                            onChange={(e) => setSettings({ ...settings, globalAnnouncement: e.target.value })}
                            placeholder="Sistem mesajını buraya girin..."
                            className="w-full h-40 p-5 bg-white/[0.02] border border-white/10 rounded-2xl text-white text-sm resize-none outline-none focus:border-orange-500 transition-all placeholder:text-zinc-800 font-medium"
                        />
                        <Button
                            onClick={handleBroadcast}
                            isLoading={isSaving}
                            className="w-full mt-6 bg-white text-black hover:bg-orange-500 hover:text-white font-black h-14 rounded-2xl text-[10px] uppercase tracking-[0.3em] transition-all shadow-xl"
                        >
                            DUYURUYU YAYINLA
                        </Button>
                    </Card>

                    {/* Support Config */}
                    <Card className="p-8 bg-zinc-950/20 border-white/[0.04] rounded-[2rem] space-y-6">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-2.5 bg-zinc-900 border border-white/5 rounded-xl text-zinc-500">
                                <Mail className="w-5 h-5" />
                            </div>
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">İletişim Yapılandırma</h3>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-1">Resmi Destek E-postası</label>
                            <input
                                value={settings.supportEmail}
                                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                                className="w-full h-12 bg-white/[0.02] border border-white/10 rounded-xl px-4 text-xs text-white outline-none focus:border-blue-500 transition-all"
                            />
                        </div>
                        <div className="p-5 bg-white/[0.02] rounded-2xl border border-white/[0.04] flex items-start gap-4">
                            <AlertCircle className="w-4 h-4 text-zinc-700 shrink-0 mt-0.5" />
                            <p className="text-[10px] text-zinc-600 leading-relaxed font-medium uppercase tracking-tight">Bu adres, platformdan gönderilen tüm sistem e-postalarında gönderici kimliği olarak kullanılacaktır.</p>
                        </div>
                    </Card>
                </div>
            </div>

            {/* --- SUCCESS MODAL --- */}
            <AnimatePresence>
                {showSuccessModal && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/95 backdrop-blur-xl" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-md bg-[#050505] border border-emerald-500/20 rounded-[3rem] p-12 text-center relative overflow-hidden shadow-[0_0_100px_rgba(0,0,0,1)]">
                            <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 shadow-[0_0_15px_#10b981]" />
                            <div className="w-24 h-24 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-10 text-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                                <Megaphone className="w-12 h-12" />
                            </div>
                            <h2 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter">İşlem Başarılı</h2>
                            <p className="text-zinc-500 text-sm mb-12 leading-relaxed uppercase tracking-widest font-bold">Duyuru paketlendi ve tüm salon düğümlerine başarıyla dağıtıldı.</p>

                            <Button onClick={() => setShowSuccessModal(false)} variant="primary" className="w-full h-16 bg-emerald-600 hover:bg-emerald-500 border-emerald-500/20 rounded-2xl font-black text-[11px] tracking-[0.3em] uppercase transition-all shadow-2xl">
                                SİSTEME DÖN
                            </Button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
