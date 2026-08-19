// Süperadmin lisansını ADM257SA67 yapar. client/ içinde: node fix_superadmin.js
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = (() => { const e = {}; for (const l of fs.readFileSync('.env.local', 'utf8').split('\n')) { const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m) e[m[1]] = m[2].replace(/^["']|["']$/g, ''); } return e; })();
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const NEW = 'ADM257SA67';

(async () => {
    const { data: admin } = await sb.from('tenants').select('id, license_key').eq('is_super_admin', true).eq('status', 'active').maybeSingle();
    if (!admin) { console.log('Aktif süperadmin tenant yok.'); return; }
    const { error } = await sb.from('tenants').update({ license_key: NEW }).eq('id', admin.id);
    if (error) { console.log('HATA:', error.message); return; }
    console.log(`✓ Süperadmin lisansı ${admin.license_key} → ${NEW} yapıldı (id: ${admin.id})`);
    console.log('!! ÖNEMLİ: Deployment env "ADMIN_SECRET_TOKEN" değerini de ADM257SA67 yap,');
    console.log('   yoksa panelde "Kaydet" işlemleri (tenant/AI ayarları) 403 verir.');
})().catch(e => console.log('ERR', e.message));
