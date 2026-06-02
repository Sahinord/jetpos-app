-- =========================================================
-- 🍽️ JETPOS RESTAURANT ECOSYSTEM — FULL SCHEMA V2
-- Supabase Dashboard → SQL Editor → RUN
-- =========================================================

-- ==========================================
-- 1. KITCHEN STATIONS (Mutfak İstasyonları)
-- Bar, Mutfak, Tatlı, Izgara vb.
-- ==========================================
CREATE TABLE IF NOT EXISTS kitchen_stations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    parent_station_id UUID REFERENCES kitchen_stations(id) ON DELETE SET NULL, -- Hiyerarşik İstasyonlar
    name TEXT NOT NULL,               -- 'Bar', 'Mutfak', 'Tatlı', 'Izgara'
    code TEXT NOT NULL,               -- 'bar', 'kitchen', 'dessert', 'grill'
    color TEXT DEFAULT '#3b82f6',     -- UI renk kodu
    icon TEXT DEFAULT 'chef-hat',     -- Lucide icon adı
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- İstasyon bazlı PIN desteği (KDS Koruması)
ALTER TABLE kitchen_stations ADD COLUMN IF NOT EXISTS pin_code TEXT;
ALTER TABLE kitchen_stations ADD COLUMN IF NOT EXISTS pin_hash TEXT;

CREATE OR REPLACE FUNCTION hash_station_pin()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.pin_code IS NOT NULL AND NEW.pin_code <> '' AND (TG_OP = 'INSERT' OR OLD.pin_code IS DISTINCT FROM NEW.pin_code) THEN
        NEW.pin_hash := crypt(NEW.pin_code, gen_salt('bf', 10));
    END IF;
    NEW.pin_code := NULL;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_hash_station_pin ON kitchen_stations;
CREATE TRIGGER tr_hash_station_pin
    BEFORE INSERT OR UPDATE ON kitchen_stations
    FOR EACH ROW
    EXECUTE FUNCTION hash_station_pin();

-- ==========================================
-- 2. EMPLOYEE ALTERS (Online/Offline Status, Role, and Security)
-- ==========================================
ALTER TABLE employees ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'Waiter'; -- Owner, Manager, Waiter, Cashier, Kitchen
ALTER TABLE employees ADD COLUMN IF NOT EXISTS pin_code TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS pin_hash TEXT;

-- Role set enum CHECK constraint (case insensitive via LOWER)
ALTER TABLE employees DROP CONSTRAINT IF EXISTS chk_employee_role;
ALTER TABLE employees ADD CONSTRAINT chk_employee_role CHECK (
    LOWER(role) IN ('owner', 'manager', 'cashier', 'waiter', 'kitchen', 'bar', 'dessert', 'grill')
);

-- Employee PIN hash trigger helper
CREATE OR REPLACE FUNCTION hash_employee_pin()
RETURNS TRIGGER AS $$
BEGIN
    -- Eğer pin_code verilmişse bcrypt ile hash'le
    IF NEW.pin_code IS NOT NULL AND NEW.pin_code <> '' AND (TG_OP = 'INSERT' OR OLD.pin_code IS DISTINCT FROM NEW.pin_code) THEN
        NEW.pin_hash := crypt(NEW.pin_code, gen_salt('bf', 10));
    END IF;
    -- Güvenlik amacıyla düz metin pin alanını temizle
    NEW.pin_code := NULL;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_hash_employee_pin ON employees;
CREATE TRIGGER tr_hash_employee_pin
    BEFORE INSERT OR UPDATE ON employees
    FOR EACH ROW
    EXECUTE FUNCTION hash_employee_pin();

-- ==========================================
-- 3. TABLE CALLS (Müşteri Çağrı Sistemi)
-- QR menüden garson/hesap/su/yardım çağrısı
-- Waiter Call Queue (Escalation) desteği
-- ==========================================
CREATE TABLE IF NOT EXISTS table_calls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    table_id UUID REFERENCES restaurant_tables(id) ON DELETE CASCADE,
    table_name TEXT,                   -- Denormalize: bildirimlerde hızlı gösterim
    call_type TEXT NOT NULL CHECK (call_type IN ('waiter', 'bill', 'water', 'help')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'seen', 'accepted', 'resolved', 'expired')),
    
    -- Waiter Call Queue (Escalation)
    assigned_to UUID REFERENCES employees(id),       -- Şu an atanmış garson
    assigned_waiter_name TEXT,                         -- Denormalize: müşteri ekranında gösterim
    escalation_level INTEGER DEFAULT 0,               -- 0=ilk atama, 1=ikinci garson, 2=tüm garsonlar
    escalated_at TIMESTAMPTZ,                         -- Son escalation zamanı
    accepted_at TIMESTAMPTZ,                          -- Garson kabul zamanı
    
    -- Çözüm
    resolved_by UUID REFERENCES employees(id),
    resolved_at TIMESTAMPTZ,
    
    -- Meta
    customer_session_id TEXT,          -- Tarayıcı session (aynı müşteri tekrar çağırmasın)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 4. TABLE CALL SPAM PROTECTION TRIGGER
