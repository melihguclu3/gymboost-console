import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
    try {
        let supabaseResponse = NextResponse.next({ request });

        // -----------------------------------------------------------------------
        // 0. KATMAN: IP KISITLAMASI (Opsiyonel Güvenlik Duvarı)
        // -----------------------------------------------------------------------
        const allowedIps = process.env.ALLOWED_IPS; // Örn: "192.168.1.1,88.241.x.x"
        
        if (allowedIps) {
            // Vercel/Proxy arkasında gerçek IP 'x-forwarded-for' başlığında gelir
            // Genelde format: "client_ip, proxy1, proxy2" şeklindedir. İlkini alırız.
            const forwardedFor = request.headers.get('x-forwarded-for');
            const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : null;
            const allowedList = allowedIps.split(',').map(ip => ip.trim());

            // Eğer IP tespit edilemezse veya listede yoksa -> 403 Forbidden
            if (!clientIp || !allowedList.includes(clientIp)) {
                console.warn(`Unauthorized IP access attempt blocked: ${clientIp}`);
                return new NextResponse(
                    `<h1>403 - Access Denied</h1><p>Your IP address (${clientIp || 'unknown'}) is not authorized to access this secure console.</p>`,
                    { status: 403, headers: { 'content-type': 'text/html' } }
                );
            }
        }

        // MASTER YETKİLERİ: Environment variable'dan okunur (virgülle ayrılmış)
        const masterEmails = (process.env.MASTER_ADMIN_EMAILS || '').split(',').filter(Boolean);

        // Değerleri temizle (boşlukları sil)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

        if (!supabaseUrl || !supabaseAnonKey) {
            console.error('Missing Supabase environment variables');
            return new NextResponse(
                JSON.stringify({ 
                    error: 'Missing Supabase environment variables', 
                    debug: { 
                        hasUrl: !!supabaseUrl, 
                        hasKey: !!supabaseAnonKey,
                        urlLength: supabaseUrl?.length 
                    } 
                }),
                { status: 500, headers: { 'content-type': 'application/json' } }
            );
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

        // Gate sayfasındaysak: Güvenlik önlemi olarak MEVCUT İZNİ SİL (Kilitle)
        if (isMasterGate) {
            if (hasGateAccess) {
                supabaseResponse.cookies.delete('master-gate-access');
            }
            return supabaseResponse;
        }

        // Gate erişimi yoksa ve gate sayfasında değilse -> Gate'e yönlendir
        if (!hasGateAccess) {
            return NextResponse.redirect(new URL('/gate', request.url));
        }

        // -----------------------------------------------------------------------
        // 3. KATMAN: DESEN KİLİDİ (PATTERN LOCK)
        // -----------------------------------------------------------------------
        // BURAYA SADECE GATE'İ GEÇENLER GELEBİLİR
        const hasPatternAccess = request.cookies.get('master-pattern-access')?.value === 'granted';
        const isPatternPage = path === '/verify-pattern';

        if (isPatternPage) {
            // Desen sayfasındayken: Eğer zaten izni varsa login'e at
            if (hasPatternAccess) {
                return NextResponse.redirect(new URL('/login', request.url));
            }
            return supabaseResponse;
        }

        // Eğer desen izni yoksa desen sayfasına yönlendir
        if (!hasPatternAccess) {
            return NextResponse.redirect(new URL('/verify-pattern', request.url));
        }

        // -----------------------------------------------------------------------

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
             // Auth hatası olsa bile 500 verdirmeyelim, login'e atalım
             // console.error('Auth error:', authError);
             // return NextResponse.redirect(new URL('/login', request.url));
             // Sadece user yokmuş gibi davranalım
        }

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
                const { data: session, error: sessionError } = await supabaseAdmin
                    .from('admin_verification_sessions')
                    .select('id, expires_at, revoked_at')
                    .eq('session_token', sessionToken)
                    .gt('expires_at', new Date().toISOString())
                    .is('revoked_at', null)
                    .single();

                if (sessionError || !session) {
                    return NextResponse.redirect(new URL('/verify', request.url));
                }

                await supabaseAdmin
                    .from('admin_verification_sessions')
                    .update({ last_used_at: new Date().toISOString() })
                    .eq('id', session.id);
            }
        }

        return supabaseResponse;

    } catch (e: any) {
        console.error('Critical Middleware Error:', e);
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        // Hata detayını gösteren güvenli bir yanıt dön
        return new NextResponse(
            `<h1>Server Error</h1>
             <p><strong>Message:</strong> ${e.message}</p>
             <p><strong>Detected URL:</strong> "${supabaseUrl}" (Length: ${supabaseUrl?.length || 0})</p>
             <hr/>
             <pre>${e.stack}</pre>`,
            { status: 500, headers: { 'content-type': 'text/html' } }
        );
    }
}