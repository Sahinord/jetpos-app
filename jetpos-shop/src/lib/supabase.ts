import { createClient } from "@supabase/supabase-js";

// Statik export (FTP hosting) için sunucu tarafı yok — bu yüzden anon key ile
// doğrudan tarayıcıdan yazıyoruz. Güvenlik, Supabase'deki RLS policy'sinden
// geliyor: anon rolü early_access_signups tablosuna sadece INSERT yapabilir,
// hiçbir şekilde SELECT/UPDATE/DELETE yapamaz (bkz. supabase/migrations/
// 20260628_early_access_signups_anon_insert_policy.sql).
export const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
