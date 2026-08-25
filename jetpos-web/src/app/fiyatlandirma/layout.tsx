import type { Metadata } from "next";

// Bu segmente özgü SEO meta verisi. Sayfa "use client" olduğu için metadata
// buradan (sunucu layout'undan) veriliyor.
export const metadata: Metadata = {
  title: `Fiyatlandırma — JetPOS Paketleri ve Abonelik`,
  description: `JetPOS paket ve fiyatlarını inceleyin; işletmenize uygun POS, stok, e-fatura ve entegrasyon çözümünü seçin.`,
  alternates: { canonical: "/fiyatlandirma" },
  openGraph: { title: `Fiyatlandırma — JetPOS Paketleri ve Abonelik`, description: `JetPOS paket ve fiyatlarını inceleyin; işletmenize uygun POS, stok, e-fatura ve entegrasyon çözümünü seçin.`, url: "/fiyatlandirma", type: "website", locale: "tr_TR" },
};

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
