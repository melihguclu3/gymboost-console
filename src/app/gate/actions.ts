'use server';

import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export async function verifyGateAccess(code: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const correctCode = process.env.MASTER_GATE_CODE;
    
    // Brute-force yavaşlatma
    await new Promise(resolve => setTimeout(resolve, 800));

    if (!correctCode) {
        console.error('MASTER_GATE_CODE is not defined!');
        return { success: false, message: 'Sunucu yapılandırma hatası.' };
    }

    if (code === correctCode) {
        const cookieStore = await cookies();
        
        cookieStore.set('master-gate-access', 'granted', {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            path: '/',
            maxAge: 60 * 60 * 24 // 24 saat
        });

        // Başarılı giriş logu
        await supabase.from('system_logs').insert({
            event_type: 'success',
            entity_type: 'auth',
            message: 'Güvenlik Kapısı (Numeric Gate) başarıyla geçildi.',
            user_email: user?.email,
            actor_user_id: user?.id,
            actor_role: 'super_admin'
        });

        return { success: true };
    }

    // Başarısız deneme logu
    await supabase.from('system_logs').insert({
        event_type: 'error',
        entity_type: 'auth',
        message: 'Güvenlik Kapısı denemesi başarısız: Geçersiz kod girildi.',
        user_email: user?.email,
        actor_user_id: user?.id,
        actor_role: 'super_admin'
    });

    return { success: false, message: 'Geçersiz erişim kodu' };
}