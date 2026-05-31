const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/Users/sahinord/Documents/jetpos-app/client/.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  console.log("Fetching all products across all tenants with pagination...");
  
  let allProducts = [];
  let page = 0;
  const PAGE_SIZE = 1000;
  let hasMore = true;
  
  while (hasMore) {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, barcode, stock_quantity, purchase_price, sale_price, tenant_id')
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      
    if (error) {
      console.error("Error fetching page:", error);
      break;
    }
    
    if (data.length === 0) {
      hasMore = false;
    } else {
      allProducts.push(...data);
      page++;
    }
  }
  
  console.log(`Total Products fetched: ${allProducts.length}`);
  
  const tenants = {};
  allProducts.forEach(p => {
    const tid = p.tenant_id;
    if (!tenants[tid]) {
      tenants[tid] = { count: 0, totalStock: 0, totalValue: 0, potentialProfit: 0, suspiciousCount: 0 };
    }
    const qty = p.stock_quantity || 0;
    const sale = p.sale_price || 0;
    const purchase = p.purchase_price || 0;
    
    tenants[tid].count += 1;
    tenants[tid].totalStock += qty;
    tenants[tid].totalValue += sale * qty;
    tenants[tid].potentialProfit += (sale - purchase) * qty;
    if (qty > 10000) {
      tenants[tid].suspiciousCount += 1;
    }
  });
  
  console.log("\nTenant statistics:");
  for (const [tid, stats] of Object.entries(tenants)) {
    console.log(`Tenant ID: ${tid}`);
    console.log(`  Product Count: ${stats.count}`);
    console.log(`  Total Stock: ${stats.totalStock}`);
    console.log(`  Total Stock Value: ₺${stats.totalValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`);
    console.log(`  Potential Profit: ₺${stats.potentialProfit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`);
    console.log(`  Suspicious Products (>10,000 stock): ${stats.suspiciousCount}`);
  }
}

run();
