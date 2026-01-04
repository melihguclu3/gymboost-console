'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function verifyGateAccess(code: string) {
    const correctCode = process.env.MASTER_GATE_CODE;
    
    // 1. Gecikme ekle (Brute-force'u yavaşlatmak için)
    await new Promise(resolve => setTimeout(resolve, 800));

    if (!correctCode) {
        console.error('MASTER_GATE_CODE is not defined in environment variables');
        return { success: false, message: 'Sunucu yapılandırma hatası.' };
    }

    if (code === correctCode) {
        // 2. Cookie'yi SUNUCU TARAFINDA set et (HttpOnly)
        // Böylece client-side JS ile bu cookie taklit edilemez.
        const cookieStore = await cookies();
        
        cookieStore.set('master-gate-access', 'granted', {
            httpOnly: true, // JS erişemez
            secure: true,   // Sadece HTTPS
            sameSite: 'strict',
            path: '/',
            maxAge: 60 * 60 * 24 // 24 saat
        });

        return { success: true };
    }

    return { success: false, message: 'Geçersiz erişim kodu' };
}
