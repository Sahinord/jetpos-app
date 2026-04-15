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
         * If no signature, check for Supabase session cookies
         * (This allows you to use the dashboard in a browser)
         */
        const hasSession = request.cookies.get('sb-access-token') || 
                          request.cookies.has('supabase-auth-token') ||
                          request.headers.get('Authorization');

        if (hasSession) {
            return NextResponse.next(); // Authenticated Web User Verified! ✅
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
