// Silinmiş ürünlerin barkodlarını NULL yaparak boşa çıkaran script
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://grlwmcuxobbgubphovhd.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdybHdtY3V4b2JiZ3VicGhvdmhkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODA3MzUzMCwiZXhwIjoyMDgzNjQ5NTMwfQ.V2ZjiEm8S0d84hBeQIlb14gNTusduDHcn2MkOiK9NsA';

const supabase = createClient(supabaseUrl, serviceKey);

async function main() {
  console.log('🔍 Silinmiş ve barkodu olan ürünler aranıyor...');

  const { data, error } = await supabase
    .from('products')
    .select('id, name, barcode, tenant_id')
    .not('deleted_at', 'is', null)
    .not('barcode', 'is', null);

  if (error) {
    console.error('❌ Arama hatası:', error.message);
    return;
  }

  console.log(`📦 ${data?.length ?? 0} adet silinmiş ama barkodunu tutan ürün bulundu:`);
  data?.forEach(p => {
    console.log(`  - [${p.tenant_id?.slice(0,8)}] ${p.name} (Barkod: ${p.barcode})`);
  });

  if (!data || data.length === 0) {
    console.log('✅ Temizlenecek kayıt yok.');
    return;
  }

  // Hepsini güncelle
  for (const product of data) {
    const { error: updErr } = await supabase
      .from('products')
      .update({ barcode: null })
      .eq('id', product.id);

    if (updErr) {
      console.error(`❌ ${product.name} güncellenirken hata:`, updErr.message);
    } else {
      console.log(`✅ ${product.name} barkodu boşa çıkarıldı.`);
    }
  }

  console.log('🎉 Tüm silinmiş ürün barkodları temizlendi ve boşa çıkarıldı!');
}

main().catch(console.error);
