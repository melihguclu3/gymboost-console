import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request });

    // MASTER YETKİLERİ: Environment variable'dan okunur (virgülle ayrılmış)
    const masterEmails = (process.env.MASTER_ADMIN_EMAILS || '').split(',').filter(Boolean);

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

    // Console projesi standalone olduğu için her yer Master Area'dır.
    const isMasterArea = true;

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

            const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
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
    return supabaseResponse;

    // 3. NORMAL KULLANICI ROTALARI
    const isAdminRoute = path.startsWith('/admin');
    const isTrainerRoute = path.startsWith('/trainer');
    const isMemberRoute = path.startsWith('/dashboard') || path.startsWith('/profile') || path.startsWith('/workouts') || path.startsWith('/history') || path.startsWith('/scan');
    const isAuthRoute = path.startsWith('/login') || path.startsWith('/register');
    const isAccountDisabledPage = path === '/account-disabled';

    if (!user && (isMemberRoute || isAdminRoute || isTrainerRoute)) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    if (user) {
        const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
        const { data: userData } = await supabaseAdmin
            .from('users')
            .select('role, email, gym_id')
            .eq('id', user.id)
            .single();

        let userRole = userData?.role;
        // Master email kontrolü
        if (userData?.email && masterEmails.includes(userData.email)) {
            userRole = 'super_admin';
        }

        if (
            userRole === 'admin' ||
            userRole === 'trainer' ||
            (userRole === 'super_admin' && isAdminRoute)
        ) {
            const { data: gymData } = await supabaseAdmin
                .from('gyms')
                .select('settings')
                .eq('id', userData?.gym_id)
                .single();

            const gymStatus = gymData?.settings?.status;
            if ((gymStatus === 'archived' || gymStatus === 'suspended') && !isAccountDisabledPage) {
                return NextResponse.redirect(new URL('/account-disabled', request.url));
            }
        }

        if (isAuthRoute) {
            // super_admin /login'e erişebilsin (test amaçlı farklı hesapla giriş için)
            if (userRole === 'admin') return NextResponse.redirect(new URL('/admin', request.url));
            if (userRole === 'trainer') return NextResponse.redirect(new URL('/trainer', request.url));
            if (userRole !== 'super_admin') return NextResponse.redirect(new URL('/dashboard', request.url));
        }

        if (isAdminRoute && userRole !== 'admin' && userRole !== 'super_admin') {
            const target = userRole === 'trainer' ? '/trainer' : '/dashboard';
            return NextResponse.redirect(new URL(target, request.url));
        }
        if (isTrainerRoute && userRole !== 'trainer') {
            const target = userRole === 'admin' ? '/admin' : userRole === 'super_admin' ? '/melihinozelalani' : '/dashboard';
            return NextResponse.redirect(new URL(target, request.url));
        }
        if (isMemberRoute && (userRole === 'admin' || userRole === 'super_admin' || userRole === 'trainer')) {
            const target = userRole === 'super_admin' ? '/melihinozelalani' : userRole === 'trainer' ? '/trainer' : '/admin';
            return NextResponse.redirect(new URL(target, request.url));
        }
    }

    return supabaseResponse;
}
