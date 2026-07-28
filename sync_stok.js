// Mobilden MASTER'a (products.stock_quantity) girilen stoğu, PC'nin okuduğu
// DEPO'ya (warehouse_stock) kopyalar. "Mobilde girildi, PC'de 0 görünüyor" fix'i.
//
// Kullanım:
//   node sync_stok.js                         → işletmenin depolarını listele (id/ad)
//   node sync_stok.js <warehouse_id>          → KURU çalıştırma: kaç ürün senkronlanacak, örnekler
//   node sync_stok.js <warehouse_id> --apply  → uygula (boş/0 olan depo stoklarını master ile doldurur)
//   node sync_stok.js <warehouse_id> --apply --force → depoda değer olsa bile master'la EZ
//
// GÜVENLİK: --apply olmadan yazmaz. Varsayılan sadece depo satırı yok/0 olanları doldurur
// (mevcut depo stoğunu ezmez). Master'daki stok kaynak alınır.

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

function loadEnv() {
    const p = path.join(__dirname, 'client', '.env.local');
    const env = {};
    for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
    return env;
}
const env = loadEnv();
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const whId = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : null;
const apply = process.argv.includes('--apply');
const force = process.argv.includes('--force');

async function listWarehouses() {
    const { data } = await sb.from('warehouses').select('id, name, tenant_id').order('name');
    if (!data || !data.length) return console.log('Depo yok.');
    console.log('\nDepolar:\n');
    for (const w of data) console.log(`  ${w.id}  |  ${w.name}  |  tenant: ${w.tenant_id}`);
    console.log('\nSonra: node sync_stok.js <warehouse_id>');
}

async function run(warehouseId) {
    const { data: wh } = await sb.from('warehouses').select('id, name, tenant_id').eq('id', warehouseId).single();
    if (!wh) return console.error('Depo bulunamadı:', warehouseId);
    const tenantId = wh.tenant_id;

    // Tüm ürünler (master stok) — sayfalı
    let products = [], from = 0;
    while (true) {
        const { data } = await sb.from('products').select('id, name, stock_quantity')
            .eq('tenant_id', tenantId).range(from, from + 999);
        if (!data || !data.length) break;
        products.push(...data);
        if (data.length < 1000) break;
        from += 1000;
    }
    // Mevcut depo stokları
    const { data: ws } = await sb.from('warehouse_stock').select('product_id, quantity').eq('warehouse_id', warehouseId);
    const wMap = Object.fromEntries((ws || []).map(w => [w.product_id, Number(w.quantity)]));

    const toSync = products.filter(p => {
        const master = Number(p.stock_quantity) || 0;
        const depo = p.id in wMap ? wMap[p.id] : null;
        if (force) return master !== depo;              // her farklıyı ez
        return (depo === null || depo === 0) && master !== 0;  // sadece boş/0 doldur
    });

    console.log(`\nDepo: ${wh.name} (${tenantId})`);
    console.log(`${products.length} ürün, ${toSync.length} tanesi senkronlanacak${force ? ' (FORCE)' : ' (boş/0 doldur)'}.`);
    console.log('\nÖrnek (ilk 10):');
    for (const p of toSync.slice(0, 10)) {
        console.log(`  ${(p.name || p.id).slice(0, 40).padEnd(40)}  master:${String(Number(p.stock_quantity) || 0).padStart(5)}  depo:${p.id in wMap ? wMap[p.id] : '—'}`);
    }
    if (!apply) return console.log(`\nUygulamak için: node sync_stok.js ${warehouseId} --apply${force ? ' --force' : ''}`);

    console.log('\n--apply: depoya yazılıyor…');
    let n = 0;
    for (let i = 0; i < toSync.length; i += 200) {
        const batch = toSync.slice(i, i + 200).map(p => ({
            tenant_id: tenantId, warehouse_id: warehouseId, product_id: p.id,
            quantity: Number(p.stock_quantity) || 0, updated_at: new Date().toISOString(),
        }));
        const { error } = await sb.from('warehouse_stock').upsert(batch, { onConflict: 'warehouse_id,product_id' });
        if (error) { console.error('Hata:', error.message); return; }
        n += batch.length;
        process.stdout.write(`\r  ${n}/${toSync.length}`);
    }
    console.log(`\n✓ ${n} ürünün deposu master stokla dolduruldu.`);
}

(async () => { if (!whId) await listWarehouses(); else await run(whId); })();
