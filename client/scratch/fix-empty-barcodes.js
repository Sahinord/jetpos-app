// DB'deki boş string barcode'ları null'a çeviren fix scripti
// Çalıştır: node client/scratch/fix-empty-barcodes.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://grlwmcuxobbgubphovhd.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdybHdtY3V4b2JiZ3VicGhvdmhkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODA3MzUzMCwiZXhwIjoyMDgzNjQ5NTMwfQ.V2ZjiEm8S0d84hBeQIlb14gNTusduDHcn2MkOiK9NsA';

const supabase = createClient(supabaseUrl, serviceKey);

async function fixEmptyBarcodes() {
  console.log('🔍 Boş barkodlu ürünler aranıyor...');

  // Önce kaç tane var gör
  const { data: emptyBarcodes, error: fetchErr } = await supabase
    .from('products')
    .select('id, name, barcode, tenant_id')
    .eq('barcode', '');

  if (fetchErr) {
    console.error('❌ Sorgu hatası:', fetchErr.message);
    return;
  }

  console.log(`📦 ${emptyBarcodes?.length ?? 0} adet boş barkodlu ürün bulundu:`);
  emptyBarcodes?.forEach(p => console.log(`  - [${p.tenant_id?.slice(0,8)}] ${p.name} (id: ${p.id})`));

  if (!emptyBarcodes || emptyBarcodes.length === 0) {
    console.log('✅ Düzeltilecek kayıt yok.');
    return;
  }

  // Hepsini null'a çevir
  const { error: updateErr, count } = await supabase
    .from('products')
    .update({ barcode: null })
    .eq('barcode', '');

  if (updateErr) {
    console.error('❌ Güncelleme hatası:', updateErr.message);
    return;
  }

  console.log(`✅ ${emptyBarcodes.length} ürünün barkodu NULL'a çevrildi.`);
  console.log('ℹ️  Bu ürünler artık barkod aranınca çıkmayacak ama listelenecek.');
  console.log('ℹ️  Her ürünü açıp barkodunu gir veya yeni ürün eklerken barkod giriniz.');
}

fixEmptyBarcodes().catch(console.error);
