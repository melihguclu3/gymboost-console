import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

type VerifyConfirmPayload = {
    email?: string;
    code?: string;
};

export const runtime = 'nodejs';

const CODE_TTL_SECONDS = 60;
const MAX_ATTEMPTS = 5;
const SESSION_TTL_SECONDS = 60 * 60 * 8;
const DEFAULT_MASTER_EMAILS = ['bigfoothdestek@gmail.com', 'guclumelih3@gmail.com'];
const MASTER_EMAILS = (
    process.env.MASTER_ADMIN_EMAILS ||
    DEFAULT_MASTER_EMAILS.join(',')
)
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean);

function getSupabaseAdmin() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
        throw new Error('Supabase admin ayarlari eksik.');
    }
    return createClient(url, key, { auth: { persistSession: false } });
}

async function logSystemEvent(eventType: string, message: string, userEmail?: string | null) {
    try {
        const supabase = getSupabaseAdmin();
        await supabase.from('system_logs').insert({
            event_type: eventType,
            message,
            user_email: userEmail || null,
            gym_name: null,
        });
    } catch {
        // Log failures should not block verification flow.
    }
}

export async function POST(request: Request) {
    let payload: VerifyConfirmPayload;
    try {
        payload = await request.json();
    } catch {
        return NextResponse.json({ message: 'Gecersiz istek.' }, { status: 400 });
    }

    const email = typeof payload.email === 'string' ? payload.email.trim() : '';
    const code = typeof payload.code === 'string' ? payload.code.trim() : '';
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
    const userAgent = request.headers.get('user-agent') || null;

    if (!email || !code) {
        return NextResponse.json({ message: 'E-posta ve kod zorunlu.' }, { status: 400 });
    }

    if (!MASTER_EMAILS.includes(email.toLowerCase())) {
        await logSystemEvent('error', `Master admin kod dogrulamasi reddedildi. ip=${ipAddress || 'n/a'}`, email);
        return NextResponse.json({ message: 'Yetkisiz istek.' }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();

    const { data: latestCode } = await supabase
        .from('admin_verification_codes')
        .select('*')
        .eq('email', email)
        .is('consumed_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (!latestCode) {
        await logSystemEvent('error', `Dogrulama kodu bulunamadi. ip=${ipAddress || 'n/a'}`, email);
        return NextResponse.json({ message: 'Dogrulama kodu bulunamadi.' }, { status: 400 });
    }

    const now = new Date();
    if (new Date(latestCode.expires_at) < now) {
        await logSystemEvent('error', `Dogrulama kodu suresi doldu. ip=${ipAddress || 'n/a'}`, email);
        return NextResponse.json({ message: `Kodun suresi doldu. (${CODE_TTL_SECONDS} sn)` }, { status: 400 });
    }

    if ((latestCode.attempts || 0) >= MAX_ATTEMPTS) {
        await logSystemEvent('error', `Cok fazla hatali deneme. ip=${ipAddress || 'n/a'}`, email);
        return NextResponse.json({ message: 'Cok fazla hatali deneme. Yeni kod isteyin.' }, { status: 429 });
    }

    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    if (codeHash !== latestCode.code_hash) {
        await supabase
            .from('admin_verification_codes')
            .update({ attempts: (latestCode.attempts || 0) + 1 })
            .eq('id', latestCode.id);

        await logSystemEvent(
            'error',
            `Dogrulama kodu hatali girildi. deneme=${(latestCode.attempts || 0) + 1} ip=${ipAddress || 'n/a'}`,
            email
        );
        return NextResponse.json({ message: 'Kod hatali. Tekrar deneyin.' }, { status: 400 });
    }

    await supabase
        .from('admin_verification_codes')
        .update({ consumed_at: now.toISOString() })
        .eq('id', latestCode.id);

    const sessionToken = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
    const sessionExpiresAt = new Date(now.getTime() + SESSION_TTL_SECONDS * 1000).toISOString();

    const { error: sessionError } = await supabase.from('admin_verification_sessions').insert({
        email,
        session_token: sessionToken,
        expires_at: sessionExpiresAt,
        ip_address: ipAddress,
        user_agent: userAgent,
        last_used_at: now.toISOString(),
    });

    if (sessionError) {
        await logSystemEvent('error', `Dogrulama oturumu olusturulamadi. ${sessionError.message}`, email);
        return NextResponse.json({ message: 'Dogrulama oturumu olusturulamadi.' }, { status: 500 });
    }

    await logSystemEvent('success', `Master admin dogrulamasi basarili. ip=${ipAddress || 'n/a'}`, email);

    const response = NextResponse.json({ ok: true });
    const isSecure = process.env.NODE_ENV === 'production';
    response.cookies.set('super-admin-session', sessionToken, {
        httpOnly: true,
        secure: isSecure,
        sameSite: 'lax',
        path: '/',
        maxAge: SESSION_TTL_SECONDS,
    });
    response.cookies.set('super-admin-verified', 'true', {
        httpOnly: false,
        secure: isSecure,
        sameSite: 'lax',
        path: '/',
        maxAge: SESSION_TTL_SECONDS,
    });
    return response;
}
