import { supabaseAdmin } from "@/lib/supabase-admin";
import type { YsConfig } from "./client";

/**
 * Yemeksepeti (Delivery Hero) ayarları — SuperAdmin'den girilir, env yok.
 * Kimlik JetPos'a (chain) verilir; her işletme bir vendor_id.
 *
 * tenants.settings.yemeksepeti:
 *   {
 *     active,
 *     clientId, clientSecret, chainId,   // JetPos chain kimliği (tüm vendor'lar için ortak)
 *     vendorId,                          // bu işletmenin Yemeksepeti vendor id'si
 *     webhookSecret,                     // gelen webhook doğrulaması için
 *     baseUrl                            // opsiyonel (test/bölge adresi)
 *   }
 */

export interface YemeksepetiSettings {
    active?: boolean;
    clientId?: string;
    clientSecret?: string;
    chainId?: string;
    vendorId?: string;
    webhookSecret?: string;
    baseUrl?: string;
}

export interface ResolvedYs {
    config: YsConfig;
    vendorId: string;
    webhookSecret: string;
}

/** Tenant'ın Yemeksepeti ayarını getir (yoksa null). */
export async function getYemeksepetiSettings(tenantId: string): Promise<YemeksepetiSettings | null> {
    if (!tenantId) return null;
    const { data, error } = await supabaseAdmin
        .from("tenants").select("settings").eq("id", tenantId).maybeSingle();
    if (error || !data) return null;
    const s = (data.settings as Record<string, unknown> | null)?.yemeksepeti as YemeksepetiSettings | undefined;
    return s || null;
}

/** Ayarları çalışır yapılandırmaya çöz (eksik kimlik → null). */
export function resolveYs(settings: YemeksepetiSettings | null): ResolvedYs | null {
    if (!settings || settings.active === false) return null;
    const clientId = (settings.clientId || "").trim();
    const clientSecret = (settings.clientSecret || "").trim();
    const chainId = (settings.chainId || "").trim();
    const vendorId = (settings.vendorId || "").trim();
    if (!clientId || !clientSecret || !chainId || !vendorId) return null;
    return {
        config: {
            clientId,
            clientSecret,
            chainId,
            baseUrl: (settings.baseUrl || "").trim() || undefined,
        },
        vendorId,
        webhookSecret: (settings.webhookSecret || "").trim(),
    };
}

/**
 * Gelen webhook'tan vendor_id ile tenant bul.
 * (Webhook Yemeksepeti'nden gelir; hangi tenant'a ait olduğunu vendor_id belirler.)
 * settings->yemeksepeti->>vendorId eşleşmesiyle çözülür.
 */
export async function findTenantByVendor(vendorId: string): Promise<{ tenantId: string; resolved: ResolvedYs } | null> {
    if (!vendorId) return null;
    const { data, error } = await supabaseAdmin
        .from("tenants")
        .select("id, settings")
        .eq("settings->yemeksepeti->>vendorId", vendorId)
        .limit(1)
        .maybeSingle();
    if (error || !data) return null;
    const settings = (data.settings as Record<string, unknown> | null)?.yemeksepeti as YemeksepetiSettings | undefined;
    const resolved = resolveYs(settings || null);
    if (!resolved) return null;
    return { tenantId: data.id as string, resolved };
}
