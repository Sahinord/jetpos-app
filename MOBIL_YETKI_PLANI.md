# JetPos Mobile — Çalışan Girişi ve Yetki Katmanı Planı

**Tarih:** 20 Temmuz 2026
**Kapsam:** jetpos-mobile'da çalışan kimliği, PIN girişi ve sayfa bazlı yetkilendirme
**Bağımlılık:** Bu katman, `garson.jetpos.shop` / `mutfak.jetpos.shop` rol modlarının üzerine oturacağı temeldir (bkz. `ADISYON_DOMAIN_PLANI.md`)

---

## 1. Mevcut durum — kod taramasının sonucu

### 1.1 Altyapı hazır, mobil kullanmıyor

Veritabanı tarafı **eksiksiz ve iyi yazılmış**:

- `verify_employee_pin(tenant_id, pin)` RPC'si var — `SECURITY DEFINER`
- PIN'ler **bcrypt** ile saklanıyor (`pin_hash = crypt(pin, pin_hash)`) — düz metin değil
- **Kaba kuvvet koruması yerleşik:** `employee_pin_attempts` tablosu, 5 dakikada 5 hatalı denemede 5 dakika kilit
- Başarılı girişte çalışan `is_online = true` işaretleniyor, `last_seen` güncelleniyor
- RPC, çalışanın **yetki matrisini** (`permissions` JSON) döndürüyor

Masaüstü uygulama bunu kullanıyor: `EmployeeManager.tsx` (38 KB) + `ShiftManager.tsx` (20 KB) + `EmployeePinLogin.tsx`.

### 1.2 Mobilde durum: yetki kavramı yok

Kod taraması sonucu net:

- Mobil sayfalarda `can_access_*` kontrolü **hiç yok** — sıfır eşleşme
- `activeEmployee` kavramı yok
- PIN girişi **yalnızca tek yerde** var: `app/adisyon/page.tsx` içinde, "garson kimliği" olarak (`activeWaiterId`) — sadece hangi garsonun sipariş girdiğini işaretlemek için, yetki için değil
- Diğer 14 sayfa (POS, Ürünler, Kasa, Banka, Cari, Alış Faturası, Depo Transferi, Sayım, Entegrasyonlar, Ayarlar…) **tamamen korumasız**

### 1.3 Bunun pratik anlamı

Lisans + işletme şifresini bir kez girdikten sonra, **o telefonu eline alan herkes her şeye erişir.** Ürün silebilir, kasa hareketi görebilir, entegrasyon ayarlarına girebilir, satış silebilir.

Ayrıca **denetim izi yok**: bir işlemin kim tarafından yapıldığı kayıtlı değil. Sahada birden fazla personelin aynı telefonu kullandığı senaryoda (ki tipik senaryo bu) hiçbir sorumluluk takibi mümkün değil.

Masaüstünde bu katman var, mobilde yok. Aradaki fark bilinçli bir tasarım tercihi değil, **eksik kalmış bir iş.**

---

## 2. Hedef

Masaüstüyle aynı güvenlik seviyesine çıkmak, ama mobilin kullanım biçimine uygun şekilde:

- İşletme şifresi = **cihazı kurma** yetkisi (bir kez, kurulumda)
- Çalışan PIN'i = **işlem yapma** yetkisi (her vardiyada, hızlı)
- Her sayfa, açılmadan önce ilgili yetkiyi kontrol eder
- Her kritik işlem, kimin yaptığını kaydeder

---

## 3. Tasarım

### 3.1 İki katmanlı oturum

| Katman | Nasıl | Ne kadar sürer | Ne verir |
|---|---|---|---|
| **Cihaz oturumu** | Lisans + işletme şifresi | Kalıcı | Cihaz bu işletmeye bağlanır |
| **Çalışan oturumu** | 4-6 haneli PIN | Vardiya boyu (varsayılan 12 saat) | İşlem yapma yetkisi |

Cihaz oturumu düşmez — personel her sabah lisans girmez. Çalışan oturumu düşer — telefon başkasının eline geçerse yetkiler kapanır.

### 3.2 Çalışan oturumu ne zaman biter

- **Süre dolunca** (varsayılan 12 saat — vardiya uzunluğu)
- **Hareketsizlik** (30 dakika ekrana dokunulmazsa) — ayarlanabilir
- **Elle çıkışta** (personel "Vardiyayı Bitir" derse)
- Uygulama kapanıp açıldığında oturum **korunur** (sık PIN sorma personeli bezdirir; süre + hareketsizlik yeterli koruma)

### 3.3 Yetki matrisi — mevcut alanlar kullanılacak

Veritabanında zaten tanımlı ve masaüstünde kullanılan alanlar:

```
can_access_pos          can_access_adisyon      can_access_inventory
can_access_reports      can_access_settings     can_access_expenses
can_access_crm          can_manage_employees    can_manage_invoices
can_apply_discount      can_delete_sales
```

**Yeni alan eklemiyoruz** — masaüstüyle birebir aynı matris kullanılacak, böylece bir çalışanın yetkisi iki uygulamada da aynı anlama gelir.

### 3.4 Sayfa → yetki eşlemesi

| Mobil sayfa | Gereken yetki |
|---|---|
| `/pos` | `can_access_pos` |
| `/adisyon` | `can_access_adisyon` |
| `/kds` | `can_access_adisyon` |
| `/products`, `/low-stock`, `/inventory-count`, `/warehouse-transfer` | `can_access_inventory` |
| `/alis-faturasi` | `can_manage_invoices` |
| `/kasa`, `/banka` | `can_access_reports` |
| `/cari` | `can_access_crm` |
| `/dashboard` | `can_access_reports` |
| `/entegre` | `can_access_settings` |
| `/ayarlar` | `can_access_settings` |

