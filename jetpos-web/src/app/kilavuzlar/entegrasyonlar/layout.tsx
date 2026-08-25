import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Entegrasyon Rehberleri — Trendyol GO, Getir, Yemek, Ödeal | JetPOS",
    description: "JetPOS entegrasyonlarını adım adım bağlayın: Trendyol GO ürün ekleme, Getir Çarşı ürün eşleştirme, yemek siparişleri ve Ödeal kart ödemesi. Teknik bilgi gerekmez.",
    alternates: { canonical: "/kilavuzlar/entegrasyonlar" },
    openGraph: {
        title: "Entegrasyon Rehberleri | JetPOS",
        description: "Trendyol GO, Getir Çarşı, Yemek platformları ve Ödeal'i adım adım bağlama rehberi.",
        url: "/kilavuzlar/entegrasyonlar",
        type: "article",
        locale: "tr_TR",
    },
};

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
