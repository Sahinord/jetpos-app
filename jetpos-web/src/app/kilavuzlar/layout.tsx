import type { Metadata } from "next";

// Bu segmente özgü SEO meta verisi. Sayfa "use client" olduğu için metadata
// buradan (sunucu layout'undan) veriliyor.
export const metadata: Metadata = {
  title: `Kılavuzlar ve Yardım — JetPOS`,
  description: `JetPOS kurulum, ayar ve kullanım kılavuzları; adım adım rehberler.`,
  alternates: { canonical: "/kilavuzlar" },
  openGraph: { title: `Kılavuzlar ve Yardım — JetPOS`, description: `JetPOS kurulum, ayar ve kullanım kılavuzları; adım adım rehberler.`, url: "/kilavuzlar", type: "website", locale: "tr_TR" },
};

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
