import type { Metadata } from "next";
import { Inter, Outfit, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { TenantProvider } from "@/lib/tenant-context";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-outfit",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: "JetPos - İşiniz Jet Hızında",
  description: "Multi-Tenant POS ve Muhasebe Yönetim Sistemi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={`${inter.variable} ${outfit.variable} ${jakarta.variable} font-outfit antialiased bg-background text-foreground relative min-h-screen overflow-x-hidden`}>
        {/* Global Premium Background Effects */}
        <div className="glow-container">
          <div className="glow-top-left" />
          <div className="glow-bottom-right" />
        </div>

        <TenantProvider>
          {children}
        </TenantProvider>
      </body>
    </html>
  );
}
