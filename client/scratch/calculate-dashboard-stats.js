const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/Users/sahinord/Documents/jetpos-app/client/.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const testTenantId = '755dfb53-fde1-4ab9-9070-572d20126c07';

async function run() {
  console.log(`Calculating dashboard stats for tenant = ${testTenantId}...`);
  
  const { data: products, error } = await supabase
    .from('products')
    .select('stock_quantity, purchase_price, sale_price')
    .eq('tenant_id', testTenantId);
    
  if (error) {
    console.error("Error querying products:", error);
    return;
  }
  
  let totalProducts = products.length;
  let totalStockQuantity = 0;
  let totalStockValue = 0;
  let potentialNetProfit = 0;
  
  products.forEach(p => {
    const qty = p.stock_quantity || 0;
    const sale = p.sale_price || 0;
    const purchase = p.purchase_price || 0;
    
    totalStockQuantity += qty;
    totalStockValue += sale * qty;
    potentialNetProfit += (sale - purchase) * qty;
  });
  
  console.log(`Total Products: ${totalProducts}`);
  console.log(`Total Stock Quantity: ${totalStockQuantity}`);
  console.log(`Total Stock Value: ${totalStockValue}`);
  console.log(`Potential Net Profit: ${potentialNetProfit}`);
}

run();
