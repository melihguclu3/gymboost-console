'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Input } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import {
    Settings as SettingsIcon,
    User,
    Lock,
    Bell,
    Globe,
    Shield,
    LogOut,
    Save,
    Mail
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'request' | 'verify'>('request');
    const [timeLeft, setTimeLeft] = useState(0);

    // Mock Profile State (In a real app, fetch from Supabase Auth)
    const [profile, setProfile] = useState({
        fullName: '',
        email: '',
        language: 'tr',
        theme: 'dark'
    });

    const [security, setSecurity] = useState({
        otpCode: '',
        newPassword: '',
        confirmPassword: ''
    });

    const supabase = createClient();

    useEffect(() => {
        getProfile();
    }, []);

    async function getProfile() {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setProfile(p => ({ ...p, email: user.email || '' }));
        }
    }

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        toast.success('Profil ayarları yerel olarak kaydedildi.');
    };

    const handleRequestPasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(profile.email);
            if (error) throw error;

            toast.success('Doğrulama kodu e-postana gönderildi.');
            setStep('verify');
            setTimeLeft(60);
            const timer = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } catch (error: any) {
            toast.error('Hata: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (security.newPassword !== security.confirmPassword) {
            toast.error('Yeni şifreler uyuşmuyor.');
            return;
        }
        setLoading(true);
        try {
            // First verify OTP (actually in Supabase updatePassword flow after reset link, usually it's a link click)
            // But since we want "Code" input, we might need verifyOtp
            const { error: verifyError } = await supabase.auth.verifyOtp({
                email: profile.email,
                token: security.otpCode,
                type: 'recovery'
            });

            if (verifyError) throw verifyError;

            const { error: updateError } = await supabase.auth.updateUser({
                password: security.newPassword
            });

            if (updateError) throw updateError;

            toast.success('Şifre başarıyla güncellendi.');
            setSecurity({ otpCode: '', newPassword: '', confirmPassword: '' });
            setStep('request');
        } catch (error: any) {
            toast.error('İşlem başarısız: ' + (error.message || 'Kod hatalı veya süresi dolmuş.'));
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        window.location.href = '/login';
    };

    const tabs = [
        { id: 'general', label: 'Genel', icon: User },
        { id: 'security', label: 'Güvenlik', icon: Shield },
    ];

    return (
        <div className="max-w-4xl mx-auto pb-20 space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100">
                    Hesap Ayarları
                </h1>
                <p className="text-sm text-zinc-400 mt-1">
                    Profilinizi ve tercihlerinizi yönetin
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Sidebar Navigation */}
                <div className="space-y-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all",
                                activeTab === tab.id
                                    ? "bg-blue-600/10 text-blue-500 hover:bg-blue-600/20"
                                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
                            )}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}

                    <div className="pt-4 mt-4 border-t border-zinc-800">
                        <button
                            onClick={handleSignOut}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 rounded-xl hover:bg-red-500/10 transition-all"
                        >
                            <LogOut className="w-4 h-4" />
                            Çıkış Yap
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="md:col-span-3">
                    {activeTab === 'general' && (
                        <Card className="p-6 bg-zinc-800/50 border-zinc-700/50">
                            <h2 className="text-lg font-semibold text-zinc-100 mb-6">Profil Bilgileri</h2>
                            <form onSubmit={handleSaveProfile} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-zinc-400">Ad Soyad</label>
                                        <input
                                            type="text"
                                            value={profile.fullName}
                                            onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                                            className="w-full h-10 bg-zinc-900 border border-zinc-700 rounded-lg px-3 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                                            placeholder="Süper Yönetici"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-zinc-400">E-posta</label>
                                        <input
                                            type="email"
                                            value={profile.email}
                                            disabled
                                            className="w-full h-10 bg-zinc-900/50 border border-zinc-700/50 rounded-lg px-3 text-sm text-zinc-500 cursor-not-allowed"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-zinc-400">Dil</label>
                                        <select
                                            value={profile.language}
                                            onChange={(e) => setProfile({ ...profile, language: e.target.value })}
                                            className="w-full h-10 bg-zinc-900 border border-zinc-700 rounded-lg px-3 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                                        >
                                            <option value="tr">Türkçe</option>
                                            <option value="en">English</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-zinc-400">Tema</label>
                                        <select
                                            value={profile.theme}
                                            onChange={(e) => setProfile({ ...profile, theme: e.target.value })}
                                            className="w-full h-10 bg-zinc-900 border border-zinc-700 rounded-lg px-3 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                                        >
                                            <option value="dark">Koyu Mod</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4 border-t border-zinc-700/50">
                                    <Button type="submit" isLoading={loading} variant="primary" className="bg-blue-600 hover:bg-blue-700 text-white">
                                        <Save className="w-4 h-4 mr-2" />
                                        Değişiklikleri Kaydet
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    )}

                    {activeTab === 'security' && (
                        <Card className="p-6 bg-zinc-800/50 border-zinc-700/50">
                            <h2 className="text-lg font-semibold text-zinc-100 mb-6">Şifre Güvenliği</h2>

                            {step === 'request' ? (
                                <div className="space-y-6">
                                    <div className="bg-blue-600/10 border border-blue-600/20 rounded-xl p-4 flex gap-4">
                                        <div className="p-2 bg-blue-600 rounded-lg h-fit text-white">
                                            <Shield className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-zinc-100">İki Adımlı Doğrulama</h3>
                                            <p className="text-xs text-zinc-400 mt-1">
                                                Güvenliğiniz için, şifre değiştirme işlemine başlamadan önce kayıtlı e-posta adresinize ({profile.email}) bir doğrulama kodu göndereceğiz.
                                            </p>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={handleRequestPasswordReset}
                                        isLoading={loading}
                                        variant="primary"
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12"
                                    >
                                        Doğrulama Kodu Gönder
                                    </Button>
                                </div>
                            ) : (
                                <form onSubmit={handleUpdatePassword} className="space-y-6">
                                    <div className="space-y-4 max-w-md mx-auto">
                                        <div className="text-center mb-6">
                                            <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3 text-zinc-400">
                                                <Mail className="w-6 h-6" />
                                            </div>
                                            <h3 className="text-zinc-100 font-medium">E-postanı Kontrol Et</h3>
                                            <p className="text-xs text-zinc-500 mt-1">Gelen 6 haneli kodu giriniz.</p>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-zinc-400">Doğrulama Kodu</label>
                                            <input
                                                type="text"
                                                value={security.otpCode}
                                                onChange={(e) => setSecurity({ ...security, otpCode: e.target.value })}
                                                className="w-full h-12 text-center bg-zinc-900 border border-zinc-700 rounded-lg text-lg tracking-[0.5em] font-mono text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent placeholder:tracking-normal"
                                                placeholder="......"
                                                maxLength={6}
                                            />
                                        </div>

                                        <div className="h-[1px] bg-zinc-800 my-4" />

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-zinc-400">Yeni Şifre</label>
                                            <input
                                                type="password"
                                                value={security.newPassword}
                                                onChange={(e) => setSecurity({ ...security, newPassword: e.target.value })}
                                                className="w-full h-10 bg-zinc-900 border border-zinc-700 rounded-lg px-3 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-zinc-400">Yeni Şifre (Tekrar)</label>
                                            <input
                                                type="password"
                                                value={security.confirmPassword}
                                                onChange={(e) => setSecurity({ ...security, confirmPassword: e.target.value })}
                                                className="w-full h-10 bg-zinc-900 border border-zinc-700 rounded-lg px-3 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-zinc-700/50">
                                        <button
                                            type="button"
                                            onClick={() => setStep('request')}
                                            className="text-xs text-zinc-500 hover:text-zinc-300"
                                        >
                                            Geri Dön
                                        </button>
                                        <Button type="submit" isLoading={loading} variant="primary" className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]">
                                            Şifreyi Güncelle
                                        </Button>
                                    </div>

                                    {timeLeft > 0 && (
                                        <p className="text-center text-xs text-zinc-600 mt-2">
                                            Yeni kod için: {timeLeft}sn
                                        </p>
                                    )}
                                </form>
                            )}
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
