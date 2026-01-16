-- ===========================================
-- EKSİK TENANT_ID KOLONLARINI EKLE
-- ===========================================

-- cari_adresler'e tenant_id ekle
ALTER TABLE cari_adresler 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- cari_bankalar'a tenant_id ekle
ALTER TABLE cari_bankalar 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- cari_ilgililer'e tenant_id ekle
ALTER TABLE cari_ilgililer 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Mevcut kayıtlar için tenant_id güncelle (eğer varsa)
-- cari_hesaplar'dan cari_id üzerinden tenant_id al
UPDATE cari_adresler a
SET tenant_id = h.tenant_id
FROM cari_hesaplar h
WHERE a.cari_id = h.id AND a.tenant_id IS NULL;

UPDATE cari_bankalar b
SET tenant_id = h.tenant_id
FROM cari_hesaplar h
WHERE b.cari_id = h.id AND b.tenant_id IS NULL;

UPDATE cari_ilgililer i
SET tenant_id = h.tenant_id
FROM cari_hesaplar h
WHERE i.cari_id = h.id AND i.tenant_id IS NULL;
