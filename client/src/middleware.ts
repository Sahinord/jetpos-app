import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import CryptoJS from 'crypto-js';

// Security Secret (Must match the one in api.ts)
const APP_SECRET = 'jetpos_secure_v1_2_8_gatekeeper'; 

/**
 * JetPos Security Guard - v1.3.2
 * Protects API from unauthorized access while allowing:
 * 1. Sealed Electron requests (HMAC)
 * 2. Authenticated Web requests (Session)
 */
export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Skip security checks in development mode for easier debugging
    if (process.env.NODE_ENV === 'development') {
        return NextResponse.next();
    }

    // Public webhook uçları — kendi güçlü doğrulamalarını (x-api-key, sabit-zamanlı)
    // route handler'da yaparlar; JetPos middleware'i bunları geçirmeli, aksi halde
    // dış servis (Getir) header'larımız olmadığı için 401 yer.
    // Dış servislerin çağırdığı webhook uçları (kendi güçlü doğrulamaları route'ta).
    // Not: Ödeal'de yalnızca WEBHOOK'lar public; pay/status/register-callbacks
    // POS tarafından x-tenant-id + x-license-key ile çağrılır, onlar korumada kalır.
    const PUBLIC_API_PATHS = [
        '/api/getir-carsi/',
        '/api/odeal/payment-succeeded',
        '/api/odeal/payment-cancelled',
        '/api/odeal/payment-failed',
        '/api/odeal/e-invoice-created',
    ];
    if (PUBLIC_API_PATHS.some((p) => pathname.startsWith(p))) {
        return NextResponse.next();
    }

    // Only protect /api routes
    if (pathname.startsWith('/api/') && !pathname.includes('/auth/callback')) {
        const signature = request.headers.get('x-jetpos-signature');
        const timestamp = request.headers.get('x-jetpos-timestamp');
        const deviceId = request.headers.get('x-jetpos-device-id');

        // IF it's a sealed request from Electron, verify it
        if (signature && timestamp && deviceId) {
            // Prevent Replay Attacks (Reject requests older than 5 minutes)
            const now = Date.now();
            if (Math.abs(now - parseInt(timestamp)) > 5 * 60 * 1000) {
                return new NextResponse(JSON.stringify({ error: 'Signature Expired' }), {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' },
                });
            }

            // Verify HMAC Signature
            const message = `${pathname}${timestamp}${deviceId}`;
            const expectedSignature = CryptoJS.HmacSHA256(message, APP_SECRET).toString();

            if (signature === expectedSignature) {
                return NextResponse.next(); // Electron Verified! ✅
            }
        }

        /**
         * WEB CLIENT FALLBACK
         * JetPos Supabase Auth kullanmıyor — kimlik license_key + tenant_id ile
         * doğrulanıyor (bkz. lib/tenant-context.tsx). Bu yüzden gerçek doğrulama
         * burada DEĞİL, route handler'larda lib/server-tenant-auth.ts ile yapılıyor
         * (bu katman DB'ye bakabiliyor, edge middleware her istekte bakmasın diye
         * burada sadece "şekli doğru mu" kontrolü var). Önceden burada SADECE bir
         * Authorization header'ının VAR OLMASI yetiyordu (değeri hiç kontrol
         * edilmiyordu) — bu trivial bir bypass'tı, kaldırıldı.
         */
        const hasTenantHeaders = request.headers.get('x-tenant-id') && request.headers.get('x-license-key');

        if (hasTenantHeaders) {
            return NextResponse.next(); // Şekli doğru — asıl doğrulama route handler'da
        }

        // NO ACCESS
        console.warn(`[SECURITY] Blocked unauthorized access to ${pathname}`);
        return new NextResponse(JSON.stringify({ error: 'Unauthorized Access Denied' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    return NextResponse.next();
}

export const config = {
    matcher: '/api/:path*',
};
