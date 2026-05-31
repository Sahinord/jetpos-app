const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/Users/sahinord/Documents/jetpos-app/client/.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  console.log("Querying database for products with exceptionally large stock or prices...");
  
  // Query products where stock_quantity > 1000000 or price > 1000000
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, barcode, stock_quantity, purchase_price, sale_price, external_price, tenant_id')
    .or('stock_quantity.gt.1000000,purchase_price.gt.1000000,sale_price.gt.1000000,external_price.gt.1000000');
    
  if (error) {
    console.error("Error querying products:", error);
    return;
  }
  
  console.log(`Found ${products.length} suspicious products:`);
  products.forEach(p => {
    console.log(`ID: ${p.id} | Name: ${p.name} | Barcode: ${p.barcode} | Stock: ${p.stock_quantity} | Purchase: ${p.purchase_price} | Sale: ${p.sale_price} | Tenant: ${p.tenant_id}`);
  });
}

run();
