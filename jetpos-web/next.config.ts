import type { NextConfig } from "next";

// İçerik Güvenlik Politikası (CSP). Next.js inline script/style ürettiği için
// script/style'da 'unsafe-inline' gerekli; yine de kaynak alan adlarını
// (Supabase, Google Analytics, görsel/font CDN'leri) kısıtlayarak XSS/enjeksiyon
// yüzeyini daraltır. Yeni bir dış servis eklersen ilgili alanı buraya ekle.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://*.supabase.co https://www.google-analytics.com https://www.googletagmanager.com https://region1.google-analytics.com",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

// Tüm sayfalara uygulanan güvenlik başlıkları.
// Not: QR menü sayfaları iframe içine gömülmüyor; framlemeyi tümden kapatıyoruz.
const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },              // clickjacking
  { key: "X-Content-Type-Options", value: "nosniff" },          // MIME sniffing
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
  { key: "Content-Security-Policy", value: csp },
  // HSTS: HTTPS'i zorunlu kıl (Vercel zaten HTTPS; 2 yıl + subdomain)
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.icons8.com',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
    ];
  },
};

export default nextConfig;
