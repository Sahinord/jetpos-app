import type { NextConfig } from "next";
import pkg from "./package.json";

const nextConfig: NextConfig = {
  // output: "export", // Vercel'de export bazen chunk hatalarına sebep olur, standalone daha iyidir
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
};

export default nextConfig;
