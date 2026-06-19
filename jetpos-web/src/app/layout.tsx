import React from "react";
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JetPOS - Yeni Nesil Akıllı İşletme Yönetim Platformu | Satış, Stok, E-Fatura",
  description: "JetPOS ile satış, stok, raporlama, cari hesap, e-fatura, çoklu şube, JetKDS mutfak ekranı ve JetQR dijital menü süreçlerinizi tek ekrandan yönetin. Bulut tabanlı, yapay zeka destekli omnichannel işletme çözümü.",
  keywords: ["pos sistemi", "stok yönetimi", "barkod sistemi", "e-fatura", "bulut tabanlı", "işletme yönetimi", "mutfak ekranı", "KDS", "QR menü", "çoklu şube", "raporlama", "cari hesap", "yazarkasa", "restoran pos", "market pos"],
  authors: [{ name: "JetPOS" }],
  openGraph: {
    title: "JetPOS - Yeni Nesil Akıllı İşletme Yönetim Platformu",
    description: "Satış, stok, raporlama, cari hesap, e-fatura ve çoklu şube yönetimini tek ekrandan yapın. JetKDS, JetQR ve pazaryeri entegrasyonları ile işletmenizi dijitalleştirin.",
    type: "website",
    locale: "tr_TR",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang="tr" className="scroll-smooth">
      <body className="antialiased">
        {/* Google Analytics — only loads when a real GA ID is configured */}
        {gaId && gaId !== "G-XXXXXXXXXX" && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}></script>
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${gaId}');
                `,
              }}
            />
          </>
        )}
        {children}
      </body>
    </html>
  );
}

