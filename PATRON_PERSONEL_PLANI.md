# JetPos — Patron Paneli + Personel Sistemi Planı

**Tarih:** 20 Temmuz 2026
**Kapsam:** Patron paneli (gözetim + personel yönetimi + performans), lisanssız personel girişi, garson/mutfak rol modları — mobil + client
**Kullanım:** Büyük restoranlar; patron personel oluşturur, PIN verir; garson/mutfak lisans girmeden sisteme girer

---

## 1. Çözülmesi gereken asıl problem: lisanssız giriş

Bugün her cihaz **lisans anahtarı + tenant_id** ile kimlik kanıtlıyor (RLS bu header'larla çalışıyor). Ama lisans **gizli** — patron onu her garsona veremez. Peki garson lisans girmeden cihaz hangi işletme olduğunu nasıl bilecek?

**Çözüm: İşletme Kodu (Staff Code) — lisanstan ayrı, paylaşılabilir, iptal edilebilir.**

- Her işletmenin kısa bir **İşletme Kodu**'su olur (örn. `KASAP-4827`). Patron panelinde görünür.
- Bu kod **gizli lisans değil** — personele verilebilir, sızarsa patron tek tıkla yeniler.
- Personel cihazı bu kodla işletmeye **bir kez** bağlanır; sonra sadece PIN girer.

### Giriş akışı (garson örneği)

```
garson.jetpos.shop  (personelin telefonu / restoran tableti)
   │
   ├─ Cihaz daha önce bağlanmamışsa:
   │     "İşletme Kodu girin" → KASAP-4827 → cihaz o işletmeye bağlanır
   │
   └─ Bağlıysa (sonraki her açılış):
         PIN tuş takımı → garson numarası/PIN → sisteme girer
```

Yani garson **lisansı hiç görmez** — sadece kısa işletme kodunu (bir kez) ve kendi PIN'ini girer. Mutfak da aynı: patron mutfak personeli oluşturur, PIN verir; mutfak cihazı işletme koduyla bağlanır, PIN'le girer, doğrudan KDS'e düşer.

### Güvenlik notu (dürüst)

Bu **"cihaz sağlama" (device provisioning)** modeli — Square, Toast gibi POS'ların yaptığı. İşletme kodu doğrulanınca cihaza tenant erişimi verilir. Restoranın **kendi tableti** için ideal. Personelin kendi telefonu için ileride "sunucu-aracılı" (cihaz lisansı hiç tutmaz) daha sıkı bir model kurulabilir; ama ilk sürüm için işletme kodu modeli hem yeterli hem standart. İşletme kodu iptal edilebilir olduğu için sızıntı yönetilebilir.

---

## 2. Personel oluşturma (patron panelinden)

Patron panelinde "Personel" bölümü:

- **Personel ekle:** ad, rol (Garson / Mutfak / Kasiyer / Müdür), PIN (4-6 hane), yetkiler
- **PIN ver / değiştir:** bcrypt'le saklanır (zaten var: `verify_employee_pin`)
- **Yetki matrisi:** hangi bölümlere erişebilir (mevcut `can_access_*` sistemi)
- **Aktif/pasif:** işten ayrılanı pasife çek (PIN'i geçersizleşir)
- **Rol → varsayılan yetki:** Garson = adisyon+pos; Mutfak = sadece KDS; Müdür = hepsi

Bu, client'taki `EmployeeManager.tsx`'in mobil/patron karşılığı — aynı `employees` tablosu, aynı RPC.

---

## 3. Patron paneli — gözetim ekranı

Patron'un "işletmem nasıl gidiyor?" ekranı. Operasyon değil, **kuş bakışı**.

### Canlı durum
- Bugünkü ciro (+ düne göre %)
- Kasa/banka bakiye özeti
- Aktif masa sayısı (kaç dolu / boş) + hangi garsonda
- Mutfak kuyruğu (kaç sipariş bekliyor)
- Canlı yemek siparişleri (Getir / Trendyol / Yemeksepeti)
- Online personel (kim çalışıyor)

### Personel performansı (tenant verisinden)
Sorunun tam karşılığı — "garson ne kadar çalışmış, kaç masaya bakmış, kaç müşteri gelmiş":

| Metrik | Kaynak |
|---|---|
| Garson başına baktığı masa sayısı | `order_groups.waiter_id` say |
| Garson başına ciro | `order_groups` → satış toplamı |
| Aktif çalışma süresi | `employees.last_seen` / online süre |
| Garson başına sipariş adedi | `table_orders` / `kitchen_orders` |
| Toplam müşteri/masa devri | `restaurant_tables.occupied_at` döngüsü |
| Bahşiş/puan (varsa) | `waiter_ratings` (tabloda mevcut) |

Güzel tasarımlı kartlar + basit grafikler (günlük/haftalık).

---

## 4. Yerleşim: subdomain mi, sekme mi?

| | Mobil | Client (masaüstü) |
|---|---|---|
| **Patron** | `patron.jetpos.shop` (ayrı PWA ikonu) | Sidebar'da "Patron Paneli" ekranı |
| **Garson** | `garson.jetpos.shop` | (masaüstünde zaten adisyon var) |
| **Mutfak** | `mutfak.jetpos.shop` | (masaüstünde zaten KDS var) |

Mobilde subdomain = ayrı PWA kimliği (patron telefonuna "JetPatron" olarak kurar). Masaüstü tek pencere olduğu için orada subdomain yok — sekme/ekran olarak eklenir.

**Erişim kilidi:** Patron paneli yalnızca **owner/müdür rolü** ya da **master PIN** ile açılır.

---

## 5. Build sırası (dilimler)

Her dilim ayrı commit, ayrı test edilebilir.

| # | Dilim | İçerik | Durum |
|---|---|---|---|
| 1 | **İşletme kodu + lisanssız giriş** | `tenants.staff_code` migration, resolver RPC, `/api/auth/staff-login`, garson/mutfak giriş ekranı (kod→bağla, sonra PIN) | ▶ önce bu |
| 2 | **Rol host modları** | `role-host.ts` (garson/mutfak/patron), dinamik manifest, Vercel domainleri | |
| 3 | **Patron paneli — canlı özet** | Ciro, kasa, masa, mutfak, yemek, online personel kartları | |
| 4 | **Personel yönetimi** | Ekle/düzenle/PIN/rol/yetki (patron panelinden) | |
| 5 | **Personel performansı** | Garson metrikleri, tasarımlı kartlar + grafik | |
| 6 | **Client entegrasyonu** | Aynı patron paneli + personel yönetimi masaüstü sidebar'da | |
| 7 | **Doğrulama** | tsc + gerçek cihaz akış testi | |

**1. dilim linchpin** — o olmadan personel giremez, gerisi anlamsız. Ondan başlıyorum.

---

## 6. Karar bekleyen (sonra netleşir)

1. Garson girişi: sadece PIN mi, yoksa "garson numarası + PIN" (iki kademeli) mi? (Önerim: bağlı cihazda sadece PIN — hızlı.)
2. Mutfak: tek ekran mı, çoklu istasyon mu (sıcak/soğuk/bar)? (`station_id` zaten var.)
3. Patron paneli çok şubeli işletmede tüm şubeleri mi, tek şubeyi mi gösterecek?

Bunlar 3-5. dilimlerde netleşir; 1-2. dilim bunlardan bağımsız.
