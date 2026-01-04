import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request });

    // MASTER YETKİLERİ: Environment variable'dan okunur (virgülle ayrılmış)
    const masterEmails = (process.env.MASTER_ADMIN_EMAILS || '').split(',').filter(Boolean);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Missing Supabase environment variables');
        return supabaseResponse;
    }

    const supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
            cookies: {
                getAll() { return request.cookies.getAll(); },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                    supabaseResponse = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
                },
            },
        }
    );

    const path = request.nextUrl.pathname;

    // API route'ları için korumayı atla - kendi auth mekanizmalarını kullanıyorlar
    const isApiRoute = path.startsWith('/api/');
    if (isApiRoute) {
        return supabaseResponse;
    }

    // Console projesi standalone olduğu için her yer Master Area'dır.
    // 1. MASTER ALAN TANIMLAMALARI
    const isMasterGate = path === '/gate';
    const isMasterLogin = path === '/login';
    const isMasterVerify = path === '/verify';

    // 2. MASTER ALAN KONTROLÜ (MUTLAK ÖNCELİK)
    // 2.1 GATE (KAPI) KONTROLÜ - Tüm master alanına girmeden önce şifre gerekli
    const hasGateAccess = request.cookies.get('master-gate-access')?.value === 'granted';

    if (!hasGateAccess && !isMasterGate) {
        // Gate erişimi yoksa ve gate sayfasında değilse -> Gate'e yönlendir
        return NextResponse.redirect(new URL('/gate', request.url));
    }

    // Gate sayfasındaysa ve erişimi varsa -> Login'e yönlendir
    if (isMasterGate && hasGateAccess) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Gate sayfasındaysa işleme devam et
    if (isMasterGate) {
        return supabaseResponse;
    }

    try {
        const { data: { user } } = await supabase.auth.getUser();

        // 2.2 Normal master alan kontrolleri (gate geçildikten sonra)
        if (!user && !isMasterLogin) {
            return NextResponse.redirect(new URL('/login', request.url));
        }

        if (user) {
            if (!masterEmails.includes(user.email || '')) {
                // Master değilse erişimi kapat (Standalone konsol projesi master dışında kimseye açılmaz)
                return NextResponse.redirect(new URL('https://app.gymboost.tr', request.url));
            }

            if (!isMasterLogin && !isMasterVerify) {
                const sessionToken = request.cookies.get('super-admin-session')?.value;
                if (!sessionToken) {
                    return NextResponse.redirect(new URL('/verify', request.url));
                }

                if (!serviceRoleKey) {
                    console.error('SUPABASE_SERVICE_ROLE_KEY is missing');
                    return supabaseResponse;
                }

                const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
                const { data: session } = await supabaseAdmin
                    .from('admin_verification_sessions')
                    .select('id, expires_at, revoked_at')
                    .eq('session_token', sessionToken)
                    .gt('expires_at', new Date().toISOString())
                    .is('revoked_at', null)
                    .single();

                if (!session) {
                    return NextResponse.redirect(new URL('/verify', request.url));
                }

                await supabaseAdmin
                    .from('admin_verification_sessions')
                    .update({ last_used_at: new Date().toISOString() })
                    .eq('id', session.id);
            }
        }
    } catch (error) {
        console.error('Middleware error:', error);
        return supabaseResponse;
    }

    return supabaseResponse;
}