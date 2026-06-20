-- ===========================================
-- CARİ HESAPLAR - EK ALANLAR (Tab 2, 3, 4 için)
-- ===========================================

-- Tab 2: Adres ve İlgililer - Ana cari tablosuna ek alanlar
DO $$
BEGIN
    -- Telefon bilgileri
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cari_hesaplar' AND column_name='tel_1') THEN
        ALTER TABLE cari_hesaplar ADD COLUMN tel_1 VARCHAR(20);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cari_hesaplar' AND column_name='tel_2') THEN
        ALTER TABLE cari_hesaplar ADD COLUMN tel_2 VARCHAR(20);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cari_hesaplar' AND column_name='cep_tel') THEN
        ALTER TABLE cari_hesaplar ADD COLUMN cep_tel VARCHAR(20);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cari_hesaplar' AND column_name='fax') THEN
        ALTER TABLE cari_hesaplar ADD COLUMN fax VARCHAR(20);
    END IF;
    -- Adres bilgileri
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cari_hesaplar' AND column_name='adres') THEN
        ALTER TABLE cari_hesaplar ADD COLUMN adres TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cari_hesaplar' AND column_name='adres_2') THEN
        ALTER TABLE cari_hesaplar ADD COLUMN adres_2 TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cari_hesaplar' AND column_name='il') THEN
        ALTER TABLE cari_hesaplar ADD COLUMN il VARCHAR(50);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cari_hesaplar' AND column_name='ilce') THEN
        ALTER TABLE cari_hesaplar ADD COLUMN ilce VARCHAR(50);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cari_hesaplar' AND column_name='posta_kodu') THEN
        ALTER TABLE cari_hesaplar ADD COLUMN posta_kodu VARCHAR(10);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cari_hesaplar' AND column_name='ulke') THEN
        ALTER TABLE cari_hesaplar ADD COLUMN ulke VARCHAR(50) DEFAULT 'Türkiye';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cari_hesaplar' AND column_name='email_2') THEN
        ALTER TABLE cari_hesaplar ADD COLUMN email_2 VARCHAR(255);
    END IF;

    -- Tab 3: Bankalar ve Notlar - Notlar alanı
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cari_hesaplar' AND column_name='notlar') THEN
        ALTER TABLE cari_hesaplar ADD COLUMN notlar TEXT;
    END IF;

    -- Tab 4: Kimlik Bilgileri
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cari_hesaplar' AND column_name='tc_kimlik_no') THEN
        ALTER TABLE cari_hesaplar ADD COLUMN tc_kimlik_no VARCHAR(11);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cari_hesaplar' AND column_name='dogum_tarihi') THEN
        ALTER TABLE cari_hesaplar ADD COLUMN dogum_tarihi DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cari_hesaplar' AND column_name='dogum_yeri') THEN
        ALTER TABLE cari_hesaplar ADD COLUMN dogum_yeri VARCHAR(100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cari_hesaplar' AND column_name='baba_adi') THEN
        ALTER TABLE cari_hesaplar ADD COLUMN baba_adi VARCHAR(100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cari_hesaplar' AND column_name='anne_adi') THEN
        ALTER TABLE cari_hesaplar ADD COLUMN anne_adi VARCHAR(100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cari_hesaplar' AND column_name='uyruk') THEN
        ALTER TABLE cari_hesaplar ADD COLUMN uyruk VARCHAR(50) DEFAULT 'T.C.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cari_hesaplar' AND column_name='cinsiyet') THEN
        ALTER TABLE cari_hesaplar ADD COLUMN cinsiyet VARCHAR(10);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cari_hesaplar' AND column_name='medeni_hal') THEN
        ALTER TABLE cari_hesaplar ADD COLUMN medeni_hal VARCHAR(20);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cari_hesaplar' AND column_name='ehliyet_no') THEN
        ALTER TABLE cari_hesaplar ADD COLUMN ehliyet_no VARCHAR(20);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cari_hesaplar' AND column_name='pasaport_no') THEN
        ALTER TABLE cari_hesaplar ADD COLUMN pasaport_no VARCHAR(20);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cari_hesaplar' AND column_name='ticaret_sicil_no') THEN
        ALTER TABLE cari_hesaplar ADD COLUMN ticaret_sicil_no VARCHAR(50);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cari_hesaplar' AND column_name='mersis_no') THEN
        ALTER TABLE cari_hesaplar ADD COLUMN mersis_no VARCHAR(20);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cari_hesaplar' AND column_name='kep_adresi') THEN
        ALTER TABLE cari_hesaplar ADD COLUMN kep_adresi VARCHAR(255);
    END IF;

    RAISE NOTICE 'Cari hesaplar tab alanları başarıyla eklendi.';
END $$;
