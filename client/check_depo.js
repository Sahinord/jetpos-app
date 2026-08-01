// Bir deponun warehouse_stock toplamini ve master toplamini yan yana gosterir.
//   node check_depo.js <warehouse_id>
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = (() => { const e = {}; for (const l of fs.readFileSync('.env.local', 'utf8').split('\n')) { const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m) e[m[1]] = m[2].replace(/^["']|["']$/g, ''); } return e; })();
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const whId = process.argv[2];

(async () => {
    const { data: wh } = await sb.from('warehouses').select('id, name, tenant_id').eq('id', whId).single();
    if (!wh) return console.error('Depo yok:', whId);

    // warehouse_stock toplami
    let ws = [], from = 0;
    while (true) { const { data } = await sb.from('warehouse_stock').select('quantity').eq('warehouse_id', whId).range(from, from + 999); if (!data || !data.length) break; ws.push(...data); if (data.length < 1000) break; from += 1000; }
    const whTotal = ws.reduce((s, r) => s + (Number(r.quantity) || 0), 0);

    // master toplam (bu tenant)
    let pr = []; from = 0;
    while (true) { const { data } = await sb.from('products').select('stock_quantity').eq('tenant_id', wh.tenant_id).range(from, from + 999); if (!data || !data.length) break; pr.push(...data); if (data.length < 1000) break; from += 1000; }
    const masterTotal = pr.reduce((s, p) => s + (Number(p.stock_quantity) || 0), 0);

    const r = n => Math.round(n * 100) / 100;
    console.log(`\nDepo: ${wh.name}`);
    console.log(`  warehouse_stock satir sayisi : ${ws.length}`);
    console.log(`  warehouse_stock TOPLAM       : ${r(whTotal)}`);
    console.log(`  master (products) TOPLAM      : ${r(masterTotal)}`);
    console.log(ws.length < pr.length ? `\n! Depoda ${pr.length - ws.length} urunun satiri YOK -> --apply tam calismamis.` : `\n= Satir sayilari esit. Toplamlar ${r(whTotal) === r(masterTotal) ? 'ESIT (sorun yok)' : 'FARKLI'}.`);
})().catch(e => console.log('ERR', e.message));
