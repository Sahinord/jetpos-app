const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/Users/sahinord/Documents/jetpos-app/client/.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  console.log("Checking products with non-numeric names...");
  
  let allProducts = [];
  let page = 0;
  const PAGE_SIZE = 1000;
  let hasMore = true;
  
  while (hasMore) {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, barcode, stock_quantity, sale_price, purchase_price')
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
  
  const realNameProducts = allProducts.filter(p => !/^\d+$/.test(p.name));
  
  console.log(`\nFound ${realNameProducts.length} products with non-numeric names.`);
  console.log("Top 20 non-numeric-named products:");
  realNameProducts.slice(0, 20).forEach(p => {
    console.log(`Name: ${p.name} | Barcode: ${p.barcode} | Stock: ${p.stock_quantity} | Sale Price: ${p.sale_price}`);
  });
}

run();
