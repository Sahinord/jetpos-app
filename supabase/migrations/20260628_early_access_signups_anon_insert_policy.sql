-- jetpos-shop, klasik (Node.js'siz) paylasimli hosting'e statik export olarak
-- deploy edildigi icin server-side API route kullanamiyor. Form artik anon key
-- ile dogrudan taraycidan bu tabloya INSERT atiyor. Bu policy SADECE INSERT'e
-- izin verir; anon SELECT/UPDATE/DELETE yapamaz, e-posta listesi disariya
-- sizdirilamaz.

CREATE POLICY "anon_can_insert_early_access_signups"
ON early_access_signups
FOR INSERT
TO anon
WITH CHECK (true);
