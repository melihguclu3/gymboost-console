import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const apiKey = process.env.RESEND_API_KEY;
        
        if (!apiKey) {
            return NextResponse.json({ 
                status: 'ERROR', 
                debug: 'RESEND_API_KEY tanımlı değil.' 
            });
        }

        const response = await fetch('https://api.resend.com/api_keys', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            return NextResponse.json({ status: 'ONLINE' });
        } else {
            const errData = await response.json();
            return NextResponse.json({ 
                status: 'ERROR', 
                debug: errData.message || 'API reddetti.' 
            });
        }
    } catch (error: any) {
        return NextResponse.json({ status: 'ERROR', debug: error.message });
    }
}
