'use server';

import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export async function verifyPattern(pattern: number[]) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    // ÖRNEK DESEN: 0 -> 1 -> 5 -> 6 (Basit bir Z şekli veya kare)
    // Bunu .env dosyasına "0-1-5-6" şeklinde kaydedeceğiz.
    const correctPatternStr = process.env.MASTER_PATTERN_CODE;
    
    // Gecikme (Timing Attack önlemi)
    await new Promise(resolve => setTimeout(resolve, 600));

    if (!correctPatternStr) {
        console.error('MASTER_PATTERN_CODE is not defined!');
        return { success: false, message: 'Sunucu yapılandırma hatası.' };
    }

    const submittedPatternStr = pattern.join('-');
    
    if (submittedPatternStr === correctPatternStr) {
        const cookieStore = await cookies();
        
        cookieStore.set('master-pattern-access', 'granted', {
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
            message: 'Desen Kilidi (Pattern Lock) başarıyla doğrulandı.',
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
        message: 'Desen Kilidi denemesi başarısız: Yanlış desen girildi.',
        user_email: user?.email,
        actor_user_id: user?.id,
        actor_role: 'super_admin'
    });

    return { success: false, message: 'Hatalı desen.' };
}
