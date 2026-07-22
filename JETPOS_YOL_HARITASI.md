# JetPos — Ana Yol Haritası ve Durum

**Son güncelleme:** 20 Temmuz 2026
**Amaç:** Tüm işlerin tek yerden takibi. "Nerede kaldık, ne bitti, ne bekliyor." Detaylar ayrı plan dosyalarında; bu belge onları bağlayan indeks + durum panosu.

---

## 0. Detaylı plan dosyaları (indeks)

| Dosya | Konu |
|---|---|
| `DOMAIN_GECIS_PLANI.md` | Vercel → jetpos.shop domain geçişi |
| `YONETICI_GUVENLIK_PLANI.md` | admin.jetpos.shop güvenlik sertleştirme (zero-trust) |
| `ADISYON_DOMAIN_PLANI.md` | garson/mutfak rol subdomain'leri |
| `MOBIL_YETKI_PLANI.md` | Mobil çalışan PIN + yetki katmanı |
| `MOBIL_EKSIK_OZELLIKLER.md` | Client'ta olup mobilde olmayan özellikler |
| `TERAZI_ENTEGRASYON_PLANI.md` | Terazi/tartı entegrasyonu (barkodlu + kasa terazisi) |
| `PATRON_PERSONEL_PLANI.md` | Patron paneli + lisanssız personel girişi |
| **`JETPOS_YOL_HARITASI.md`** | **(bu belge) ana durum panosu** |

---

## 1. ⚡ ÖNCE YAPILACAK — senin elinde bekleyen işlemler

Bunlar kod değil, senin panellerden yapman gerekenler. Kodun çalışması bunlara bağlı.

### Supabase — çalıştırılacak YENİ migration'lar
Son oturumda eklenenler (önceki "hepsini yaptım" dediklerinden SONRA geldiler):

- [ ] `supabase/migrations/20260720_yemeksepeti.sql` — Yemeksepeti sipariş tablosu
- [ ] `supabase/migrations/20260720_refund_pos_invoice.sql` — mobil satış iadesi (stok geri ekleme)
- [ ] `supabase/migrations/20260720_staff_code.sql` — işletme kodu (lisanssız personel girişi)

### Vercel — ortam değişkenleri
- [ ] **jetpos-mobile** projesine `SUPABASE_SERVICE_ROLE_KEY` — **kritik**: PIN, personel girişi ve Ödeal bunsuz çalışmaz
- [ ] client projesine `ADMIN_SECRET_TOKEN` (yeni yönetici anahtarı) — süper admin API kısa devresi için

### Deploy
- [ ] `git push` (tüm son commit'ler bekliyor)
- [ ] jetpos-web + jetpos-mobile Vercel projeleri deploy
- [ ] Domainler: `beta` (jetpos-web), `mobile`/`garson`/`mutfak`/`patron` (jetpos-mobile)

### Diğer
- [ ] GitHub token'ını yenile (git config'de açıkta) — güvenlik
- [ ] Yemeksepeti başvurusu maili gönderildi → kimlik gelince entegrasyon aktifleşecek

---

## 2. ✅ TAMAMLANAN İŞLER

### Ödeal (kartlı ödeme)
- Client'ta kartlı ödeme canlı ortamda çalışıyor (pilot: Kardeşler Kasap) ✅
- Ödeme sonucu realtime broadcast + yedek poll (hızlı + dayanıklı) ✅
- Mobil POS'a Ödeal kartlı ödeme eklendi ✅
- Canlı debug logları temizlendi (secret sızıntısı kapandı) ✅
- **Açık:** e-Arşiv/bilgi fişi sorusu Ödeal'e soruldu (VKN eksik olabilir), yanıt bekleniyor

### Yemek/teslimat entegrasyonları
- Trendyol Yemek + Uber Eats (TGO, tek bağlantı) ✅
- Getir Yemek + Getir Çarşı ✅
- Trendyol Pazaryeri + GO (ayrı sayfalar) ✅
- Yemeksepeti çekirdek kod (webhook + order-action + bildirim) ✅ — kimlik bekliyor
- Her iki app'te yeni sipariş bildirimi ✅

### Domain / altyapı
- `admin.jetpos.shop` yayında, süper admin paneli oraya taşındı ✅
- `app.jetpos.shop` yayında (POS) ✅
- API tabanı aynı-origin yapıldı (domain geçişinde CORS kırılması engellendi) ✅

### Güvenlik
- Süper admin anahtarı istemci paketinden çıkarıldı + DB'de is_super_admin ✅
- Eski anahtar rotasyonu (SQL) ✅
- Lisans girişine hız sınırı + kilitleme (3 uygulama) ✅
- Login RPC'lerinin anon izni kaldırıldı ✅
- Admin host'a katı güvenlik başlıkları ✅

