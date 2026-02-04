import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { TenantProvider } from "@/lib/tenant-context";
import ContextMenu from "@/components/Common/ContextMenu";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["300", "400", "500", "600", "700", "800"],
  fallback: ["system-ui", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
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
      <body className={`${jakarta.variable} font-sans antialiased bg-background text-foreground relative min-h-screen overflow-x-hidden`}>
        <TenantProvider>
          <ContextMenu />
          {children}
        </TenantProvider>
      </body>
    </html>
  );
}
