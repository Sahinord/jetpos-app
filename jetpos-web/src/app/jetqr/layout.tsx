import type { Metadata } from "next";

// Bu segmente özgü SEO meta verisi. Sayfa "use client" olduğu için metadata
// buradan (sunucu layout'undan) veriliyor.
export const metadata: Metadata = {
  title: `JetQR — Dijital QR Menü`,
  description: `Karekod ile temassız dijital menü ve masadan sipariş; menünüzü saniyeler içinde dijitalleştirin.`,
  alternates: { canonical: "/jetqr" },
  openGraph: { title: `JetQR — Dijital QR Menü`, description: `Karekod ile temassız dijital menü ve masadan sipariş; menünüzü saniyeler içinde dijitalleştirin.`, url: "/jetqr", type: "website", locale: "tr_TR" },
};

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
