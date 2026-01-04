import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function proxy(request: NextRequest) {
    // Console projesi zaten kendi başına bağımsız olduğu için 
    // ek subdomain rewrite mantığına burada gerek yok.
    // Sadece Supabase oturum kontrolünü yapıyoruz.
    return await updateSession(request);
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
