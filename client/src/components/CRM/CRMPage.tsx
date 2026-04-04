"use client";

import CRMOverview from "./CRMOverview";

interface CRMPageProps {
    pageId: string;
    showToast?: (message: string, type: "success" | "error" | "info" | "warning") => void;
}

export default function CRMPage({ pageId, showToast }: CRMPageProps) {
    switch (pageId) {
        case "crm_overview":
            return <CRMOverview showToast={showToast} />;
        case "crm_segments":
            return (
                <div className="glass-card p-8 text-center space-y-4">
                    <h2 className="text-2xl font-bold text-white">Müşteri Segmentleri</h2>
                    <p className="text-secondary italic">Bu özellik geliştirme aşamasındadır (AI Analizi Bekleniyor).</p>
                </div>
            );
        case "crm_campaigns":
            return (
                <div className="glass-card p-8 text-center space-y-4">
                    <h2 className="text-2xl font-bold text-white">Kampanya Yönetimi</h2>
                    <p className="text-secondary italic">Bu özellik geliştirme aşamasındadır.</p>
                </div>
            );
        case "crm_loyalty":
            return (
                <div className="glass-card p-8 text-center space-y-4">
                    <h2 className="text-2xl font-bold text-white">Puan Sistemi Ayarları</h2>
                    <p className="text-secondary italic">Bu özellik geliştirme aşamasındadır.</p>
                </div>
            );
        default:
            return <CRMOverview showToast={showToast} />;
    }
}
