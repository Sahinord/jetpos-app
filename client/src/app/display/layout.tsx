/**
 * JetPOS Müşteri Ekranı (CFD) - Bağımsız Layout
 * 
 * Bu layout, `/display` route'unu ana uygulama layout'undan (TenantProvider vb.) izole eder.
 * CFD'nin ana uygulamadan bağımsız çalışabilmesi için gereklidir.
 */

import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "../globals.css"; // Stilleri paylaş

const jakarta = Plus_Jakarta_Sans({
    subsets: ["latin"],
    variable: "--font-jakarta",
    weight: ["300", "400", "500", "600", "700", "800"],
    fallback: ["system-ui", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
});

export const metadata: Metadata = {
    title: "JetPos - Müşteri Ekranı",
    description: "JetPos Müşteri Karşı Ekranı (Customer Facing Display)",
};

export default function DisplayLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="tr">
            <body className={`${jakarta.variable} font-sans antialiased bg-background text-foreground relative min-h-screen overflow-hidden`}>
                {/* TenantProvider, LicenseGate, Sidebar yok - salt display sayfası */}
                {children}
            </body>
        </html>
    );
}
