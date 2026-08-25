import type { Metadata } from "next";

// Bu segmente özgü SEO meta verisi. Sayfa "use client" olduğu için metadata
// buradan (sunucu layout'undan) veriliyor.
export const metadata: Metadata = {
  title: `JetKDS — Mutfak Ekranı (KDS)`,
  description: `Siparişleri mutfağa anlık ileten dokunmatik mutfak ekranı sistemi; hazırlık süreçlerini hızlandırın.`,
  alternates: { canonical: "/urunler/jetkds" },
  openGraph: { title: `JetKDS — Mutfak Ekranı (KDS)`, description: `Siparişleri mutfağa anlık ileten dokunmatik mutfak ekranı sistemi; hazırlık süreçlerini hızlandırın.`, url: "/urunler/jetkds", type: "website", locale: "tr_TR" },
};

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
