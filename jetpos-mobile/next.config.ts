import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@zxing/library', '@zxing/browser'],
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
