-- 20260601_restaurant_ecosystem.sql, get_current_tenant_id_logged() fonksiyonunu
-- olusturdu ve kitchen_stations / kitchen_orders / kitchen_order_items / table_calls /
-- order_groups / notifications / waiter_ratings RLS politikalarinda kullandi, ama
-- anon/authenticated rollerine EXECUTE izni vermeyi unuttu (ayni migration'da
-- escalate_unanswered_calls / get_waiter_performance / verify_employee_pin /
-- verify_station_pin icin bu grant'lar yapilmisti, bu fonksiyon atlanmis).
--
-- Sonuc: PostgREST/Realtime bu rollerle bu fonksiyonu cagiramadigi icin RLS
-- degerlendirmesi "permission denied for function get_current_tenant_id_logged"
-- (code 42501) ile patliyor — yedi tablonun tumunde SELECT/INSERT/UPDATE/DELETE
-- ve Realtime postgres_changes akisi tamamen kirik (KDS dahil).
--
-- Dogrulama: anon key + x-tenant-id header + set_current_tenant RPC ile
-- kitchen_orders/kitchen_stations sorgusu calistirilinca tam bu hata aliniyor.

GRANT EXECUTE ON FUNCTION get_current_tenant_id_logged() TO anon, authenticated;
