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
    Megaphone
} from 'lucide-react';
import { useDialog } from '@/context/DialogContext';

export default function GlobalSettingsPage() {
    const { showAlert } = useDialog();
    const [isSaving, setIsLoading] = useState(false);

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
        if (!settings.globalAnnouncement) return showAlert('Uyarı', 'Lütfen bir duyuru metni girin.');

        setIsLoading(true);
        try {
            const supabase = createClient();

            // Tüm admin kullanıcılarını bul
            const { data: admins } = await supabase
                .from('users')
                .select('id')
                .eq('role', 'admin');

            if (admins && admins.length > 0) {
                const notifications = admins.map(admin => ({
                    user_id: admin.id,
                    title: 'Sistem Duyurusu',
                    body: settings.globalAnnouncement,
                    type: 'system',
                    read: false
                }));

                const { error } = await supabase.from('notifications').insert(notifications);
                if (error) throw error;
            }

            showAlert('Başarılı', 'Duyuru tüm salon sahiplerine bildirim olarak gönderildi! 🔔');
            setSettings({ ...settings, globalAnnouncement: '' });
        } catch (err: any) {
            showAlert('Hata', 'Duyuru gönderilirken hata oluştu: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8 text-left text-white">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-zinc-700 to-zinc-900 rounded-2xl shadow-xl">
                            <Settings className="w-8 h-8 text-white" />
                        </div>
                        Global Sistem Ayarları
                    </h1>
                    <p className="text-zinc-400 mt-1 font-medium ml-14">Platformun genel çalışma kuralları ve limitleri</p>
                </div>
                <Button onClick={handleSave} isLoading={isSaving} className="bg-orange-600 hover:bg-orange-500 rounded-xl font-black h-12 px-8 uppercase tracking-widest text-xs">
                    <Save className="w-4 h-4 mr-2" /> Değişiklikleri Kaydet
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {/* Security & Access */}
                    <Card className="p-8 bg-zinc-950/50 border-white/5 space-y-8">
                        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                            <ShieldCheck className="w-6 h-6 text-orange-500" />
                            <h2 className="text-xl font-bold text-white">Güvenlik ve Erişim</h2>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between group">
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors">Bakım Modu (Kill Switch)</p>
                                    <p className="text-xs text-zinc-500">Aktif edildiğinde, siz hariç hiç kimse sisteme giriş yapamaz.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={settings.systemMaintenance} onChange={(e) => setSettings({ ...settings, systemMaintenance: e.target.checked })} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between group border-t border-white/5 pt-6">
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors">Dışarıdan Kayıtları Aç</p>
                                    <p className="text-xs text-zinc-500">Kapatıldığında sadece sizin davetiyenizle salon kaydı yapılabilir.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={settings.publicRegistration} onChange={(e) => setSettings({ ...settings, publicRegistration: e.target.checked })} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between group border-t border-white/5 pt-6">
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors">Zorunlu 2FA (Doğrulama)</p>
                                    <p className="text-xs text-zinc-500">Tüm işletme sahiplerinin giriş yaparken kod girmesini zorunlu kılar.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={settings.enforceTwoFactor} onChange={(e) => setSettings({ ...settings, enforceTwoFactor: e.target.checked })} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                                </label>
                            </div>
                        </div>
                    </Card>

                    {/* AI & Features */}
                    <Card className="p-8 bg-zinc-950/50 border-white/5 space-y-8">
                        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                            <Bot className="w-6 h-6 text-blue-500" />
                            <h2 className="text-xl font-bold text-white">Yapay Zeka & Özellikler</h2>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between group">
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">Gemini AI Motoru</p>
                                    <p className="text-xs text-zinc-500">Platform genelindeki tüm AI asistanlarını ve analizleri açar/kapatır.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={settings.aiEnabled} onChange={(e) => setSettings({ ...settings, aiEnabled: e.target.checked })} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="space-y-6">
                    {/* Broadcast */}
                    <Card className="p-6 bg-gradient-to-br from-orange-600/20 to-transparent border-orange-500/20">
                        <div className="flex items-center gap-3 mb-4">
                            <Bell className="w-5 h-5 text-orange-500" />
                            <h3 className="text-sm font-black uppercase tracking-widest text-white">Global Duyuru</h3>
                        </div>
                        <p className="text-xs text-zinc-400 mb-4 leading-relaxed">Buraya yazacağınız mesaj tüm salon sahiplerinin dashboard&apos;unda kırmızı bir bar olarak görünecektir.</p>
                        <textarea
                            value={settings.globalAnnouncement}
                            onChange={(e) => setSettings({ ...settings, globalAnnouncement: e.target.value })}
                            placeholder="Örn: 12 Ocak gecesi sistem bakımı yapılacaktır..."
                            className="w-full h-32 p-4 bg-zinc-900 border border-white/10 rounded-2xl text-white text-xs resize-none outline-none focus:border-orange-500 transition-all placeholder:text-zinc-700"
                        />
                        <Button
                            onClick={handleBroadcast}
                            className="w-full mt-4 bg-white text-black hover:bg-zinc-200 font-bold h-10 rounded-xl text-[10px] uppercase tracking-widest"
                        >
                            YAYINLA
                        </Button>
                    </Card>

                    {/* Support Config */}
                    <Card className="p-6 bg-zinc-950 border-white/5 space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                            <Globe className="w-5 h-5 text-zinc-500" />
                            <h3 className="text-sm font-bold text-white">İletişim Ayarları</h3>
                        </div>
                        <Input
                            label="Resmi Destek E-postası"
                            value={settings.supportEmail}
                            onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                            className="bg-zinc-900 border-white/5 text-xs"
                        />
                        <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center gap-3">
                            <AlertCircle className="w-4 h-4 text-zinc-500" />
                            <p className="text-[10px] text-zinc-500 leading-tight">Bu e-posta adresi sistemden giden tüm otomatik bilgilendirme maillerinde görünecektir.</p>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
