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
  
  console.log(`Loaded ${allProducts.length} products.`);
  
  const parseNum = (val) => {
    if (val === undefined || val === null || val === "") return 0;
    if (typeof val === 'number') return val;
    const clean = String(val).replace(',', '.').replace(/[^\d.-]/g, '');
    const res = parseFloat(clean);
    return isNaN(res) ? 0 : res;
  };
  
  const buggyProducts = [];
  
  allProducts.forEach(p => {
    if (!p.barcode || p.stock_quantity === 0) return;
    
    const parsedBarcodeNum = parseNum(p.barcode);
    if (parsedBarcodeNum > 0 && parsedBarcodeNum === p.stock_quantity) {
      buggyProducts.push(p);
    }
  });
  
  console.log(`\nFound ${buggyProducts.length} products where stock_quantity equals parsed barcode digits.`);
  
  if (buggyProducts.length > 0) {
    console.log("Showing first 20 buggy products:");
    buggyProducts.slice(0, 20).forEach(p => {
      console.log(`Name: ${p.name} | Barcode: ${p.barcode} | Stock: ${p.stock_quantity}`);
    });
  }
}

run();
