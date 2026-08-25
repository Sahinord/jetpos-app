import type { Metadata } from "next";

// Bu segmente özgü SEO meta verisi. Sayfa "use client" olduğu için metadata
// buradan (sunucu layout'undan) veriliyor.
export const metadata: Metadata = {
  title: `JetPOS — POS ve İşletme Yönetim Yazılımı`,
  description: `Satış, stok, e-fatura, cari hesap ve raporlamayı tek ekranda yöneten bulut tabanlı POS yazılımı.`,
  alternates: { canonical: "/urunler/jetpos" },
  openGraph: { title: `JetPOS — POS ve İşletme Yönetim Yazılımı`, description: `Satış, stok, e-fatura, cari hesap ve raporlamayı tek ekranda yöneten bulut tabanlı POS yazılımı.`, url: "/urunler/jetpos", type: "website", locale: "tr_TR" },
};

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
