-- ═══════════════════════════════════════════════════════════════════
--  PLATFORM BAZLI FİYAT — her ürün için platform-özel satış fiyatı
--  Manuel uygulanır: Supabase Dashboard > SQL Editor
--
--  Şimdiye kadar ürünlerde tek "external_price" + "sync_trendyol" vardı
--  (sadece Trendyol Pazaryeri). Artık her platform (Trendyol GO, Getir Çarşı,
--  Hepsiburada, Yemeksepeti, TGO Yemek) kendi fiyatını ve "satışta" durumunu
--  tutabilsin diye JSONB alan:
--
--    platform_prices = {
--      "trendyol":     { "active": true,  "price": 100 },
--      "getir":        { "active": false, "price": 0 },
--      "trendyol_go":  { "active": true,  "price": 105 },
--      ...
--    }
--
--  NOT: Trendyol Pazaryeri ile geriye uyumluluk için external_price/sync_trendyol
--  alanları KORUNUYOR; modal bunları platform_prices.trendyol ile aynı anda yazar.
--  Diğer platformların stok/fiyat senkron route'ları platform_prices'tan okuyacak
--  (ayrı adım).
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE products ADD COLUMN IF NOT EXISTS platform_prices JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN products.platform_prices IS
    'Platform-özel fiyat/durum: { "<platform>": { "active": bool, "price": number } }';
