import type { Metadata } from "next";

// Bu segmente özgü SEO meta verisi. Sayfa "use client" olduğu için metadata
// buradan (sunucu layout'undan) veriliyor.
export const metadata: Metadata = {
  title: `Ücretsiz Demo Talebi — JetPOS`,
  description: `JetPOS’u ücretsiz deneyin; işletmenize özel canlı demo planlayalım.`,
  alternates: { canonical: "/demo" },
  openGraph: { title: `Ücretsiz Demo Talebi — JetPOS`, description: `JetPOS’u ücretsiz deneyin; işletmenize özel canlı demo planlayalım.`, url: "/demo", type: "website", locale: "tr_TR" },
};

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
