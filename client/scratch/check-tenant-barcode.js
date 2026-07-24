// Tenant 755dfb53 içindeki 2701038 barkodlu ürün var mı?
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://grlwmcuxobbgubphovhd.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdybHdtY3V4b2JiZ3VicGhvdmhkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODA3MzUzMCwiZXhwIjoyMDgzNjQ5NTMwfQ.V2ZjiEm8S0d84hBeQIlb14gNTusduDHcn2MkOiK9NsA';

const supabase = createClient(supabaseUrl, serviceKey);

const MY_TENANT = '755dfb53-fde1-4ab9-9070-572d20126c07';

async function main() {
  // Bu tenant'taki tüm 2701038 barkodlu ürünler (silinmiş dahil)
  const { data, error } = await supabase
    .from('products')
    .select('id, name, barcode, status, deleted_at')
    .eq('tenant_id', MY_TENANT)
    .eq('barcode', '2701038');

  if (error) { console.error('Hata:', error.message); return; }

  console.log(`\nTenant ${MY_TENANT} içinde 2701038 barkodlu ürünler (${data?.length ?? 0}):\n`);
  data?.forEach(p => {
    const flag = p.deleted_at ? '[SİLİNMİŞ]' : p.status === 'passive' ? '[PASİF]' : '[AKTİF]';
    console.log(`  ${flag} ${p.name} - id: ${p.id}`);
    console.log(`    deleted_at: ${p.deleted_at}`);
    console.log('');
  });

  // DOGUS KUP SEKER 1KG ne durumda?
  const { data: dogus } = await supabase
    .from('products')
    .select('id, name, barcode, status, deleted_at')
    .eq('tenant_id', MY_TENANT)
    .ilike('name', '%dogus%kup%');

  console.log('\nDOGUS KUP SEKER ürünleri:');
  dogus?.forEach(p => {
    console.log(`  ${p.name} | barkod: "${p.barcode}" | status: ${p.status} | deleted: ${p.deleted_at}`);
  });
}

main().catch(console.error);
