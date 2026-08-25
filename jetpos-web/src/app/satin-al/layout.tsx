import type { Metadata } from "next";

// Bu segmente özgü SEO meta verisi. Sayfa "use client" olduğu için metadata
// buradan (sunucu layout'undan) veriliyor.
export const metadata: Metadata = {
  title: `Satın Al — JetPOS`,
  description: `JetPOS lisansı ve paketlerini hemen satın alın; kurulumla birlikte kullanmaya başlayın.`,
  alternates: { canonical: "/satin-al" },
  openGraph: { title: `Satın Al — JetPOS`, description: `JetPOS lisansı ve paketlerini hemen satın alın; kurulumla birlikte kullanmaya başlayın.`, url: "/satin-al", type: "website", locale: "tr_TR" },
};

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
