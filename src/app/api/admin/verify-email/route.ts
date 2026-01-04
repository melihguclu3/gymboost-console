import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

import { getEmailTemplate } from '@/lib/email-templates';
import { sendResendEmail } from '@/lib/email';

type VerifyEmailPayload = {
    email?: string;
};

export const runtime = 'nodejs';

const CODE_TTL_SECONDS = 60;
const RESEND_COOLDOWN_SECONDS = 30;
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
    let payload: VerifyEmailPayload;
    try {
        payload = await request.json();
    } catch {
        return NextResponse.json({ message: 'Gecersiz istek.' }, { status: 400 });
    }

    const email = typeof payload.email === 'string' ? payload.email.trim() : '';
    if (!email) {
        return NextResponse.json({ message: 'E-posta zorunlu.' }, { status: 400 });
    }

    if (!MASTER_EMAILS.includes(email.toLowerCase())) {
        await logSystemEvent('error', 'Master admin e-posta istegi reddedildi.', email);
        return NextResponse.json({ message: 'Yetkisiz istek.' }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
    const userAgent = request.headers.get('user-agent') || null;

    const { data: lastCode } = await supabase
        .from('admin_verification_codes')
        .select('created_at')
        .eq('email', email)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (lastCode?.created_at) {
        const lastCreatedAt = new Date(lastCode.created_at).getTime();
        const now = Date.now();
        const diffSeconds = Math.floor((now - lastCreatedAt) / 1000);
        if (diffSeconds < RESEND_COOLDOWN_SECONDS) {
            const waitSeconds = RESEND_COOLDOWN_SECONDS - diffSeconds;
            await logSystemEvent('warning', `E-posta kodu istek limiti. ${waitSeconds} sn. ip=${ipAddress || 'n/a'}`, email);
            return NextResponse.json(
                { message: `Lutfen ${waitSeconds} saniye bekleyin.`, cooldown: waitSeconds },
                { status: 429 }
            );
        }
    }

    const code = crypto.randomInt(100000, 1000000).toString();
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    const expiresAt = new Date(Date.now() + CODE_TTL_SECONDS * 1000).toISOString();

    const { error: insertError } = await supabase.from('admin_verification_codes').insert({
        email,
        code_hash: codeHash,
        expires_at: expiresAt,
        ip_address: ipAddress,
        user_agent: userAgent,
    });

    if (insertError) {
        await logSystemEvent('error', `Dogrulama kodu kaydedilemedi. ${insertError.message}`, email);
        return NextResponse.json({ message: 'Dogrulama kodu kaydedilemedi.' }, { status: 500 });
    }

    const subject = 'Güvenlik Doğrulaması - GymBoost Dev Console';
    const html = getEmailTemplate(
        'Giriş Doğrulaması',
        'Geliştirici paneline erişmek için aşağıdaki 6 haneli güvenlik kodunu kullanın.',
        code
    );

    const result = await sendResendEmail(email, subject, html);
    if (!result.ok) {
        await logSystemEvent('error', `Dogrulama e-postasi gonderilemedi. ${result.error || ''}`.trim(), email);
        return NextResponse.json({ message: result.error || 'E-posta gonderilemedi.' }, { status: 500 });
    }

    await logSystemEvent(
        'success',
        `Dogrulama kodu gonderildi. ip=${ipAddress || 'n/a'}`,
        email
    );
    return NextResponse.json({ ok: true, expiresIn: CODE_TTL_SECONDS, cooldown: RESEND_COOLDOWN_SECONDS });
}
