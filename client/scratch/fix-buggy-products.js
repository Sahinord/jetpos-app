const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/Users/sahinord/Documents/jetpos-app/client/.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  console.log("Querying database for products with stock_quantity > 1000000...");
  
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, barcode, stock_quantity')
    .gt('stock_quantity', 1000000);
    
  if (error) {
    console.error("Error querying products:", error);
    return;
  }
  
  console.log(`Found ${products.length} products with stock_quantity > 1,000,000.`);
  
  if (products.length === 0) {
    console.log("No buggy products to fix.");
    return;
  }
  
  const productIds = products.map(p => p.id);
  
  console.log("Updating stock_quantity to 0 for these products...");
  const { data: updated, error: updateError } = await supabase
    .from('products')
    .update({ stock_quantity: 0 })
    .in('id', productIds)
    .select();
    
  if (updateError) {
    console.error("Error updating products:", updateError);
    return;
  }
  
  console.log(`Successfully updated ${updated.length} products' stock_quantity to 0!`);
}

run();
