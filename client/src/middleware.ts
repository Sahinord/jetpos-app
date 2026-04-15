import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import CryptoJS from 'crypto-js';

// Security Secret (Must match the one in api.ts)
const APP_SECRET = 'jetpos_secure_v1_2_8_gatekeeper'; 

/**
 * JetPos Security Guard - v1.2.8
 * Protects all /api routes from unauthorized external access
 */
export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Only protect /api routes, and exclude auth-related specific paths if needed
    if (pathname.startsWith('/api/') && !pathname.includes('/auth/callback')) {
        const signature = request.headers.get('x-jetpos-signature');
        const timestamp = request.headers.get('x-jetpos-timestamp');
        const deviceId = request.headers.get('x-jetpos-device-id');

        // 1. Check if signature exists
        if (!signature || !timestamp || !deviceId) {
            console.warn(`[SECURITY] Blocked request to ${pathname} - Missing security headers`);
            return new NextResponse(JSON.stringify({ error: 'Unauthorized Access Denied' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // 2. Prevent Replay Attacks (Reject requests older than 5 minutes)
        const now = Date.now();
        if (Math.abs(now - parseInt(timestamp)) > 5 * 60 * 1000) {
            console.warn(`[SECURITY] Blocked request to ${pathname} - Expired signature`);
            return new NextResponse(JSON.stringify({ error: 'Signature Expired' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // 3. Verify Signature
        const message = `${pathname}${timestamp}${deviceId}`;
        const expectedSignature = CryptoJS.HmacSHA256(message, APP_SECRET).toString();

        if (signature !== expectedSignature) {
            console.warn(`[SECURITY] Blocked request to ${pathname} - Signature mismatch`);
            return new NextResponse(JSON.stringify({ error: 'Invalid Security Signature' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            });
        }
    }

    return NextResponse.next();
}

/**
 * Configure which paths the middleware should run on
 */
export const config = {
    matcher: '/api/:path*',
};
