import type { Metadata } from "next";

// Bu segmente özgü SEO meta verisi. Sayfa "use client" olduğu için metadata
// buradan (sunucu layout'undan) veriliyor.
export const metadata: Metadata = {
  title: `Gizlilik ve KVKK — JetPOS`,
  description: `JetPOS gizlilik politikası ve KVKK aydınlatma metni.`,
  alternates: { canonical: "/gizlilik" },
  openGraph: { title: `Gizlilik ve KVKK — JetPOS`, description: `JetPOS gizlilik politikası ve KVKK aydınlatma metni.`, url: "/gizlilik", type: "website", locale: "tr_TR" },
};

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
