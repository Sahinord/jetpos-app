import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const host = request.headers.get('host');

  // Skip if no host or local development on localhost:3005 without subdomain
  if (!host || host.includes('localhost:3005') || host.includes('127.0.0.1')) {
    return NextResponse.next();
  }

  // Base domain check
  const baseDomain = 'jetpos.shop';
  
  // If the host is exactly the base domain, continue to main app
  if (host === baseDomain || host === `www.${baseDomain}`) {
    return NextResponse.next();
  }

  // Check if it's a subdomain
  if (host.endsWith(`.${baseDomain}`)) {
    const subdomain = host.split('.')[0];
    
    // Skip system subdomains
    if (['www', 'admin', 'api', 'dev', 'test'].includes(subdomain)) {
      return NextResponse.next();
    }

    // Rewrite to the QR menu route
    // /m/[slug]
    const path = url.pathname;
    
    // If the path already starts with /m/, no need to rewrite again (avoid loop)
    if (path.startsWith('/m/')) {
      return NextResponse.next();
    }

    // Rewrite the internal URL to include the slug
    // e.g. restoran.jetpos.shop/ -> jetpos.shop/m/restoran/
    // e.g. restoran.jetpos.shop/table/5 -> jetpos.shop/m/restoran/table/5
    return NextResponse.rewrite(new URL(`/m/${subdomain}${path}`, request.url));
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, logo.png (static assets)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|logo.png|.*\\..*).*)',
  ],
};
