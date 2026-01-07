'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, Button } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import {
    User,
    Shield,
    LogOut,
    Save,
    Mail,
    Bell,
    Smartphone,
    Monitor,
    Clock,
    MapPin,
    Trash2,
    CheckCircle2,
    AlertTriangle,
    Key,
    Calendar,
    Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface Session {
    id: string;
    device: string;
    location: string;
    lastActive: Date;
    current: boolean;
}

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'request' | 'verify'>('request');
    const [timeLeft, setTimeLeft] = useState(0);

    const [profile, setProfile] = useState({
        fullName: '',
        email: '',
        createdAt: '',
        lastSignIn: ''
    });

    const [security, setSecurity] = useState({
        otpCode: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [notifications, setNotifications] = useState({
        newGymSignup: true,
        criticalErrors: true,
        weeklyReport: false,
        paymentAlerts: true
    });

    const [sessions, setSessions] = useState<Session[]>([]);
    const [sessionsLoading, setSessionsLoading] = useState(false);

    const supabase = createClient();

    const getProfile = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setProfile({
                email: user.email || '',
                fullName: user.user_metadata?.full_name || '',
                createdAt: user.created_at || '',
                lastSignIn: user.last_sign_in_at || ''
            });
        }
    }, [supabase]);

    const loadSessions = useCallback(async () => {
        setSessionsLoading(true);
        // Simulated sessions - in real app would come from Supabase auth sessions
        const mockSessions: Session[] = [
            {
                id: '1',
                device: 'Chrome - macOS',
                location: 'İstanbul, TR',
                lastActive: new Date(),
                current: true
            }
        ];
        setSessions(mockSessions);
        setSessionsLoading(false);
    }, []);

    useEffect(() => {
        getProfile();
        loadSessions();
    }, [getProfile, loadSessions]);

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                data: { full_name: profile.fullName }
            });
            if (error) throw error;
            toast.success('Profil güncellendi');
        } catch (error: any) {
            toast.error('Hata: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRequestPasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // signInWithOtp sends a 6-digit code instead of a link
            const { error } = await supabase.auth.signInWithOtp({
                email: profile.email,
                options: {
                    shouldCreateUser: false
                }
            });
            if (error) throw error;
            toast.success('Doğrulama kodu gönderildi');
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
            toast.error('Şifreler uyuşmuyor');
            return;
        }
        if (security.newPassword.length < 8) {
            toast.error('Şifre en az 8 karakter olmalı');
            return;
        }
        setLoading(true);
        try {
            // Verify the OTP code first
            const { error: verifyError } = await supabase.auth.verifyOtp({
                email: profile.email,
                token: security.otpCode,
                type: 'email'
            });
            if (verifyError) throw verifyError;

            // Now update the password
            const { error: updateError } = await supabase.auth.updateUser({
                password: security.newPassword
            });
            if (updateError) throw updateError;

            toast.success('Şifre güncellendi');
            setSecurity({ otpCode: '', newPassword: '', confirmPassword: '' });
            setStep('request');
        } catch (error: any) {
            toast.error('Hata: ' + (error.message || 'Kod hatalı veya süresi dolmuş'));
        } finally {
            setLoading(false);
        }
    };

    const handleSaveNotifications = async () => {
        setLoading(true);
        // In real app, save to database
        await new Promise(r => setTimeout(r, 500));
        toast.success('Bildirim tercihleri kaydedildi');
        setLoading(false);
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        window.location.href = '/login';
    };

    const handleSignOutAllSessions = async () => {
        setLoading(true);
        try {
            await supabase.auth.signOut({ scope: 'global' });
            toast.success('Tüm oturumlar sonlandırıldı');
            window.location.href = '/login';
        } catch (error: any) {
            toast.error('Hata: ' + error.message);
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'profile', label: 'Profil', icon: User },
        { id: 'security', label: 'Güvenlik', icon: Shield },
        { id: 'notifications', label: 'Bildirimler', icon: Bell },
        { id: 'sessions', label: 'Oturumlar', icon: Monitor },
    ];

    return (
        <div className="max-w-4xl mx-auto pb-20 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-zinc-100">Hesap Ayarları</h1>
                <p className="text-sm text-zinc-500 mt-1">Hesabınızı ve tercihlerinizi yönetin</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Sidebar */}
                <div className="space-y-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all",
                                activeTab === tab.id
                                    ? "bg-blue-600/10 text-blue-500"
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
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-500 rounded-lg hover:bg-red-500/10 transition-all"
                        >
                            <LogOut className="w-4 h-4" />
                            Çıkış Yap
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="md:col-span-3 space-y-6">
                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <>
                            <Card className="p-5 bg-zinc-800/50 border-zinc-700/50">
                                <h2 className="text-base font-semibold text-zinc-100 mb-4">Profil Bilgileri</h2>
                                <form onSubmit={handleSaveProfile} className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-zinc-400">Ad Soyad</label>
                                            <input
                                                type="text"
                                                value={profile.fullName}
                                                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                                                className="w-full h-9 bg-zinc-900 border border-zinc-700 rounded-lg px-3 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                                placeholder="İsim girin"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-zinc-400">E-posta</label>
                                            <input
                                                type="email"
                                                value={profile.email}
                                                disabled
                                                className="w-full h-9 bg-zinc-900/50 border border-zinc-700/50 rounded-lg px-3 text-sm text-zinc-500 cursor-not-allowed"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end pt-3 border-t border-zinc-700/50">
                                        <Button type="submit" isLoading={loading} variant="primary" className="bg-blue-600 hover:bg-blue-700 text-white h-9 text-sm">
                                            <Save className="w-3.5 h-3.5 mr-1.5" />
                                            Kaydet
                                        </Button>
                                    </div>
                                </form>
                            </Card>

                            <Card className="p-5 bg-zinc-800/50 border-zinc-700/50">
                                <h2 className="text-base font-semibold text-zinc-100 mb-4">Hesap Bilgileri</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3 p-3 bg-zinc-900/50 rounded-lg">
                                        <div className="p-2 bg-blue-600/10 rounded-lg">
                                            <Calendar className="w-4 h-4 text-blue-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-zinc-500">Kayıt Tarihi</p>
                                            <p className="text-sm font-medium text-zinc-100">
                                                {profile.createdAt ? format(new Date(profile.createdAt), 'd MMM yyyy', { locale: tr }) : '—'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-zinc-900/50 rounded-lg">
                                        <div className="p-2 bg-green-600/10 rounded-lg">
                                            <Activity className="w-4 h-4 text-green-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-zinc-500">Son Giriş</p>
                                            <p className="text-sm font-medium text-zinc-100">
                                                {profile.lastSignIn ? format(new Date(profile.lastSignIn), 'd MMM yyyy, HH:mm', { locale: tr }) : '—'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </>
                    )}

                    {/* Security Tab */}
                    {activeTab === 'security' && (
                        <Card className="p-5 bg-zinc-800/50 border-zinc-700/50">
                            <h2 className="text-base font-semibold text-zinc-100 mb-4">Şifre Değiştir</h2>

                            {step === 'request' ? (
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3 p-3 bg-blue-600/5 border border-blue-600/20 rounded-lg">
                                        <Key className="w-5 h-5 text-blue-500 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-zinc-100">İki Adımlı Doğrulama</p>
                                            <p className="text-xs text-zinc-400 mt-0.5">
                                                Şifrenizi değiştirmek için {profile.email} adresine doğrulama kodu göndereceğiz.
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={handleRequestPasswordReset}
                                        isLoading={loading}
                                        variant="primary"
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10"
                                    >
                                        <Mail className="w-4 h-4 mr-2" />
                                        Doğrulama Kodu Gönder
                                    </Button>
                                </div>
                            ) : (
                                <form onSubmit={handleUpdatePassword} className="space-y-4">
                                    <div className="text-center py-2">
                                        <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-2">
                                            <Mail className="w-5 h-5 text-zinc-400" />
                                        </div>
                                        <p className="text-sm text-zinc-300">E-postanı kontrol et</p>
                                        <p className="text-xs text-zinc-500">6 haneli kodu gir</p>
                                    </div>

                                    <input
                                        type="text"
                                        value={security.otpCode}
                                        onChange={(e) => setSecurity({ ...security, otpCode: e.target.value })}
                                        className="w-full h-12 text-center bg-zinc-900 border border-zinc-700 rounded-lg text-xl tracking-[0.5em] font-mono text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                        placeholder="000000"
                                        maxLength={6}
                                    />

                                    <div className="h-px bg-zinc-700/50" />

                                    <div className="space-y-3">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-zinc-400">Yeni Şifre</label>
                                            <input
                                                type="password"
                                                value={security.newPassword}
                                                onChange={(e) => setSecurity({ ...security, newPassword: e.target.value })}
                                                className="w-full h-9 bg-zinc-900 border border-zinc-700 rounded-lg px-3 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                                placeholder="En az 8 karakter"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-zinc-400">Şifre Tekrar</label>
                                            <input
                                                type="password"
                                                value={security.confirmPassword}
                                                onChange={(e) => setSecurity({ ...security, confirmPassword: e.target.value })}
                                                className="w-full h-9 bg-zinc-900 border border-zinc-700 rounded-lg px-3 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-3 border-t border-zinc-700/50">
                                        <button
                                            type="button"
                                            onClick={() => setStep('request')}
                                            className="text-xs text-zinc-500 hover:text-zinc-300"
                                        >
                                            Geri Dön
                                        </button>
                                        <Button type="submit" isLoading={loading} variant="primary" className="bg-blue-600 hover:bg-blue-700 text-white h-9 text-sm">
                                            Şifreyi Güncelle
                                        </Button>
                                    </div>

                                    {timeLeft > 0 && (
                                        <p className="text-center text-xs text-zinc-500">
                                            Yeni kod: {timeLeft}sn
                                        </p>
                                    )}
                                </form>
                            )}
                        </Card>
                    )}

                    {/* Notifications Tab */}
                    {activeTab === 'notifications' && (
                        <Card className="p-5 bg-zinc-800/50 border-zinc-700/50">
                            <h2 className="text-base font-semibold text-zinc-100 mb-4">Bildirim Tercihleri</h2>
                            <div className="space-y-3">
                                {[
                                    { key: 'newGymSignup', label: 'Yeni Salon Kaydı', desc: 'Yeni bir salon kayıt olduğunda bildirim al', icon: CheckCircle2, color: 'text-green-500' },
                                    { key: 'criticalErrors', label: 'Kritik Hatalar', desc: 'Sistemde kritik hata oluştuğunda bildirim al', icon: AlertTriangle, color: 'text-red-500' },
                                    { key: 'paymentAlerts', label: 'Ödeme Bildirimleri', desc: 'Önemli ödeme işlemlerinde bildirim al', icon: Activity, color: 'text-blue-500' },
                                    { key: 'weeklyReport', label: 'Haftalık Rapor', desc: 'Her hafta özet rapor e-postası al', icon: Mail, color: 'text-purple-500' },
                                ].map((item) => (
                                    <div key={item.key} className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className={cn("p-2 rounded-lg bg-zinc-800", item.color)}>
                                                <item.icon className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-zinc-100">{item.label}</p>
                                                <p className="text-xs text-zinc-500">{item.desc}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof notifications] }))}
                                            className={cn(
                                                "w-10 h-6 rounded-full transition-colors relative",
                                                notifications[item.key as keyof typeof notifications] ? "bg-blue-600" : "bg-zinc-700"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-4 h-4 bg-white rounded-full absolute top-1 transition-all",
                                                notifications[item.key as keyof typeof notifications] ? "right-1" : "left-1"
                                            )} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-end pt-4 mt-4 border-t border-zinc-700/50">
                                <Button onClick={handleSaveNotifications} isLoading={loading} variant="primary" className="bg-blue-600 hover:bg-blue-700 text-white h-9 text-sm">
                                    <Save className="w-3.5 h-3.5 mr-1.5" />
                                    Kaydet
                                </Button>
                            </div>
                        </Card>
                    )}

                    {/* Sessions Tab */}
                    {activeTab === 'sessions' && (
                        <>
                            <Card className="p-5 bg-zinc-800/50 border-zinc-700/50">
                                <h2 className="text-base font-semibold text-zinc-100 mb-4">Aktif Oturumlar</h2>
                                {sessionsLoading ? (
                                    <div className="text-center py-8 text-zinc-500 text-sm">Yükleniyor...</div>
                                ) : (
                                    <div className="space-y-3">
                                        {sessions.map((session) => (
                                            <div key={session.id} className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-zinc-800 rounded-lg">
                                                        {session.device.includes('Mobile') ? (
                                                            <Smartphone className="w-4 h-4 text-zinc-400" />
                                                        ) : (
                                                            <Monitor className="w-4 h-4 text-zinc-400" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-medium text-zinc-100">{session.device}</p>
                                                            {session.current && (
                                                                <span className="text-[10px] bg-green-600/10 text-green-500 px-1.5 py-0.5 rounded">
                                                                    Bu cihaz
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-3 text-xs text-zinc-500 mt-0.5">
                                                            <span className="flex items-center gap-1">
                                                                <MapPin className="w-3 h-3" />
                                                                {session.location}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                {format(session.lastActive, 'HH:mm')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                {!session.current && (
                                                    <button className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Card>

                            <Card className="p-5 bg-red-600/5 border-red-600/20">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-red-600/10 rounded-lg">
                                        <AlertTriangle className="w-5 h-5 text-red-500" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-sm font-medium text-zinc-100">Tüm Oturumları Sonlandır</h3>
                                        <p className="text-xs text-zinc-400 mt-0.5">
                                            Bu işlem tüm cihazlardan çıkış yapmanızı sağlar. Tekrar giriş yapmanız gerekecek.
                                        </p>
                                        <Button
                                            onClick={handleSignOutAllSessions}
                                            isLoading={loading}
                                            variant="secondary"
                                            className="mt-3 bg-red-600/10 hover:bg-red-600/20 text-red-500 border-red-600/30 h-8 text-xs"
                                        >
                                            Tüm Oturumları Kapat
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