-- ==========================================
CREATE OR REPLACE FUNCTION prevent_spam_table_calls()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM table_calls
        WHERE table_id = NEW.table_id
          AND call_type = NEW.call_type
          AND status = 'active'
          AND created_at > NOW() - INTERVAL '60 seconds'
    ) THEN
        RAISE EXCEPTION 'Aynı çağrı tipi için 60 saniye içinde mükerrer istek gönderilemez.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_prevent_spam_table_calls ON table_calls;
CREATE TRIGGER tr_prevent_spam_table_calls
    BEFORE INSERT ON table_calls
    FOR EACH ROW
    EXECUTE FUNCTION prevent_spam_table_calls();

-- ==========================================
-- 5. ORDER GROUPS (Sipariş Grupları)
-- ==========================================
CREATE TABLE IF NOT EXISTS order_groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    table_id UUID REFERENCES restaurant_tables(id) ON DELETE CASCADE,
    waiter_id UUID REFERENCES employees(id),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    order_source TEXT DEFAULT 'table' CHECK (order_source IN ('table', 'qr', 'takeaway', 'yemeksepeti', 'trendyol', 'getir')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 6. KITCHEN ORDERS (Mutfak Sipariş Takibi)
-- Adisyon'dan KDS'ye akan siparişler
-- ==========================================
CREATE TABLE IF NOT EXISTS kitchen_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    order_group_id UUID REFERENCES order_groups(id) ON DELETE CASCADE,
    table_id UUID REFERENCES restaurant_tables(id),
    waiter_id UUID REFERENCES employees(id),
    station_id UUID REFERENCES kitchen_stations(id),  -- Hangi mutfak istasyonuna gidecek
    
    -- Denormalize alanlar (KDS'de hızlı gösterim)
    table_name TEXT,
    waiter_name TEXT,
    station_name TEXT,
    
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'preparing', 'ready', 'delivered', 'cancelled')),
    priority INTEGER DEFAULT 0,        -- 0=normal, 1=acil, 2=VIP
    notes TEXT,
    
    -- Zaman takibi (performans raporları için)
    started_at TIMESTAMPTZ,            -- Hazırlanmaya başlandı
    ready_at TIMESTAMPTZ,              -- Hazır oldu
    delivered_at TIMESTAMPTZ,          -- Teslim edildi
    cancelled_at TIMESTAMPTZ,          -- İptal edildi
    cancelled_by UUID REFERENCES employees(id) ON DELETE SET NULL, -- İptal eden
    estimated_minutes INTEGER,         -- Tahmini hazırlanma süresi
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kolonların varlığını garanti altına alalım (Tablo önceden oluşturulmuşsa)
ALTER TABLE kitchen_orders ADD COLUMN IF NOT EXISTS order_group_id UUID REFERENCES order_groups(id) ON DELETE CASCADE;
ALTER TABLE kitchen_orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
ALTER TABLE kitchen_orders ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES employees(id) ON DELETE SET NULL;

-- ==========================================
-- 7. KITCHEN ORDER ITEMS (Sipariş Detayları)
-- ==========================================
CREATE TABLE IF NOT EXISTS kitchen_order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    kitchen_order_id UUID REFERENCES kitchen_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    notes TEXT,                        -- "Soğansız", "Az pişmiş" vb.
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready')),
    station_id UUID REFERENCES kitchen_stations(id),   -- Ürün bazlı istasyon (override)
    cancelled_at TIMESTAMPTZ,
    cancelled_by UUID REFERENCES employees(id) ON DELETE SET NULL
);

-- Kolonların varlığını garanti altına alalım (Tablo önceden oluşturulmuşsa)
ALTER TABLE kitchen_order_items ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
ALTER TABLE kitchen_order_items ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES employees(id) ON DELETE SET NULL;
ALTER TABLE kitchen_order_items ADD COLUMN IF NOT EXISTS station_id UUID REFERENCES kitchen_stations(id);

