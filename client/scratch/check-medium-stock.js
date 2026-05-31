const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/Users/sahinord/Documents/jetpos-app/client/.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  console.log("Checking products with stock_quantity between 10,000 and 1,000,000...");
  
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, barcode, stock_quantity, sale_price, purchase_price')
    .gt('stock_quantity', 10000)
    .lt('stock_quantity', 1000000);
    
  if (error) {
    console.error("Error querying products:", error);
    return;
  }
  
  console.log(`Found ${products.length} products:`);
  products.forEach(p => {
    console.log(`ID: ${p.id} | Name: ${p.name} | Barcode: ${p.barcode} | Stock: ${p.stock_quantity} | Purchase: ${p.purchase_price} | Sale: ${p.sale_price}`);
  });
}

run();
