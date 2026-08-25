import type { Metadata } from "next";

// Bu segmente özgü SEO meta verisi. Sayfa "use client" olduğu için metadata
// buradan (sunucu layout'undan) veriliyor.
export const metadata: Metadata = {
  title: `İletişim — JetPOS`,
  description: `JetPOS ekibine ulaşın: destek, satış ve demo talepleriniz için bize yazın.`,
  alternates: { canonical: "/iletisim" },
  openGraph: { title: `İletişim — JetPOS`, description: `JetPOS ekibine ulaşın: destek, satış ve demo talepleriniz için bize yazın.`, url: "/iletisim", type: "website", locale: "tr_TR" },
};

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
