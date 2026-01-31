import type { Metadata } from "next";
import { Inter, Roboto, Poppins } from "next/font/google";
import "./globals.css";
import { TenantProvider } from "@/lib/tenant-context";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-roboto",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
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
      <body className={`${inter.variable} ${roboto.variable} ${poppins.variable} font-sans antialiased bg-background text-foreground relative min-h-screen overflow-x-hidden`}>
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
