import type { NextConfig } from "next";

// Tüm sayfalara uygulanan güvenlik başlıkları.
// Not: QR menü sayfaları iframe içine gömülmüyor; framlemeyi tümden kapatıyoruz.
const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },              // clickjacking
  { key: "X-Content-Type-Options", value: "nosniff" },          // MIME sniffing
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
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
