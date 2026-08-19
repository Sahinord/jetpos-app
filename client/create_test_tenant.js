// Trendyol GO testi için hızlı test lisansı oluşturur (RLS'yi service-role ile bypass).
// client/ içinde: node create_test_tenant.js
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = (() => { const e = {}; for (const l of fs.readFileSync('.env.local', 'utf8').split('\n')) { const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m) e[m[1]] = m[2].replace(/^["']|["']$/g, ''); } return e; })();
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const LICENSE = 'TEST-TGO-' + Date.now().toString().slice(-6);

(async () => {
    // Zaten bir test-tgo lisansı varsa onu kullan
    const { data: existing } = await sb.from('tenants').select('id, license_key, features')
        .ilike('license_key', 'TEST-TGO-%').limit(1).maybeSingle();
    if (existing) {
        console.log('Zaten test lisansı var, onu kullan:');
        console.log('  Lisans: ' + existing.license_key + '  (id: ' + existing.id + ')');
        return;
    }

    const { data, error } = await sb.from('tenants').insert([{
        license_key: LICENSE,
        company_name: 'TEST - Trendyol GO',
        status: 'active',
        features: { pos: true, products: true, trendyol_go: true },
        max_stores: 1,
        max_online_stores: 1,
    }]).select().single();

    if (error) { console.log('HATA:', error.message); return; }
    console.log('\n✓ Test lisansı oluşturuldu:');
    console.log('  Lisans Anahtarı : ' + data.license_key);
    console.log('  Tenant ID       : ' + data.id);
    console.log('  Özellikler      : pos, products, trendyol_go (açık)');
    console.log('\nBu lisansla JetPos\'a gir → SuperAdmin\'den Trendyol GO bilgilerini bu tenant\'a gir → test et.');
})().catch(e => console.log('ERR', e.message));