Yetkisi olmayan sayfa **alt menüde hiç görünmez** (kilitli gösterip tıklatmak yerine gizlemek daha temiz). Adres çubuğundan doğrudan girilmeye çalışılırsa "Bu bölüm için yetkiniz yok" ekranı çıkar.

### 3.5 İşlem bazlı yetkiler

Sayfa erişimi yetmez, bazı işlemler ayrı kontrol ister:

- **İndirim uygulama** → `can_apply_discount`
- **Satış silme/iade** → `can_delete_sales`
- **Ödeal kart ödemesi** → `can_access_pos` (ayrı yetki gerekmez)

Yetkisi olmayan personel bu düğmeleri **görmez**.

### 3.6 Denetim izi

Şu işlemler `audit_log`'a çalışan kimliğiyle yazılacak:

- Satış tamamlama (hangi personel)
- İndirim uygulama (kim, ne kadar)
- Satış silme/iade
- Stok sayımı ve depo transferi
- Ayar değişikliği

Masaüstündeki `auditLog()` deseni mobile taşınacak — **ateşle-unut**, asla satış akışını bloklamaz.

---

## 4. Güvenlik notları

**PIN sunucuda doğrulanıyor, iyi.** `verify_employee_pin` `SECURITY DEFINER` ve bcrypt kullanıyor; PIN'ler tarayıcıya hiç inmiyor. Bu katmanı değiştirmeye gerek yok.

**Ama bir açık var:** RPC'nin `anon` rolüne EXECUTE izni var. Bugün lisans RPC'lerinde kapattığımız açığın aynısı — saldırgan paketteki anon anahtarıyla RPC'yi doğrudan çağırıp PIN deneyebilir. **Ancak** bu RPC'nin kendi kaba kuvvet koruması var (5 dakikada 5 deneme), yani risk lisans RPC'lerindeki kadar yüksek değil.

**Öneri:** PIN doğrulamayı da `/api/auth/pin` ucundan geçir (lisans için yaptığımızın aynısı), sonra `anon` EXECUTE iznini kaldır. Böylece IP bazlı sayaç da devreye girer ve tek giriş kapısı kalır. Bu, planın 5. adımı.

**Yetki kontrolü nerede zorlanıyor:** Arayüzdeki gizleme **kolaylık**tır, güvenlik değil. Gerçek koruma RLS'te. Tarayıcıda kod değiştiren biri gizli düğmeyi görünür yapabilir ama veriye erişemez. Bu kabul edilebilir — masaüstünde de aynı model çalışıyor.

---

## 5. Uygulama adımları

| # | İş | Açıklama | Süre |
|---|---|---|---|
| 1 | `lib/employee-context.tsx` | Çalışan oturumu: PIN doğrula, sakla, süre/hareketsizlik takibi, `useEmployee()` kancası | 3 saat |
| 2 | `components/EmployeePinGate.tsx` | Tasarımlı PIN ekranı (mevcut giriş ekranıyla aynı dil), kilit durumu mesajı | 2 saat |
| 3 | Yetki kancası + sayfa koruması | `useCan('can_access_pos')`, korumalı sayfa sarmalayıcısı | 2 saat |
| 4 | Alt menü filtreleme | Yetkisiz sayfalar menüde görünmesin | 1 saat |
| 5 | `/api/auth/pin` + RPC iznini kapat | Lisans akışıyla aynı desen, IP bazlı sayaç | 2 saat |
| 6 | İşlem bazlı yetkiler | İndirim / satış silme düğmelerini gizle | 2 saat |
| 7 | Denetim izi | Kritik işlemlere `auditLog` ekle | 2 saat |
| 8 | Adisyon'daki garson PIN'ini birleştir | `activeWaiterId` ile yeni sistem tek yerden yönetilsin (şu an ayrı) | 2 saat |
| 9 | Doğrulama | tsc + akış testi | 1 saat |

**Toplam: yaklaşık 2 gün.**

Adım 8 önemli: adisyonda zaten bir PIN akışı var ama yeni sistemden bağımsız. İkisi birleşmezse personel iki kez PIN girer.

---

## 6. Rol modlarıyla ilişkisi

`garson.jetpos.shop` / `mutfak.jetpos.shop` planı bu katmanın **üstüne** oturur:

- Garson modu → PIN girişi zorunlu, sadece `can_access_adisyon` yetkisi kontrol edilir
- Mutfak modu → PIN girişi **isteğe bağlı** (mutfak tableti ortak kullanılır, sürekli PIN sormak akışı bozar); ama "hazırlandı" işaretlemesi için kim olduğu sorulabilir
- Tam mobil mod → tüm yetki matrisi devrede

Bu yüzden **önce yetki katmanı, sonra rol modları.** Ters sırada yapılırsa rol modları yetkisiz çalışır ve sonra baştan elden geçirmek gerekir.

---

## 7. Karar bekleyen sorular

1. **Vardiya süresi:** 12 saat mantıklı mı, yoksa işletme başına ayarlanabilir mi olsun?
2. **Hareketsizlik kilidi:** 30 dakika uygun mu? Yoğun serviste garson telefonu cebe koyup 30 dk dokunmayabilir — süre uzun tutulmalı mı?
3. **Mutfak ekranı PIN isteyecek mi?** Ortak tablet senaryosunda sürekli PIN sormak sorun yaratır.
4. **Patron modu:** İşletme şifresiyle giriş yapan (masaüstündeki "Patron" sanal çalışanı gibi) tam yetkili bir mod mobilde de olsun mu?

Bu dördü netleşince kodlamaya başlıyorum.
