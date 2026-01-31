import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JetPOS - AI Destekli Akıllı İşletme Yönetim Sistemi",
  description: "Yapay zeka destekli stok yönetimi, pazar yeri entegrasyonları, personel takibi ve e-fatura çözümleri. İşletmenizi bir üst seviyeye taşıyın.",
  keywords: ["pos sistemi", "stok yönetimi", "ai analiz", "e-fatura", "trendyol", "işletme yönetimi", "yapay zeka"],
  authors: [{ name: "JetPOS" }],
  openGraph: {
    title: "JetPOS - AI Destekli İşletme Yönetimi",
    description: "Yapay zeka ile işletme yönetiminde yeni çağ",
    type: "website",
    locale: "tr_TR",
  },
  robots: {
    index: true,
    follow: true,
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="scroll-smooth">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
