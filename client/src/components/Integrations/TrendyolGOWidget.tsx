"use client";

import { useState } from "react";
import { Package, TrendingUp, RefreshCw, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";

export default function TrendyolGOWidget() {
    const [isConfigured, setIsConfigured] = useState(false);
    const [syncing, setSyncing] = useState(false);

    // Mock data - Credentials gelince gerçek olacak
    const stats = {
        totalOrders: 0,
        pendingOrders: 0,
        stockUpdates: 0,
        lastSync: null,
        status: "not_configured" // "connected" | "syncing" | "error"
    };

    const handleTestConnection = async () => {
        setSyncing(true);
        // TODO: Gerçek API çağrısı buraya
        setTimeout(() => {
            setSyncing(false);
            alert("⚠️ Trendyol GO credentials henüz yapılandırılmadı!\n\nLütfen .env.local dosyasına ekleyin:\n- TRENDYOL_GO_SUPPLIER_ID\n- TRENDYOL_GO_STORE_ID\n- TRENDYOL_GO_AGENT_NAME\n- TRENDYOL_GO_EXECUTOR_USER");
        }, 1000);
    };

    return (
        <div className="glass-card p-6 space-y-6 border-l-4 border-l-orange-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center">
                        <Package className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-white">Trendyol GO</h3>
                        <p className="text-xs text-secondary">Hızlı Market Entegrasyonu</p>
                    </div>
                </div>

                {isConfigured ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs font-bold text-emerald-500">Bağlı</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full">
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-bold text-amber-500">Yapılandırma Gerekli</span>
                    </div>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-xs text-secondary font-bold uppercase mb-1">Siparişler</p>
                    <p className="text-2xl font-black text-white">{stats.totalOrders}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-xs text-secondary font-bold uppercase mb-1">Bekleyen</p>
                    <p className="text-2xl font-black text-amber-400">{stats.pendingOrders}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-xs text-secondary font-bold uppercase mb-1">Stok Günc.</p>
                    <p className="text-2xl font-black text-primary">{stats.stockUpdates}</p>
                </div>
            </div>

            {/* Configuration Status */}
            {!isConfigured && (
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 space-y-3">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <h4 className="text-sm font-black text-amber-400 mb-2">Entegrasyon Henüz Yapılandırılmadı</h4>
                            <p className="text-xs text-amber-400/60 leading-relaxed mb-3">
                                Trendyol GO entegrasyonunu kullanmak için önce API credentials almanız gerekiyor.
                            </p>

                            <div className="space-y-2 text-xs text-amber-400/80">
                                <p className="font-bold">✉️ Yapılacaklar:</p>
                                <ol className="list-decimal list-inside space-y-1 ml-2">
                                    <li>Trendyol Partner Portal'a giriş yap</li>
                                    <li>API entegrasyonu talep et</li>
                                    <li>Credentials'ı .env.local'e ekle</li>
                                    <li>Uygulamayı yeniden başlat</li>
                                </ol>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <a
                            href="https://partner.trendyol.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-xl text-xs font-bold text-amber-400 transition-all"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Partner Portal
                        </a>

                        <button
                            onClick={() => window.open('/TRENDYOL_GO_ENTEGRASYON_MAIL_SABLONU.md', '_blank')}
                            className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-xl text-xs font-bold text-amber-400 transition-all"
                        >
                            📧 Mail Şablonu
                        </button>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
                <button
                    onClick={handleTestConnection}
                    disabled={syncing}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 hover:bg-orange-600 rounded-xl text-white font-bold transition-all disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                    {syncing ? 'Test Ediliyor...' : 'Bağlantıyı Test Et'}
                </button>

                <button
                    className="px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white font-bold transition-all"
                    onClick={() => alert('API Dokümantasyonu: /TRENDYOL_GO_STOK_SENKRONIZASYON_RAPORU.md')}
                >
                    📖 Döküman
                </button>
            </div>

            {/* Last Sync */}
            {stats.lastSync && (
                <div className="text-xs text-secondary text-center">
                    Son senkronizasyon: {new Date(stats.lastSync).toLocaleString('tr-TR')}
                </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3">
                <div className="flex items-start gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <h5 className="text-xs font-black text-blue-400 mb-1">Otomatik Stok Senkronizasyonu</h5>
                        <p className="text-xs text-blue-400/60 leading-relaxed">
                            Trendyol GO'da sipariş geldiğinde otomatik olarak stoklarınız güncellenir.
                            Sistemdeki stok değişiklikleriniz de Trendyol GO'ya otomatik yansır.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
