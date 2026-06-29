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

async function run() {
  const candidates = ['exec_sql', 'execute_sql', 'run_sql', 'query', 'sql'];
  for (const fn of candidates) {
    try {
      const { data, error } = await supabase.rpc(fn, { query: 'SELECT 1;' });
      if (error) {
        console.log(`❌ RPC "${fn}" returned error: ${error.message} (${error.code})`);
      } else {
        console.log(`✅ RPC "${fn}" exists and returned:`, data);
        return;
      }
    } catch (e) {
      console.log(`❌ RPC "${fn}" exception:`, e.message);
    }
  }
}
run();
