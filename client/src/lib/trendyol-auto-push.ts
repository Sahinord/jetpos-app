import { supabase } from '@/lib/supabase';
import { apiFetch } from '@/lib/api';

// JetPos'ta yeni ürün eklenince, Trendyol GO ayarlarında "otomatik gönderim" açıksa
// ürünü varsayılan kategori/markayla Trendyol kataloğuna aktarır. Fire-and-forget:
// hata olursa POS/ürün kaydı akışını ASLA bloklamaz (sadece konsola yazar).
export interface AutoPushProduct {
    name: string;
    barcode?: string | null;
    sale_price?: number | null;
    vat_rate?: number | null;
    stock_quantity?: number | null;
    category_id?: string | number | null;
}

export async function autoPushProductToTrendyol(tenantId: string, product: AutoPushProduct): Promise<void> {
    try {
        if (!tenantId || !product?.barcode) return; // barkodsuz ürün Trendyol'a gidemez

        // Trendyol GO ayarlarını oku
        const { data: intData } = await supabase
            .from('integration_settings')
            .select('api_config, settings, is_active')
            .eq('tenant_id', tenantId)
            .or('type.eq.trendyol_go,platform.eq.trendyol')
            .maybeSingle();

        if (!intData || intData.is_active === false) return;
        const cfg: any = intData.api_config || intData.settings || {};
        if (!cfg.autoPushProducts) return;
        if (!cfg.defaultBrandId) {
            console.warn('[trendyol-auto-push] Otomatik gönderim açık ama varsayılan marka seçili değil, atlanıyor.');
            return;
        }

        // JetPos kategorisi -> Trendyol kategorisi (eşleme yoksa varsayılan kategori)
        const map = cfg.categoryMap || {};
        const mapped = product.category_id != null ? map[String(product.category_id)]?.id : undefined;
        const categoryId = Number(mapped || cfg.defaultCategoryId || 0);
        if (!categoryId) {
            console.warn(`[trendyol-auto-push] "${product.name}" için Trendyol kategorisi çözülemedi (kategori eşlemesi ve varsayılan kategori yok), atlanıyor.`);
            return;
        }

        const vatOk = [0, 1, 10, 20].includes(Number(product.vat_rate)) ? Number(product.vat_rate) : 20;
        const barcode = String(product.barcode).replace(/\s+/g, '');

        const res = await apiFetch('/api/trendyol/create-products', {
            method: 'POST',
            body: JSON.stringify({
                tenantId,
                items: [{
                    barcode,
                    title: String(product.name || 'Ürün').slice(0, 100),
                    brandId: Number(cfg.defaultBrandId),
                    categoryId,
                    vatRate: vatOk,
                }],
                pushStock: [{
                    barcode,
                    quantity: Number(product.stock_quantity) || 0,
                    sellingPrice: Number(product.sale_price) || 0,
                }],
            }),
        });
        if (res?.success) {
            console.log(`[trendyol-auto-push] "${product.name}" Trendyol'a gönderildi (batch: ${res.batchRequestId}).`);
        } else {
            console.warn('[trendyol-auto-push] gönderim başarısız:', res?.error);
        }
    } catch (e: any) {
        console.warn('[trendyol-auto-push] hata (yok sayıldı):', e?.message || e);
    }
}
