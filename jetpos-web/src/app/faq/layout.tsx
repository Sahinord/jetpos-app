import type { Metadata } from "next";

// Bu segmente özgü SEO meta verisi. Sayfa "use client" olduğu için metadata
// buradan (sunucu layout'undan) veriliyor.
export const metadata: Metadata = {
  title: `Sıkça Sorulan Sorular — JetPOS`,
  description: `JetPOS kurulum, fiyatlandırma, entegrasyon ve kullanım hakkında en çok merak edilenler.`,
  alternates: { canonical: "/faq" },
  openGraph: { title: `Sıkça Sorulan Sorular — JetPOS`, description: `JetPOS kurulum, fiyatlandırma, entegrasyon ve kullanım hakkında en çok merak edilenler.`, url: "/faq", type: "website", locale: "tr_TR" },
};

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
