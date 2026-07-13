import { supabaseAdmin } from "@/lib/supabase-admin";
import type { TgoYemekConfig } from "./tgo-yemek-client";

/**
 * Yemek entegrasyonu — İKİ bağlantı:
 *   1) tgo   → Trendyol Go · Uber Eats (BİRLEŞİK — Uber, Trendyol Go'yu aldı,
 *              Uber Eats TR bunun üzerinden gelir; siparişler tek API'den düşer,
 *              marka sipariş kaynağından etiketlenir).
 *   2) getir → Getir Yemek (Uber tarafından devralınıyor; geçiş döneminde AYRI kanal).
 *
 * Ayarlar SuperAdmin'den tenants.settings.tgoYemek altına girilir (env yok):
 *   {
 *     active, agentName, stage,
 *     tgo:   { active, sellerId, apiKey, apiSecret, storeId },
 *     getir: { active, sellerId, apiKey, apiSecret, storeId }
 *   }
 */

export interface TgoYemekConnCfg {
    active?: boolean;
    sellerId?: string;
    apiKey?: string;
    apiSecret?: string;
    storeId?: string;
}

export interface TgoYemekSettings {
    active?: boolean;
    agentName?: string;
    stage?: boolean;
    tgo?: TgoYemekConnCfg;
    getir?: TgoYemekConnCfg;
}

export type YemekChannel = "tgo" | "getir";

export interface ResolvedConnection {
    channel: YemekChannel;
    name: string;          // varsayılan gösterim adı
    config: TgoYemekConfig;
}

/** Tenant'ın Yemek ayarını getir (yoksa null). */
export async function getTgoYemekSettings(tenantId: string): Promise<TgoYemekSettings | null> {
    if (!tenantId) return null;
    const { data, error } = await supabaseAdmin
        .from("tenants").select("settings").eq("id", tenantId).maybeSingle();
    if (error || !data) return null;
    const s = (data.settings as Record<string, unknown> | null)?.tgoYemek as TgoYemekSettings | undefined;
    return s || null;
}

function buildConn(
    settings: TgoYemekSettings,
    conn: TgoYemekConnCfg | undefined,
    channel: YemekChannel,
    name: string
): ResolvedConnection | null {
    if (!conn || conn.active === false) return null;
    const sellerId = (conn.sellerId || "").trim();
    const apiKey = (conn.apiKey || "").trim();
    const apiSecret = (conn.apiSecret || "").trim();
    if (!sellerId || !apiKey || !apiSecret) return null; // eksik kimlik → atla
    return {
        channel,
        name,
        config: {
            sellerId,
            apiKey,
            apiSecret,
            agentName: settings.agentName || "JetPos",
            storeId: (conn.storeId || "").trim() || undefined,
            isStage: settings.stage === true,
        },
    };
}

/** Aktif bağlantıları çöz (tgo + getir). */
export function resolveConnections(settings: TgoYemekSettings): ResolvedConnection[] {
    if (!settings || settings.active === false) return [];
    const out: ResolvedConnection[] = [];
    const tgo = buildConn(settings, settings.tgo, "tgo", "Trendyol Go · Uber Eats");
    if (tgo) out.push(tgo);
    const getir = buildConn(settings, settings.getir, "getir", "Getir Yemek");
    if (getir) out.push(getir);
    return out;
}

/** Tek bir bağlantıyı kanal ile çöz (order-action için). */
export function resolveConnection(settings: TgoYemekSettings, channel: YemekChannel): ResolvedConnection | null {
    return resolveConnections(settings).find(c => c.channel === channel) || null;
}
