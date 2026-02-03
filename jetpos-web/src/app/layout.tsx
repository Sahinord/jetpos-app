import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JetPOS - Bulut Tabanlı Barkodlu Satış Sistemi",
  description: "JetPOS ile hızlı, ekonomik ve kullanıcı dostu satış deneyimi yaşayın. Web tabanlı çözümümüz ile herhangi bir cihazdan barkod sistemine erişim sağlayabilirsiniz.",
  keywords: ["pos sistemi", "stok yönetimi", "barkod sistemi", "e-fatura", "bulut tabanlı", "işletme yönetimi"],
  authors: [{ name: "JetPOS" }],
  openGraph: {
    title: "JetPOS - Bulut Tabanlı Barkodlu Satış Sistemi",
    description: "JetPOS ile hızlı, ekonomik ve kullanıcı dostu satış deneyimi yaşayın. Web tabanlı çözümümüz ile herhangi bir cihazdan barkod sistemine erişim sağlayabilirsiniz.",
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
