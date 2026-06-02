const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://grlwmcuxobbgubphovhd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdybHdtY3V4b2JiZ3VicGhvdmhkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODA3MzUzMCwiZXhwIjoyMDgzNjQ5NTMwfQ.V2ZjiEm8S0d84hBeQIlb14gNTusduDHcn2MkOiK9NsA';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  console.log("Checking DB Tables...");
  const tables = [
    'kitchen_stations',
    'table_calls',
    'order_groups',
    'kitchen_orders',
    'kitchen_order_items',
    'waiter_ratings',
    'notifications'
  ];
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`❌ Table "${table}": Error - ${error.message} (${error.code})`);
    } else {
      console.log(`✅ Table "${table}": Found (Count: ${data?.length || 0})`);
    }
  }

  // Check additional columns
  console.log("\nChecking table columns...");
  const { data: employees, error: empErr } = await supabase.from('employees').select('*').limit(1);
  if (!empErr && employees && employees[0]) {
    console.log("Employees columns:", Object.keys(employees[0]));
  } else {
    console.log("Employees check error or empty:", empErr?.message);
  }

  const { data: tablesData, error: tabErr } = await supabase.from('restaurant_tables').select('*').limit(1);
  if (!tabErr && tablesData && tablesData[0]) {
    console.log("Restaurant Tables columns:", Object.keys(tablesData[0]));
  } else {
    console.log("Restaurant Tables check error or empty:", tabErr?.message);
  }

  const { data: tenantsData, error: tenErr } = await supabase.from('tenants').select('*').limit(1);
  if (!tenErr && tenantsData && tenantsData[0]) {
    console.log("Tenants columns:", Object.keys(tenantsData[0]));
  } else {
    console.log("Tenants check error or empty:", tenErr?.message);
  }
}

run();
