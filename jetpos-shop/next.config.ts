import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Klasik paylaşımlı hosting (FTP, Node.js yok) için statik export.
  // npm run build sonrası "out/" klasörünün içeriği hostinge yüklenir.
  output: "export",
};

export default nextConfig;
