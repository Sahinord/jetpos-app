const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://grlwmcuxobbgubphovhd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdybHdtY3V4b2JiZ3VicGhvdmhkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODA3MzUzMCwiZXhwIjoyMDgzNjQ5NTMwfQ.V2ZjiEm8S0d84hBeQIlb14gNTusduDHcn2MkOiK9NsA';

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
