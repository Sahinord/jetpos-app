// Trendyol GO stage bilgilerini TEST tenant'ına yazar (service-role, panel gerektirmez).
// Kullanım (stage panelinden aldığın değerlerle):
//   node set_trendyol_test.js <storeId> <apiKey> <apiSecret>
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = (() => { const e = {}; for (const l of fs.readFileSync('.env.local', 'utf8').split('\n')) { const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m) e[m[1]] = m[2].replace(/^["']|["']$/g, ''); } return e; })();
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const [storeId, apiKey, apiSecret] = process.argv.slice(2);
if (!storeId || !apiKey || !apiSecret) {
    console.log('Kullanım: node set_trendyol_test.js <storeId> <apiKey> <apiSecret>');
    process.exit(1);
}

(async () => {
    const { data: t } = await sb.from('tenants').select('id, settings').ilike('license_key', 'TEST-TGO-%').limit(1).maybeSingle();
    if (!t) { console.log('Test tenant yok. Önce: node create_test_tenant.js'); return; }
    const settings = { ...(t.settings || {}) };
    settings.trendyolGo = {
        sellerId: '5631267',
        storeId: String(storeId),
        apiKey: String(apiKey),
        apiSecret: String(apiSecret),
        agentName: 'JetPos',
        stage: true,
        active: true,
    };
    const { error } = await sb.from('tenants').update({ settings }).eq('id', t.id);
    if (error) { console.log('HATA:', error.message); return; }
    console.log('✓ Trendyol GO stage bilgileri test tenant\'ına yazıldı (Seller 5631267, stage=AÇIK).');
    console.log('  Şimdi TEST-TGO lisansıyla JetPos\'a gir → Trendyol GO → "Siparişleri Çek".');
})().catch(e => console.log('ERR', e.message));
