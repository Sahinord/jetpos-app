import type { NextConfig } from "next";
import pkg from "./package.json";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version,
  },
  transpilePackages: ["lucide-react", "framer-motion"],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        // Yönetici alan adına özel katı güvenlik başlıkları
        // (bkz. YONETICI_GUVENLIK_PLANI.md K8). Yalnızca admin host'ta —
        // POS tarafında kamera (barkod) ve iframe kullanımını kısıtlamamak için.
        source: "/(.*)",
        has: [{ type: "host", value: "admin.jetpos.shop" }],
        headers: [
          { key: "X-Frame-Options", value: "DENY" }, // clickjacking
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
