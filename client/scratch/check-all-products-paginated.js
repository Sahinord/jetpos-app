const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/Users/sahinord/Documents/jetpos-app/client/.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  console.log("Fetching all products with pagination...");
  
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
  
  // Calculate total stock and find suspicious ones
  let totalStock = 0;
  let suspicious = [];
  
  allProducts.forEach(p => {
    const qty = p.stock_quantity || 0;
    totalStock += qty;
    if (qty > 100000) {
      suspicious.push(p);
    }
  });
  
  console.log(`Total stock in database: ${totalStock}`);
  console.log(`Number of products with stock > 100,000: ${suspicious.length}`);
  if (suspicious.length > 0) {
    console.log("Top 5 suspicious:");
    suspicious.slice(0, 5).forEach(p => {
      console.log(`Name: ${p.name} | Stock: ${p.stock_quantity} | Barcode: ${p.barcode}`);
    });
  }
}

run();
