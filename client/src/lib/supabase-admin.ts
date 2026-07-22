
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const DUMMY_KEY = 'no_admin_key_for_build';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || DUMMY_KEY;

// service-role key gerçekten var mı? (build-time dummy değilse). Route'lar bunu
// kontrol edip "Invalid API key" yerine anlamlı hata döndürebilir.
export const hasServiceRoleKey = supabaseServiceRoleKey !== DUMMY_KEY;

if (!hasServiceRoleKey) {
}

// Server-side only client with bypass RLS
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
