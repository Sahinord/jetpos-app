// Stok gerçeğini DB'den ADET/KG/PASİF ayrı ayrı gösterir.
// "Mobil 3294, PC 1097 — hangisi doğru?" sorusunu kesin cevaplar.
//
// Kullanım:
//   node stok_ozet.js                → tüm işletmeleri (tenant) özetle
//   node stok_ozet.js <tenant_id>    → tek işletme

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const env = (() => {
    const e = {};
    for (const line of fs.readFileSync(path.join(__dirname, 'client', '.env.local'), 'utf8').split('\n')) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (m) e[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
    return e;
})();
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const tenantArg = process.argv[2] || null;

async function fetchAll(tenantId) {
    const out = [];
    let from = 0;
    while (true) {
        let q = sb.from('products').select('stock_quantity, unit, status').range(from, from + 999);
        if (tenantId) q = q.eq('tenant_id', tenantId);
        const { data, error } = await q;
        if (error) { console.error(error.message); break; }
        if (!data || !data.length) break;
        out.push(...data);
        if (data.length < 1000) break;
        from += 1000;
    }
    return out;
}

function summarize(products) {
    const isKg = p => String(p.unit || '').toUpperCase() === 'KG';
    const isActive = p => (p.status || 'active') === 'active';
    const s = {
        adetAktif: 0, adetAktifStok: 0,
        kgAktif: 0, kgAktifStok: 0,
        pasif: 0, pasifStok: 0,
        toplamHam: 0, // mobildeki eski (karışık) toplam
    };
    for (const p of products) {
        const q = Number(p.stock_quantity) || 0;
        s.toplamHam += q;
        if (!isActive(p)) { s.pasif++; s.pasifStok += q; continue; }
        if (isKg(p)) { s.kgAktif++; s.kgAktifStok += q; }
        else { s.adetAktif++; s.adetAktifStok += q; }
    }
    return s;
}

function print(name, s) {
    const r = n => Math.round(n * 100) / 100;
    console.log(`\n=== ${name} ===`);
    console.log(`  ADET (aktif) : ${s.adetAktif} ürün → toplam ${r(s.adetAktifStok)} adet   ← PC "TOPLAM STOK" bunu gösterir`);
    console.log(`  KG   (aktif) : ${s.kgAktif} ürün → toplam ${r(s.kgAktifStok)} kg`);
    console.log(`  PASİF        : ${s.pasif} ürün → toplam ${r(s.pasifStok)}`);
    console.log(`  ────────────`);
    console.log(`  Eski mobil (adet+kg+pasif KARIŞIK) : ${r(s.toplamHam)}   ← "3294,55" buydu`);
    console.log(`  Doğru adet toplamı                 : ${r(s.adetAktifStok)}`);
}

(async () => {
    if (tenantArg) {
        const { data: t } = await sb.from('tenants').select('company_name').eq('id', tenantArg).single();
        print(t?.company_name || tenantArg, summarize(await fetchAll(tenantArg)));
    } else {
        const { data: tenants } = await sb.from('tenants').select('id, company_name').order('company_name');
        for (const t of tenants || []) {
            const prods = await fetchAll(t.id);
            if (!prods.length) continue;
            print(t.company_name || t.id, summarize(prods));
        }
    }
})();
