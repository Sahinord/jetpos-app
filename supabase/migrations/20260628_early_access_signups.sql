-- jetpos.shop "cok yakinda" sayfasindaki erken erisim e-posta toplama formu icin.
-- Bu tablo herkese acik (anon) bir form tarafindan INSERT edilir, Supabase Auth
-- kullanmiyor, bu yuzden tenant izolasyonu yok - sadece spam/yinelenen kaydi
-- engellemek icin email'i unique tutuyoruz.

CREATE TABLE IF NOT EXISTS early_access_signups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    source VARCHAR(50) DEFAULT 'jetpos-shop-coming-soon',
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE early_access_signups ENABLE ROW LEVEL SECURITY;

-- Yalnizca service-role (API route) yazabilir/okuyabilir; anon/authenticated icin
-- herhangi bir policy tanimlanmadi, yani RLS varsayilan olarak her seyi reddeder.
