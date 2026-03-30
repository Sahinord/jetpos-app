-- Çalışma Saatleri & Kapalı Modu Güncellemesi

-- 1. Çalışma saatlerini tutan JSONB kolonu ve Manuel Kapatma kolonu
ALTER TABLE qr_menu_settings ADD COLUMN IF NOT EXISTS working_hours JSONB DEFAULT '{
  "monday": {"open": "09:00", "close": "22:00", "active": true},
  "tuesday": {"open": "09:00", "close": "22:00", "active": true},
  "wednesday": {"open": "09:00", "close": "22:00", "active": true},
  "thursday": {"open": "09:00", "close": "22:00", "active": true},
  "friday": {"open": "09:00", "close": "23:00", "active": true},
  "saturday": {"open": "10:00", "close": "23:00", "active": true},
  "sunday": {"open": "10:00", "close": "22:00", "active": true}
}';

ALTER TABLE qr_menu_settings ADD COLUMN IF NOT EXISTS is_closed_manual BOOLEAN DEFAULT false;