-- ==========================================
-- 8. WAITER RATINGS (Garson Değerlendirme & Bahşiş)
-- QR Menüden hesap sonrası değerlendirme
-- ==========================================
CREATE TABLE IF NOT EXISTS waiter_ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    waiter_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    table_id UUID REFERENCES restaurant_tables(id),
    table_name TEXT,
    
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),   -- 1-5 yıldız
    tip_amount DECIMAL(15,2) DEFAULT 0,                    -- Bahşiş tutarı
    comment TEXT,                                           -- Müşteri yorumu
    
    -- Hangi siparişe ait
    kitchen_order_id UUID REFERENCES kitchen_orders(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kolonların varlığını garanti altına alalım (Tablo önceden oluşturulmuşsa)
ALTER TABLE waiter_ratings ADD COLUMN IF NOT EXISTS kitchen_order_id UUID REFERENCES kitchen_orders(id);

-- ==========================================
-- 9. REALTIME NOTIFICATIONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'general' CHECK (type IN ('general', 'call', 'order_status', 'kds', 'alert')),
    status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read')),
    reference_id UUID,
    target_user_id UUID REFERENCES employees(id) ON DELETE CASCADE, -- Alıcı çalışan
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kolonların varlığını garanti altına alalım (Tablo önceden oluşturulmuşsa)
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS reference_id UUID;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS target_user_id UUID REFERENCES employees(id) ON DELETE CASCADE;

-- ==========================================
-- 10. CATEGORY → STATION MAPPING
-- Hangi kategori hangi istasyona gidecek
-- ==========================================
ALTER TABLE categories
    ADD COLUMN IF NOT EXISTS station_id UUID REFERENCES kitchen_stations(id);

-- ==========================================
-- 11. RESTAURANT_TABLES — YENİ KOLONLAR
-- Garson sahiplenme + sürükle-bırak pozisyon + süre takibi
-- ==========================================
ALTER TABLE restaurant_tables
    ADD COLUMN IF NOT EXISTS assigned_waiter_id UUID REFERENCES employees(id),
    ADD COLUMN IF NOT EXISTS assigned_waiter_name TEXT,
    ADD COLUMN IF NOT EXISTS position_x INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS position_y INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS width INTEGER DEFAULT 120,
    ADD COLUMN IF NOT EXISTS height INTEGER DEFAULT 120,
    ADD COLUMN IF NOT EXISTS shape TEXT DEFAULT 'square' CHECK (shape IN ('square', 'rectangle', 'circle')),
    ADD COLUMN IF NOT EXISTS floor TEXT DEFAULT 'Zemin Kat',
    ADD COLUMN IF NOT EXISTS has_active_call BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS occupied_at TIMESTAMPTZ;

-- ==========================================
-- 12. QR MENU SETTINGS — MOD SEÇİMİ
-- ==========================================
ALTER TABLE qr_menu_settings
    ADD COLUMN IF NOT EXISTS qr_mode TEXT DEFAULT 'call' CHECK (qr_mode IN ('view', 'call', 'self_order')),
    ADD COLUMN IF NOT EXISTS enable_tips BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS enable_ratings BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS call_button_text TEXT DEFAULT 'Garson Çağır',
    ADD COLUMN IF NOT EXISTS estimated_waiter_time INTEGER DEFAULT 30;

-- ==========================================
-- 13. PRODUCTS — İSTASYON ATAMASI
-- ==========================================
ALTER TABLE products
    ADD COLUMN IF NOT EXISTS station_id UUID REFERENCES kitchen_stations(id);

-- ==========================================
-- 14. TENANT FEATURE GATE
-- ==========================================
ALTER TABLE tenants
    ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{"kds": true, "waiter_panel": true, "qr_menu": true, "tips": true, "ratings": true}'::jsonb;

-- ==========================================
-- 15. ROW LEVEL SECURITY
-- ==========================================
-- RLS tenant context logger function
CREATE OR REPLACE FUNCTION get_current_tenant_id_logged()
RETURNS uuid AS $$
DECLARE
    v_tenant_id text;
BEGIN
    v_tenant_id := current_setting('app.current_tenant_id', true);
    RAISE WARNING 'RLS Access Check: app.current_tenant_id = %', v_tenant_id;
    IF v_tenant_id IS NULL OR v_tenant_id = '' THEN
        RETURN NULL;
    END IF;
    RETURN v_tenant_id::uuid;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'RLS Access Check Error: Failed to cast % to UUID', v_tenant_id;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

ALTER TABLE kitchen_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE kitchen_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE kitchen_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE waiter_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$
BEGIN
    -- Kitchen Stations
    EXECUTE 'DROP POLICY IF EXISTS kitchen_stations_tenant ON kitchen_stations';
    EXECUTE 'CREATE POLICY kitchen_stations_tenant ON kitchen_stations FOR ALL USING (tenant_id = get_current_tenant_id_logged())';

    -- Table Calls — Anon SELECT/INSERT & Auth UPDATE
    EXECUTE 'DROP POLICY IF EXISTS table_calls_tenant ON table_calls';
    EXECUTE 'DROP POLICY IF EXISTS table_calls_tenant_select ON table_calls';
    EXECUTE 'DROP POLICY IF EXISTS table_calls_tenant_insert ON table_calls';
    EXECUTE 'DROP POLICY IF EXISTS table_calls_tenant_update ON table_calls';
    
    EXECUTE 'CREATE POLICY table_calls_tenant_select ON table_calls FOR SELECT TO anon, authenticated USING (tenant_id = get_current_tenant_id_logged())';
    EXECUTE 'CREATE POLICY table_calls_tenant_insert ON table_calls FOR INSERT TO anon, authenticated WITH CHECK (true)';
    EXECUTE 'CREATE POLICY table_calls_tenant_update ON table_calls FOR UPDATE TO authenticated USING (tenant_id = get_current_tenant_id_logged())';

    -- Order Groups
    EXECUTE 'DROP POLICY IF EXISTS order_groups_tenant ON order_groups';
    EXECUTE 'CREATE POLICY order_groups_tenant ON order_groups FOR ALL USING (tenant_id = get_current_tenant_id_logged())';

    -- Kitchen Orders
    EXECUTE 'DROP POLICY IF EXISTS kitchen_orders_tenant ON kitchen_orders';
    EXECUTE 'CREATE POLICY kitchen_orders_tenant ON kitchen_orders FOR ALL USING (tenant_id = get_current_tenant_id_logged())';

    -- Kitchen Order Items (Mutfak sipariş kalemleri — RLS Güvenliği)
    EXECUTE 'DROP POLICY IF EXISTS kitchen_order_items_all ON kitchen_order_items';
    EXECUTE 'DROP POLICY IF EXISTS kitchen_order_items_tenant ON kitchen_order_items';
    EXECUTE 'CREATE POLICY kitchen_order_items_tenant ON kitchen_order_items FOR ALL USING (EXISTS (SELECT 1 FROM kitchen_orders WHERE kitchen_orders.id = kitchen_order_items.kitchen_order_id AND kitchen_orders.tenant_id = get_current_tenant_id_logged()))';

    -- Waiter Ratings — Anon INSERT (QR menüden rating yapılabilmesi için)
    EXECUTE 'DROP POLICY IF EXISTS waiter_ratings_tenant ON waiter_ratings';
    EXECUTE 'DROP POLICY IF EXISTS waiter_ratings_tenant_select ON waiter_ratings';
    EXECUTE 'DROP POLICY IF EXISTS waiter_ratings_tenant_insert ON waiter_ratings';
    
    EXECUTE 'CREATE POLICY waiter_ratings_tenant_select ON waiter_ratings FOR SELECT TO anon, authenticated USING (tenant_id = get_current_tenant_id_logged())';
    EXECUTE 'CREATE POLICY waiter_ratings_tenant_insert ON waiter_ratings FOR INSERT TO anon, authenticated WITH CHECK (true)';

    -- Notifications
    EXECUTE 'DROP POLICY IF EXISTS notifications_tenant ON notifications';
    EXECUTE 'CREATE POLICY notifications_tenant ON notifications FOR ALL USING (tenant_id = get_current_tenant_id_logged())';
END $$;

-- ==========================================
-- 16. INDEXES (Performans)
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_table_calls_tenant ON table_calls(tenant_id);
CREATE INDEX IF NOT EXISTS idx_table_calls_table ON table_calls(table_id);
CREATE INDEX IF NOT EXISTS idx_table_calls_status ON table_calls(status);
CREATE INDEX IF NOT EXISTS idx_table_calls_assigned ON table_calls(assigned_to);

CREATE INDEX IF NOT EXISTS idx_kitchen_orders_tenant ON kitchen_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_kitchen_orders_station ON kitchen_orders(station_id);
CREATE INDEX IF NOT EXISTS idx_kitchen_orders_status ON kitchen_orders(status);
CREATE INDEX IF NOT EXISTS idx_kitchen_orders_table ON kitchen_orders(table_id);
CREATE INDEX IF NOT EXISTS idx_kitchen_orders_group ON kitchen_orders(order_group_id);

CREATE INDEX IF NOT EXISTS idx_kitchen_order_items_order ON kitchen_order_items(kitchen_order_id);
CREATE INDEX IF NOT EXISTS idx_kitchen_stations_tenant ON kitchen_stations(tenant_id);

CREATE INDEX IF NOT EXISTS idx_waiter_ratings_tenant ON waiter_ratings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_waiter_ratings_waiter ON waiter_ratings(waiter_id);

CREATE INDEX IF NOT EXISTS idx_notifications_tenant ON notifications(tenant_id);

-- ==========================================
-- 17. REALTIME YAYINLARI (Pub/Sub Etkinleştirme)
-- Supabase Realtime bu tabloları dinlesin
-- ==========================================
DO $$
BEGIN
    -- Realtime yayınına tabloları ekleme (varsa hata fırlatmasını önlemek için ayrı try block/safe check)
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE table_calls;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE order_groups;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE kitchen_orders;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE kitchen_order_items;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
END $$;

-- ==========================================
-- 17.5. WAITER INITIAL ASSIGNMENT TRIGGER (Queue Routing)
-- ==========================================
CREATE OR REPLACE FUNCTION assign_waiter_to_call()
RETURNS TRIGGER AS $$
DECLARE
    next_waiter UUID;
    next_waiter_name_val TEXT;
    waiter_count INTEGER;
    emp_record RECORD;
BEGIN
    RAISE WARNING 'assign_waiter_to_call trigger fired. table_name: %, tenant_id: %, call_type: %', 
        NEW.table_name, NEW.tenant_id, NEW.call_type;

    -- Sadece atanmamış çağrılar için otomatik atama yap
    IF NEW.assigned_to IS NULL THEN
        -- Log all employees of this tenant to verify their values
        FOR emp_record IN 
            SELECT id, first_name, last_name, role, status, is_online 
            FROM employees 
            WHERE tenant_id = NEW.tenant_id
        LOOP
            RAISE WARNING 'Employee in DB: ID: %, Name: % %, Role: %, Status: %, IsOnline: %',
                emp_record.id, emp_record.first_name, emp_record.last_name, 
                emp_record.role, emp_record.status, emp_record.is_online;
        END LOOP;

        SELECT COUNT(*) INTO waiter_count
        FROM employees
        WHERE tenant_id = NEW.tenant_id
          AND status = 'active'
          AND is_online = true
          AND LOWER(role) = 'waiter';

        RAISE WARNING 'Found % active, online employees with role "waiter" (case-insensitive)', waiter_count;

        SELECT e.id, e.first_name || ' ' || e.last_name
        INTO next_waiter, next_waiter_name_val
        FROM employees e
        WHERE e.tenant_id = NEW.tenant_id
          AND e.status = 'active'
          AND e.is_online = true
          AND LOWER(e.role) = 'waiter' -- Sadece garson rolündekilere ata (case-insensitive)
        ORDER BY 
          -- 1. En az aktif çağrısı olan
          (SELECT COUNT(*) FROM table_calls tc WHERE tc.assigned_to = e.id AND tc.status = 'active') ASC,
          -- 2. Son atama zamanı en eski olan / En uzun süredir boşta olan
          (SELECT COALESCE(MAX(tc.created_at), '1970-01-01'::timestamptz) FROM table_calls tc WHERE tc.assigned_to = e.id) ASC
        LIMIT 1;

        RAISE WARNING 'Selected waiter: ID: %, Name: %', next_waiter, next_waiter_name_val;

        IF next_waiter IS NOT NULL THEN
            NEW.assigned_to := next_waiter;
            NEW.assigned_waiter_name := next_waiter_name_val;
            NEW.escalation_level := 0;
            NEW.escalated_at := NOW();
        END IF;
    ELSE
        RAISE WARNING 'Call already assigned to: % (%)', NEW.assigned_waiter_name, NEW.assigned_to;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_assign_waiter_to_call ON table_calls;
CREATE TRIGGER tr_assign_waiter_to_call
    BEFORE INSERT ON table_calls
    FOR EACH ROW
    EXECUTE FUNCTION assign_waiter_to_call();

-- ==========================================
-- 17.6. TABLE CALL NOTIFICATION TRIGGER
-- ==========================================
CREATE OR REPLACE FUNCTION notify_waiter_on_call()
RETURNS TRIGGER AS $$
BEGIN
    -- İlk atamada veya atanan garson değiştiğinde (veya level arttığında) bildirim gönder
    IF (TG_OP = 'INSERT' AND NEW.assigned_to IS NOT NULL) OR 
       (TG_OP = 'UPDATE' AND NEW.assigned_to IS DISTINCT FROM OLD.assigned_to AND NEW.assigned_to IS NOT NULL) THEN
        
        INSERT INTO notifications (tenant_id, title, message, type, reference_id, target_user_id)
        VALUES (
            NEW.tenant_id,
            'Yeni Çağrı Atandı',
            NEW.table_name || ' numaralı masadan ' || 
            CASE NEW.call_type 
                WHEN 'waiter' THEN 'garson' 
                WHEN 'bill' THEN 'hesap' 
                WHEN 'water' THEN 'su' 
                ELSE 'yardım' 
            END || ' çağrısı.',
            'call',
            NEW.id,
            NEW.assigned_to
        );
    ELSIF (TG_OP = 'UPDATE' AND NEW.escalation_level IS DISTINCT FROM OLD.escalation_level AND NEW.escalation_level = 3 AND NEW.assigned_to IS NULL) THEN
        -- Herkes için acil çağrı (level 3)
        INSERT INTO notifications (tenant_id, title, message, type, reference_id, target_user_id)
        SELECT 
            NEW.tenant_id,
            'Acil Çağrı (Tüm Ekip)',
            NEW.table_name || ' numaralı masanın çağrısı cevaplanmadı!',
            'call',
            NEW.id,
            e.id
        FROM employees e
        WHERE e.tenant_id = NEW.tenant_id 
          AND e.status = 'active' 
          AND e.is_online = true 
          AND LOWER(e.role) = 'waiter';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_notify_waiter_on_call ON table_calls;
CREATE TRIGGER tr_notify_waiter_on_call
    AFTER INSERT OR UPDATE ON table_calls
    FOR EACH ROW
    EXECUTE FUNCTION notify_waiter_on_call();

-- ==========================================
-- 18. WAITER CALL QUEUE — Escalation RPC
-- 15sn cevap yoksa sonraki ONLINE garsona ata
-- ==========================================
CREATE OR REPLACE FUNCTION escalate_unanswered_calls(p_tenant_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    escalated_count INTEGER := 0;
    call_record RECORD;
    next_waiter UUID;
    next_waiter_name_val TEXT;
    all_waiters UUID[];
BEGIN
    -- Aktif ve ONLINE garsonları bul
    SELECT ARRAY_AGG(id) INTO all_waiters
    FROM employees
    WHERE tenant_id = p_tenant_id
      AND status = 'active'
      AND is_online = true;

    IF all_waiters IS NULL OR array_length(all_waiters, 1) = 0 THEN
        RETURN 0;
    END IF;

    -- Cevapsız çağrıları bul (15 saniyeden fazla bekleyen)
    FOR call_record IN
        SELECT *
        FROM table_calls
        WHERE tenant_id = p_tenant_id
          AND status = 'active'
          AND (
              (escalation_level = 0 AND created_at < NOW() - INTERVAL '15 seconds')
              OR
              (escalation_level = 1 AND escalated_at < NOW() - INTERVAL '15 seconds')
          )
    LOOP
        IF call_record.escalation_level < 2 THEN
            -- Bir sonraki garsonu seç (adil yük sırasına göre)
            SELECT e.id, e.first_name || ' ' || e.last_name
            INTO next_waiter, next_waiter_name_val
            FROM employees e
            WHERE e.tenant_id = p_tenant_id
              AND e.status = 'active'
              AND e.is_online = true
              AND e.id != COALESCE(call_record.assigned_to, '00000000-0000-0000-0000-000000000000'::uuid)
            ORDER BY 
              (SELECT COUNT(*) FROM table_calls tc WHERE tc.assigned_to = e.id AND tc.status = 'active') ASC,
              (SELECT COALESCE(MAX(tc.created_at), '1970-01-01'::timestamptz) FROM table_calls tc WHERE tc.assigned_to = e.id) ASC
            LIMIT 1;

            IF next_waiter IS NOT NULL THEN
                UPDATE table_calls
                SET assigned_to = next_waiter,
                    assigned_waiter_name = next_waiter_name_val,
                    escalation_level = call_record.escalation_level + 1,
                    escalated_at = NOW()
                WHERE id = call_record.id;
                
                escalated_count := escalated_count + 1;
            END IF;
        ELSE
            -- Level 2: Tüm garsonlara yayınla (assigned_to = NULL → herkes görecek)
            UPDATE table_calls
            SET assigned_to = NULL,
                assigned_waiter_name = 'TÜM GARSONLAR',
                escalation_level = 3,
                escalated_at = NOW()
            WHERE id = call_record.id;
            
            escalated_count := escalated_count + 1;
        END IF;
    END LOOP;

    RETURN escalated_count;
END;
$$;

GRANT EXECUTE ON FUNCTION escalate_unanswered_calls(UUID) TO anon;
GRANT EXECUTE ON FUNCTION escalate_unanswered_calls(UUID) TO authenticated;

-- ==========================================
-- 19. GARSON PERFORMANS SKORU RPC
-- ==========================================
CREATE OR REPLACE FUNCTION get_waiter_performance(p_tenant_id UUID, p_waiter_id UUID, p_days INTEGER DEFAULT 30)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    total_orders INTEGER;
    avg_prep_time NUMERIC;
    avg_response_time NUMERIC;
    avg_rating NUMERIC;
    total_tips NUMERIC;
BEGIN
    -- Sipariş sayısı
    SELECT COUNT(*) INTO total_orders
    FROM kitchen_orders
    WHERE tenant_id = p_tenant_id AND waiter_id = p_waiter_id
      AND created_at > NOW() - (p_days || ' days')::interval;

    -- Ortalama hazırlanma süresi (dakika)
    SELECT AVG(EXTRACT(EPOCH FROM (ready_at - created_at)) / 60) INTO avg_prep_time
    FROM kitchen_orders
    WHERE tenant_id = p_tenant_id AND waiter_id = p_waiter_id
      AND ready_at IS NOT NULL
      AND created_at > NOW() - (p_days || ' days')::interval;

    -- Ortalama çağrı cevap süresi (saniye)
    SELECT AVG(EXTRACT(EPOCH FROM (accepted_at - created_at))) INTO avg_response_time
    FROM table_calls
    WHERE tenant_id = p_tenant_id AND assigned_to = p_waiter_id
      AND accepted_at IS NOT NULL
      AND created_at > NOW() - (p_days || ' days')::interval;

    -- Ortalama puan
    SELECT AVG(rating) INTO avg_rating
    FROM waiter_ratings
    WHERE tenant_id = p_tenant_id AND waiter_id = p_waiter_id
      AND created_at > NOW() - (p_days || ' days')::interval;

    -- Toplam bahşiş
    SELECT COALESCE(SUM(tip_amount), 0) INTO total_tips
    FROM waiter_ratings
    WHERE tenant_id = p_tenant_id AND waiter_id = p_waiter_id
      AND created_at > NOW() - (p_days || ' days')::interval;

    result := json_build_object(
        'total_orders', COALESCE(total_orders, 0),
        'avg_prep_time_min', ROUND(COALESCE(avg_prep_time, 0)::numeric, 1),
        'avg_response_time_sec', ROUND(COALESCE(avg_response_time, 0)::numeric, 1),
        'avg_rating', ROUND(COALESCE(avg_rating, 0)::numeric, 1),
        'total_tips', COALESCE(total_tips, 0),
        'performance_score', ROUND(
            (COALESCE(avg_rating, 3) * 20) +  -- Rating 20%
            (LEAST(COALESCE(total_orders, 0), 100)) +   -- Sipariş sayısı 100%
            (CASE WHEN COALESCE(avg_response_time, 999) < 30 THEN 20
                  WHEN COALESCE(avg_response_time, 999) < 60 THEN 10
                  ELSE 0 END)  -- Hızlı cevap bonusu
        )
    );

    RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_waiter_performance(UUID, UUID, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION get_waiter_performance(UUID, UUID, INTEGER) TO authenticated;

-- ==========================================
-- 19.5. PIN ATTEMPTS RATE LIMIT LOGS
-- ==========================================
CREATE TABLE IF NOT EXISTS employee_pin_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    ip_address TEXT,
    attempted_at TIMESTAMPTZ DEFAULT NOW(),
    is_success BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_pin_attempts_ip ON employee_pin_attempts(ip_address, attempted_at);
CREATE INDEX IF NOT EXISTS idx_pin_attempts_tenant ON employee_pin_attempts(tenant_id, attempted_at);

-- IP resolver helper
CREATE OR REPLACE FUNCTION get_request_ip()
RETURNS TEXT AS $$
BEGIN
    RETURN COALESCE(
        current_setting('request.headers', true)::json->>'x-forwarded-for',
        current_setting('request.headers', true)::json->>'x-real-ip',
        'unknown'
    );
EXCEPTION WHEN OTHERS THEN
    RETURN 'unknown';
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 20. VERIFY EMPLOYEE PIN RPC (With Role, Bcrypt & Rate Limiting)
-- ==========================================
CREATE OR REPLACE FUNCTION verify_employee_pin(p_tenant_id UUID, p_pin_code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_employee RECORD;
    v_failed_attempts INTEGER;
    v_ip TEXT;
BEGIN
    v_ip := get_request_ip();
    
    -- Son 5 dakikadaki başarısız denemeleri say (5 yanlış PIN -> 5 dk kilit)
    SELECT COUNT(*) INTO v_failed_attempts
    FROM employee_pin_attempts
    WHERE tenant_id = p_tenant_id
      AND ip_address = v_ip
      AND is_success = false
      AND attempted_at > NOW() - INTERVAL '5 minutes';

    IF v_failed_attempts >= 5 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Çok fazla hatalı deneme! Lütfen 5 dakika sonra tekrar deneyin.',
            'locked', true
        );
    END IF;

    -- Bcrypt doğrulama (pin_hash = crypt(p_pin_code, pin_hash))
    SELECT * INTO v_employee 
    FROM employees 
    WHERE tenant_id = p_tenant_id 
      AND pin_hash = crypt(p_pin_code, pin_hash) 
      AND status = 'active'
    LIMIT 1;

    IF v_employee.id IS NOT NULL THEN
        -- Başarılı deneme logu
        INSERT INTO employee_pin_attempts (tenant_id, ip_address, is_success)
        VALUES (p_tenant_id, v_ip, true);

        -- Set employee as online when they login
        UPDATE employees 
        SET is_online = true, 
            last_seen = NOW() 
        WHERE id = v_employee.id;

        RETURN json_build_object(
            'success', true,
            'employee', json_build_object(
                'id', v_employee.id,
                'name', v_employee.first_name || ' ' || v_employee.last_name,
                'position', v_employee.position,
                'role', COALESCE(v_employee.role, v_employee.position, 'Waiter'),
                'permissions', COALESCE(v_employee.permissions, '{
                    "can_access_pos": true,
                    "can_access_adisyon": true,
                    "can_access_reports": false,
                    "can_access_settings": false,
                    "can_access_inventory": true,
                    "can_access_expenses": false,
                    "can_access_crm": false,
                    "can_manage_employees": false,
                    "can_apply_discount": false,
                    "can_delete_sales": false
                }'::jsonb)
            )
        );
    ELSE
        -- Başarısız deneme logu
        INSERT INTO employee_pin_attempts (tenant_id, ip_address, is_success)
        VALUES (p_tenant_id, v_ip, false);

        RETURN json_build_object('success', false, 'message', 'Geçersiz PIN kodu');
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION verify_employee_pin(UUID, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION verify_employee_pin(UUID, TEXT) TO authenticated;

-- ==========================================
-- 21. VERIFY STATION PIN RPC (Bcrypt & Rate Limiting)
-- ==========================================
CREATE OR REPLACE FUNCTION verify_station_pin(p_tenant_id UUID, p_station_id UUID, p_pin_code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_station RECORD;
    v_failed_attempts INTEGER;
    v_ip TEXT;
BEGIN
    v_ip := get_request_ip();
    
    -- Son 5 dakikadaki başarısız denemeleri say (5 yanlış PIN -> 5 dk kilit)
    SELECT COUNT(*) INTO v_failed_attempts
    FROM employee_pin_attempts
    WHERE tenant_id = p_tenant_id
      AND ip_address = v_ip
      AND is_success = false
      AND attempted_at > NOW() - INTERVAL '5 minutes';

    IF v_failed_attempts >= 5 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Çok fazla hatalı deneme! Lütfen 5 dakika sonra tekrar deneyin.',
            'locked', true
        );
    END IF;

    -- Bcrypt doğrulama (pin_hash = crypt(p_pin_code, pin_hash))
    SELECT * INTO v_station 
    FROM kitchen_stations 
    WHERE tenant_id = p_tenant_id 
      AND id = p_station_id 
      AND pin_hash = crypt(p_pin_code, pin_hash) 
      AND is_active = true
    LIMIT 1;

    IF v_station.id IS NOT NULL THEN
        -- Başarılı deneme logu
        INSERT INTO employee_pin_attempts (tenant_id, ip_address, is_success)
        VALUES (p_tenant_id, v_ip, true);

        RETURN json_build_object(
            'success', true,
            'station', json_build_object(
                'id', v_station.id,
                'name', v_station.name,
                'code', v_station.code
            )
        );
    ELSE
        -- Başarısız deneme logu
        INSERT INTO employee_pin_attempts (tenant_id, ip_address, is_success)
        VALUES (p_tenant_id, v_ip, false);

        RETURN json_build_object('success', false, 'message', 'Geçersiz İstasyon PIN kodu');
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION verify_station_pin(UUID, UUID, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION verify_station_pin(UUID, UUID, TEXT) TO authenticated;

-- ==========================================
-- 22. CRON SCHEDULER SETUP (pg_cron)
-- Loop through all tenants and escalate every minute
-- ==========================================
DO $$
BEGIN
    -- Enable pg_cron if possible
    CREATE EXTENSION IF NOT EXISTS pg_cron;
    
    -- Schedule the job (unschedule first if exists to prevent duplicates)
    PERFORM cron.unschedule('escalate-waiter-calls-job');
    PERFORM cron.schedule(
        'escalate-waiter-calls-job',
        '* * * * *', -- Every minute
        'SELECT public.escalate_unanswered_calls(id) FROM public.tenants;'
    );
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron is not enabled or available in this environment. Please schedule escalate_unanswered_calls(tenant_id) externally via Edge Functions or Vercel Cron.';
END $$;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
