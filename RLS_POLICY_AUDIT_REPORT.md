# RLS POLICY AUDIT RAPORU
**Tarih:** 2026-01-22  
**Analiz Edilen Konu:** Row-Level Security WITH CHECK clause eksikliği

## 🔴 SORUNLU TABLOLAR (WITH CHECK Eksik)

### 1. Kasa İşlemleri ❌
- `kasa_tanimlari` - **FOR ALL** ama WITH CHECK yok
- `odalar` - **FOR ALL** ama WITH CHECK yok  
- `kasa_fisleri` - **FOR ALL** ama WITH CHECK yok
- `kasa_fis_satirlari` - **FOR ALL** ama WITH CHECK yok

**Dosya:** `kasa_ve_odalar_setup.sql`  
**Fix Dosyası:** `fix_kasa_rls_policies.sql` ✅ Hazır

### 2. Banka Fişleri ❌
- `banka_fisleri` - **FOR ALL** ama WITH CHECK yok
- `banka_fis_satirlari` - **FOR ALL** ama WITH CHECK yok

**Dosya:** `banka_fis_setup.sql`  
**Fix Dosyası:** `fix_banka_fis_rls.sql` ✅ Hazır

## ✅ DOĞRU YAPILMIŞ TABLOLAR

### 1. Banka Tanımları ✅
- `bankalar` - WITH CHECK var
- `banka_hareketleri` - WITH CHECK var

**Dosya:** `banka_islemleri_setup.sql`

### 2. Cari İşlemler ✅
- `cari_hesaplar` - WITH CHECK var
- `cari_hareketler` - WITH CHECK var
- `cari_ilgililer` - WITH CHECK var
- `cari_bankalar` - WITH CHECK var
- `cari_adresler` - WITH CHECK var
- `cari_gruplar` - WITH CHECK var
- `cari_ozel_kodlar` - WITH CHECK var

**Dosya:** `cari_part3_rls.sql`

## 📝 YAPILMASI GEREKENLER

1. **Supabase Dashboard'a git**
2. **SQL Editor'ü aç**
3. **Sırayla şu dosyaları çalıştır:**
   - ✅ `fix_kasa_rls_policies.sql`
   - ✅ `fix_banka_fis_rls.sql`

## 🔍 SORUNUN NEDENİ

RLS policy'lerinde:
```sql
CREATE POLICY "policy_name" ON table_name
    FOR ALL 
    USING (tenant_id = ...)  -- ✅ SELECT, UPDATE, DELETE için yeterli
    -- ❌ INSERT için WITH CHECK gerekli!
```

**Doğru kullanım:**
```sql
CREATE POLICY "policy_name" ON table_name
    FOR ALL 
    USING (tenant_id = ...)
    WITH CHECK (tenant_id = ...)  -- ✅ INSERT için gerekli
```

## 📊 ÖZET

| Tablo Grubu | Durum | Fix |
|-------------|-------|-----|
| Kasa İşlemleri | ❌ Sorunlu | fix_kasa_rls_policies.sql |
| Banka Fişleri | ❌ Sorunlu | fix_banka_fis_rls.sql |
| Banka Tanımları | ✅ İyi | - |
| Cari İşlemler | ✅ İyi | - |

---
**Toplam Sorunlu Tablo:** 6  
**Hazırlanan Fix Dosyası:** 2  
**Durum:** Migration dosyaları hazır, SQL çalıştırılmayı bekliyor
