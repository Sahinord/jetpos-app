-- Enable Realtime for Adisyon Tables
BEGIN;
  -- Add tables to the supabase_realtime publication
  ALTER PUBLICATION supabase_realtime ADD TABLE restaurant_tables;
  ALTER PUBLICATION supabase_realtime ADD TABLE table_orders;
COMMIT;
