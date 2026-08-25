import type { Metadata } from "next";

// Bu segmente özgü SEO meta verisi. Sayfa "use client" olduğu için metadata
// buradan (sunucu layout'undan) veriliyor.
export const metadata: Metadata = {
  title: `Sistem Gereksinimleri — JetPOS`,
  description: `JetPOS’un sorunsuz çalışması için önerilen donanım ve yazılım gereksinimleri.`,
  alternates: { canonical: "/sistem-gereksinimleri" },
  openGraph: { title: `Sistem Gereksinimleri — JetPOS`, description: `JetPOS’un sorunsuz çalışması için önerilen donanım ve yazılım gereksinimleri.`, url: "/sistem-gereksinimleri", type: "website", locale: "tr_TR" },
};

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
