import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, hasServiceRoleKey } from '@/lib/supabase-admin';
import { verifyTenantAccess } from '@/lib/server-tenant-auth';
import { encryptSecret, decryptSecret, maskSecret } from '@/lib/crypto-settings';

// Trendyol GO ayarlarını GÜVENLİ kaydet:
//  • apiKey/apiSecret/token sırları AES-256-GCM ile ŞİFRELİ saklanır,
//  • bir sır alanı BOŞ gelirse mevcut kayıt KORUNUR (asla silinmez/sıfırlanmaz),
//  • service-role ile yazılır (RLS/GRANT sorunundan etkilenmez).
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SECRET_FIELDS = ['apiKey', 'apiSecret', 'token'] as const;

export async function POST(req: NextRequest) {
    try {
        if (!hasServiceRoleKey) {
            return NextResponse.json({ success: false, error: 'Sunucu yapılandırması eksik (service role).' }, { status: 500 });
        }
        const body = await req.json().catch(() => ({} as any));
        const tenantId = body.tenantId || '';
        const incoming = body.settings || {};
        if (!tenantId) return NextResponse.json({ success: false, error: 'tenantId gerekli' }, { status: 400 });

        const auth = await verifyTenantAccess(req, tenantId);
        if (!auth.ok) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

        // Mevcut kayıt
        const { data: existing } = await supabaseAdmin
            .from('integration_settings')
            .select('id, api_config, settings')
            .eq('tenant_id', tenantId)
            .or('type.eq.trendyol_go,platform.eq.trendyol')
            .maybeSingle();

        const prev: any = existing?.api_config || existing?.settings || {};

        // Yeni config: gizli olmayan alanlar gelenden; sır alanları BOŞSA eskiyi koru.
        const merged: any = { ...prev };
        for (const k of Object.keys(incoming)) {
            if ((SECRET_FIELDS as readonly string[]).includes(k)) continue; // sırlar aşağıda
            merged[k] = incoming[k];
        }
        for (const f of SECRET_FIELDS) {
            const val = incoming[f];
            if (val && String(val).trim() !== '') {
                merged[f] = encryptSecret(String(val).trim()); // yeni değer → şifrele
            } else if (prev[f]) {
                merged[f] = encryptSecret(String(prev[f])); // boş geldi → eskiyi koru (şifreli)
            }
        }

        const row: any = {
            tenant_id: tenantId,
            type: 'trendyol_go',
            platform: 'trendyol',
            api_config: merged,
            settings: merged,
            is_active: true,
        };

        let dbErr: any = null;
        if (existing?.id) {
            const { error } = await supabaseAdmin.from('integration_settings').update(row).eq('id', existing.id);
            dbErr = error;
        } else {
            const { error } = await supabaseAdmin.from('integration_settings').insert(row);
            dbErr = error;
        }
        if (dbErr) return NextResponse.json({ success: false, error: dbErr.message }, { status: 500 });

        // UI'ya sadece maske döneriz (gerçek sır asla tarayıcıya gitmez)
        return NextResponse.json({
            success: true,
            masked: {
                apiKey: merged.apiKey ? maskSecret(merged.apiKey) : '',
                apiSecret: merged.apiSecret ? '••••••••' : '',
                token: merged.token ? maskSecret(merged.token) : '',
            },
            hasApiKey: !!merged.apiKey,
            hasApiSecret: !!merged.apiSecret,
            hasToken: !!merged.token,
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// Kayıtlı sırların VAR/YOK bilgisini (maskeli) döndürür — gerçek değer gönderilmez.
export async function GET(req: NextRequest) {
    try {
        const tenantId = new URL(req.url).searchParams.get('tenantId') || '';
        if (!tenantId) return NextResponse.json({ success: false, error: 'tenantId gerekli' }, { status: 400 });
        const auth = await verifyTenantAccess(req, tenantId);
        if (!auth.ok) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

        const { data } = await supabaseAdmin
            .from('integration_settings')
            .select('api_config, settings, is_active')
            .eq('tenant_id', tenantId)
            .or('type.eq.trendyol_go,platform.eq.trendyol')
            .maybeSingle();

        const cfg: any = data?.api_config || data?.settings || {};
        return NextResponse.json({
            success: true,
            isActive: data?.is_active ?? false,
            // gizli olmayan alanlar
            sellerId: cfg.sellerId || '', storeId: cfg.storeId || '', agentName: cfg.agentName || '',
            isStage: cfg.isStage || cfg.stage || false, isStockSyncActive: cfg.isStockSyncActive || false,
            autoPushProducts: cfg.autoPushProducts || false,
            defaultCategoryId: cfg.defaultCategoryId, defaultCategoryName: cfg.defaultCategoryName,
            defaultBrandId: cfg.defaultBrandId, defaultBrandName: cfg.defaultBrandName,
            categoryMap: cfg.categoryMap || {},
            // sırlar: sadece maske
            masked: {
                apiKey: cfg.apiKey ? maskSecret(cfg.apiKey) : '',
                apiSecret: cfg.apiSecret ? '••••••••' : '',
                token: cfg.token ? maskSecret(cfg.token) : '',
            },
            hasApiKey: !!cfg.apiKey, hasApiSecret: !!cfg.apiSecret, hasToken: !!cfg.token,
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
