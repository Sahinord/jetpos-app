// DOGUS KUP SEKER 1KG ürününe 2701038 barkodunu ekle
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://grlwmcuxobbgubphovhd.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdybHdtY3V4b2JiZ3VicGhvdmhkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODA3MzUzMCwiZXhwIjoyMDgzNjQ5NTMwfQ.V2ZjiEm8S0d84hBeQIlb14gNTusduDHcn2MkOiK9NsA';

const supabase = createClient(supabaseUrl, serviceKey);

async function main() {
  const productId = 'dffd4df9-4392-40cf-856a-5390f8997c6d';
  const barcode = '2701038';

  // Önce bu barkod başka üründe var mı kontrol et
  const { data: existing } = await supabase
    .from('products')
    .select('id, name, barcode')
    .eq('barcode', barcode);

  if (existing && existing.length > 0) {
    console.log('⚠️  Bu barkod zaten şu ürünlerde kullanılıyor:');
    existing.forEach(p => console.log(`  - ${p.name} (${p.id})`));
    return;
  }

  const { error } = await supabase
    .from('products')
    .update({ barcode })
    .eq('id', productId);

  if (error) {
    console.error('❌ Hata:', error.message);
    return;
  }

  console.log(`✅ "DOGUS KUP SEKER 1KG" ürününe barkod atandı: ${barcode}`);
}

main().catch(console.error);
