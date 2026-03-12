const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://grlwmcuxobbgubphovhd.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdybHdtY3V4b2JiZ3VicGhvdmhkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODA3MzUzMCwiZXhwIjoyMDgzNjQ5NTMwfQ.V2ZjiEm8S0d84hBeQIlb14gNTusduDHcn2MkOiK9NsA');

async function check() {
    const { data, error } = await supabase.from('tenants').select('id, name, settings');
    if (error) {
        console.error(error);
        process.exit(1);
    }
    console.log(JSON.stringify(data, null, 2));
}

check();
