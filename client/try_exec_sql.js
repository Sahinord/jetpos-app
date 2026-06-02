const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://grlwmcuxobbgubphovhd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdybHdtY3V4b2JiZ3VicGhvdmhkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODA3MzUzMCwiZXhwIjoyMDgzNjQ5NTMwfQ.V2ZjiEm8S0d84hBeQIlb14gNTusduDHcn2MkOiK9NsA';

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
