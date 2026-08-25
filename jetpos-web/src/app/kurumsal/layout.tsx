import type { Metadata } from "next";

// Bu segmente özgü SEO meta verisi. Sayfa "use client" olduğu için metadata
// buradan (sunucu layout'undan) veriliyor.
export const metadata: Metadata = {
  title: `Kurumsal — JetPOS`,
  description: `JetPOS kurumsal çözümleri, çoklu şube yönetimi ve iş ortaklıkları.`,
  alternates: { canonical: "/kurumsal" },
  openGraph: { title: `Kurumsal — JetPOS`, description: `JetPOS kurumsal çözümleri, çoklu şube yönetimi ve iş ortaklıkları.`, url: "/kurumsal", type: "website", locale: "tr_TR" },
};

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
