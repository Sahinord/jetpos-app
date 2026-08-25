import type { Metadata } from "next";

// Bu segmente özgü SEO meta verisi. Sayfa "use client" olduğu için metadata
// buradan (sunucu layout'undan) veriliyor.
export const metadata: Metadata = {
  title: `Hakkımızda — JetPOS`,
  description: `JetPOS’un hikayesi, vizyonu ve işletmeleri dijitalleştirme misyonu.`,
  alternates: { canonical: "/hakkimizda" },
  openGraph: { title: `Hakkımızda — JetPOS`, description: `JetPOS’un hikayesi, vizyonu ve işletmeleri dijitalleştirme misyonu.`, url: "/hakkimizda", type: "website", locale: "tr_TR" },
};

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
