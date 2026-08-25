import type { Metadata } from "next";

// Bu segmente özgü SEO meta verisi. Sayfa "use client" olduğu için metadata
// buradan (sunucu layout'undan) veriliyor.
export const metadata: Metadata = {
  title: `İş Ortaklığı ve Bayilik — JetPOS`,
  description: `JetPOS bayilik ve çözüm ortaklığı fırsatları; birlikte büyüyelim.`,
  alternates: { canonical: "/is-ortakligi" },
  openGraph: { title: `İş Ortaklığı ve Bayilik — JetPOS`, description: `JetPOS bayilik ve çözüm ortaklığı fırsatları; birlikte büyüyelim.`, url: "/is-ortakligi", type: "website", locale: "tr_TR" },
};

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
