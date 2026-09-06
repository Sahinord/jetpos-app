// Ödeal reference id'lerini çekip ekrana + odeal-references.csv dosyasına yazar.
// Çalıştır:  cd client && node odeal-reference-cek.js
const fs = require('fs');
const env = {};
fs.readFileSync('.env.local', 'utf8').split('\n').forEach(l => {
  const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim();
});
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

(async () => {
  const { data, error } = await sb
    .from('odeal_transactions')
    .select('reference_code, status, amount, payment_method, payment_ref_code, einvoice_no, created_at, updated_at, tenant_id')
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) { console.error('HATA:', error.message); process.exit(1); }

  const byStatus = {};
  data.forEach(r => byStatus[r.status] = (byStatus[r.status] || 0) + 1);
  console.log('Toplam:', data.length, '| Durumlar:', JSON.stringify(byStatus));
  console.log('\n=== PENDING (Ödeal\'e iletilecek) ===');
  data.filter(r => r.status === 'pending').forEach(r =>
    console.log(`${r.reference_code}  |  ${r.amount} TL  |  ${r.payment_method || '-'}  |  ${r.created_at}`));

  const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const header = ['reference_code','status','amount','payment_method','payment_ref_code','einvoice_no','created_at','updated_at','tenant_id'];
  const csv = [header.join(',')].concat(
    data.map(r => header.map(h => esc(r[h])).join(','))
  ).join('\n');
  fs.writeFileSync('odeal-references.csv', csv);
  console.log('\n✓ Tümü odeal-references.csv dosyasına yazıldı.');
})();
