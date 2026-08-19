// Süper-admin lisansını teşhis eder. client/ içinde çalıştır:
//   node check_admin.js
//   node check_admin.js ADM257SA67   (belirli bir lisansı ara)
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = (() => { const e = {}; for (const l of fs.readFileSync('.env.local', 'utf8').split('\n')) { const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m) e[m[1]] = m[2].replace(/^["']|["']$/g, ''); } return e; })();
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const wanted = process.argv[2] || null;

(async () => {
    // 1) Süper admin tenant'ları
    const { data: admins, error } = await sb
        .from('tenants')
        .select('id, company_name, license_key, is_super_admin, expires_at, status')
        .eq('is_super_admin', true);
    if (error) { console.log('HATA:', error.message); return; }

    console.log('\n=== is_super_admin = true olan tenant(lar) ===');
    if (!admins || admins.length === 0) {
        console.log('  YOK! Hiç süper-admin tenant yok. (Bu yüzden admin girişi çalışmaz.)');
    } else {
        for (const a of admins) {
            const exp = a.expires_at ? new Date(a.expires_at) : null;
            const expired = exp && exp < new Date();
            console.log(`  license_key: ${a.license_key}  |  ${a.company_name || '-'}  |  status:${a.status || '-'}  |  ${expired ? 'SÜRESİ DOLMUŞ' : 'aktif'}  |  id:${a.id}`);
        }
    }

    // 2) İstenen lisans var mı (super olsun olmasın)
    if (wanted) {
        const { data: t } = await sb.from('tenants').select('id, company_name, is_super_admin, expires_at').eq('license_key', wanted).maybeSingle();
        console.log(`\n=== "${wanted}" lisansı ===`);
        if (!t) console.log('  Bu license_key ile HİÇBİR tenant yok. → "bulunamadı" sebebi bu.');
        else console.log(`  Bulundu: ${t.company_name || '-'} | is_super_admin: ${t.is_super_admin} | id:${t.id}`);
    }
})().catch(e => console.log('ERR', e.message));