### Mobil (jetpos-mobile)
- Giriş ekranı client ile aynı tasarım + grid arka plan + akan yazılar + responsive ✅
- Giriş: lisans + **şifre** iki adımlı (eskiden sadece lisans yetiyordu — açık kapatıldı) ✅
- POS ürün listesi düzeltildi (status filtresi ürünleri gizliyordu) ✅
- **Çalışan PIN + yetki sistemi** (9 sayfa korumalı, menü filtreleme) ✅
- **Satış geçmişi + iade** (stok geri ekleme, yetkiyle) ✅
- **Adisyon:** garson kimliği global PIN'le birleşti + açık masa claim + devralma onayı ✅

### Personel sistemi — 1. dilim
- İşletme kodu (staff_code) altyapısı: lisanssız personel girişi ✅
- `/api/auth/staff-login` (kod + PIN birlikte) ✅
- Personel giriş ekranı (kod bir kez, sonra PIN) ✅

---

## 3. 🔜 DEVAM EDEN — Personel & Patron sistemi (kalan dilimler)

Detay: `PATRON_PERSONEL_PLANI.md`

- [x] **1. dilim** — lisanssız giriş (işletme kodu + PIN) ✅
- [ ] **2. dilim** — rol host modları: `garson`/`mutfak`/`patron` subdomain + dinamik manifest
- [ ] **3. dilim** — patron paneli canlı özet (ciro, kasa, masa, mutfak, yemek, online personel)
- [ ] **4. dilim** — personel yönetimi (patron panelinden ekle/düzenle/PIN/rol/yetki) ← **sıradaki mantıklı adım**
- [ ] **5. dilim** — personel performansı (garson: kaç masa, ciro, süre, müşteri — tasarımlı kartlar+grafik)
- [ ] **6. dilim** — aynı patron paneli + personel yönetimi client (masaüstü) sidebar'a
- [ ] **7. dilim** — doğrulama + gerçek cihaz testi

**Karar bekleyen:** İşletme kodu modeli (device provisioning) yeterli mi, yoksa personel telefonu için "sunucu-aracılı" sıkı model mi? (Bkz. `PATRON_PERSONEL_PLANI.md §6`)

---

## 4. 🔜 BEKLEYEN DİĞER İŞLER

### Yemeksepeti (dış kimlik bekliyor)
- [ ] Partner API kimliği (client_id/secret/chain_id) gelince: SuperAdmin formu + widget + sidebar
- Kod hazır, sadece kimlik + test vendor lazım

### Terazi entegrasyonu (barkod fotoğrafı bekliyor)
Detay: `TERAZI_ENTEGRASYON_PLANI.md`
- [ ] Pilot terazinin markası + barkod fotoğrafı → format netleşince Faz 1
- [ ] Faz 1: PLU alanı + barkod ayrıştırıcı + POS'a bağla (ağırlık gömülü barkod → hızlı satış)
- [ ] Ödeal kg birim kodu (C62→KGM) düzeltmesi — kg ürün fişte "adet" çıkıyor

### Mobil eksik özellikler (öncelik sırası)
Detay: `MOBIL_EKSIK_OZELLIKLER.md`
- [x] Ödeal kartlı ödeme ✅
- [x] Çalışan PIN + yetki ✅
- [x] Satış geçmişi + iade ✅
- [ ] Gider girişi
- [ ] Tahsilat girişi (cari/kasa)
- [ ] Satış faturası / sevk irsaliyesi (işletme tipine göre)

### Domain geçişi (tam)
Detay: `DOMAIN_GECIS_PLANI.md`
- [x] admin + app yayında ✅
- [ ] jetpos.shop apex → jetpos-web (tanıtım sitesi deploy olunca)
- [ ] Eski `vercel.app` adresini min. 6 ay açık tut

### Yönetici güvenliği (ileri)
Detay: `YONETICI_GUVENLIK_PLANI.md`
- [ ] Yönetici oturum süresi + denetim izi
- [ ] 2FA (TOTP) — bu ay hedefi
- [ ] openrouter_api_key'i sunucuya taşı (istemciye inmesin)

### İleride (ürün oturunca)
- [ ] JetPos kendi API'sini verme (önce API anahtar sistemi) — şimdilik erken
- [ ] App Store / Play Store — şimdilik PWA yeterli, 6-12 ay sonra değerlendir

---

## 5. Nereden devam edilecek

**Bir sonraki oturumda önerilen sıra:**

1. Senin bekleyen işlemler (§1) — özellikle mobil `SUPABASE_SERVICE_ROLE_KEY` + 3 migration
2. Personel sistemi **4. dilim** (personel oluşturma/PIN verme) — patron garsonları yaratabilsin ki giriş test edilebilsin
3. Sonra **3. dilim** (patron paneli özet) ve **5. dilim** (performans)
4. Paralelde: Yemeksepeti kimliği ya da terazi barkodu gelirse o hat ilerler

**Test edilmesi gerekenler (gerçek cihaz):**
- Mobil çalışan PIN akışı (employee_login özelliği açık bir işletmede)
- Adisyon masa claim / devralma (iki garson aynı anda)
- Mobil Ödeal kartlı ödeme
- Satış geçmişi + iade
