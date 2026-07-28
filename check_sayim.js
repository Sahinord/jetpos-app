// Envanter sayımlarını KONTROL ve gerekirse STOĞA UYGULA.
// Repodaki check_*.js deseni: client/.env.local'dan service-role ile bağlanır.
//
// Kullanım:
//   node check_sayim.js                      → son 20 sayımı listele (salt-okuma)
//   node check_sayim.js <count_id>           → o sayımın kalemlerini + mevcut stokla farkını göster (salt-okuma)
//   node check_sayim.js <count_id> --apply   → o sayımı stoğa işle (products.stock_quantity + warehouse_stock = sayılan)
//
// GÜVENLİK: --apply olmadan HİÇBİR ŞEY yazmaz. Apply, sayılan miktarı SET eder (toplama değil).

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// ── .env.local oku ──
function loadEnv() {
    const p = path.join(__dirname, 'client', '.env.local');
    const env = {};
    try {
        for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
            const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
            if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
        }
    } catch (e) {
        console.error('client/.env.local okunamadı:', e.message);
        process.exit(1);
    }
    return env;
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
    console.error('NEXT_PUBLIC_SUPABASE_URL veya SUPABASE_SERVICE_ROLE_KEY eksik (client/.env.local).');
    process.exit(1);
}
const sb = createClient(url, key, { auth: { persistSession: false } });

const countId = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : null;
const doApply = process.argv.includes('--apply');

async function listCounts() {
    const { data, error } = await sb
        .from('inventory_counts')
        .select('id, warehouse_id, status, created_at, completed_at')
        .order('created_at', { ascending: false })
        .limit(20);
    if (error) return console.error('Hata:', error.message);
    if (!data || !data.length) return console.log('Hiç sayım kaydı yok.');
    console.log(`\nSon ${data.length} sayım:\n`);
    for (const c of data) {
        const { count } = await sb.from('inventory_count_items')
            .select('id', { count: 'exact', head: true }).eq('count_id', c.id);
        console.log(`  ${c.id}  |  durum: ${c.status || '-'}  |  ${count || 0} kalem  |  ${new Date(c.created_at).toLocaleString('tr-TR')}  |  depo: ${c.warehouse_id || '-'}`);
    }
    console.log('\nDetay için: node check_sayim.js <count_id>');
}

async function showCount(id) {
    const { data: c } = await sb.from('inventory_counts').select('*').eq('id', id).single();
    if (!c) return console.error('Sayım bulunamadı:', id);
    const { data: items } = await sb.from('inventory_count_items')
        .select('product_id, system_quantity, counted_quantity, difference').eq('count_id', id);
    if (!items || !items.length) return console.log('Bu sayımda kalem yok.');

    // Ürün adları + mevcut stok
    const pids = items.map(i => i.product_id);
    const { data: prods } = await sb.from('products').select('id, name, stock_quantity').in('id', pids);
    const pMap = Object.fromEntries((prods || []).map(p => [p.id, p]));
    const { data: ws } = await sb.from('warehouse_stock').select('product_id, quantity')
        .eq('warehouse_id', c.warehouse_id).in('product_id', pids);
    const wMap = Object.fromEntries((ws || []).map(w => [w.product_id, w.quantity]));

    console.log(`\nSayım ${id}  (durum: ${c.status}, depo: ${c.warehouse_id})\n`);
    console.log('ÜRÜN'.padEnd(28), 'SAYILAN'.padStart(8), 'MASTER'.padStart(8), 'DEPO'.padStart(8), '  DURUM');
    let mismatch = 0;
    for (const it of items) {
        const name = (pMap[it.product_id]?.name || it.product_id).slice(0, 27);
        const master = Number(pMap[it.product_id]?.stock_quantity ?? '-');
        const depo = it.product_id in wMap ? Number(wMap[it.product_id]) : null;
        const counted = Number(it.counted_quantity);
        const ok = master === counted && (depo === null || depo === counted);
        if (!ok) mismatch++;
        console.log(name.padEnd(28), String(counted).padStart(8), String(master).padStart(8),
            String(depo ?? '—').padStart(8), ok ? '  ✓ işlenmiş' : '  ✗ FARKLI');
    }
    console.log(`\n${items.length} kalem, ${mismatch} tanesi stoğa İŞLENMEMİŞ.`);
    if (mismatch > 0) console.log(`Stoğa işlemek için: node check_sayim.js ${id} --apply`);
    return { c, items };
}

async function applyCount(id) {
    const res = await showCount(id);
    if (!res) return;
    const { c, items } = res;
    console.log('\n--apply: sayılan miktarlar stoğa yazılıyor (SET)…\n');
    let n = 0;
    for (const it of items) {
        const q = Number(it.counted_quantity);
        await sb.from('products').update({ stock_quantity: q, updated_at: new Date().toISOString() })
            .eq('id', it.product_id).eq('tenant_id', c.tenant_id);
        if (c.warehouse_id) {
            await sb.from('warehouse_stock').upsert(
                { tenant_id: c.tenant_id, warehouse_id: c.warehouse_id, product_id: it.product_id, quantity: q, updated_at: new Date().toISOString() },
                { onConflict: 'warehouse_id,product_id' });
        }
        n++;
    }
    console.log(`✓ ${n} ürünün stoğu sayıma göre güncellendi.`);
}

(async () => {
    if (!countId) await listCounts();
    else if (doApply) await applyCount(countId);
    else await showCount(countId);
})();
