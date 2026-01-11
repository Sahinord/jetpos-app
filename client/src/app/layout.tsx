import type { Metadata } from "next";
import { Inter, Roboto, Poppins } from "next/font/google";
import "./globals.css";
import LicenseGate from "@/components/Auth/LicenseGate";

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
  title: "Kardeşler Kasap Muhasebe",
  description: "Ürün ve Muhasebe Yönetim Paneli",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${roboto.variable} ${poppins.variable} font-sans antialiased`}>
        <LicenseGate>
          {children}
        </LicenseGate>
      </body>
    </html>
  );
}
