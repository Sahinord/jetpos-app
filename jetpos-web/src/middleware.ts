import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  
  // Get hostname of request
  const hostname = req.headers.get('host') || '';

  // Define main domains that should NOT trigger QR Menu routing
  const mainDomains = [
    'jetpos.shop',
    'www.jetpos.shop',
    // Uygulama alt alan adları — ayrı Vercel projelerine bağlı olsalar da,
    // yanlış yönlenirlerse burada /qr/<isim>'e rewrite EDİLMEMELİ (güvenlik ağı).
    'app.jetpos.shop',
    'admin.jetpos.shop',
    'beta.jetpos.shop',
    'mobile.jetpos.shop',
    'localhost:3000',
    'localhost:3002', 
    '127.0.0.1:3000', 
    '127.0.0.1:3002'
  ];

  if (mainDomains.includes(hostname)) {
    return NextResponse.next();
  }

  // Extract subdomain
  // e.g. "isletme.jetpos.shop" -> "isletme"
  const subdomain = hostname.split('.')[0];
  
  if (subdomain === 'www') {
      return NextResponse.next();
  }

  // Skip API routes, Next.js internal files, and public assets
  if (
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/_next') ||
    url.pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Rewrite to our dynamic QR menu route: /qr/[slug]
  url.pathname = `/qr/${subdomain}${url.pathname === '/' ? '' : url.pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
