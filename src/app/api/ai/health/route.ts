import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
        
        if (!apiKey) {
            return NextResponse.json({ 
                status: 'ERROR', 
                debug: 'GOOGLE_API_KEY tanımlı değil.' 
            });
        }

        // Kütüphaneyi çağırmadan önce Google'ın kendi API endpointine ufak bir ping atalım
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
            method: 'GET'
        });

        if (response.ok) {
            return NextResponse.json({ status: 'ONLINE' });
        } else {
            const errData = await response.json();
            return NextResponse.json({ 
                status: 'ERROR', 
                debug: errData.error?.message || 'Gemini API reddetti.' 
            });
        }
    } catch (error: any) {
        return NextResponse.json({ status: 'ERROR', debug: error.message });
    }
}
