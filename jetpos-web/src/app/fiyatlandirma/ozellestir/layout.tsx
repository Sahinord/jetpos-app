import type { Metadata } from "next";

// Bu segmente özgü SEO meta verisi. Sayfa "use client" olduğu için metadata
// buradan (sunucu layout'undan) veriliyor.
export const metadata: Metadata = {
  title: `Paketini Özelleştir — JetPOS`,
  description: `İhtiyacına göre modül seçerek kendi JetPOS paketini oluştur; sadece kullandığın özellikler için öde.`,
  alternates: { canonical: "/fiyatlandirma/ozellestir" },
  openGraph: { title: `Paketini Özelleştir — JetPOS`, description: `İhtiyacına göre modül seçerek kendi JetPOS paketini oluştur; sadece kullandığın özellikler için öde.`, url: "/fiyatlandirma/ozellestir", type: "website", locale: "tr_TR" },
};

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
