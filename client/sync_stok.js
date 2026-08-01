// Master stok (products.stock_quantity) -> secili MAGAZANIN deposuna (warehouse_stock) kopyalar.
// "Mobilden girildi ama magaza deposunda yok / dashboard eksik gosteriyor" fix'i.
// client/ icinde calistir:
//   node sync_stok.js                         -> depolari listele (id/ad)
//   node sync_stok.js <warehouse_id>          -> KURU: kac urun senkronlanacak
//   node sync_stok.js <warehouse_id> --apply  -> uygula (warehouse_stock = master)

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const env = (() => {
    const e = {};
    for (const line of fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8').split('\n')) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (m) e[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
    return e;
})();
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const whId = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : null;
const apply = process.argv.includes('--apply');

async function listWarehouses() {
    const { data } = await sb.from('warehouses').select('id, name, tenant_id, platform').order('name');
    if (!data || !data.length) return console.log('Depo yok.');
    const { data: tenants } = await sb.from('tenants').select('id, company_name');
    const tName = Object.fromEntries((tenants || []).map(t => [t.id, t.company_name]));
    console.log('\nDepolar (sadece platformsuz = fiziksel magaza secilir):\n');
    for (const w of data) {
        if (w.platform) continue; // pazaryeri depolarini atla
        console.log(`  ${w.id}  |  ISLETME: ${tName[w.tenant_id] || w.tenant_id}  |  ${w.name}`);
    }
    console.log('\nSonra: node sync_stok.js <warehouse_id>   (Kardesler Kasap satirindaki id yi sec)');
}

async function run(warehouseId) {
    const { data: wh } = await sb.from('warehouses').select('id, name, tenant_id').eq('id', warehouseId).single();
    if (!wh) return console.error('Depo bulunamadi:', warehouseId);
    const tenantId = wh.tenant_id;

    let products = [], from = 0;
    while (true) {
        const { data } = await sb.from('products').select('id, name, stock_quantity').eq('tenant_id', tenantId).range(from, from + 999);
        if (!data || !data.length) break;
        products.push(...data);
        if (data.length < 1000) break;
        from += 1000;
    }

    const masterTotal = products.reduce((s, p) => s + (Number(p.stock_quantity) || 0), 0);
    console.log(`\nDepo: ${wh.name}`);
    console.log(`${products.length} urun, master toplam stok: ${Math.round(masterTotal * 100) / 100}`);

    if (!apply) {
        console.log(`\nUygulamak (depoya master stogu yaz): node sync_stok.js ${warehouseId} --apply`);
        return;
    }

    console.log('\n--apply: master stok magaza deposuna yaziliyor...');
    let n = 0;
    for (let i = 0; i < products.length; i += 300) {
        const batch = products.slice(i, i + 300).map(p => ({
            tenant_id: tenantId, warehouse_id: warehouseId, product_id: p.id,
            quantity: Number(p.stock_quantity) || 0, updated_at: new Date().toISOString(),
        }));
        const { error } = await sb.from('warehouse_stock').upsert(batch, { onConflict: 'warehouse_id,product_id' });
        if (error) { console.error('\nHata:', error.message); return; }
        n += batch.length;
        process.stdout.write(`\r  ${n}/${products.length}`);
    }
    console.log(`\n✓ ${n} urunun magaza deposu master stokla dolduruldu. Dashboard artik ayni sayiyi gosterecek.`);
}

(async () => { if (!whId) await listWarehouses(); else await run(whId); })();
