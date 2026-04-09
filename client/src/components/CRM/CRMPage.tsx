"use client";

import { Star } from "lucide-react";
import CRMOverview from "./CRMOverview";
import Segments from "./Segments";
import Campaigns from "./Campaigns";

interface CRMPageProps {
    pageId: string;
    showToast?: (message: string, type: "success" | "error" | "info" | "warning") => void;
}

export default function CRMPage({ pageId, showToast }: CRMPageProps) {
    switch (pageId) {
        case "crm_overview":
            return <CRMOverview showToast={showToast} />;
        case "crm_segments":
            return <Segments showToast={showToast} />;
        case "crm_campaigns":
            return <Campaigns showToast={showToast} />;
        case "crm_loyalty":
            return (
                <div className="glass-card p-12 text-center space-y-6 flex flex-col items-center justify-center min-h-[400px]">
                    <div className="p-4 bg-pink-500/10 rounded-full text-pink-400 border border-pink-500/20">
                        <Star className="w-12 h-12" />
                    </div>
                    <div className="max-w-md">
                        <h2 className="text-3xl font-black text-white">Sadakat Puan Sistemi</h2>
                        <p className="text-secondary mt-3 leading-relaxed">Bu modül üzerinden puan kazanım oranlarını, harcama limitlerini ve puan son kullanım tarihlerini yönetebilirsiniz.</p>
                    </div>
                    <button className="px-6 py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-black transition-all">
                        Puan Sistemini Yapılandır
                    </button>
                    <p className="text-[10px] text-pink-500 font-bold uppercase tracking-widest animate-pulse mt-4 italic opacity-70">Sistem Hazırlanıyor</p>
                </div>
            );
        default:
            return <CRMOverview showToast={showToast} />;
    }
}
