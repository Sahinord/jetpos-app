// 2701038 barkodlu ürünlerin durumunu kontrol et
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://grlwmcuxobbgubphovhd.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdybHdtY3V4b2JiZ3VicGhvdmhkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODA3MzUzMCwiZXhwIjoyMDgzNjQ5NTMwfQ.V2ZjiEm8S0d84hBeQIlb14gNTusduDHcn2MkOiK9NsA';

const supabase = createClient(supabaseUrl, serviceKey);

async function main() {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, barcode, status, deleted_at, archived_at, tenant_id')
    .eq('barcode', '2701038');

  if (error) { console.error('Hata:', error.message); return; }

  console.log(`\n2701038 barkodlu ürünler (${data?.length ?? 0} adet):\n`);
  data?.forEach(p => {
    console.log(`  ID: ${p.id}`);
    console.log(`  Adı: ${p.name}`);
    console.log(`  Status: ${p.status}`);
    console.log(`  is_active: ${p.is_active}`);
    console.log(`  deleted_at: ${p.deleted_at}`);
    console.log(`  archived_at: ${p.archived_at}`);
    console.log(`  tenant_id: ${p.tenant_id}`);
    console.log('');
  });
}

main().catch(console.error);
