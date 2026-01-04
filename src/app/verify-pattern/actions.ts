'use server';

import { cookies } from 'next/headers';

export async function verifyPattern(pattern: number[]) {
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

        return { success: true };
    }

    return { success: false, message: 'Hatalı desen.' };
}
