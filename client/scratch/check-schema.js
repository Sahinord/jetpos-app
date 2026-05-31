const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/Users/sahinord/Documents/jetpos-app/client/.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const testTenantId = '755dfb53-fde1-4ab9-9070-572d20126c07';

async function testBarcodeOnly(barcodeValue) {
  const testProduct = {
    tenant_id: testTenantId,
    barcode: String(barcodeValue),
    name: 'Test Product Barcode ' + barcodeValue,
    purchase_price: 10,
    sale_price: 20,
    vat_rate: 20,
    stock_quantity: 100,
    external_price: 0,
    status: 'active'
  };

  const { data, error } = await supabase.from('products').insert([testProduct]).select();
  if (error) {
    console.log(`Failed for barcode = ${barcodeValue}:`, error.message, `[${error.code}]`);
    return error.code;
  } else {
    console.log(`Success for barcode = ${barcodeValue}`);
    // Cleanup
    await supabase.from('products').delete().eq('id', data[0].id);
    return null;
  }
}

async function run() {
  await testBarcodeOnly('8683767637232');
}

run();
