import type { Metadata } from "next";

// Bu segmente özgü SEO meta verisi. Sayfa "use client" olduğu için metadata
// buradan (sunucu layout'undan) veriliyor.
export const metadata: Metadata = {
  title: `Kullanım Koşulları — JetPOS`,
  description: `JetPOS hizmet kullanım koşulları ve sözleşme şartları.`,
  alternates: { canonical: "/terms" },
  openGraph: { title: `Kullanım Koşulları — JetPOS`, description: `JetPOS hizmet kullanım koşulları ve sözleşme şartları.`, url: "/terms", type: "website", locale: "tr_TR" },
};

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
