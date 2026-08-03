import { supabaseAdmin } from "@/lib/supabase-admin";
import type { GetirCarsiConfig } from "./getir-carsi-client";

/**
 * Getir Çarşı per-tenant ayarları — SuperAdmin'den tenants.settings.getirCarsi
 * altına girilir (env değil, projedeki trendyolGo/qnb/parasut kalıbı).
 *
 * Beklenen şekil:
 *   settings.getirCarsi = {
 *     shopId:     "<Getir shopId>",   // webhook tenant çözümü + order path'i
 *     username:   "<Getir kullanıcı>",// outbound token (/v1/auth/token)
 *     password:   "<Getir şifre>",
 *     agentName:  "JetPos Yazılım",   // User-Agent (opsiyonel)
 *     storeType:  "market",           // referans (getir_carsi_store_types)
 *     stage:      true,               // true → test ortamı (artisandev)
 *     stockBuffer: 0,                 // stok tamponu: quantity - buffer <=0 → kapat
 *     active:     true
 *   }
 *
 * NOT: username/password YALNIZCA token almak için okunur; loglanmaz.
 */

export interface GetirCarsiSettings {
    shopId?: string;
    username?: string;
    password?: string;
    agentName?: string;
    storeType?: string;
    stage?: boolean;
    stockBuffer?: number;
    active?: boolean;
}

/** Tenant'ın Getir Çarşı ayarını getir (yoksa null). */
export async function getGetirCarsiSettings(tenantId: string): Promise<GetirCarsiSettings | null> {
    if (!tenantId) return null;
    const { data, error } = await supabaseAdmin
        .from("tenants")
        .select("settings")
        .eq("id", tenantId)
        .maybeSingle();
    if (error || !data) return null;
    const gc = (data.settings as Record<string, unknown> | null)?.getirCarsi as GetirCarsiSettings | undefined;
    return gc || null;
}

/** Ayarları client config'e çöz. Eksik/pasifse null döner. */
export function resolveGetirCarsiConfig(s: GetirCarsiSettings | null): GetirCarsiConfig | null {
    if (!s || s.active === false) return null;
    const username = (s.username || "").trim();
    const password = (s.password || "").trim();
    const shopId = (s.shopId || "").trim();
    if (!username || !password || !shopId) return null; // eksik kimlik → atla
    return {
        username,
        password,
        shopId,
        agentName: (s.agentName || "JetPos").trim(),
        isStage: s.stage === true,
    };
}

/** Tek adımda: tenantId → client config (yoksa null). */
export async function getGetirCarsiConfig(tenantId: string): Promise<GetirCarsiConfig | null> {
    return resolveGetirCarsiConfig(await getGetirCarsiSettings(tenantId));
}

/** Stok tamponu (varsayılan 0). quantity - buffer <= 0 → ürün kapatılır. */
export function stockBufferOf(s: GetirCarsiSettings | null): number {
    const n = Number(s?.stockBuffer);
    return Number.isFinite(n) && n >= 0 ? n : 0;
}
