// Silinmiş PILIC BAGET KG barkodunu null yap + DOGUS KUP SEKER 1KG'ya 2701038 ata
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://grlwmcuxobbgubphovhd.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdybHdtY3V4b2JiZ3VicGhvdmhkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODA3MzUzMCwiZXhwIjoyMDgzNjQ5NTMwfQ.V2ZjiEm8S0d84hBeQIlb14gNTusduDHcn2MkOiK9NsA';

const supabase = createClient(supabaseUrl, serviceKey);

async function main() {
  // 1. Silinmiş PILIC BAGET KG'nin barkodunu null'a çevir
  const deletedId = 'cab1bdaf-e01e-4967-b3bc-0a5fb021bcea';
  const { error: e1 } = await supabase
    .from('products')
    .update({ barcode: null })
    .eq('id', deletedId);

  if (e1) { console.error('❌ Silinmiş ürün güncelleme hatası:', e1.message); return; }
  console.log('✅ Silinmiş PILIC BAGET KG ürününün barkodu NULL\'a çevrildi.');

  // 2. DOGUS KUP SEKER 1KG (null barkodlu) ürününe 2701038 ata
  const dogusId = 'dffd4df9-4392-40cf-856a-5390f8997c6d';
  const { error: e2 } = await supabase
    .from('products')
    .update({ barcode: '2701038' })
    .eq('id', dogusId);

  if (e2) { console.error('❌ DOGUS KUP SEKER barkod atama hatası:', e2.message); return; }
  console.log('✅ DOGUS KUP SEKER 1KG ürününe barkod atandı: 2701038');

  // 3. Doğrulama
  const { data } = await supabase
    .from('products')
    .select('id, name, barcode, status, deleted_at')
    .in('id', [deletedId, dogusId]);

  console.log('\n📋 Son durum:');
  data?.forEach(p => {
    const flag = p.deleted_at ? '[SİLİNMİŞ]' : `[${p.status?.toUpperCase()}]`;
    console.log(`  ${flag} ${p.name} → barkod: "${p.barcode}"`);
  });
}

main().catch(console.error);
