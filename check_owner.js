const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envContent = fs.readFileSync('./client/.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val.length > 0) env[key.trim()] = val.join('=').trim();
});

const supabase = createClient(
  env['NEXT_PUBLIC_SUPABASE_URL'],
  env['SUPABASE_SERVICE_ROLE_KEY']
);

async function checkOwner() {
  console.log("Checking employees table for 'owner' role...");
  const { data, error } = await supabase
    .from('employees')
    .select('id, first_name, role, pin_hash')
    .eq('role', 'owner');
    
  if (error) {
    console.error("Error fetching employees:", error.message);
    return;
  }
  
  if (data && data.length > 0) {
    console.log("Owner found:");
    console.table(data);
    
    // Check if pin_hash is null
    data.forEach(owner => {
       console.log(`Owner ${owner.first_name} has_pin:`, owner.pin_hash !== null);
    });
  } else {
    console.log("No owner found in employees table.");
  }
}

checkOwner();
