// Client dashboard'un GORDUGU stok ile ham toplami karsilastirir.
// 1.321 mi 3.288 mi dogru sorusunu kesin cevaplar.
//   node check_client_view.js <tenant_id>
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = (() => { const e = {}; for (const l of fs.readFileSync('.env.local', 'utf8').split('\n')) { const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m) e[m[1]] = m[2].replace(/^["']|["']$/g, ''); } return e; })();
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const tenantId = process.argv[2] || '755dfb53-fde1-4ab9-9070-572d20126c07';

async function fetchAll(applyClientFilters) {
    const out = []; let from = 0;
    while (true) {
        let q = sb.from('products').select('stock_quantity, unit, status, deleted_at, archived_at').eq('tenant_id', tenantId).range(from, from + 999);
        if (applyClientFilters) q = q.is('deleted_at', null).is('archived_at', null);
        const { data, error } = await q;
        if (error) { console.log('HATA:', error.message); if (String(error.message).includes('archived_at')) return null; break; }
        if (!data || !data.length) break;
        out.push(...data); if (data.length < 1000) break; from += 1000;
    }
    return out;
}

const sumNonKg = arr => arr.filter(p => String(p.unit || '').toUpperCase() !== 'KG').reduce((s, p) => s + (Number(p.stock_quantity) || 0), 0);
const r = n => Math.round(n * 100) / 100;

(async () => {
    const all = await fetchAll(false);
    console.log(`\n=== tenant ${tenantId} ===`);
    console.log(`HAM (tum urunler)            : ${all.length} urun, stok(adet) ${r(sumNonKg(all))}`);

    const active = all.filter(p => !p.deleted_at && !p.archived_at);
    console.log(`CLIENT gorunumu (silinmemis + arsivlenmemis): ${active.length} urun, stok(adet) ${r(sumNonKg(active))}   <-- dashboard bunu gosteriyor`);

    const deleted = all.filter(p => p.deleted_at);
    const archived = all.filter(p => !p.deleted_at && p.archived_at);
    console.log(`  - silinmis (deleted_at)   : ${deleted.length} urun, stok ${r(sumNonKg(deleted))}`);
    console.log(`  - arsivlenmis (archived_at): ${archived.length} urun, stok ${r(sumNonKg(archived))}`);
})().catch(e => console.log('ERR', e.message));
