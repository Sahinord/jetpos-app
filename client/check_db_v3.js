const { createClient } = require('@supabase/supabase-js');

const fs = require('fs');
const path = require('path');
const envContent = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const idx = line.indexOf('=');
  if (idx === -1) return;
  env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
});
const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseServiceKey = env['SUPABASE_SERVICE_ROLE_KEY'];

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkProducts() {
  console.log('Checking products table...');
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .limit(5);

  if (error) {
    console.error('Error fetching products:', error);
    return;
  }

  console.log(`Found ${products.length} products (sample):`);
  console.log(JSON.stringify(products, null, 2));

  // Check columns
  const firstProduct = products[0];
  if (firstProduct) {
    console.log('Product columns:', Object.keys(firstProduct));
  } else {
    console.log('No products found in table.');
  }
}

checkProducts();
