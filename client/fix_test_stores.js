// TEST tenant: yanlış "Trendyol Mağazası" (pazaryeri) yerine Trendyol GO mağazası koyar.
// client/ içinde: node fix_test_stores.js
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = (() => { const e = {}; for (const l of fs.readFileSync('.env.local', 'utf8').split('\n')) { const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m) e[m[1]] = m[2].replace(/^["']|["']$/g, ''); } return e; })();
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

(async () => {
    const { data: t } = await sb.from('tenants').select('id').ilike('license_key', 'TEST-TGO-%').limit(1).maybeSingle();
    if (!t) { console.log('Test tenant yok.'); return; }

    // Yanlış pazaryeri Trendyol mağazasını sil (bu tenant GO)
    const { data: wrong } = await sb.from('warehouses').select('id, name').eq('tenant_id', t.id).eq('platform', 'trendyol');
    if (wrong && wrong.length) {
        await sb.from('warehouses').delete().eq('tenant_id', t.id).eq('platform', 'trendyol');
        console.log(`✗ Silindi: ${wrong.map(w => w.name).join(', ')} (platform trendyol)`);
    }

    // Trendyol GO mağazası zaten var mı?
    const { data: go } = await sb.from('warehouses').select('id').eq('tenant_id', t.id).eq('platform', 'trendyol_go').maybeSingle();
    if (go) { console.log('Trendyol GO mağazası zaten var.'); return; }

    const { error } = await sb.from('warehouses').insert([{
        tenant_id: t.id, name: 'Trendyol GO Mağazası', type: 'virtual',
        platform: 'trendyol_go', code: 'TGO-001', is_default: false, is_active: true,
    }]);
    if (error) { console.log('HATA:', error.message); return; }
    console.log('✓ "Trendyol GO Mağazası" (platform trendyol_go) eklendi. Mağaza değiştirde ayrı görünecek.');
})().catch(e => console.log('ERR', e.message));
