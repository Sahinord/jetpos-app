-- ==============================================================================
-- JETPOS GÜVENLİK GÜNCELLEMESİ (View Security Fix)
-- ==============================================================================
-- Supabase uyarısı: "public.product_summaries" view'i SECURITY DEFINER ile tanımlanmış.
-- Bu durum, RLS kurallarının (tenant izolasyonu vb.) atlanmasına neden olur.
-- Aşağıdaki komut, bu görünümü SECURITY INVOKER (çağıranın yetkileri) olarak ayarlar 
-- ve verilerin güvenli bir şekilde filtrelenmesini sağlar.

ALTER VIEW public.product_summaries SET (security_invoker = on);
