const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/Users/sahinord/Documents/jetpos-app/client/.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  console.log("Analyzing all products across all tenants...");
  
  const { data: products, error } = await supabase
    .from('products')
    .select('tenant_id, stock_quantity, sale_price, purchase_price');
    
  if (error) {
    console.error("Error querying products:", error);
    return;
  }
  
  const tenants = {};
  products.forEach(p => {
    const tid = p.tenant_id;
    if (!tenants[tid]) {
      tenants[tid] = { count: 0, totalStock: 0, totalValue: 0, potentialProfit: 0 };
    }
    const qty = p.stock_quantity || 0;
    const sale = p.sale_price || 0;
    const purchase = p.purchase_price || 0;
    
    tenants[tid].count += 1;
    tenants[tid].totalStock += qty;
    tenants[tid].totalValue += sale * qty;
    tenants[tid].potentialProfit += (sale - purchase) * qty;
  });
  
  console.log("Tenant statistics:");
  for (const [tid, stats] of Object.entries(tenants)) {
    console.log(`Tenant ID: ${tid}`);
    console.log(`  Product Count: ${stats.count}`);
    console.log(`  Total Stock: ${stats.totalStock.toLocaleString('tr-TR')}`);
    console.log(`  Total Stock Value: ₺${stats.totalValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`);
    console.log(`  Potential Profit: ₺${stats.potentialProfit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`);
  }
}

run();
