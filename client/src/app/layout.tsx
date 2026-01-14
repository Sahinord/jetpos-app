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
        <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.03)_0%,transparent_70%)]" />
        </div>

        <TenantProvider>
          {children}
        </TenantProvider>
      </body>
    </html>
  );
}
